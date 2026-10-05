import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  renderRouteHtml,
  robotsTxt,
  routes,
  sitemapXml,
} from "../../scripts/card-html.mjs";
import {
  contactSchema,
  DIRECT_DELIVERY_NOTICE,
  parseSiteOrigin,
  qrDestination,
  tidyLines,
} from "./logic";
import { profile } from "./profile";

describe("QR entry", () => {
  it("discards arbitrary destinations and personal query strings", () => {
    expect(
      qrDestination(
        "https://example.com/q?next=https://evil.test&email=private&ut m=a&utm_medium=print",
      ),
    ).toBe("/card?utm_medium=print&utm_source=card");
  });
  it("keeps only valid campaign fields, in a fixed order", () => {
    expect(
      qrDestination(
        "/q?utm_campaign=spring_26&utm_source=card&utm_medium=print&utm_term=x",
      ),
    ).toBe("/card?utm_source=card&utm_medium=print&utm_campaign=spring_26");
    expect(qrDestination("/q?utm_source=card&next=https://evil.example&email=a@b.c")).toBe(
      "/card?utm_source=card",
    );
  });
  it("rejects unsafe campaign values", () => {
    for (const value of [
      "%3Cscript%3E",
      "a%2Fb",
      "a.b",
      "",
      "a".repeat(65),
      "%0d%0aSet-Cookie:x",
      "caf%C3%A9",
    ])
      expect(qrDestination(`/q?utm_source=${value}`)).toBe(
        "/card?utm_source=card",
      );
  });
  it("defaults the source when no parameters are given", () => {
    expect(qrDestination("/q")).toBe("/card?utm_source=card");
    expect(qrDestination("")).toBe("/card?utm_source=card");
    expect(qrDestination("/q?")).toBe("/card?utm_source=card");
  });
  it("can never produce an open redirect", () => {
    const attempts = [
      "//evil.example/q?utm_source=card",
      "/\\evil.example?utm_source=x",
      "\\\\evil.example\\q",
      "/q?next=//evil.example",
      "/q?url=https://evil.example",
      "/q?redirect=%2F%2Fevil.example",
      "/%2F%2Fevil.example?utm_source=a",
      "/q/..%2F..%2Fevil?utm_medium=b",
      "https://evil.example/q?utm_source=card",
      "/q?utm_source=card#//evil.example",
      "//[::1/q?x",
      "/q?utm_source=%2F%2Fevil.example",
    ];
    for (const raw of attempts) {
      const location = qrDestination(raw);
      expect(location.startsWith("/card?")).toBe(true);
      expect(location.startsWith("//")).toBe(false);
      expect(location).not.toMatch(/evil|\\|%2F|#/i);
    }
  });
});

describe("site origin", () => {
  it("accepts only an exact HTTPS origin", () => {
    expect(parseSiteOrigin("https://card.example")).toBe("https://card.example");
    expect(parseSiteOrigin("https://card.example:8443")).toBe(
      "https://card.example:8443",
    );
    for (const value of [
      undefined,
      null,
      "",
      "card.example",
      "http://card.example",
      "https://card.example/",
      "https://card.example/card",
      "https://card.example?x=1",
      "https://user:pass@card.example",
      "https://CARD.example",
      " https://card.example",
      "javascript:alert(1)",
    ])
      expect(parseSiteOrigin(value)).toBeNull();
  });
});

describe("contact validation", () => {
  const message = {
    name: "Sample Person",
    email: "sample@example.com",
    message: "A thoughtful idea to discuss together.",
    consent: true,
    contextUrl: "",
  };
  it("accepts expected content", () =>
    expect(contactSchema.safeParse(message).success).toBe(true));
  it("requires reply consent", () =>
    expect(
      contactSchema.safeParse({ ...message, consent: false }).success,
    ).toBe(false));
  it("rejects unsafe context links", () =>
    expect(
      contactSchema.safeParse({ ...message, contextUrl: "javascript:alert(1)" })
        .success,
    ).toBe(false));
  it("rejects oversized messages", () =>
    expect(
      contactSchema.safeParse({ ...message, message: "a".repeat(1201) })
        .success,
    ).toBe(false));
});

it("makes a stable unique checklist without interpreting HTML", () => {
  expect(tidyLines("  - Do a thing\nDo a thing\n\n<script>")).toEqual([
    "Do a thing",
    "<script>",
  ]);
});

describe("static route HTML (scripts/card-html.mjs)", () => {
  const template = readFileSync("index.html", "utf8");
  const all = routes(profile);
  const image = { path: "/card-og.png", width: 1200, height: 630 };

  it("index.html carries the same public values as profile.ts", () => {
    expect(template).toContain(`<title>${escapeHtml(all.home.title)}</title>`);
    expect(template).toContain(`content="${escapeHtml(all.home.description)}"`);
    expect(template).toContain(`href="mailto:${profile.email}"`);
    expect(template).toContain(`href="${profile.github}"`);
    expect(template).toContain(`href="${profile.linkedin}"`);
    expect(template).toContain(`href="${profile.pinterest}"`);
    expect(template).toContain('<html lang="en">');
    expect(template).toContain('content="#190019"');
    expect(template).toContain("viewport-fit=cover");
    expect(template).not.toMatch(/fonts\.googleapis|fonts\.gstatic|lovable|gpt-engineer/i);
  });
  it("without SITE_ORIGIN: route metadata, noindex and no absolute URLs", () => {
    const html = renderRouteHtml(template, {
      profile,
      route: all.card,
      origin: null,
      image,
    });
    expect(html).toContain(
      "<title>Anirudh Sharma — Human, But Automated.</title>",
    );
    expect(html).toContain(`<meta name="description" content="${profile.description}" />`);
    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<meta property="og:title"');
    expect(html).not.toMatch(/rel="canonical"|og:url|og:image|ld\+json|https:\/\/[^"]*\/card/);
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html).toContain(`href="mailto:${profile.email}"`);
  });
  it("with SITE_ORIGIN: canonical, og:url, og:image and Person JSON-LD", () => {
    const html = renderRouteHtml(template, {
      profile,
      route: all.card,
      origin: "https://card.example",
      image,
    });
    expect(html).toContain('<link rel="canonical" href="https://card.example/card" />');
    expect(html).toContain('<meta property="og:url" content="https://card.example/card" />');
    expect(html).toContain('<meta property="og:image" content="https://card.example/card-og.png" />');
    expect(html).toContain('<meta property="og:image:width" content="1200" />');
    expect(html).not.toContain('name="robots"');
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(ld).not.toBeNull();
    expect(JSON.parse(ld![1])).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      url: "https://card.example/card",
      email: `mailto:${profile.email}`,
      jobTitle: profile.role,
      sameAs: [profile.linkedin, profile.github, profile.pinterest],
    });
  });
  it("homepage route is indexable at / with Person data and no employer", () => {
    const html = renderRouteHtml(template, {
      profile,
      route: all.home,
      origin: "https://card.example",
      image,
    });
    expect(html).toContain('<link rel="canonical" href="https://card.example/" />');
    expect(html).toContain(`<title>${escapeHtml(all.home.title)}</title>`);
    expect(html).not.toContain('name="robots"');
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(JSON.parse(ld![1])).toMatchObject({ "@type": "Person", url: "https://card.example/", jobTitle: profile.role });
    expect(JSON.parse(ld![1])).not.toHaveProperty("worksFor");
  });
  it("privacy route gets its own title and no Person data", () => {
    const html = renderRouteHtml(template, {
      profile,
      route: all.privacy,
      origin: "https://card.example",
      image,
    });
    expect(html).toContain(`<title>Privacy — ${profile.name}</title>`);
    expect(html).toContain('href="https://card.example/privacy"');
    expect(html).not.toContain("ld+json");
  });
  it("the SPA fallback is never indexable", () => {
    const html = renderRouteHtml(template, {
      profile,
      route: all.card,
      origin: "https://card.example",
      image,
      indexable: false,
    });
    expect(html).toContain('content="noindex, nofollow"');
    expect(html).not.toMatch(/rel="canonical"|og:url|ld\+json/);
  });
  it("escapes attribute values", () => {
    expect(escapeHtml(`"<a href='x'>&`)).toBe("&quot;&lt;a href=&#39;x&#39;&gt;&amp;");
    const html = renderRouteHtml(template, {
      profile,
      route: { ...all.card, title: 'A "quoted" <title>', description: "x\" onload=\"y" },
      origin: null,
      image: null,
    });
    expect(html).toContain("<title>A &quot;quoted&quot; &lt;title&gt;</title>");
    expect(html).toContain('content="x&quot; onload=&quot;y"');
  });
  it("robots.txt and sitemap follow the origin", () => {
    expect(robotsTxt(null)).toBe("User-agent: *\nDisallow: /\n");
    const robots = robotsTxt("https://card.example");
    expect(robots).toContain("Allow: /");
    // /q is kept out of the index by its X-Robots-Tag header, not robots.txt,
    // so crawlers can follow it and see that header.
    expect(robots).not.toContain("Disallow: /q");
    expect(robots).toContain("Sitemap: https://card.example/sitemap.xml");
    const sitemap = sitemapXml("https://card.example", ["/card", "/privacy"]);
    expect(sitemap).toContain("<loc>https://card.example/card</loc>");
    expect(sitemap).toContain("<loc>https://card.example/privacy</loc>");
  });
});

describe("direct delivery is tied to the privacy notice", () => {
  // Tripwire: enabling delivery requires changing the notice and this constant
  // together (see DIRECT_DELIVERY_NOTICE in logic.ts and README).
  it("keeps delivery locked while the notice says it is not enabled", () => {
    const notice = readFileSync("src/card/Privacy.tsx", "utf8");
    expect(DIRECT_DELIVERY_NOTICE).toBeNull();
    expect(notice).toContain("Direct form delivery is not enabled.");
  });
});
