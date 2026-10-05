/**
 * One-off asset pipeline for the homepage (`npm run assets`).
 *
 * Source files live in "Portfolio Design Assets/" (not shipped). This script:
 *   1. writes responsive WebP portraits to public/site/img/ — natural colour
 *      for the page, palette gradient-mapped for the spotlight's alt layer
 *   2. recolours the Lottie illustrations onto the same palette (by luminance)
 *      and writes minified JSON to public/site/lottie/
 *   3. copies the licensed web fonts (SA Triumph, Balimo) to src/site/fonts/
 *
 * Outputs are committed, so a normal `npm run build` never needs sharp.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "Portfolio Design Assets");
const IMG_OUT = join(ROOT, "public/site/img");
const LOTTIE_OUT = join(ROOT, "public/site/lottie");
const FONT_OUT = join(ROOT, "src/site/fonts");
for (const dir of [IMG_OUT, LOTTIE_OUT, FONT_OUT]) mkdirSync(dir, { recursive: true });

/** Brand palette, darkest to lightest. */
const PALETTE = ["#190019", "#2B124C", "#522B5B", "#854F6C", "#DFB6B2", "#FBE4D8"];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Builds a 256-entry lookup table from [position, hex] stops. */
function gradientLut(stops) {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [p0, c0] = stops[k];
    const [p1, c1] = stops[k + 1];
    const f = Math.min(1, Math.max(0, (t - p0) / (p1 - p0)));
    const a = rgb(c0);
    const b = rgb(c1);
    for (let ch = 0; ch < 3; ch++) lut[i * 3 + ch] = Math.round(a[ch] + (b[ch] - a[ch]) * f);
  }
  return lut;
}

const LIGHT_MAP = gradientLut([
  [0, "#190019"],
  [0.35, "#522B5B"],
  [0.7, "#DFB6B2"],
  [1, "#FBE4D8"],
]);

/** Gradient-maps an image (keeping alpha) and writes WebP at each width. */
async function duotone(file, name, lut, widths, { gamma = 1, contrast = 1 } = {}) {
  const { data, info } = await sharp(join(SRC, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    let l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    l = Math.min(1, Math.max(0, (l - 0.5) * contrast + 0.5));
    const idx = Math.round(Math.pow(l, gamma) * 255) * 3;
    out[i] = lut[idx];
    out[i + 1] = lut[idx + 1];
    out[i + 2] = lut[idx + 2];
    out[i + 3] = data[i + 3];
  }
  for (const w of widths) {
    const target = join(IMG_OUT, `${name}-${w}.webp`);
    await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78, alphaQuality: 90, effort: 6 })
      .toFile(target);
    console.log("img", target.replace(ROOT, "."));
  }
}

/** Natural-colour portrait: resized and compressed only. */
async function natural(file, name, widths) {
  for (const w of widths) {
    const target = join(IMG_OUT, `${name}-${w}.webp`);
    await sharp(join(SRC, file))
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80, alphaQuality: 90, effort: 6 })
      .toFile(target);
    console.log("img", target.replace(ROOT, "."));
  }
}

await natural("Man isolated on transparent background.png", "hero-photo", [640, 1100]);
await natural("Quiet Reflection in an Empty Theater.png", "reel-photo", [640, 1100]);
await natural("Gemini_Generated_Image_24hy624hy624hy62.png", "connect-photo", [800, 1600]);
await duotone("Geometric Sunlight Portrait.png", "hero-alt", LIGHT_MAP, [640, 1100], { gamma: 0.95, contrast: 1.15 });
await duotone("Serene Forest Portrait in Golden Light.png", "connect-alt", LIGHT_MAP, [640, 1100], { gamma: 1, contrast: 1.1 });

// Social preview image (1200×630): dark canvas with the hero portrait.
{
  const portrait = await sharp(join(IMG_OUT, "hero-photo-1100.webp")).resize({ height: 630 }).toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#190019" } })
    .composite([{ input: portrait, left: 640, top: 0 }])
    .png()
    .toFile(join(ROOT, "public/site/og.png"));
}

// ---------------------------------------------------------------------------
// Lottie recolouring: every solid colour (static or animated) and gradient stop
// is replaced with the palette colour at the same luminance rank.
const PAL_RGB = PALETTE.map((h) => rgb(h).map((v) => v / 255));
const LUM_EDGES = [0.12, 0.28, 0.45, 0.68, 0.88];
function mapColour(r, g, b) {
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  let i = LUM_EDGES.findIndex((e) => l < e);
  if (i === -1) i = PALETTE.length - 1;
  // Saturated mid-tones read as accents: lift them to the blush.
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (sat > 0.45 && i >= 2 && i <= 3) i = 4;
  return PAL_RGB[i];
}
function recolourArray(arr) {
  if (Array.isArray(arr) && arr.length >= 3 && arr.slice(0, 3).every((v) => typeof v === "number")) {
    const [r, g, b] = mapColour(arr[0], arr[1], arr[2]);
    arr[0] = r;
    arr[1] = g;
    arr[2] = b;
  }
}
function recolourProp(prop) {
  if (!prop || prop.k === undefined) return;
  if (prop.a === 1 && Array.isArray(prop.k)) {
    for (const kf of prop.k) {
      if (kf.s) recolourArray(kf.s);
      if (kf.e) recolourArray(kf.e);
    }
  } else recolourArray(prop.k);
}
function recolourGradient(g) {
  if (!g?.k) return;
  const stops = g.p;
  const fix = (arr) => {
    for (let s = 0; s < stops; s++) {
      const o = s * 4;
      const [r, gg, b] = mapColour(arr[o + 1], arr[o + 2], arr[o + 3]);
      arr[o + 1] = r;
      arr[o + 2] = gg;
      arr[o + 3] = b;
    }
  };
  if (g.k.a === 1) for (const kf of g.k.k) { if (kf.s) fix(kf.s); if (kf.e) fix(kf.e); }
  else fix(g.k.k);
}
function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (!node || typeof node !== "object") return;
  if ((node.ty === "fl" || node.ty === "st") && node.c) recolourProp(node.c);
  if ((node.ty === "gf" || node.ty === "gs") && node.g) recolourGradient(node.g);
  if (node.ty === 1 && typeof node.sc === "string") node.sc = PALETTE[1]; // solid layers
  for (const v of Object.values(node)) if (v && typeof v === "object") walk(v);
}

const LOTTIES = {
  ugc: "man-sitting-near-computer-with-cup-2025-11-05-03-59-12-utc.json",
  shortform: "social-media-algorithm-illustration-with-gear-icon-2025-10-20-06-18-32-utc.json",
  explainers: "lettering-ai-with-gears-robot-head-and-cursor-2025-11-05-04-06-36-utc.json",
  marketing: "business-to-business-marketing-illustration-2025-10-20-04-35-47-utc.json",
  data: "man-programmer-writing-code-on-a-laptop-2025-11-05-04-40-43-utc.json",
  about: "male-programmer-writing-program-code-2025-11-05-06-06-56-utc.json",
  experience: "product-design-teamwork-2026-07-08-04-03-35-utc.json",
  learning: "people-learning-and-studying-together-illustration-2025-10-20-06-18-34-utc.json",
  calendar: "hand-interaction-with-calendar-duotone-illustratio-2025-10-20-06-18-32-utc.json",
  email: "email-marketing-2025-11-05-03-50-53-utc.json",
};
for (const [key, file] of Object.entries(LOTTIES)) {
  const json = JSON.parse(readFileSync(join(SRC, file), "utf8"));
  walk(json);
  const target = join(LOTTIE_OUT, `${key}.json`);
  writeFileSync(target, JSON.stringify(json));
  console.log("lottie", target.replace(ROOT, "."));
}

// ---------------------------------------------------------------------------
// Fonts (licensed by the owner; only the weights the site uses are copied).
const FONTS = [
  ["triumph-sans-serif-wide-font-2026-04-07-05-59-09-utc/WOFF/SATriumph.woff", "SATriumph.woff"],
  ["triumph-sans-serif-wide-font-2026-04-07-05-59-09-utc/WOFF/SATriumph-Outline.woff", "SATriumph-Outline.woff"],
  ["balimo-modern-sans-serif-family-2026-04-27-20-27-19-utc/OTF/Balimo-Regular.otf", "Balimo-Regular.otf"],
  ["balimo-modern-sans-serif-family-2026-04-27-20-27-19-utc/OTF/Balimo-Medium.otf", "Balimo-Medium.otf"],
  ["balimo-modern-sans-serif-family-2026-04-27-20-27-19-utc/OTF/Balimo-Bold.otf", "Balimo-Bold.otf"],
];
for (const [from, to] of FONTS) {
  copyFileSync(join(SRC, from), join(FONT_OUT, to));
  console.log("font", to);
}
