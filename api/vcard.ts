import type { IncomingMessage, ServerResponse } from "node:http";
import { profile } from "../src/card/profile";
const escape = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, "\\$&");
export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="anirudh-sharma.vcf"',
  );
  res.end(
    [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${escape(profile.name)}`,
      "N:Sharma;Anirudh;;;",
      `EMAIL:${profile.email}`,
      `URL:${profile.linkedin}`,
      "END:VCARD",
      "",
    ].join("\r\n"),
  );
}
