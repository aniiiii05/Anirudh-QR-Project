#!/usr/bin/env node
/**
 * Render the workspace poster from the real three.js scene.
 *
 *   node scripts/render-poster.mjs
 *
 * Starts a Vite dev server (or reuses POSTER_BASE_URL), opens
 * scripts/poster/index.html in the locally installed Google Chrome with GPU
 * flags, and writes:
 *   public/workspace-room.webp  1600×1280, quality lowered until < 150 kB
 *   public/workspace-room.png   1000×800 fallback (same render, downscaled)
 *
 * Options (env):
 *   POSTER_BASE_URL=http://127.0.0.1:5202/  reuse a running dev server
 *   POSTER_AREA=operations|practice|workflow  render a focused view instead
 *   POSTER_OUT=dir                           write somewhere other than public/
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(root, process.env.POSTER_OUT || "public");
const area = process.env.POSTER_AREA || "";
const WEBP_BUDGET = 150 * 1024;
const WEBP_WIDTH = 1600;
const PNG_WIDTH = 1000;

let server;
let baseUrl = process.env.POSTER_BASE_URL;
if (!baseUrl) {
  const { createServer } = await import("vite");
  server = await createServer({
    root,
    configFile: path.join(root, "vite.config.ts"),
    logLevel: "warn",
    server: { host: "127.0.0.1", port: 5202, strictPort: false, hmr: false },
  });
  await server.listen();
  baseUrl = server.resolvedUrls?.local?.[0];
  if (!baseUrl) throw new Error("Vite did not report a local URL");
}

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") console.log(`[page ${message.type()}] ${message.text()}`);
  });
  page.on("pageerror", (error) => console.log(`[page error] ${error.message}`));
  const url = new URL("scripts/poster/index.html", baseUrl);
  if (area) url.searchParams.set("area", area);
  await page.goto(url.href);
  await page.waitForFunction(() => window.__poster && (window.__poster.ready || window.__poster.error), null, {
    timeout: 90_000,
  });
  const error = await page.evaluate(() => window.__poster.error);
  if (error) throw new Error(`Poster render failed: ${error}`);
  const renderer = await page.evaluate(() => {
    const gl = document.querySelector("canvas")?.getContext("webgl2");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "unknown";
  });
  console.log(`GPU: ${renderer}`);

  const decode = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  let quality = 0.9;
  let webp;
  for (;;) {
    webp = decode(await page.evaluate(([q, w]) => window.__poster.encode("image/webp", q, w), [quality, WEBP_WIDTH]));
    if (webp.length <= WEBP_BUDGET || quality <= 0.5) break;
    quality = Math.round((quality - 0.05) * 100) / 100;
  }
  const png = decode(await page.evaluate((w) => window.__poster.encode("image/png", 1, w), PNG_WIDTH));

  await mkdir(outDir, { recursive: true });
  const name = area ? `workspace-room-${area}` : "workspace-room";
  await writeFile(path.join(outDir, `${name}.webp`), webp);
  await writeFile(path.join(outDir, `${name}.png`), png);
  console.log(`${name}.webp  ${WEBP_WIDTH}px  q=${quality}  ${(webp.length / 1024).toFixed(1)} kB`);
  console.log(`${name}.png   ${PNG_WIDTH}px  ${(png.length / 1024).toFixed(1)} kB`);
  if (webp.length > WEBP_BUDGET) console.warn(`Warning: WebP is above the ${WEBP_BUDGET / 1024} kB budget.`);
} finally {
  await browser.close();
  await server?.close();
}
