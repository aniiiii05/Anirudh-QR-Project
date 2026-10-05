import { createHmac, randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  contactSchema,
  DIRECT_DELIVERY_NOTICE,
  parseSiteOrigin,
} from "../src/card/logic.js";

/**
 * /api/contact — optional direct delivery for "Share a thought" (guide §10).
 *
 * GET  → { enabled } — true only when delivery is fully configured. Never says
 *        which setting is missing.
 * POST → validates, rate-limits (shared Upstash counter) and sends one plain-text
 *        email through Resend. Fails closed: missing configuration, an
 *        unavailable limiter or an unexpected limiter reply all return 503.
 *
 * Never stored or logged: the raw client IP (only a keyed hash is used as the
 * rate-limit key, with a TTL) and any form text.
 */

export const MAX_BODY_BYTES = 10_000;
const IDEMPOTENCY_KEY = /^[a-zA-Z0-9-]{16,80}$/;
const SUBJECT = "A thought from your QR card";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const LIMITER_TIMEOUT_MS = 4_000;
const PROVIDER_TIMEOUT_MS = 8_000;
const BODY_TIMEOUT_MS = 10_000;
const DEFAULT_RATE_LIMIT_MAX = 5;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 600;
const DEFAULT_GLOBAL_RATE_LIMIT_MAX = 50;
const DEFAULT_GLOBAL_RATE_LIMIT_WINDOW_SECONDS = 86_400;
const GLOBAL_RATE_KEY = "card:contact:rate:global";
const MIN_SECRET_LENGTH = 16;

/**
 * Two atomic fixed-window counters in one script: KEYS[1] per client
 * (window ARGV[1]) and KEYS[2] for all clients together (window ARGV[2]), so
 * rotating addresses cannot exceed the overall ceiling. Each counter sets its
 * expiry on the first hit and repairs a missing expiry so no key lives forever.
 * Returns {clientCount, clientTtl, globalCount, globalTtl}.
 */
const RATE_LIMIT_SCRIPT =
  "local r={} " +
  "for i=1,2 do " +
  "local n=redis.call('INCR',KEYS[i]) " +
  "if n==1 then redis.call('EXPIRE',KEYS[i],ARGV[i]) end " +
  "local t=redis.call('TTL',KEYS[i]) " +
  "if t<0 then redis.call('EXPIRE',KEYS[i],ARGV[i]) t=tonumber(ARGV[i]) end " +
  "r[#r+1]=n r[#r+1]=t end " +
  "return r";

type ContactRequest = IncomingMessage & { body?: unknown };

export type ContactConfig = {
  siteOrigin: string;
  resendApiKey: string;
  to: string;
  from: string;
  redisUrl: string;
  redisToken: string;
  rateLimitSecret: string;
  rateLimitMax: number;
  rateLimitWindowSeconds: number;
  globalRateLimitMax: number;
  globalRateLimitWindowSeconds: number;
};

/** Removes CR/LF (and other control characters) from values bound for email headers. */
export function headerSafe(value: string) {
  // eslint-disable-next-line no-control-regex -- removing control characters is the purpose
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

function positiveInt(raw: string | undefined, fallback: number, max: number) {
  if (raw === undefined || raw.trim() === "") return fallback;
  if (!/^\d{1,7}$/.test(raw.trim())) return null;
  const value = Number(raw.trim());
  return value >= 1 && value <= max ? value : null;
}

/**
 * Delivery configuration, or null when anything required is missing or invalid.
 * Callers must not reveal which part is missing. Delivery also stays off until
 * the privacy notice describes it (DIRECT_DELIVERY_NOTICE in logic.ts) and
 * PRIVACY_NOTICE_VERSION names that same notice revision.
 */
export function readContactConfig(
  env: NodeJS.ProcessEnv = process.env,
  notice: string | null = DIRECT_DELIVERY_NOTICE,
): ContactConfig | null {
  if (env.CONTACT_ENABLED !== "true") return null;
  if (!notice || env.PRIVACY_NOTICE_VERSION?.trim() !== notice) return null;
  const siteOrigin = parseSiteOrigin(env.SITE_ORIGIN);
  const resendApiKey = env.RESEND_API_KEY?.trim();
  const to = headerSafe(env.CONTACT_TO ?? "");
  const from = headerSafe(env.CONTACT_FROM ?? "");
  const redisUrl = env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const rateLimitSecret = env.RATE_LIMIT_SECRET ?? "";
  const rateLimitMax = positiveInt(
    env.RATE_LIMIT_MAX,
    DEFAULT_RATE_LIMIT_MAX,
    1_000,
  );
  const rateLimitWindowSeconds = positiveInt(
    env.RATE_LIMIT_WINDOW_SECONDS,
    DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
    86_400,
  );
  const globalRateLimitMax = positiveInt(
    env.RATE_LIMIT_GLOBAL_MAX,
    DEFAULT_GLOBAL_RATE_LIMIT_MAX,
    100_000,
  );
  const globalRateLimitWindowSeconds = positiveInt(
    env.RATE_LIMIT_GLOBAL_WINDOW_SECONDS,
    DEFAULT_GLOBAL_RATE_LIMIT_WINDOW_SECONDS,
    604_800,
  );
  if (
    !siteOrigin ||
    !resendApiKey ||
    !to ||
    !from ||
    !redisUrl ||
    !redisToken ||
    rateLimitSecret.length < MIN_SECRET_LENGTH ||
    rateLimitMax === null ||
    rateLimitWindowSeconds === null ||
    globalRateLimitMax === null ||
    globalRateLimitWindowSeconds === null
  )
    return null;
  try {
    if (new URL(redisUrl).protocol !== "https:") return null;
  } catch {
    return null;
  }
  return {
    siteOrigin,
    resendApiKey,
    to,
    from,
    redisUrl,
    redisToken,
    rateLimitSecret,
    rateLimitMax,
    rateLimitWindowSeconds,
    globalRateLimitMax,
    globalRateLimitWindowSeconds,
  };
}

function header(req: IncomingMessage, name: string) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function keyedHash(secret: string, purpose: string, value: string) {
  return createHmac("sha256", secret)
    .update(`${purpose}\u0000${value}`)
    .digest("hex");
}

/** The platform-provided client address. Only ever used as HMAC input. */
function clientAddress(req: IncomingMessage) {
  const forwarded =
    header(req, "x-vercel-forwarded-for") ||
    header(req, "x-real-ip") ||
    header(req, "x-forwarded-for") ||
    req.socket?.remoteAddress ||
    "unknown";
  return rateLimitSubject(forwarded.split(",")[0].trim() || "unknown");
}

/**
 * Reduces an address to the unit one client controls: IPv4 as is (including
 * IPv4-mapped IPv6), IPv6 to its /64 prefix, since a single host commonly holds
 * a whole /64 and could otherwise rotate addresses to reset its allowance.
 */
export function rateLimitSubject(address: string) {
  let value = address.trim().toLowerCase();
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(value);
  if (bracketed) value = bracketed[1];
  value = value.replace(/%.*$/, "");
  const ipv4 = /^(?:::ffff:(?:0:)?)?(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/.exec(
    value,
  );
  if (ipv4) return ipv4[1];
  if (!value.includes(":") || !/^[0-9a-f:.]+$/.test(value))
    return value || "unknown";
  const [head, tail = ""] = value.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  // An embedded IPv4 tail covers the last 32 bits, outside the /64 prefix.
  for (const part of [left, right])
    if (part.length && part[part.length - 1].includes("."))
      part.splice(-1, 1, "0", "0");
  const missing = value.includes("::") ? 8 - left.length - right.length : 0;
  const groups = [...left, ...Array(Math.max(missing, 0)).fill("0"), ...right];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g)))
    return value;
  const prefix = groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ""))
    .join(":");
  return `${prefix}::/64`;
}

// Both members carry every property so narrowing also works in non-strict
// TypeScript configs (the browser tests import this module).
type BodyResult =
  | { ok: true; value: unknown; status?: undefined }
  | { ok: false; status: 400 | 408 | 413; value?: undefined };

function parseJson(text: string): BodyResult {
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return { ok: false, status: 413 };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400 };
  }
}

/** Reads an unread Node request stream, stopping as soon as the limit is passed. */
function readStream(req: IncomingMessage): Promise<BodyResult> {
  return new Promise((resolve) => {
    // Keep a listener so a late socket error can never crash the process.
    req.on("error", () => {});
    if (req.readableEnded) {
      resolve({ ok: false, status: 400 });
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    const finish = (result: BodyResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
      resolve(result);
    };
    const onData = (chunk: Buffer | string) => {
      const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      size += buffer.length;
      if (size > MAX_BODY_BYTES) {
        req.pause();
        finish({ ok: false, status: 413 });
        return;
      }
      chunks.push(buffer);
    };
    const onEnd = () =>
      finish(parseJson(Buffer.concat(chunks).toString("utf8")));
    const onError = () => finish({ ok: false, status: 400 });
    const timer = setTimeout(() => {
      req.pause();
      finish({ ok: false, status: 408 });
    }, BODY_TIMEOUT_MS);
    req.on("data", onData);
    req.on("end", onEnd);
    req.on("error", onError);
  });
}

/**
 * Accepts a body the platform already parsed (object), buffered (string or
 * bytes), or an unread stream. The size limit applies in every case.
 */
async function readJsonBody(req: ContactRequest): Promise<BodyResult> {
  let preParsed: unknown;
  try {
    // Vercel parses JSON lazily and throws on malformed input.
    preParsed = req.body;
  } catch {
    return { ok: false, status: 400 };
  }
  if (preParsed === null) return { ok: false, status: 400 };
  if (typeof preParsed === "string") return parseJson(preParsed);
  if (preParsed instanceof Uint8Array)
    return parseJson(Buffer.from(preParsed).toString("utf8"));
  if (preParsed !== undefined) {
    let serialised: string | undefined;
    try {
      serialised = JSON.stringify(preParsed);
    } catch {
      return { ok: false, status: 400 };
    }
    if (serialised === undefined) return { ok: false, status: 400 };
    if (Buffer.byteLength(serialised) > MAX_BODY_BYTES)
      return { ok: false, status: 413 };
    return { ok: true, value: preParsed };
  }
  if (typeof req.on !== "function") return { ok: false, status: 400 };
  return readStream(req);
}

type LimitResult =
  | { ok: true; allowed: boolean; retryAfter: number }
  | { ok: false; allowed?: undefined; retryAfter?: undefined };

async function checkRateLimit(
  config: ContactConfig,
  address: string,
): Promise<LimitResult> {
  const key = `card:contact:rate:${keyedHash(config.rateLimitSecret, "rate", address)}`;
  try {
    const response = await fetch(config.redisUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        RATE_LIMIT_SCRIPT,
        "2",
        key,
        GLOBAL_RATE_KEY,
        String(config.rateLimitWindowSeconds),
        String(config.globalRateLimitWindowSeconds),
      ]),
      signal: AbortSignal.timeout(LIMITER_TIMEOUT_MS),
    });
    if (!response.ok) return { ok: false };
    const payload = (await response.json()) as {
      result?: unknown;
      error?: unknown;
    };
    if (payload.error !== undefined || !Array.isArray(payload.result))
      return { ok: false };
    const [count, ttl, globalCount, globalTtl] = payload.result as unknown[];
    const finite = (v: unknown): v is number =>
      typeof v === "number" && Number.isFinite(v);
    if (!finite(count) || !finite(globalCount)) return { ok: false };
    const wait = (t: unknown, fallback: number) =>
      finite(t) && t > 0 ? Math.ceil(t) : fallback;
    const clientOver = count > config.rateLimitMax;
    const globalOver = globalCount > config.globalRateLimitMax;
    const retryAfter = Math.max(
      clientOver ? wait(ttl, config.rateLimitWindowSeconds) : 0,
      globalOver ? wait(globalTtl, config.globalRateLimitWindowSeconds) : 0,
      1,
    );
    return { ok: true, allowed: !clientOver && !globalOver, retryAfter };
  } catch {
    return { ok: false };
  }
}

export default async function handler(req: ContactRequest, res: ServerResponse) {
  const requestId = randomUUID();
  const reply = (
    status: number,
    body: Record<string, unknown>,
    extraHeaders: Record<string, string> = {},
  ) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex");
    for (const [name, value] of Object.entries(extraHeaders))
      res.setHeader(name, value);
    res.end(JSON.stringify({ requestId, ...body }));
  };
  const fail = (
    status: number,
    error: string,
    extraHeaders: Record<string, string> = {},
  ) => reply(status, { error }, extraHeaders);

  if (req.method === "GET")
    return reply(200, { enabled: readContactConfig() !== null });
  if (req.method !== "POST")
    return fail(405, "Method not allowed", { Allow: "GET, POST" });

  // Same-origin only: browsers send Origin on every POST.
  const fetchSite = header(req, "sec-fetch-site");
  if (fetchSite !== undefined && fetchSite !== "same-origin")
    return fail(403, "Request not allowed");
  const siteOrigin = parseSiteOrigin(process.env.SITE_ORIGIN);
  if (!siteOrigin || header(req, "origin") !== siteOrigin)
    return fail(403, "Request not allowed");

  const config = readContactConfig();
  if (!config)
    return fail(503, "Direct delivery is unavailable. Please use email.");

  const mediaType = (header(req, "content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (mediaType !== "application/json") return fail(415, "Use JSON");

  const declaredLength = header(req, "content-length");
  if (declaredLength !== undefined) {
    if (!/^\d+$/.test(declaredLength)) return fail(400, "Invalid request");
    if (Number(declaredLength) > MAX_BODY_BYTES)
      return fail(413, "Message too large", { Connection: "close" });
  }

  const idempotencyKey = header(req, "idempotency-key");
  if (!idempotencyKey || !IDEMPOTENCY_KEY.test(idempotencyKey))
    return fail(400, "Invalid request key");

  const body = await readJsonBody(req);
  if (!body.ok) {
    if (body.status === 413)
      return fail(413, "Message too large", { Connection: "close" });
    if (body.status === 408)
      return fail(408, "Request timed out", { Connection: "close" });
    return fail(400, "Invalid message");
  }

  const parsed = contactSchema.safeParse(body.value);
  if (!parsed.success) return fail(400, "Check the message fields");
  if (parsed.data.website) return fail(400, "Request not accepted");

  const limit = await checkRateLimit(config, clientAddress(req));
  if (!limit.ok) return fail(503, "Please retry later or use email.");
  if (!limit.allowed)
    return fail(429, "Too many messages. Please retry later.", {
      "Retry-After": String(limit.retryAfter),
    });

  const data = parsed.data;
  const contextUrl = data.contextUrl ? headerSafe(data.contextUrl) : "";
  // Stable for an identical retry; different for different content.
  const canonical = JSON.stringify([
    data.name,
    data.email,
    data.message,
    contextUrl,
    data.consent,
  ]);
  const providerKey = `card-contact-${keyedHash(
    config.rateLimitSecret,
    "idempotency",
    `${idempotencyKey}\u0000${canonical}`,
  )}`;
  const text = [
    "New message from the QR card contact form.",
    "",
    `Name: ${headerSafe(data.name)}`,
    `Reply email: ${headerSafe(data.email)}`,
    `Context link: ${contextUrl || "None"}`,
    "Consent to an email reply: yes",
    "",
    "Message:",
    data.message.replace(/\r\n?/g, "\n"),
  ].join("\n");

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": providerKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        reply_to: headerSafe(data.email),
        subject: SUBJECT,
        text,
      }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(
        JSON.stringify({
          event: "contact_delivery_failed",
          requestId,
          providerStatus: response.status,
        }),
      );
      return fail(502, "Delivery failed. Please retry or use email.");
    }
  } catch {
    console.warn(
      JSON.stringify({ event: "contact_delivery_unreachable", requestId }),
    );
    return fail(502, "Delivery failed. Please retry or use email.");
  }
  return reply(200, { received: true });
}
