// @vitest-environment node
import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/vcard";
import { profile } from "./profile";
import { buildVCard, escapeText, foldLine, profileVCard } from "./vcard";

const octets = (line: string) => new TextEncoder().encode(line).length;
const unfold = (card: string) => card.replace(/\r\n /g, "");

describe("vCard builder", () => {
  it("contains only the approved public fields, CRLF-terminated", () => {
    const card = profileVCard();
    expect(card.endsWith("\r\n")).toBe(true);
    expect(card.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    const lines = unfold(card).trimEnd().split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCARD");
    expect(lines[1]).toBe("VERSION:3.0");
    expect(lines[lines.length - 1]).toBe("END:VCARD");
    expect(lines).toContain(`FN:${profile.name}`);
    expect(lines).toContain(`N:${profile.familyName};${profile.givenName};;;`);
    expect(lines).toContain(`EMAIL;TYPE=INTERNET:${profile.email}`);
    expect(lines).toContain(`URL:${profile.linkedin}`);
    expect(lines).toContain(`item1.URL:${profile.github}`);
    expect(lines).toContain("item1.X-ABLabel:GitHub");
    const properties = lines.map((line) =>
      line.split(":")[0].split(";")[0].replace(/^item\d+\./, ""),
    );
    for (const forbidden of ["TEL", "TITLE", "ORG", "ADR", "PHOTO", "NOTE", "BDAY"])
      expect(properties).not.toContain(forbidden);
  });
  it("uses the canonical /card URL when an origin is configured", () => {
    const lines = unfold(profileVCard("https://card.example/card")).split("\r\n");
    expect(lines).toContain("URL:https://card.example/card");
    expect(lines).toContain(`item1.URL:${profile.linkedin}`);
    expect(lines).toContain("item1.X-ABLabel:LinkedIn");
    expect(lines).toContain(`item2.URL:${profile.github}`);
  });
  it("escapes text values", () => {
    expect(escapeText("a,b;c\\d\ne\r\nf")).toBe("a\\,b\\;c\\\\d\\ne\\nf");
    const card = buildVCard({
      name: "Ana, de; Test\\Name",
      givenName: "Ana; Maria",
      familyName: "de, Test",
      email: "ana@example.com",
      linkedin: "https://www.linkedin.com/in/example/",
      github: "https://github.com/example",
    });
    expect(card).toContain("FN:Ana\\, de\\; Test\\\\Name\r\n");
    expect(card).toContain("N:de\\, Test;Ana\\; Maria;;;\r\n");
  });
  it("folds long lines at 75 octets without splitting characters", () => {
    const long = `NOTE:${"é".repeat(60)}${"a".repeat(80)}`;
    const folded = foldLine(long);
    const physical = folded.split("\r\n");
    expect(physical.length).toBeGreaterThan(1);
    for (const line of physical) expect(octets(line)).toBeLessThanOrEqual(75);
    for (const line of physical.slice(1)) expect(line.startsWith(" ")).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(long);
    expect(foldLine("short")).toBe("short");
  });
  it("rejects non-HTTPS or unsafe URLs", () => {
    const base = {
      name: "A B",
      givenName: "A",
      familyName: "B",
      email: "a@example.com",
      linkedin: "https://www.linkedin.com/in/example/",
      github: "https://github.com/example",
    };
    expect(() => buildVCard({ ...base, github: "http://github.com/x" })).toThrow();
    expect(() =>
      buildVCard({ ...base, linkedin: "https://x.example/a\r\nTEL:1" }),
    ).toThrow();
  });
});

describe("GET /contact.vcf", () => {
  afterEach(() => vi.unstubAllEnvs());
  function call(method = "GET") {
    const out = { status: 0, headers: {} as Record<string, string>, body: "" };
    const res = {
      statusCode: 200,
      setHeader: (name: string, value: string | number) => {
        out.headers[name.toLowerCase()] = String(value);
      },
      end: (chunk?: string) => {
        out.status = res.statusCode;
        out.body = chunk ?? "";
      },
    };
    handler(
      { method, url: "/contact.vcf", headers: {} } as unknown as IncomingMessage,
      res as unknown as ServerResponse,
    );
    return out;
  }
  it("serves a downloadable vCard", () => {
    vi.stubEnv("SITE_ORIGIN", "");
    const res = call();
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("text/vcard; charset=utf-8");
    expect(res.headers["content-disposition"]).toBe(
      'attachment; filename="anirudh-sharma.vcf"',
    );
    expect(res.body).toBe(profileVCard());
    expect(res.body).not.toMatch(/^TEL/m);
  });
  it("points at the canonical card when SITE_ORIGIN is valid", () => {
    vi.stubEnv("SITE_ORIGIN", "https://card.example");
    expect(call().body).toContain("URL:https://card.example/card\r\n");
    vi.stubEnv("SITE_ORIGIN", "http://card.example");
    expect(call().body).toContain(`URL:${profile.linkedin}\r\n`);
  });
  it("answers HEAD without a body and refuses other methods", () => {
    const head = call("HEAD");
    expect(head.status).toBe(200);
    expect(head.body).toBe("");
    const post = call("POST");
    expect(post.status).toBe(405);
    expect(post.headers.allow).toBe("GET, HEAD");
  });
});
