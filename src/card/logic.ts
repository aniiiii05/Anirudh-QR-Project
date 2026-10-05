import { z } from "zod";

/** Contact form rules (guide §10). Shared by the browser form and api/contact.ts. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80),
  email: z.string().trim().email("Enter a valid email.").max(254),
  message: z
    .string()
    .trim()
    .min(20, "Please write at least 20 characters.")
    .max(1200),
  contextUrl: z
    .union([
      z.literal(""),
      z
        .string()
        .max(500)
        .url()
        .refine((v) => new URL(v).protocol === "https:", "Use an HTTPS link."),
    ])
    .optional(),
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Please confirm that Anirudh may reply by email.",
    }),
  }),
  /** Honeypot: hidden from people and assistive technology; must stay empty. */
  website: z.string().max(200).optional(),
});

export function tidyLines(value: string) {
  return [
    ...new Set(
      value
        .split("\n")
        .map((line) => line.trim().replace(/^[-*•]\s*/, ""))
        .filter(Boolean),
    ),
  ].slice(0, 30);
}

/** Campaign fields kept by /q. Everything else (next=, url=, email=, …) is dropped. */
export const QR_CAMPAIGN_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
] as const;
const CAMPAIGN_VALUE = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Destination for the printed QR entry point (/q).
 *
 * Only the query string of `raw` is read — its scheme, host and path are
 * ignored — and the result is always the fixed relative path `/card` plus
 * allowlisted campaign fields. It can never become an open redirect, whatever
 * the input (`//host`, backslashes, encoded slashes, `next=`, `url=`).
 * `utm_source=card` is added when no valid source is supplied so printed-card
 * visits stay distinguishable without any other identifier.
 */
export function qrDestination(raw: string) {
  const queryStart = raw.indexOf("?");
  const query =
    queryStart === -1 ? "" : raw.slice(queryStart + 1).split("#")[0];
  const incoming = new URLSearchParams(query);
  const kept = new URLSearchParams();
  for (const key of QR_CAMPAIGN_FIELDS) {
    const value = incoming.get(key);
    if (value !== null && CAMPAIGN_VALUE.test(value)) kept.set(key, value);
  }
  if (!kept.has("utm_source")) kept.set("utm_source", "card");
  return `/card?${kept.toString()}`;
}

/**
 * Validates a deployment origin such as `https://example.com`.
 * Returns the origin only when the value is exactly an HTTPS origin — no path,
 * query, fragment, credentials or trailing slash — otherwise `null`.
 * Callers treat `null` as "no public origin": metadata stays noindex and
 * contact delivery stays disabled.
 */
export function parseSiteOrigin(value: string | undefined | null) {
  if (typeof value !== "string" || value === "") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    // Plain DNS names only (no wildcards or other symbols the URL parser tolerates).
    if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(url.hostname))
      return null;
    return url.origin === value ? url.origin : null;
  } catch {
    return null;
  }
}

/**
 * Revision id of the privacy notice (src/card/Privacy.tsx) that describes direct
 * form delivery: the email and rate-limiting providers, retention and deletion.
 * While this is null the notice says direct delivery is not enabled, and
 * api/contact.ts refuses to enable delivery whatever the environment says.
 * To enable delivery: update the notice, set this to that revision (for example
 * "2026-11-01"), and set PRIVACY_NOTICE_VERSION to the same value on the server.
 */
export const DIRECT_DELIVERY_NOTICE: string | null = null;
