import { profile } from "./profile.js";

/**
 * vCard 3.0 builder for /contact.vcf (guide §9).
 *
 * Pure and dependency-free: it only uses the approved public fields from
 * profile.ts — name, email and public profile links. No phone, job title,
 * organisation or address by design.
 */
export type VCardContact = {
  name: string;
  givenName: string;
  familyName: string;
  email: string;
  linkedin: string;
  github: string;
};

const CRLF = "\r\n";
const MAX_LINE_OCTETS = 75;

/** RFC 2426 §4 / RFC 6350 §3.4 text escaping: backslash, comma, semicolon, newline. */
export function escapeText(value: string) {
  return value
    // eslint-disable-next-line no-control-regex -- rejecting/removing control characters is the purpose
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/[,;]/g, (c) => `\\${c}`);
}

/** URI values are not text-escaped, so only plain HTTPS URLs are accepted. */
function uri(value: string) {
  // eslint-disable-next-line no-control-regex -- rejecting/removing control characters is the purpose
  if (/[\s\u0000-\u001f\u007f"<>\\]/.test(value))
    throw new Error("vCard URL contains characters that are not allowed");
  if (new URL(value).protocol !== "https:")
    throw new Error("vCard URLs must use HTTPS");
  return value;
}

/**
 * Folds one content line to at most 75 octets per physical line (excluding
 * CRLF). Continuation lines start with a single space, which counts towards
 * the limit. Never splits a UTF-8 multi-byte character.
 */
export function foldLine(line: string) {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = lines.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (octets + size > limit) {
      lines.push(current);
      current = "";
      octets = 0;
    }
    current += char;
    octets += size;
  }
  lines.push(current);
  return lines.join(`${CRLF} `);
}

export function buildVCard(contact: VCardContact, cardUrl?: string | null) {
  const linkedin = uri(contact.linkedin);
  const github = uri(contact.github);
  const primary = cardUrl ? uri(cardUrl) : linkedin;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeText(contact.familyName)};${escapeText(contact.givenName)};;;`,
    `FN:${escapeText(contact.name)}`,
    `EMAIL;TYPE=INTERNET:${escapeText(contact.email)}`,
    `URL:${primary}`,
  ];
  let item = 0;
  for (const [label, url] of [
    ["LinkedIn", linkedin],
    ["GitHub", github],
  ] as const) {
    if (url === primary) continue;
    item += 1;
    lines.push(`item${item}.URL:${url}`, `item${item}.X-ABLabel:${label}`);
  }
  lines.push("END:VCARD");
  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** The public contact card generated from profile.ts. */
export function profileVCard(cardUrl?: string | null) {
  return buildVCard(
    {
      name: profile.name,
      givenName: profile.givenName,
      familyName: profile.familyName,
      email: profile.email,
      linkedin: profile.linkedin,
      github: profile.github,
    },
    cardUrl,
  );
}

export const VCARD_FILENAME = "anirudh-sharma.vcf";
