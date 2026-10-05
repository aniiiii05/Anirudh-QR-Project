import { expect, test, type Page } from "@playwright/test";

/**
 * Page UI checks for /card (guide §13). Run against a dev server with
 *   E2E_BASE_URL=http://127.0.0.1:5201 npx playwright test e2e/card.spec.ts
 * The 3D workspace has its own spec; these tests only touch the HTML page,
 * demos and contact sheet.
 */

const MINE = "header, .hero, .caps, #work, #about, #say-hello, footer, .skip-link";

async function load(page: Page, path = "/card") {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1, name: "Hi, I'm Anirudh." })).toBeVisible();
}

async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

const desktopOnly = (name: string) =>
  test.skip(name !== "desktop-chrome", "viewport loop runs once, on the desktop project");

test.describe("layout", () => {
  test("no horizontal overflow at 360 / 390 / 430 / 720 (200% zoom) / 1440", async ({ page }, info) => {
    desktopOnly(info.project.name);
    for (const width of [360, 390, 430, 720, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const hash of ["", "#operations", "#practice", "#workflow"]) {
        await load(page, `/card${hash}`);
        expect(await overflow(page), `overflow at ${width}${hash}`).toBeLessThanOrEqual(0);
      }
      await page.locator("#about summary").click();
      expect(await overflow(page), `overflow at ${width} with Background open`).toBeLessThanOrEqual(0);
      await page.getByRole("button", { name: "Share a thought" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      expect(await overflow(page), `overflow at ${width} with sheet open`).toBeLessThanOrEqual(0);
    }
  });

  test("loads without runtime errors and keeps one h1, landmarks and lang", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await load(page);
    expect(await page.locator("h1").count()).toBe(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("header").first()).toBeVisible();
    await expect(page.locator("main#main")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("touch targets in the page UI are at least 44px", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile-chrome", "mobile only");
    await load(page, "/card#workflow");
    await page.locator("#about summary").click();
    const small = await page.evaluate((selector) => {
      const out: string[] = [];
      const roots = Array.from(document.querySelectorAll(selector));
      for (const root of roots)
        for (const el of Array.from(
          root.querySelectorAll<HTMLElement>("a, button, summary, .checklist__items label"),
        )) {
          // Work toggles stretch over their whole row via ::after.
          const target = el.classList.contains("work-item__toggle")
            ? (el.closest(".work-item__head") as HTMLElement)
            : el;
          const r = target.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          if (el.closest(".sr-only, .honeypot")) continue;
          if (r.height < 44)
            out.push(`${el.tagName} "${el.textContent?.trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      return out;
    }, MINE);
    expect(small).toEqual([]);
  });
});

test.describe("keyboard", () => {
  test("Tab reaches every page action with a visible focus ring", async ({ page }, info) => {
    desktopOnly(info.project.name);
    await load(page);
    const seen = new Set<string>();
    const missingRing: string[] = [];
    for (let i = 0; i < 70; i += 1) {
      await page.keyboard.press("Tab");
      // Let the 160ms focus transition settle before reading styles.
      await page.waitForTimeout(220);
      const result = await page.evaluate((selector) => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const label = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
        const mine = !!el.closest(selector);
        const own = getComputedStyle(el).boxShadow;
        const after = getComputedStyle(el, "::after").boxShadow;
        const ring = /rgba?\(133, 79, 108|rgba?\(223, 182, 178/.test(own + after); // mauve / blush
        return { label, mine, ring };
      }, MINE);
      if (!result) continue;
      seen.add(result.label);
      if (result.mine && !result.ring) missingRing.push(result.label);
      if (result.label.startsWith("Copy link")) break;
    }
    const labels = [...seen].join(" | ");
    for (const expected of [
      "Skip to content",
      "Work",
      "About",
      "Say hello",
      "See what I make",
      "DATA",
      "AUTOMATION",
      "PRODUCT",
      "The operations lens",
      "One small intention",
      "The useful workflow",
      "Background",
      "Share a thought",
      "Just connect",
      "Privacy",
      "Copy link",
    ])
      expect(labels, `keyboard should reach "${expected}"`).toContain(expected);
    expect(missingRing).toEqual([]);
  });

  test("work stories: Enter and Space toggle, Escape collapses and restores focus", async ({ page }, info) => {
    desktopOnly(info.project.name);
    await load(page);
    const toggle = page.getByRole("button", { name: "The useful workflow" });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page).toHaveURL(/#workflow$/);
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press(" ");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.getByLabel("Paste messy notes").focus();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    // Only one story open at a time.
    await page.getByRole("button", { name: "The operations lens" }).click();
    await page.getByRole("button", { name: "One small intention" }).click();
    await expect(page.locator(".work-item.is-open")).toHaveCount(1);
  });

  test("capability strip toggles with Enter/Space and arrow keys", async ({ page }, info) => {
    desktopOnly(info.project.name);
    await load(page);
    const caps = page.locator(".caps");
    const data = caps.getByRole("button", { name: "DATA", exact: true });
    const automation = caps.getByRole("button", { name: "AUTOMATION", exact: true });
    await automation.focus();
    await page.keyboard.press("Enter");
    await expect(automation).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Give the repetitive work a better job.")).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(data).toHaveAttribute("aria-pressed", "true");
    await expect(data).toBeFocused();
    await page.keyboard.press("End");
    await expect(caps.getByRole("button", { name: "PRODUCT", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("contact sheet traps focus, closes on Escape and returns focus", async ({ page }) => {
    await load(page);
    const trigger = page.locator("header").getByRole("button", { name: "Say hello" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close" })).toBeVisible();
    for (let i = 0; i < 16; i += 1) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest("[role='dialog']"),
      );
      expect(inside, `focus stays in the dialog after ${i + 1} Tab presses`).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    // Close button also restores focus to the trigger that opened it.
    const share = page.getByRole("button", { name: "Share a thought" });
    await share.focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
    await expect(share).toBeFocused();
  });
});

test.describe("demos", () => {
  test("operations lens: 70% → 80% calculated from fictional orders", async ({ page }) => {
    await load(page, "/card#operations");
    const percent = page.getByTestId("otif-percent");
    await expect(percent).toHaveText("70%");
    await page.getByRole("button", { name: "Sample B" }).click();
    await expect(percent).toHaveText("80%");
    await expect(page.getByRole("button", { name: "Sample B" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".otif__order.is-both")).toHaveCount(8);
    await expect(page.getByText(/not Anirudh’s business results/)).toBeVisible();
  });

  test("one small intention: empty → disabled, filled → completion toggles", async ({ page }) => {
    await load(page, "/card#practice");
    const done = page.getByRole("button", { name: "Step done" });
    await expect(done).toBeDisabled();
    await page.getByLabel("One intention").fill("Make Sunday evenings calmer");
    await page.getByLabel("One small next step").fill("Write tomorrow’s top three tonight");
    await expect(done).toBeEnabled();
    await done.click();
    await expect(done).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await page.waitForSelector("#practice-detail:not([hidden])");
    await expect(page.getByLabel("One intention")).toHaveValue("");
  });

  test("useful workflow: empty state, normal input, text-only output", async ({ page }) => {
    await load(page, "/card#workflow");
    const list = page.getByRole("list", { name: "Clean checklist" });
    await expect(list.getByRole("checkbox")).toHaveCount(4);
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("Nothing to tidy yet.")).toBeVisible();
    await page.getByLabel("Paste messy notes").fill("- <b>bold</b>\n\n* two\n- two\n1. three");
    await expect(list.getByRole("checkbox")).toHaveCount(3);
    await expect(list.getByText("<b>bold</b>")).toBeVisible();
    await expect(list.locator("b")).toHaveCount(0);
    await list.getByText("two").click();
    await expect(list.getByRole("checkbox", { name: "two" })).toBeChecked();
  });
});

test.describe("deep links and contact", () => {
  test("#workflow opens the story and scrolls it into view on load", async ({ page }) => {
    await load(page, "/card#workflow");
    const toggle = page.getByRole("button", { name: "The useful workflow" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#workflow")).toBeInViewport();
  });

  test("header nav anchors move to Work and About", async ({ page }) => {
    await load(page);
    await page.locator("header").getByRole("link", { name: "About" }).click();
    await expect(page.locator("#about")).toBeInViewport();
    await page.locator("header").getByRole("link", { name: "Work" }).click();
    await expect(page.locator("#work")).toBeInViewport();
  });

  test("copy link copies the canonical /card URL and announces it", async ({ page, context, baseURL }, info) => {
    desktopOnly(info.project.name);
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(baseURL!).origin });
    await load(page, "/card?utm_source=card#about");
    await page.locator("footer").getByRole("button", { name: "Copy link" }).click();
    await expect(page.locator("footer").getByText("Link copied")).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(new URL("/card", baseURL!).href);
  });

  test("copy link falls back to a selectable field when the Clipboard API fails", async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await load(page);
    await page.locator("header").getByRole("button", { name: "Say hello" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /Copy link/ }).click();
    const field = dialog.getByLabel(/select and copy this link/);
    await expect(field).toBeVisible();
    await expect(field).toHaveValue(new URL("/card", baseURL!).href);
    await expect(field).toBeFocused();
  });

  test("compose falls back to an honest email draft when delivery is off", async ({ page }) => {
    await load(page);
    await page.getByRole("button", { name: "Share a thought" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Opens your own email app — this page does not send messages.")).toBeVisible();
    await dialog.getByRole("button", { name: "Open email draft" }).click();
    await expect(dialog.getByText("Write a few words first.")).toBeVisible();
    await dialog.getByLabel("Your message").fill("Hello from the e2e check.");
    // Navigation to mailto: is attempted by the app; Chrome ignores it headless.
    await dialog.getByRole("button", { name: "Open email draft" }).click();
    await expect(
      dialog.getByText("Your email app should open with a draft. Nothing has been sent yet — press send there."),
    ).toBeVisible();
  });

  test("reduced motion stops decorative animation and keeps everything usable", async ({ page }, info) => {
    desktopOnly(info.project.name);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await load(page);
    const anim = await page
      .locator(".caps__tile[aria-pressed='true'] .glyph__bar")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe("none");
    await page.getByRole("button", { name: "The operations lens" }).click();
    await expect(page.getByTestId("otif-percent")).toHaveText("70%");
  });
});
