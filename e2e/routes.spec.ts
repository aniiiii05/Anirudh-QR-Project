import { expect, test } from "@playwright/test";

/**
 * Server routes, headers and metadata. Runs against the local emulation of
 * Vercel routing (scripts/local-vercel.mjs, default http://127.0.0.1:4173) or
 * E2E_BASE_URL. Expectations assume SITE_ORIGIN is not set (review build:
 * noindex, contact delivery disabled), which is the local default.
 */
const EMAIL = "sharma.aniiirudh@gmail.com";
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

test.describe("server routes", () => {
  test("/ serves the homepage with its own metadata", async ({ request }) => {
    const res = await request.get("/", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain("<title>Anirudh Sharma — Data Engineer &amp; Creator</title>");
    expect(html).toContain(`href="mailto:${EMAIL}"`);
    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
  });

  test("unknown paths fall back to the noindex app shell", async ({ request }) => {
    const res = await request.get("/does-not-exist");
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('<meta name="robots" content="noindex, nofollow" />');
  });

  test("/q keeps only allowlisted campaign fields", async ({ request }) => {
    const res = await request.get(
      "/q?utm_source=card&next=https://evil.example&email=a@b.c",
      { maxRedirects: 0 },
    );
    expect([302, 307]).toContain(res.status());
    expect(res.headers()["location"]).toBe("/card?utm_source=card");
    expect(res.headers()["cache-control"]).toBe("no-store");
    expect(res.headers()["x-robots-tag"]).toBe("noindex");
  });

  test("/q without parameters defaults the source", async ({ request }) => {
    const res = await request.get("/q", { maxRedirects: 0 });
    expect([302, 307]).toContain(res.status());
    expect(res.headers()["location"]).toBe("/card?utm_source=card");
  });

  test("/q is never an open redirect", async ({ request }) => {
    for (const query of [
      "?next=//evil.example",
      "?url=https://evil.example",
      "?utm_source=%2F%2Fevil.example",
      "?utm_campaign=..%2F..%2Fevil",
    ]) {
      const res = await request.get(`/q${query}`, { maxRedirects: 0 });
      const location = res.headers()["location"];
      expect(location.startsWith("/card?")).toBe(true);
      expect(location).not.toMatch(/evil|\/\//);
    }
  });

  test("/contact.vcf is a downloadable vCard without a phone number", async ({
    request,
  }) => {
    const res = await request.get("/contact.vcf");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("text/vcard; charset=utf-8");
    expect(res.headers()["content-disposition"]).toBe(
      'attachment; filename="anirudh-sharma.vcf"',
    );
    const body = await res.text();
    expect(body.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(body).toContain("FN:Anirudh Sharma\r\n");
    expect(body).toContain(`EMAIL;TYPE=INTERNET:${EMAIL}\r\n`);
    expect(body).toContain("https://github.com/aniiiii05");
    expect(body).toContain("https://www.linkedin.com/in/-anirudh-sharma/");
    expect(body).not.toMatch(/^(TEL|TITLE|ORG|ADR)[;:]/m);
    expect(body.endsWith("END:VCARD\r\n")).toBe(true);
  });

  test("raw /card HTML has metadata before JavaScript runs", async ({
    request,
  }) => {
    const res = await request.get("/card");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain(
      "<title>Anirudh Sharma — Human, But Automated.</title>",
    );
    expect(html).toMatch(
      /<meta name="description" content="I turn messy ideas into useful systems\.[^"]*"/,
    );
    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain(`href="mailto:${EMAIL}"`);
    expect(html).not.toMatch(/fonts\.googleapis|lovable|gpt-engineer/);
  });

  test("GET /api/contact reports delivery as disabled", async ({ request }) => {
    const res = await request.get("/api/contact");
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toBe("no-store");
    const body = await res.json();
    expect(body.enabled).toBe(false);
    expect(typeof body.requestId).toBe("string");
  });

  test("cross-origin POST /api/contact is refused", async ({ request }) => {
    const res = await request.post("/api/contact", {
      headers: {
        Origin: "https://evil.example",
        "Content-Type": "application/json",
        "Idempotency-Key": "12345678-1234-1234-1234-123456789abc",
      },
      data: {
        name: "Sample Person",
        email: "sample@example.com",
        message: "Here is an interesting idea for a small workflow.",
        consent: true,
      },
    });
    expect(res.status()).toBe(403);
    expect(typeof (await res.json()).requestId).toBe("string");
  });

  test("dotfiles and paths outside the build are never served", async ({
    request,
  }) => {
    for (const path of ["/.env", "/.env.example", "/%2e%2e/package.json"]) {
      const res = await request.get(path);
      const text = await res.text();
      expect(text).not.toContain("RESEND_API_KEY");
      expect(text).not.toContain('"devDependencies"');
    }
    expect((await request.get("/api/does-not-exist")).status()).toBe(404);
  });
});

test.describe("pages", () => {
  test("/privacy renders the notice with the contact email", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { level: 1, name: /Privacy/ }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: EMAIL }).first()).toBeVisible();
    await expect(page.getByText("Last updated: 2 October 2026")).toBeVisible();
    await expect(page).toHaveTitle("Privacy — Anirudh Sharma");
    await expect(
      page.getByRole("link", { name: /Back to the card/ }).first(),
    ).toHaveAttribute("href", "/card");
  });

  test("/card sends the CSP and loads without console errors or violations", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const store: string[] = [];
      (window as unknown as { __cspViolations: string[] }).__cspViolations = store;
      document.addEventListener("securitypolicyviolation", (event) =>
        store.push(`${event.violatedDirective} ${event.blockedURI}`),
      );
    });
    const response = await page.goto("/card", { waitUntil: "load" });
    expect(response?.headers()["content-security-policy"]).toBe(CSP);
    expect(response?.headers()["x-frame-options"]).toBe("DENY");
    expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
    await expect(page).toHaveTitle("Anirudh Sharma — Human, But Automated.");
    await expect(page.locator("#root > *").first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    const violations = await page.evaluate(
      () => (window as unknown as { __cspViolations: string[] }).__cspViolations,
    );
    expect(violations).toEqual([]);
    expect(errors).toEqual([]);
  });
});
