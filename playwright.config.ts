import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end checks run in the locally installed Google Chrome (no browser
 * download) with GPU flags so the real WebGL scene renders.
 *
 * Default target: the production build served by scripts/local-vercel.mjs
 * (local emulation of Vercel routing + functions, not a deployment).
 * Set E2E_BASE_URL to test another production-like server instead (the local
 * emulation on another port, or a Vercel preview). routes.spec.ts assumes
 * production behaviour and is not meant for `npm run dev`.
 */
const external = process.env.E2E_BASE_URL;
const baseURL = external || "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    channel: "chrome",
    headless: true,
    launchOptions: {
      args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
    },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
        channel: "chrome",
      },
    },
  ],
  webServer: external
    ? undefined
    : {
        command: "npm run preview:vercel",
        url: "http://127.0.0.1:4173/card",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
