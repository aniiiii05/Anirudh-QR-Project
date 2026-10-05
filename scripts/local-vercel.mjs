/**
 * Local emulation of Vercel routing and functions — NOT a Vercel deployment.
 *
 * Serves the production build in dist/ the way vercel.json describes it:
 *   1. headers   — every matching rule is applied (later rules win)
 *   2. redirects — first match
 *   3. /api/*    — the handlers in api/*.ts, transpiled file-by-file (as @vercel/node does)
 *   4. files     — an exact file in dist/
 *   5. rewrites  — first match, to a function or a file
 * No new dependencies: Node's http server plus esbuild (already installed with Vite).
 *
 * Safety: binds to 127.0.0.1 only; never serves outside dist/ or any dotfile;
 * logs only method, path and status (no query strings, addresses or bodies).
 *
 *   npm run build && npm run serve        (or: npm run preview:vercel)
 *   PORT=5000 npm run serve               (port override)
 */
import http from "node:http";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const HOST = "127.0.0.1";
const PORT = Number.parseInt(process.env.PORT ?? "", 10) || 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".ktx2": "image/ktx2",
  ".hdr": "application/octet-stream",
  ".wasm": "application/wasm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".vcf": "text/vcard; charset=utf-8",
};

/** Converts a vercel.json `source` (path-to-regexp subset) to an anchored RegExp. */
export function compileSource(source) {
  let pattern = "^";
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "(") {
      let depth = 0;
      let j = i;
      for (; j < source.length; j++) {
        const c = source[j];
        if (c === "\\") {
          j++;
          continue;
        }
        if (c === "(") depth++;
        else if (c === ")" && --depth === 0) break;
      }
      pattern += source.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === ":") {
      const param = /^:([A-Za-z_]\w*)([*+?])?/.exec(source.slice(i));
      if (param) {
        pattern += param[2] === "*" || param[2] === "+" ? "(.*)" : "([^/]+)";
        i += param[0].length;
        continue;
      }
    }
    pattern += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    i++;
  }
  return new RegExp(`${pattern}$`);
}

/** Maps a URL path to a file inside dist/, or null. Never escapes dist/; never serves dotfiles. */
export function resolveStatic(pathname, distDir = DIST) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (/[\0\\]/.test(decoded)) return null;
  const segments = decoded.split("/").filter(Boolean);
  if (segments.some((s) => s.startsWith(".") || s.includes(":"))) return null;
  const file = resolve(distDir, ...segments);
  if (!file.startsWith(distDir + sep)) return null;
  let stat;
  try {
    stat = statSync(file);
  } catch {
    return null;
  }
  if (!stat.isFile()) return null;
  const real = realpathSync(file);
  if (!real.startsWith(realpathSync(distDir) + sep)) return null;
  return { file: real, size: stat.size };
}

function loadVercelConfig() {
  const config = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
  const compile = (rules = []) =>
    rules.map((rule) => ({ ...rule, regex: compileSource(rule.source) }));
  return {
    redirects: compile(config.redirects),
    rewrites: compile(config.rewrites),
    headers: compile(config.headers),
  };
}

/**
 * Compiles the functions the way @vercel/node does: every api/*.ts file and every
 * relative module it imports is transpiled on its own (no bundling), import paths
 * are left untouched, and the result is loaded as native Node ESM ("type": "module").
 * An extensionless relative import therefore fails here exactly as it would on Vercel.
 * Output goes to node_modules/.cache so bare imports (zod) resolve from node_modules.
 */
export function collectModules(entryFiles) {
  const seen = new Set();
  const queue = [...entryFiles];
  const importRe = /(?:^|[\s;])(?:import|export)\s[^"'`]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(importRe)) {
      const spec = match[1] ?? match[2];
      if (!spec.startsWith(".")) continue;
      // Node ESM needs the runtime (.js) path; the TypeScript source sits next to it as .ts.
      const target = resolve(dirname(file), spec.replace(/\.js$/, ".ts"));
      if (target.endsWith(".ts") && existsSync(target)) queue.push(target);
    }
  }
  return [...seen];
}

async function bundleFunctions() {
  const { build } = await import("esbuild");
  const apiDir = join(ROOT, "api");
  const names = readdirSync(apiDir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.startsWith("_"))
    .map((f) => f.slice(0, -3));
  const outdir = join(ROOT, "node_modules", ".cache", "local-vercel-functions");
  rmSync(outdir, { recursive: true, force: true });
  mkdirSync(outdir, { recursive: true });
  writeFileSync(join(outdir, "package.json"), '{ "type": "module" }\n');
  await build({
    entryPoints: collectModules(names.map((n) => join(apiDir, `${n}.ts`))),
    absWorkingDir: ROOT,
    outbase: ROOT,
    outdir,
    bundle: false,
    platform: "node",
    format: "esm",
    target: "node18",
    logLevel: "warning",
  });
  const functions = {};
  for (const name of names) {
    const mod = await import(pathToFileURL(join(outdir, "api", `${name}.js`)).href);
    if (typeof mod.default !== "function")
      throw new Error(`api/${name}.ts has no default export handler`);
    functions[name] = mod.default;
  }
  return functions;
}

function sendStatic(req, res, found, status = 200) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Method not allowed");
    return;
  }
  res.statusCode = status;
  res.setHeader(
    "Content-Type",
    MIME[extname(found.file).toLowerCase()] ?? "application/octet-stream",
  );
  res.setHeader("Content-Length", found.size);
  if (!res.hasHeader("Cache-Control"))
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(found.file)
    .on("error", () => res.destroy())
    .pipe(res);
}

function notFound(res) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end("Not found");
}

async function runFunction(name, functions, req, res) {
  const handler = Object.hasOwn(functions, name) ? functions[name] : undefined;
  if (!handler) return notFound(res);
  try {
    await handler(req, res);
  } catch (error) {
    console.error(`  function api/${name} threw: ${error?.message ?? error}`);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    res.end("Function failed");
  }
}

function createHandler({ config, functions }) {
  return async (req, res) => {
    const raw = req.url ?? "/";
    const queryAt = raw.indexOf("?");
    const pathname = queryAt === -1 ? raw : raw.slice(0, queryAt);
    const search = queryAt === -1 ? "" : raw.slice(queryAt);
    res.on("finish", () =>
      console.log(`  ${req.method} ${pathname} → ${res.statusCode}`),
    );
    if (!pathname.startsWith("/")) {
      res.statusCode = 400;
      res.end("Bad request");
      return;
    }

    for (const rule of config.headers)
      if (rule.regex.test(pathname))
        for (const { key, value } of rule.headers) res.setHeader(key, value);

    for (const rule of config.redirects) {
      if (!rule.regex.test(pathname)) continue;
      res.statusCode = rule.statusCode ?? (rule.permanent === false ? 307 : 308);
      res.setHeader("Location", rule.destination + search);
      res.end();
      return;
    }

    if (pathname.startsWith("/api/"))
      return runFunction(pathname.slice(5), functions, req, res);

    // Like Vercel, "/" serves dist/index.html (the homepage) before any rewrite.
    const file = resolveStatic(pathname === "/" ? "/index.html" : pathname);
    if (file) return sendStatic(req, res, file);

    for (const rule of config.rewrites) {
      if (!rule.regex.test(pathname)) continue;
      const destination = rule.destination.split("?")[0];
      if (destination.startsWith("/api/"))
        return runFunction(destination.slice(5), functions, req, res);
      const target = resolveStatic(destination);
      return target ? sendStatic(req, res, target) : notFound(res);
    }
    notFound(res);
  };
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("dist/index.html not found. Run `npm run build` first (or `npm run preview:vercel`).");
    process.exit(1);
  }
  const envFile = join(ROOT, ".env");
  const envLoaded = existsSync(envFile);
  if (envLoaded) process.loadEnvFile(envFile);

  const config = loadVercelConfig();
  const functions = await bundleFunctions();
  const server = http.createServer(createHandler({ config, functions }));
  server.on("clientError", (_error, socket) => {
    if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  });
  server.listen(PORT, HOST, () => {
    const base = `http://${HOST}:${PORT}`;
    console.log("");
    console.log("Local emulation of Vercel routing and functions — not a Vercel deployment");
    console.log(`  serving   ${DIST}`);
    console.log(`  functions ${Object.keys(functions).map((n) => `api/${n}.ts`).join(", ")}`);
    console.log(`  .env      ${envLoaded ? "loaded" : "not present (using the shell environment only)"}`);
    console.log("");
    console.log(`  Card:     ${base}/card`);
    console.log(`  QR entry: ${base}/q`);
    console.log(`  Privacy:  ${base}/privacy`);
    console.log(`  vCard:    ${base}/contact.vcf`);
    console.log(`  Contact:  ${base}/api/contact`);
    console.log("");
    console.log("  Stop with Ctrl+C.");
    // Delivery status comes from the contact handler itself, whatever the env source.
    fetch(`${base}/api/contact`)
      .then((r) => r.json())
      .then((body) =>
        console.log(`  contact delivery: ${body?.enabled === true ? "ENABLED (real email can be sent)" : "disabled"}`),
      )
      .catch(() => console.log("  contact delivery: status unknown"));
  });
  const stop = () => server.close(() => process.exit(0));
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

const invokedDirectly =
  process.argv[1] &&
  import.meta.url.toLowerCase() ===
    pathToFileURL(resolve(process.argv[1])).href.toLowerCase();
if (invokedDirectly)
  main().catch((error) => {
    console.error(`local-vercel: ${error.message}`);
    process.exit(1);
  });
