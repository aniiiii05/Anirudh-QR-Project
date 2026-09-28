// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/contact";
import type { IncomingMessage, ServerResponse } from "node:http";
const valid = {
  name: "Sample Person",
  email: "sample@example.com",
  message: "Here is an interesting idea for a small workflow.",
  consent: true,
  contextUrl: "",
};
async function request(body: unknown = valid, headers = {}, method = "POST") {
  let output = "";
  const response = {
    statusCode: 200,
    setHeader: vi.fn(),
    end: (s: string) => {
      output = s;
    },
  };
  await handler(
    {
      method,
      headers: {
        origin: "https://card.example",
        "content-type": "application/json",
        "idempotency-key": "12345678-1234-1234-1234-123456789abc",
        ...headers,
      },
      body,
      socket: { remoteAddress: "192.0.2.1" },
    } as unknown as IncomingMessage,
    response as unknown as ServerResponse,
  );
  return { status: response.statusCode, body: JSON.parse(output) };
}
beforeEach(() => {
  vi.stubEnv("SITE_ORIGIN", "https://card.example");
  vi.stubEnv("CONTACT_ENABLED", "false");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function enable() {
  for (const key of [
    "RESEND_API_KEY",
    "CONTACT_TO",
    "CONTACT_FROM",
    "UPSTASH_REDIS_REST_TOKEN",
    "RATE_LIMIT_SECRET",
  ])
    vi.stubEnv(key, "test-only");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
  vi.stubEnv("CONTACT_ENABLED", "true");
}
describe("contact endpoint fail-safe behavior", () => {
  it("rejects cross-origin requests", async () =>
    expect(
      (await request(valid, { origin: "https://other.example" })).status,
    ).toBe(403));
  it("rejects invalid input", async () =>
    expect((await request({ ...valid, consent: false })).status).toBe(400));
  it("never claims delivery before setup", async () =>
    expect((await request()).status).toBe(503));
  it("rejects honeypot submissions", async () =>
    expect((await request({ ...valid, website: "bot" })).status).toBe(400));
  it("limits method and content type", async () => {
    expect((await request(valid, {}, "GET")).status).toBe(405);
    expect(
      (await request(valid, { "content-type": "text/plain" })).status,
    ).toBe(415);
  });
  it("fails closed when the shared limiter fails", async () => {
    enable();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await request()).status).toBe(503);
  });
  it("blocks exhausted rate limits before notification", async () => {
    enable();
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ result: 6 }) });
    vi.stubGlobal("fetch", fetcher);
    expect((await request()).status).toBe(429);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("reports provider failures honestly", async () => {
    enable();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 1 }) })
        .mockResolvedValueOnce({ ok: false }),
    );
    expect((await request()).status).toBe(502);
  });
  it("uses the same provider idempotency key on a matching retry", async () => {
    enable();
    const fetcher = vi.fn(async (url: string) =>
      url.includes("redis")
        ? { ok: true, json: async () => ({ result: 1 }) }
        : { ok: true },
    );
    vi.stubGlobal("fetch", fetcher);
    expect((await request()).status).toBe(200);
    expect((await request()).status).toBe(200);
    const calls = fetcher.mock.calls as unknown as [string, RequestInit][];
    expect(
      (calls[1][1].headers as Record<string, string>)["Idempotency-Key"],
    ).toBe((calls[3][1].headers as Record<string, string>)["Idempotency-Key"]);
    expect(calls[0][1].body).not.toContain("192.0.2.1");
  });
});
