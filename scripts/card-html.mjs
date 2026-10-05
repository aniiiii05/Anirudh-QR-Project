/**
 * Post-build step (runs after `vite build`).
 *
 * Writes route-specific HTML so link previews and crawlers see the right
 * metadata before any JavaScript runs:
 *   dist/card/index.html, dist/privacy/index.html — title, description, og:*, twitter:*
 *   dist/index.html — SPA fallback for unknown paths, always noindex
 *   dist/robots.txt, and dist/sitemap.xml only when SITE_ORIGIN is set
 *
 * Every public value comes from src/card/profile.ts (bundled on the fly with
 * esbuild), so the static HTML can never drift from the page. Absolute URLs
 * (canonical, og:url, og:image, JSON-LD) are emitted ONLY when SITE_ORIGIN is
 * an exact HTTPS origin; otherwise pages are noindex,nofollow and no domain is
 * invented.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Escapes text and attribute values. */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** JSON that is safe inside a <script> element (also escapes U+2028/U+2029). */
const BACKSLASH = String.fromCharCode(92);
const UNSAFE_IN_SCRIPT = new RegExp(
  `[<>&${String.fromCharCode(0x2028, 0x2029)}]`,
  "g",
);
function scriptJson(value) {
  return JSON.stringify(value).replace(
    UNSAFE_IN_SCRIPT,
    (c) => BACKSLASH + "u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}

export function routes(profile) {
  return {
    home: {
      path: "/",
      title: `${profile.name} — ${profile.role} & Creator`,
      description: `${profile.employment} ${profile.role.toLowerCase()} building towards UGC and tech & marketing content. Data by day, stories by night.`,
      lead: "Data by day. Stories by night.",
      image: { path: "/site/og.png" },
    },
    card: {
      path: "/card",
      title: `${profile.name} — ${profile.tagline}`,
      description: profile.description,
      lead: profile.description,
    },
    privacy: {
      path: "/privacy",
      title: `Privacy — ${profile.name}`,
      description:
        "How this personal page handles information: no analytics, cookies or tracking, browser-only demos and an email-draft contact path.",
      lead: "Privacy, plainly: this page uses no analytics, cookies or tracking, and its demos run only in your browser tab. For questions or deletion requests, email the address below.",
    },
  };
}

const meta = (attr, key, content) =>
  `<meta ${attr}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`;

/**
 * Head tags for one route. `origin` must already be validated (or null).
 * `image` = { path, width, height } for the social preview, or null.
 */
export function headTags({ profile, route, origin, image, indexable = true }) {
  const tags = [
    `<title>${escapeHtml(route.title)}</title>`,
    meta("name", "description", route.description),
    meta("name", "author", profile.name),
  ];
  const canIndex = Boolean(origin) && indexable;
  if (!canIndex) tags.push(meta("name", "robots", "noindex, nofollow"));
  const url = origin ? new URL(route.path, origin).href : null;
  if (url && indexable)
    tags.push(`<link rel="canonical" href="${escapeHtml(url)}" />`);
  tags.push(
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", profile.name),
    meta("property", "og:locale", "en_GB"),
    meta("property", "og:title", route.title),
    meta("property", "og:description", route.description),
  );
  if (url && indexable) tags.push(meta("property", "og:url", url));
  const imageUrl =
    origin && image ? new URL(image.path, origin).href : null;
  if (imageUrl) {
    tags.push(meta("property", "og:image", imageUrl));
    if (image.width && image.height)
      tags.push(
        meta("property", "og:image:width", String(image.width)),
        meta("property", "og:image:height", String(image.height)),
      );
    tags.push(
      meta("property", "og:image:alt", `${profile.name} — ${profile.tagline}`),
    );
  }
  tags.push(
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", route.title),
    meta("name", "twitter:description", route.description),
  );
  if (imageUrl) tags.push(meta("name", "twitter:image", imageUrl));
  if (url && indexable && (route.path === "/card" || route.path === "/"))
    tags.push(
      `<script type="application/ld+json">${scriptJson({
        "@context": "https://schema.org",
        "@type": "Person",
        name: profile.name,
        url,
        email: `mailto:${profile.email}`,
        jobTitle: profile.role,
        sameAs: [profile.linkedin, profile.github, profile.pinterest].filter(Boolean),
      })}</script>`,
    );
  return tags.join("\n    ");
}

/** Plain HTML for visitors without JavaScript: email, GitHub and LinkedIn still work. */
export function noscriptHtml({ profile, route }) {
  const link = (href, text) =>
    `<li><a href="${escapeHtml(href)}">${escapeHtml(text)}</a></li>`;
  return [
    "<noscript>",
    '<main style="max-width:40rem;margin:0 auto;padding:2rem 1.25rem;font-family:system-ui,sans-serif;line-height:1.5;background:#190019;color:#fbe4d8">',
    `<h1>${escapeHtml(profile.name)}</h1>`,
    `<p>${escapeHtml(profile.tagline)}</p>`,
    `<p>${escapeHtml(route.lead)}</p>`,
    "<p>The interactive page needs JavaScript. You can still get in touch:</p>",
    "<ul>",
    link(`mailto:${profile.email}`, `Email ${profile.email}`),
    link(profile.github, "GitHub"),
    link(profile.linkedin, "LinkedIn"),
    ...(profile.pinterest ? [link(profile.pinterest, "Pinterest")] : []),
    link("/contact.vcf", "Save contact (vCard)"),
    link("/privacy", "Privacy"),
    "</ul>",
    "</main>",
    "</noscript>",
  ].join("");
}

const STRIP_PATTERNS = [
  /\s*<title>[\s\S]*?<\/title>/i,
  /\s*<meta\s+name="(?:description|author|robots|twitter:[^"]*)"[^>]*>/gi,
  /\s*<meta\s+property="og:[^"]*"[^>]*>/gi,
  /\s*<link\s+rel="canonical"[^>]*>/gi,
  /\s*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi,
  /\s*<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>/gi,
];

/** Rewrites the built index.html for one route. */
export function renderRouteHtml(template, options) {
  let html = template;
  if (!/<title>[\s\S]*?<\/title>/i.test(html))
    throw new Error("Template has no <title> to replace");
  html = html.replace(/<title>[\s\S]*?<\/title>/i, "<!--route-meta-->");
  for (const pattern of STRIP_PATTERNS) html = html.replace(pattern, "");
  html = html.replace("<!--route-meta-->", headTags(options));
  const noscript = noscriptHtml(options);
  html = /<noscript>[\s\S]*?<\/noscript>/i.test(html)
    ? html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscript)
    : html.replace('<div id="root"></div>', `<div id="root"></div>${noscript}`);
  return html;
}

export function robotsTxt(origin) {
  if (!origin) return "User-agent: *\nDisallow: /\n";
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Sitemap: ${new URL("/sitemap.xml", origin).href}`,
    "",
  ].join("\n");
}

export function sitemapXml(origin, paths) {
  const urls = paths
    .map((path) => `  <url><loc>${escapeHtml(new URL(path, origin).href)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function pngSize(file) {
  try {
    const bytes = readFileSync(file);
    if (bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a") return null;
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  } catch {
    return null;
  }
}

/** Imports profile.ts and logic.ts through esbuild (a Vite dependency). */
async function loadSiteModules() {
  const { build } = await import("esbuild");
  const result = await build({
    stdin: {
      contents:
        'export { profile } from "./src/card/profile.ts";\n' +
        'export { parseSiteOrigin } from "./src/card/logic.ts";\n',
      resolveDir: ROOT,
      sourcefile: "card-html-entry.ts",
      loader: "ts",
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    target: "node18",
    mainFields: ["module", "main"],
    logLevel: "silent",
  });
  const code = result.outputFiles[0].text;
  return import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
}

async function main() {
  const dist = join(ROOT, "dist");
  const templatePath = join(dist, "index.html");
  if (!existsSync(templatePath))
    throw new Error("dist/index.html not found — run `vite build` first");
  const { profile, parseSiteOrigin } = await loadSiteModules();
  const rawOrigin = process.env.SITE_ORIGIN;
  const origin = parseSiteOrigin(rawOrigin);
  if (rawOrigin && !origin)
    throw new Error(
      "SITE_ORIGIN must be an exact HTTPS origin such as https://example.com (no path or trailing slash)",
    );
  const template = readFileSync(templatePath, "utf8");
  const size = pngSize(join(dist, "card-og.png"));
  const image = size ? { path: "/card-og.png", ...size } : null;
  const all = routes(profile);
  const imageFor = (route) => {
    if (!route.image) return image;
    const s = pngSize(join(dist, route.image.path));
    return s ? { path: route.image.path, ...s } : image;
  };

  for (const [name, route] of Object.entries(all)) {
    if (name === "home") continue;
    mkdirSync(join(dist, name), { recursive: true });
    writeFileSync(
      join(dist, name, "index.html"),
      renderRouteHtml(template, { profile, route, origin, image: imageFor(route) }),
    );
  }
  // SPA fallback for unknown paths (vercel.json rewrites to /spa.html): same shell, never indexed.
  writeFileSync(
    join(dist, "spa.html"),
    renderRouteHtml(template, {
      profile,
      route: all.home,
      origin,
      image: imageFor(all.home),
      indexable: false,
    }),
  );
  // The homepage is served straight from dist/index.html.
  writeFileSync(
    templatePath,
    renderRouteHtml(template, { profile, route: all.home, origin, image: imageFor(all.home) }),
  );
  writeFileSync(join(dist, "robots.txt"), robotsTxt(origin));
  const sitemap = join(dist, "sitemap.xml");
  if (origin)
    writeFileSync(sitemap, sitemapXml(origin, Object.values(all).map((r) => r.path)));
  else rmSync(sitemap, { force: true });

  console.log(
    origin
      ? `card-html: wrote /, /card, /privacy, robots.txt and sitemap.xml for ${origin}`
      : "card-html: SITE_ORIGIN not set — wrote noindex /, /card and /privacy and a Disallow-all robots.txt (no sitemap)",
  );
}

const invokedDirectly =
  process.argv[1] &&
  import.meta.url.toLowerCase() ===
    pathToFileURL(resolve(process.argv[1])).href.toLowerCase();
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`card-html: ${error.message}`);
    process.exit(1);
  });
}
