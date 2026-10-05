import type { IncomingMessage, ServerResponse } from "node:http";
import { qrDestination } from "../src/card/logic.js";

/**
 * Printed-QR entry point: a server-side temporary redirect to /card that keeps
 * only allowlisted campaign fields (see qrDestination). Works without client
 * JavaScript. 302 keeps the destination changeable; no-store stops browsers and
 * shared caches from pinning it; noindex keeps /q out of search results.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Method not allowed");
    return;
  }
  res.statusCode = 302;
  res.setHeader("Location", qrDestination(req.url || "/q"));
  res.end();
}
