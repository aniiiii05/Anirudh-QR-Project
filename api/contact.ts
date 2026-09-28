import { createHmac, randomUUID } from "node:crypto";
import { contactSchema } from "../src/card/logic";
import type { IncomingMessage, ServerResponse } from "node:http";
type Request = IncomingMessage & { body?: unknown };
export default async function handler(req: Request, res: ServerResponse) {
  const requestId = randomUUID();
  res.setHeader("Cache-Control", "no-store");
  const reply = (code: number, error?: string) => {
    res.statusCode = code;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        requestId,
        ...(error ? { error } : { received: true }),
      }),
    );
  };
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(405, "Method not allowed");
  }
  const origin = process.env.SITE_ORIGIN;
  if (!origin || req.headers.origin !== origin)
    return reply(403, "Request not allowed");
  if (!req.headers["content-type"]?.startsWith("application/json"))
    return reply(415, "Use JSON");
  if (Number(req.headers["content-length"] || 0) > 10000)
    return reply(413, "Message too large");
  let body: unknown = req.body;
  try {
    if (typeof body === "string") body = JSON.parse(body);
    if (JSON.stringify(body).length > 10000)
      return reply(413, "Message too large");
  } catch {
    return reply(400, "Invalid message");
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return reply(400, "Check the message fields");
  if (parsed.data.website) return reply(400, "Request not accepted");
  const key = req.headers["idempotency-key"];
  if (typeof key !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(key))
    return reply(400, "Invalid request key");
  const {
    CONTACT_ENABLED,
    RESEND_API_KEY,
    CONTACT_TO,
    CONTACT_FROM,
    UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN,
    RATE_LIMIT_SECRET,
  } = process.env;
  if (
    CONTACT_ENABLED !== "true" ||
    !RESEND_API_KEY ||
    !CONTACT_TO ||
    !CONTACT_FROM ||
    !UPSTASH_REDIS_REST_URL ||
    !UPSTASH_REDIS_REST_TOKEN ||
    !RATE_LIMIT_SECRET
  )
    return reply(503, "Direct delivery unavailable. Please use email.");
  const data = parsed.data;
  const digest = (value: string) =>
    createHmac("sha256", RATE_LIMIT_SECRET).update(value).digest("hex");
  const ip = String(
    req.headers["x-vercel-forwarded-for"] ||
      req.socket.remoteAddress ||
      "unknown",
  )
    .split(",")[0]
    .trim();
  try {
    // Atomic shared counter with a TTL; never store the raw address or form text.
    const limit = await fetch(UPSTASH_REDIS_REST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],600) end; return n",
        "1",
        `card:rate:${digest(ip)}`,
      ]),
      signal: AbortSignal.timeout(4000),
    });
    if (!limit.ok) return reply(503, "Please retry later");
    const limited = (await limit.json()) as { result?: number; error?: string };
    if (limited.error || typeof limited.result !== "number")
      return reply(503, "Please retry later");
    if (limited.result > 5) {
      res.setHeader("Retry-After", "600");
      return reply(429, "Please retry later");
    }
    const notification = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `card-${digest(key + JSON.stringify(data))}`,
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [CONTACT_TO],
        reply_to: data.email,
        subject: "A thought from your QR card",
        text: `Name: ${data.name}\nReply email: ${data.email}\n\n${data.message}\n\nContext: ${data.contextUrl || "None"}\n\nConsent to email reply: yes`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!notification.ok)
      return reply(502, "Delivery failed. Please retry or use email.");
    return reply(200);
  } catch {
    return reply(503, "Delivery unavailable. Please retry or use email.");
  }
}
