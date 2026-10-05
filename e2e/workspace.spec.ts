import { expect, test, type Page } from "@playwright/test";

/**
 * 3D workspace checks in real Chrome with GPU flags (see playwright.config.ts).
 * Run against the dev server for the dev-only test hook:
 *   E2E_BASE_URL=http://127.0.0.1:5202 npx playwright test e2e/workspace.spec.ts
 * Against a production build the hook is absent and the canvas-click test is skipped.
 */

type Area = "operations" | "practice" | "workflow";
type HookState = { area: Area | null; settled: boolean; renders: number; quality: string; pixelRatio: number };
declare global {
  interface Window {
    __workspaceTest?: {
      pickPoint: (area: Area) => { x: number; y: number };
      state: () => HookState;
    };
    __lose?: { loseContext: () => void; restoreContext: () => void } | null;
  }
}

/** Requests that belong to the lazily loaded renderer (dev module paths and build chunk names). */
const LAZY_3D = /RoomCanvas|roomScene|\/\.vite\/deps\/three|three[._-]module|\/assets\/three[-.]/;

const corners = (page: Page) => page.getByRole("group", { name: "Workspace corners" });
const stage = (page: Page) => page.locator("#workspace .room-stage");
const canvas = (page: Page) => page.locator("#workspace .room-canvas canvas");
const status = (page: Page) => page.locator("#workspace").getByRole("status");

async function openWorkspace(page: Page) {
  await page.goto("/card");
  const section = page.locator("#workspace");
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole("heading", { name: "Different tools. Same curiosity." })).toBeVisible();
  return section;
}

async function explore(page: Page) {
  await page.getByRole("button", { name: "Explore in 3D ↗" }).click();
  await expect(stage(page)).toHaveClass(/is-active/, { timeout: 30_000 });
  await expect(canvas(page)).toBeVisible();
  // Wait for the cross-fade: canvas fully in, poster fully out.
  await expect(page.locator("#workspace .room-canvas")).toHaveCSS("opacity", "1");
  await expect(page.locator("#workspace .room-poster img")).toHaveCSS("opacity", "0");
  await stage(page).scrollIntoViewIfNeeded();
  await settle(page);
}

const hasHook = (page: Page) => page.evaluate(() => Boolean(window.__workspaceTest));

/** Wait until the camera has stopped (render loop idle). */
async function settle(page: Page) {
  // Keep the mouse off the canvas so desktop parallax does not keep easing.
  await page.mouse.move(1, 1);
  if (await hasHook(page)) {
    await page.waitForFunction(() => window.__workspaceTest?.state().settled === true, null, { timeout: 15_000 });
    await page.waitForTimeout(120); // let the compositor present the last frame
  } else await page.waitForTimeout(1600);
}

const hookState = (page: Page) => page.evaluate(() => window.__workspaceTest?.state() ?? null);

/** Decode a canvas screenshot in the page and summarise its pixels. */
async function canvasPixels(page: Page) {
  const png = await canvas(page).screenshot();
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const surface = document.createElement("canvas");
    surface.width = image.width;
    surface.height = image.height;
    const context = surface.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, surface.width, surface.height).data;
    const colours = new Set<number>();
    let blush = 0;
    let mauve = 0;
    let ink = 0;
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      colours.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3));
      // Brand accents: blush #DFB6B2 and mauve #854F6C, allowing for lighting.
      if (r > 195 && g > 150 && g < 205 && b > 140 && b < 205 && r - g > 20) blush++;
      if (r > 95 && r < 175 && g > 45 && g < 115 && b > 75 && b < 145 && r > b && b > g + 5) mauve++;
      if (r < 60 && g < 60 && b < 60) ink++;
    }
    return { colours: colours.size, blush, mauve, ink, pixels: data.length / 4 };
  }, png.toString("base64"));
}

/** Share of pixels that differ noticeably between two screenshots (decoded in the page). */
async function diffRatio(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(
    async ([first, second]) => {
      const decode = async (base64: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const surface = document.createElement("canvas");
        surface.width = image.width;
        surface.height = image.height;
        const context = surface.getContext("2d")!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, surface.width, surface.height).data;
      };
      const [x, y] = await Promise.all([decode(first), decode(second)]);
      if (x.length !== y.length) return 1;
      let changed = 0;
      for (let i = 0; i < x.length; i += 4)
        if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 48) changed++;
      return changed / (x.length / 4);
    },
    [a.toString("base64"), b.toString("base64")] as const,
  );
}

test.describe("3D workspace", () => {
  test("requests three.js only after Explore, then renders a real scene", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await openWorkspace(page);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#workspace picture img")).toBeVisible();
    await expect(page.locator("#workspace canvas")).toHaveCount(0);
    expect(requests.filter((url) => LAZY_3D.test(url))).toEqual([]);

    await explore(page);
    expect(requests.some((url) => LAZY_3D.test(url))).toBe(true);
    const pixels = await canvasPixels(page);
    expect(pixels.colours).toBeGreaterThan(150);
    expect(pixels.blush).toBeGreaterThan(50);
    expect(pixels.mauve).toBeGreaterThan(50);
    expect(pixels.ink).toBeGreaterThan(200);
    await expect(canvas(page)).toHaveAttribute("aria-hidden", "true");
    await expect(canvas(page)).toHaveCSS("touch-action", "pan-y");
    const state = await hookState(page);
    if (state) {
      // Pixel ratio is capped: ≈1.5 on desktop, ≈1.25 and the lighter tier on touch devices.
      const touch = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
      expect(state.pixelRatio).toBeLessThanOrEqual(touch ? 1.25 : 1.5);
      expect(state.quality).toBe(touch ? "low" : "high");
    }
  });

  test("pauses rendering while the canvas is off-screen", async ({ page }) => {
    await openWorkspace(page);
    await explore(page);
    test.skip(!(await hasHook(page)), "needs the dev-only test hook (run against the dev server)");
    const before = (await hookState(page))!.renders;
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(stage(page)).not.toBeInViewport();
    // Select a corner without scrolling: the camera target changes but nothing is drawn.
    await page.evaluate(() =>
      document.querySelector<HTMLButtonElement>('#workspace .room-area[aria-pressed="false"]')!.click(),
    );
    await page.waitForTimeout(700);
    expect((await hookState(page))!.renders).toBe(before);
    await stage(page).scrollIntoViewIfNeeded();
    await settle(page);
    const after = (await hookState(page))!;
    expect(after.renders).toBeGreaterThan(before);
    expect(after.area).toBe("operations");
  });

  test("area buttons move the camera; Reset view and Use still image work", async ({ page }) => {
    await openWorkspace(page);
    await explore(page);
    const overview = await canvas(page).screenshot();
    const shots = new Map<string, Buffer>();
    for (const [name, id] of [
      ["Data", "operations"],
      ["Product", "practice"],
      ["Automation", "workflow"],
    ] as const) {
      await corners(page).getByRole("button", { name }).click();
      await expect(corners(page).getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
      await stage(page).scrollIntoViewIfNeeded();
      await settle(page);
      const shot = await canvas(page).screenshot();
      expect(await diffRatio(page, shot, overview), `${name} view should differ from the overview`).toBeGreaterThan(0.2);
      for (const [other, previous] of shots)
        expect(await diffRatio(page, shot, previous), `${name} vs ${other}`).toBeGreaterThan(0.2);
      shots.set(name, shot);
      const state = await hookState(page);
      if (state) expect(state.area).toBe(id);
    }
    await expect(page.getByRole("button", { name: "Open The useful workflow ↗" })).toBeVisible();

    await page.getByRole("button", { name: "Reset view" }).click();
    for (const name of ["Data", "Product", "Automation"])
      await expect(corners(page).getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    await settle(page);
    const reset = await canvas(page).screenshot();
    expect(await diffRatio(page, reset, shots.get("Automation")!)).toBeGreaterThan(0.2);
    // Back to the same overview it started from.
    expect(await diffRatio(page, reset, overview)).toBeLessThan(0.01);
    const state = await hookState(page);
    if (state) {
      expect(state.area).toBeNull();
      // Render on demand: nothing is drawn while the view is idle.
      await page.waitForTimeout(600);
      expect((await hookState(page))!.renders).toBe(state.renders);
    }

    await page.getByRole("button", { name: "Use still image" }).click();
    await expect(page.locator("#workspace canvas")).toHaveCount(0);
    await expect(page.locator("#workspace picture img")).toBeVisible();
    await expect(page.getByRole("button", { name: "Explore in 3D ↗" })).toBeVisible();
  });

  test("clicking or tapping an object in the canvas selects its corner", async ({ page }, testInfo) => {
    await openWorkspace(page);
    await explore(page);
    test.skip(!(await hasHook(page)), "needs the dev-only test hook (run against the dev server)");
    for (const [id, name] of [
      ["workflow", "Automation"],
      ["operations", "Data"],
      ["practice", "Product"],
    ] as const) {
      if (id !== "workflow") {
        await page.getByRole("button", { name: "Reset view" }).click();
        await settle(page);
      }
      const point = await page.evaluate((area) => window.__workspaceTest!.pickPoint(area), id);
      // Make sure the point hits the canvas itself, not a hotspot pin on top of it.
      const target = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.tagName ?? null,
        point,
      );
      expect(target).toBe("CANVAS");
      if (testInfo.project.use.hasTouch) await page.touchscreen.tap(point.x, point.y);
      else await page.mouse.click(point.x, point.y);
      await expect(corners(page).getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
      await settle(page);
      expect((await hookState(page))!.area).toBe(id);
    }
  });

  test("reduced motion makes camera changes immediate", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspace(page);
    await explore(page);
    await corners(page).getByRole("button", { name: "Data" }).click();
    if (await hasHook(page)) {
      // Settles within a frame or two instead of a ~1 s transition.
      await page.waitForFunction(() => window.__workspaceTest?.state().settled === true, null, { timeout: 400 });
    }
    await stage(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const early = await canvas(page).screenshot();
    await page.waitForTimeout(900);
    const late = await canvas(page).screenshot();
    // A normal transition takes ~1 s; with reduced motion the view is already final.
    expect(await diffRatio(page, early, late)).toBeLessThan(0.01);
    await expect(page.getByRole("button", { name: "Open The operations lens ↗" })).toBeVisible();
  });

  test("missing WebGL keeps the still image and working buttons", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (/webgl/i.test(type)) return null;
        return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await openWorkspace(page);
    await page.getByRole("button", { name: "Explore in 3D ↗" }).click();
    await expect(status(page)).toContainText("3D isn’t available on this device");
    await expect(page.locator("#workspace canvas")).toHaveCount(0);
    await expect(page.locator("#workspace picture img")).toBeVisible();
    expect(requests.filter((url) => LAZY_3D.test(url))).toEqual([]);
    // Every hotspot pin stays visible and on top (the status box must not cover them).
    const pins = page.locator("#workspace .room-pin");
    await expect(pins).toHaveCount(3);
    for (const pin of await pins.all()) {
      await expect(pin).toBeVisible();
      const label = await pin.getAttribute("aria-label");
      const hit = await pin.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return top?.closest(".room-pin")?.getAttribute("aria-label") ?? top?.className ?? null;
      });
      expect(hit).toBe(label);
    }
    await corners(page).getByRole("button", { name: "Data" }).click();
    await expect(page.locator("#workspace .room-spot")).toBeVisible();
    // Reset view in still mode keeps keyboard focus on the (now disabled) button.
    const reset = page.getByRole("button", { name: "Reset view" });
    await reset.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#workspace .room-spot")).toHaveCount(0);
    await expect(reset).toBeFocused();
    await expect(reset).toHaveAttribute("aria-disabled", "true");
    await corners(page).getByRole("button", { name: "Data" }).click();
    await expect(page.locator("#workspace .room-spot")).toBeVisible();
    await page.getByRole("button", { name: "Open The operations lens ↗" }).click();
    await expect
      .poll(async () => page.evaluate(() => location.hash === "#operations" || !!document.getElementById("operations")))
      .toBe(true);
  });

  test("a failed 3D download shows a fallback and the retry recovers", async ({ page }) => {
    await page.route(/RoomCanvas/, (route) => route.abort());
    await openWorkspace(page);
    await page.getByRole("button", { name: "Explore in 3D ↗" }).click();
    await expect(status(page)).toContainText("couldn’t load", { timeout: 15_000 });
    await expect(page.locator("#workspace picture img")).toBeVisible();
    await corners(page).getByRole("button", { name: "Product" }).click();
    await expect(page.getByRole("button", { name: "Open One small intention ↗" })).toBeVisible();
    await page.unroute(/RoomCanvas/);
    await page.getByRole("button", { name: "Try 3D again" }).click();
    await expect(stage(page)).toHaveClass(/is-active/, { timeout: 30_000 });
    await expect(canvas(page)).toBeVisible();
  });

  test("a lost WebGL context falls back and can be restored", async ({ page }) => {
    await openWorkspace(page);
    await explore(page);
    await page.evaluate(() => {
      const element = document.querySelector<HTMLCanvasElement>("#workspace .room-canvas canvas")!;
      const gl = element.getContext("webgl2");
      window.__lose = gl?.getExtension("WEBGL_lose_context") ?? null;
      window.__lose?.loseContext();
    });
    await expect(status(page)).toContainText("graphics context was lost");
    await expect(stage(page)).toHaveClass(/is-error/);
    await expect(page.locator("#workspace picture img")).toBeVisible();
    await corners(page).getByRole("button", { name: "Automation" }).click();
    await expect(page.getByRole("button", { name: "Open The useful workflow ↗" })).toBeVisible();
    await page.evaluate(() => window.__lose?.restoreContext());
    await page.getByRole("button", { name: "Try 3D again" }).click();
    await expect(stage(page)).toHaveClass(/is-active/, { timeout: 30_000 });
    await settle(page);
    expect((await canvasPixels(page)).colours).toBeGreaterThan(150);
  });

  test("wheel and touch scrolling over the canvas still scroll the page", async ({ page }, testInfo) => {
    await openWorkspace(page);
    await explore(page);
    const box = (await canvas(page).boundingBox())!;
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    if (!testInfo.project.use.hasTouch) {
      await page.mouse.move(centre.x, centre.y);
      const before = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, 240);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 100);
      return;
    }
    // A real touch drag that starts on the canvas, sent through Chrome's input pipeline.
    const before = await page.evaluate(() => window.scrollY);
    const cdp = await page.context().newCDPSession(page);
    const x = Math.round(centre.x);
    const y = Math.round(centre.y);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let step = 1; step <= 10; step++)
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - step * 18 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 100);
    // A scroll is not a tap: no corner was selected by it.
    for (const name of ["Data", "Product", "Automation"])
      await expect(corners(page).getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
  });
});
