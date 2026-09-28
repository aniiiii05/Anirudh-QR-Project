import type { IncomingMessage, ServerResponse } from "node:http";
import { qrDestination } from "../src/card/logic";
export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 302;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Location", qrDestination(req.url || "/q"));
  res.end();
}
