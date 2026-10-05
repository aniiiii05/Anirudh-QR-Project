// @vitest-environment node
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler, {
  MAX_BODY_BYTES,
  rateLimitSubject,
  readContactConfig,
} from "../../api/contact";

/**
 * The shipped notice does not yet describe direct delivery, so the real
 * DIRECT_DELIVERY_NOTICE is null and delivery cannot be enabled. These tests
 * stand in a notice revision to exercise the enabled path.
 */
const NOTICE = "test-notice-revision";
vi.mock("./logic", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./logic")>()),
  DIRECT_DELIVERY_NOTICE: "test-notice-revision",
}));

/**
 * The contact endpoint is exercised with mocked fetch only: no request ever
 * leaves the test process and no real email can be sent.
 */
const ORIGIN = "https://card.example";
const KEY = "12345678-1234-1234-1234-123456789abc";
const valid = {
  name: "Sample Person",
  email: "sample@example.com",
  message: "Here is an interesting idea for a small workflow.",
  consent: true,
  contextUrl: "",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type Captured = {
  status: number;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

type RequestOptions = {
  method?: string;
  headers?: Record<string, string | undefined>;
  /** Pre-parsed body (Vercel style). Ignored when `stream` is given. */
  body?: unknown;
  /** Raw chunks delivered as an unread Node stream, with no `body` property. */
  stream?: string[];
  address?: string;
};

async function call(options: RequestOptions = {}): Promise<Captured> {
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries({
    origin: ORIGIN,
    "content-type": "application/json",
    "idempotency-key": KEY,
    ...options.headers,
  }))
    if (value !== undefined) headers[name] = value;
  const base = {
    method: options.method ?? "POST",
    headers,
    socket: { remoteAddress: options.address ?? "192.0.2.1" },
  };
  const req = options.stream
    ? Object.assign(
        Readable.from(options.stream.map((chunk) => Buffer.from(chunk))),
        base,
      )
    : { ...base, body: "body" in options ? options.body : valid };
  const captured: Captured = { status: 0, headers: {}, body: {} };
  const res = {
    statusCode: 200,
    setHeader(name: string, value: string | number) {
      captured.headers[name.toLowerCase()] = String(value);
    },
    end(chunk?: string) {
      captured.status = res.statusCode;
      captured.body = chunk ? JSON.parse(chunk) : {};
    },
  };
  await handler(
    req as unknown as IncomingMessage,
    res as unknown as ServerResponse,
  );
  return captured;
}

const REQUIRED = {
  RESEND_API_KEY: "re_test_only",
  CONTACT_TO: "owner@example.com",
  CONTACT_FROM: "Card <card@example.com>",
  UPSTASH_REDIS_REST_URL: "https://redis.example",
  UPSTASH_REDIS_REST_TOKEN: "test-only-token",
  RATE_LIMIT_SECRET: "test-only-secret-0123456789",
  PRIVACY_NOTICE_VERSION: NOTICE,
};

function enable(extra: Record<string, string> = {}) {
  vi.stubEnv("CONTACT_ENABLED", "true");
  for (const [key, value] of Object.entries({ ...REQUIRED, ...extra }))
    vi.stubEnv(key, value);
}

type Call = [string, RequestInit];
const limiterReply = (result: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ result }),
});

/** Limiter allows (count 1); provider succeeds. Records every outbound call. */
function mockServices(
  limiter: () => unknown = () => limiterReply([1, 600, 1, 86400]),
  provider: () => unknown = () => ({ ok: true, status: 200 }),
) {
  const fetcher = vi.fn(async (url: string) =>
    url.startsWith("https://redis.example") ? limiter() : provider(),
  );
  vi.stubGlobal("fetch", fetcher);
  return {
    fetcher,
    calls: () => fetcher.mock.calls as unknown as Call[],
    providerCalls: () =>
      (fetcher.mock.calls as unknown as Call[]).filter(([url]) =>
        url.startsWith("https://api.resend.com"),
      ),
  };
}

beforeEach(() => {
  vi.stubEnv("SITE_ORIGIN", ORIGIN);
  vi.stubEnv("CONTACT_ENABLED", "false");
  for (const key of [
    ...Object.keys(REQUIRED),
    "RATE_LIMIT_MAX",
    "RATE_LIMIT_WINDOW_SECONDS",
    "RATE_LIMIT_GLOBAL_MAX",
    "RATE_LIMIT_GLOBAL_WINDOW_SECONDS",
  ])
    vi.stubEnv(key, "");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/contact", () => {
  it("reports disabled by default without naming settings", async () => {
    const res = await call({ method: "GET" });
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);
    expect(res.body.requestId).toMatch(UUID);
    expect(Object.keys(res.body).sort()).toEqual(["enabled", "requestId"]);
    expect(res.headers["cache-control"]).toBe("no-store");
  });
  it("reports enabled only when everything is configured", async () => {
    enable();
    expect((await call({ method: "GET" })).body.enabled).toBe(true);
  });
  it.each([
    ["CONTACT_ENABLED", "TRUE"],
    ["RESEND_API_KEY", ""],
    ["CONTACT_TO", ""],
    ["CONTACT_FROM", ""],
    ["UPSTASH_REDIS_REST_URL", ""],
    ["UPSTASH_REDIS_REST_URL", "http://redis.example"],
    ["UPSTASH_REDIS_REST_TOKEN", ""],
    ["RATE_LIMIT_SECRET", ""],
    ["RATE_LIMIT_SECRET", "short"],
    ["RATE_LIMIT_MAX", "five"],
    ["RATE_LIMIT_WINDOW_SECONDS", "0"],
    ["RATE_LIMIT_GLOBAL_MAX", "0"],
    ["RATE_LIMIT_GLOBAL_WINDOW_SECONDS", "x"],
    ["PRIVACY_NOTICE_VERSION", ""],
    ["PRIVACY_NOTICE_VERSION", "an-older-notice"],
    ["SITE_ORIGIN", ""],
    ["SITE_ORIGIN", "http://card.example"],
    ["SITE_ORIGIN", "https://card.example/"],
    ["SITE_ORIGIN", "https://card.example/card"],
    ["SITE_ORIGIN", "https://*.example"],
  ])("stays disabled when %s is %j", async (key, value) => {
    enable();
    vi.stubEnv(key, value);
    const res = await call({ method: "GET" });
    expect(res.body).toEqual({ requestId: res.body.requestId, enabled: false });
  });
});

describe("POST /api/contact request checks", () => {
  it("allows only GET and POST", async () => {
    for (const method of ["PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]) {
      const res = await call({ method });
      expect(res.status).toBe(405);
      expect(res.headers.allow).toBe("GET, POST");
      expect(res.body.requestId).toMatch(UUID);
    }
  });
  it("requires the exact site origin", async () => {
    enable();
    const { fetcher } = mockServices();
    for (const origin of [
      "https://other.example",
      "https://card.example.evil.test",
      "http://card.example",
      "https://card.example/",
      "null",
      undefined,
    ])
      expect((await call({ headers: { origin } })).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects every POST when SITE_ORIGIN is not a valid origin", async () => {
    vi.stubEnv("SITE_ORIGIN", "");
    expect((await call()).status).toBe(403);
  });
  it("rejects Sec-Fetch-Site values other than same-origin", async () => {
    enable();
    mockServices();
    for (const site of ["cross-site", "same-site", "none"])
      expect(
        (await call({ headers: { "sec-fetch-site": site } })).status,
      ).toBe(403);
    expect(
      (await call({ headers: { "sec-fetch-site": "same-origin" } })).status,
    ).toBe(200);
  });
  it("fails closed with 503 while delivery is disabled", async () => {
    const res = await call();
    expect(res.status).toBe(503);
    expect(res.body.requestId).toMatch(UUID);
    expect(res.body).not.toHaveProperty("received");
  });
  it("fails closed with 503 when one secret is missing", async () => {
    enable({ RESEND_API_KEY: "" });
    const { fetcher } = mockServices();
    expect((await call()).status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("requires a JSON content type", async () => {
    enable();
    mockServices();
    for (const type of ["text/plain", "application/x-www-form-urlencoded", undefined])
      expect((await call({ headers: { "content-type": type } })).status).toBe(415);
    expect(
      (await call({ headers: { "content-type": "application/json; charset=utf-8" } }))
        .status,
    ).toBe(200);
  });
  it("rejects an oversized Content-Length before reading", async () => {
    enable();
    const { fetcher } = mockServices();
    const res = await call({
      headers: { "content-length": String(MAX_BODY_BYTES + 1) },
    });
    expect(res.status).toBe(413);
    expect(fetcher).not.toHaveBeenCalled();
    expect(
      (await call({ headers: { "content-length": "12abc" } })).status,
    ).toBe(400);
  });
  it("rejects an oversized pre-parsed body", async () => {
    enable();
    mockServices();
    const res = await call({
      body: { ...valid, padding: "x".repeat(MAX_BODY_BYTES) },
    });
    expect(res.status).toBe(413);
    expect(
      (await call({ body: JSON.stringify({ ...valid, padding: "x".repeat(MAX_BODY_BYTES) }) }))
        .status,
    ).toBe(413);
  });
  it("stops reading an oversized streamed body without Content-Length", async () => {
    enable();
    const { fetcher } = mockServices();
    const chunk = "x".repeat(4_000);
    const res = await call({ stream: ['{"name":"', chunk, chunk, chunk, '"}'] });
    expect(res.status).toBe(413);
    expect(res.headers.connection).toBe("close");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON", async () => {
    enable();
    mockServices();
    expect((await call({ body: "{not json" })).status).toBe(400);
    expect((await call({ stream: ["{not json"] })).status).toBe(400);
    expect((await call({ body: null })).status).toBe(400);
  });
  it.each([
    ["missing key", undefined],
    ["short key", "abc123"],
    ["long key", "a".repeat(81)],
    ["unsafe characters", "12345678_1234/1234-1234"],
  ])("rejects an invalid Idempotency-Key (%s)", async (_label, key) => {
    enable();
    const { fetcher } = mockServices();
    const res = await call({ headers: { "idempotency-key": key } });
    expect(res.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact field validation", () => {
  it.each([
    ["name too short", { name: " a " }],
    ["name too long", { name: "a".repeat(81) }],
    ["name missing", { name: undefined }],
    ["email invalid", { email: "not-an-email" }],
    ["email too long", { email: `${"a".repeat(250)}@example.com` }],
    ["email with a line break", { email: "a@example.com\r\nBcc: x@example.com" }],
    ["message too short", { message: "Too short." }],
    ["message too long", { message: "a".repeat(1201) }],
    ["context link not HTTPS", { contextUrl: "http://example.com" }],
    ["context link script", { contextUrl: "javascript:alert(1)" }],
    ["context link too long", { contextUrl: `https://example.com/${"a".repeat(500)}` }],
    ["consent false", { consent: false }],
    ["consent missing", { consent: undefined }],
    ["consent as string", { consent: "true" }],
  ])("rejects %s", async (_label, change) => {
    enable();
    const { fetcher } = mockServices();
    const res = await call({ body: { ...valid, ...change } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Check the message fields");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects honeypot submissions without counting or sending", async () => {
    enable();
    const { fetcher } = mockServices();
    const res = await call({ body: { ...valid, website: "https://spam.example" } });
    expect(res.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact rate limiting", () => {
  it("fails closed when the limiter is unreachable", async () => {
    enable();
    const { providerCalls } = mockServices(() => {
      throw new Error("offline");
    });
    expect((await call()).status).toBe(503);
    expect(providerCalls()).toHaveLength(0);
  });
  it("fails closed when the limiter returns an HTTP error", async () => {
    enable();
    const { providerCalls } = mockServices(() => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));
    expect((await call()).status).toBe(503);
    expect(providerCalls()).toHaveLength(0);
  });
  it.each([
    ["an error payload", { error: "ERR max requests limit exceeded" }],
    ["a missing result", {}],
    ["a non-numeric count", { result: ["1", 600] }],
    ["a scalar result", { result: 1 }],
    ["a missing global count", { result: [1, 600] }],
  ])("fails closed on %s", async (_label, payload) => {
    enable();
    const { providerCalls } = mockServices(() => ({
      ok: true,
      status: 200,
      json: async () => payload,
    }));
    const res = await call();
    expect(res.status).toBe(503);
    expect(res.body.requestId).toMatch(UUID);
    expect(providerCalls()).toHaveLength(0);
  });
  it("returns 429 with Retry-After once the limit is exceeded", async () => {
    enable();
    const { providerCalls } = mockServices(() => limiterReply([6, 321, 6, 86000]));
    const res = await call();
    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe("321");
    expect(res.body.requestId).toMatch(UUID);
    expect(providerCalls()).toHaveLength(0);
  });
  it("uses the configured limit and window", async () => {
    enable({ RATE_LIMIT_MAX: "2", RATE_LIMIT_WINDOW_SECONDS: "120" });
    const { calls } = mockServices(() => limiterReply([3, -1, 3, 86000]));
    const res = await call();
    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe("120");
    const command = JSON.parse(String(calls()[0][1].body)) as string[];
    expect(command[0]).toBe("EVAL");
    expect(command[2]).toBe("2");
    expect(command[4]).toBe("card:contact:rate:global");
    expect(command[5]).toBe("120");
    expect(command[6]).toBe("86400");
  });
  it("defaults to five attempts per ten minutes", async () => {
    enable();
    const allowed = mockServices(() => limiterReply([5, 400, 5, 86000]));
    expect((await call()).status).toBe(200);
    const command = JSON.parse(String(allowed.calls()[0][1].body)) as string[];
    expect(command[5]).toBe("600");
    mockServices(() => limiterReply([6, 400, 6, 86000]));
    expect((await call()).status).toBe(429);
  });
  it("keys the limiter on a keyed hash, never the raw address or form text", async () => {
    enable();
    const { calls } = mockServices();
    await call({ address: "203.0.113.77" });
    await call({ address: "203.0.113.78" });
    const [first, second] = calls()
      .filter(([url]) => url.startsWith("https://redis.example"))
      .map(([, init]) => String(init.body));
    for (const body of [first, second]) {
      expect(body).not.toContain("203.0.113");
      expect(body).not.toContain(valid.message);
      expect(body).not.toContain(valid.email);
      expect(body).toMatch(/card:contact:rate:[0-9a-f]{64}/);
    }
    expect(JSON.parse(first)[3]).not.toBe(JSON.parse(second)[3]);
  });
  it("applies a global ceiling across all clients (default 50 per day)", async () => {
    enable();
    const { providerCalls } = mockServices(() =>
      limiterReply([1, 600, 51, 4321]),
    );
    const res = await call();
    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe("4321");
    expect(providerCalls()).toHaveLength(0);
    mockServices(() => limiterReply([1, 600, 50, 4321]));
    expect((await call()).status).toBe(200);
  });
  it("uses the configured global ceiling", async () => {
    enable({ RATE_LIMIT_GLOBAL_MAX: "3", RATE_LIMIT_GLOBAL_WINDOW_SECONDS: "3600" });
    const { calls } = mockServices(() => limiterReply([1, 600, 4, -1]));
    const res = await call();
    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe("3600");
    expect(JSON.parse(String(calls()[0][1].body))[6]).toBe("3600");
  });
  it("shares one limiter key across an IPv6 /64", async () => {
    enable();
    const { calls } = mockServices();
    await call({ headers: { "x-vercel-forwarded-for": "2001:db8:1:2:aaaa::1" } });
    await call({ headers: { "x-vercel-forwarded-for": "2001:db8:1:2:bbbb:cccc:dddd:eeee" } });
    await call({ headers: { "x-vercel-forwarded-for": "2001:db8:1:3::1" } });
    const keys = calls()
      .filter(([url]) => url.startsWith("https://redis.example"))
      .map(([, init]) => JSON.parse(String(init.body))[3]);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
    for (const body of calls().map(([, init]) => String(init.body)))
      expect(body).not.toContain("2001:db8");
  });
  it("prefers the platform client address header", async () => {
    enable();
    const { calls } = mockServices();
    await call({ headers: { "x-vercel-forwarded-for": "198.51.100.1" } });
    await call({ headers: { "x-vercel-forwarded-for": "198.51.100.2" } });
    const keys = calls()
      .filter(([url]) => url.startsWith("https://redis.example"))
      .map(([, init]) => JSON.parse(String(init.body))[3]);
    expect(keys[0]).not.toBe(keys[1]);
  });
});

describe("POST /api/contact delivery", () => {
  it("reports provider failures as 502", async () => {
    enable();
    mockServices(undefined, () => ({ ok: false, status: 422 }));
    const res = await call();
    expect(res.status).toBe(502);
    expect(res.body.requestId).toMatch(UUID);
    expect(JSON.stringify(res.body)).not.toContain("422");
  });
  it("reports an unreachable provider as 502", async () => {
    enable();
    mockServices(undefined, () => {
      throw new Error("timeout");
    });
    expect((await call()).status).toBe(502);
  });
  it("returns 200 with a request ID after the provider accepts", async () => {
    enable();
    const { providerCalls } = mockServices();
    const res = await call();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ requestId: res.body.requestId, received: true });
    expect(res.body.requestId).toMatch(UUID);
    expect(providerCalls()).toHaveLength(1);
  });
  it("sends one plain-text email with safe header values", async () => {
    enable({ CONTACT_FROM: "Card <card@example.com>\r\nBcc: x@example.com" });
    const { providerCalls } = mockServices();
    await call({
      body: {
        ...valid,
        name: "Sample\r\nPerson",
        contextUrl: "https://example.com/idea",
        message: "Line one of a thoughtful idea.\r\n<b>Line two</b>",
      },
    });
    const [[url, init]] = providerCalls();
    expect(url).toBe("https://api.resend.com/emails");
    const sent = JSON.parse(String(init.body));
    expect(Object.keys(sent).sort()).toEqual(
      ["from", "reply_to", "subject", "text", "to"].sort(),
    );
    expect(sent).not.toHaveProperty("html");
    expect(sent.subject).toBe("A thought from your QR card");
    expect(sent.reply_to).toBe(valid.email);
    expect(sent.to).toEqual(["owner@example.com"]);
    expect(sent.from).not.toMatch(/[\r\n]/);
    expect(sent.text).toContain("Name: Sample Person");
    expect(sent.text).toContain("Context link: https://example.com/idea");
    expect(sent.text).toContain("<b>Line two</b>");
    expect(sent.text).not.toContain("\r");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_test_only");
    expect(headers["Idempotency-Key"]).toMatch(/^card-contact-[0-9a-f]{64}$/);
  });
  it("uses a stable provider idempotency key for identical retries only", async () => {
    enable();
    const { providerCalls } = mockServices();
    await call();
    await call();
    await call({ body: { ...valid, message: `${valid.message} Changed.` } });
    await call({
      headers: { "idempotency-key": "abcdefgh-1234-1234-1234-123456789abc" },
    });
    const keys = providerCalls().map(
      ([, init]) => (init.headers as Record<string, string>)["Idempotency-Key"],
    );
    expect(keys).toHaveLength(4);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
    expect(keys[3]).not.toBe(keys[0]);
    expect(keys[0]).not.toContain(KEY);
  });
  it("accepts an unread streamed body", async () => {
    enable();
    const { providerCalls } = mockServices();
    const json = JSON.stringify(valid);
    const res = await call({
      stream: [json.slice(0, 20), json.slice(20)],
      headers: { "content-length": String(Buffer.byteLength(json)) },
    });
    expect(res.status).toBe(200);
    expect(JSON.parse(String(providerCalls()[0][1].body)).reply_to).toBe(
      valid.email,
    );
  });
  it("accepts a pre-buffered string body", async () => {
    enable();
    mockServices();
    expect((await call({ body: JSON.stringify(valid) })).status).toBe(200);
  });
});

describe("rateLimitSubject", () => {
  it.each([
    ["192.0.2.7", "192.0.2.7"],
    ["::ffff:192.0.2.7", "192.0.2.7"],
    ["::FFFF:192.0.2.7", "192.0.2.7"],
    ["2001:db8:0:1:2:3:4:5", "2001:db8:0:1::/64"],
    ["2001:0db8:0000:0001::9", "2001:db8:0:1::/64"],
    ["[2001:db8::1]:443", "2001:db8:0:0::/64"],
    ["fe80::1%eth0", "fe80:0:0:0::/64"],
    ["::1", "0:0:0:0::/64"],
    ["2001:db8:1:2::192.0.2.1", "2001:db8:1:2::/64"],
    ["", "unknown"],
  ])("maps %j to %j", (input, expected) => {
    expect(rateLimitSubject(input)).toBe(expected);
  });
});

describe("readContactConfig", () => {
  it("stays off unless the privacy notice revision matches", () => {
    const env = { CONTACT_ENABLED: "true", SITE_ORIGIN: ORIGIN, ...REQUIRED };
    expect(readContactConfig(env)).not.toBeNull();
    expect(readContactConfig(env, null)).toBeNull();
    expect(readContactConfig(env, "a-newer-notice")).toBeNull();
  });
  it("returns parsed limits and the validated origin", () => {
    const config = readContactConfig({
      CONTACT_ENABLED: "true",
      SITE_ORIGIN: ORIGIN,
      ...REQUIRED,
      RATE_LIMIT_MAX: "7",
    });
    expect(config).toMatchObject({
      siteOrigin: ORIGIN,
      rateLimitMax: 7,
      rateLimitWindowSeconds: 600,
      globalRateLimitMax: 50,
      globalRateLimitWindowSeconds: 86_400,
    });
  });
});
