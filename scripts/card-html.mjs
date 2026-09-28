import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const source = readFileSync("dist/index.html", "utf8");
const origin = process.env.SITE_ORIGIN;
if (origin && new URL(origin).protocol !== "https:")
  throw new Error("SITE_ORIGIN must be HTTPS");
for (const route of ["card", "privacy"]) {
  const title =
    route === "card"
      ? "Anirudh Sharma — Human, But Automated."
      : "Privacy — Anirudh Sharma";
  const description =
    route === "card"
      ? "I turn messy ideas into useful systems. A personal introduction through data, automation and product experiments."
      : "How this personal page handles your information.";
  const meta =
    `<title>${title}</title><meta name="description" content="${description}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/card-icon.svg">` +
    (origin
      ? `<link rel="canonical" href="${new URL("/" + route, origin).href}"><meta property="og:image" content="${new URL("/card-og.png", origin).href}">`
      : '<meta name="robots" content="noindex">');
  let html = source
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(
      /<meta\s+(?:name="(?:description|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g,
      "",
    )
    .replace(/<link[^>]*fonts\.[^>]*>/g, "")
    .replace("</head>", meta + "</head>");
  html = html.replace(
    '<div id="root"></div>',
    '<div id="root"></div><noscript><main style="padding:2rem;font-family:sans-serif;background:#f4f1ea;color:#181817"><h1>Anirudh Sharma</h1><p>Human, But Automated.</p><p>A personal introduction through data, automation and product experiments.</p><p>Enable JavaScript for the interactive page, or connect on <a href="https://github.com/aniiiii05">GitHub</a>.</p></main></noscript>',
  );
  mkdirSync(`dist/${route}`, { recursive: true });
  writeFileSync(`dist/${route}/index.html`, html);
}
