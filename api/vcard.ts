import type { IncomingMessage, ServerResponse } from "node:http";
import { parseSiteOrigin } from "../src/card/logic.js";
import { profileVCard, VCARD_FILENAME } from "../src/card/vcard.js";

/**
 * /contact.vcf — the public contact card generated from src/card/profile.ts.
 * The primary URL is the canonical /card address once SITE_ORIGIN is a valid
 * HTTPS origin; until then it is the public LinkedIn profile.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Method not allowed");
    return;
  }
  const origin = parseSiteOrigin(process.env.SITE_ORIGIN);
  const body = profileVCard(origin ? new URL("/card", origin).href : null);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${VCARD_FILENAME}"`,
  );
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(req.method === "HEAD" ? undefined : body);
}
