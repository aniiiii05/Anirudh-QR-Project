import type { z } from "zod";
import type { contactSchema } from "./logic";

export type ContactInput = z.infer<typeof contactSchema>;

/**
 * Whether the server can actually deliver a message right now.
 * `GET /api/contact` reports only a boolean (never configuration details).
 * Any failure — static hosting, Vite without functions, network error — means
 * "not enabled", so the page falls back to an honest email draft instead of a
 * form that would fail on every valid submission.
 */
export async function fetchContactStatus(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch("/api/contact", {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: signal ?? AbortSignal.timeout(4000),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as { enabled?: unknown };
    return body.enabled === true;
  } catch {
    return false;
  }
}

/**
 * Every member lists every property (absent ones as `undefined`) so callers can
 * read `status` / `retryAfter` after an `ok` check under any TypeScript strictness.
 */
export type SendResult =
  | { ok: true; requestId?: string; status?: undefined; retryAfter?: undefined }
  | { ok: false; status: number; retryAfter?: number; requestId?: undefined };

/** Posts a validated message. The idempotency key must stay stable across retries of the same content. */
export async function sendContact(
  data: ContactInput,
  idempotencyKey: string,
): Promise<SendResult> {
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000),
    });
    const body = (await response.json().catch(() => ({}))) as {
      requestId?: string;
    };
    if (response.ok) return { ok: true, requestId: body.requestId };
    const retry = Number(response.headers.get("Retry-After"));
    return {
      ok: false,
      status: response.status,
      retryAfter: Number.isFinite(retry) && retry > 0 ? retry : undefined,
    };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** Builds a mailto: URL for the email-draft fallback. Opening it sends nothing by itself. */
export function emailDraftUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({ subject, body });
  // URLSearchParams encodes spaces as "+", which some mail clients show literally.
  return `mailto:${to}?${params.toString().replace(/\+/g, "%20")}`;
}
