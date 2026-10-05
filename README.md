# Anirudh Sharma — portfolio & QR card

**Human, But Automated.** A small personal site reached by scanning a printed business card. Visitors get a quick introduction (data, automation and product interests), three honestly labelled browser-only demos, an optional 3D workspace, and a working way to get in touch.

`/` is the portfolio homepage (`src/site/`): a dark, editorial page modelled on minhpham.design, with a cursor spotlight that reveals an "honest" alter-ego layer of every section (or all of it via the *Honest mode* toggle — the touch/keyboard route). `/card` is the QR business-card experience (`src/card/`).

**Homepage notes**
- Copy lives in `src/site/content.ts` (base + alt text per section). Facts come from `src/card/profile.ts`; the current employer is never named.
- Brand palette `#190019 #2B124C #522B5B #854F6C #DFB6B2 #FBE4D8`; fonts SA Triumph (display) and Balimo (text), owner-licensed, self-hosted from `src/site/fonts/`.
- `npm run assets` regenerates palette-mapped portraits (`public/site/img/`), recoloured Lottie illustrations (`public/site/lottie/`), the social image and the font copies from the git-ignored `Portfolio Design Assets/` folder. Outputs are committed, so builds don't need it.
- The 3D chip (`src/site/chipScene.ts`) is procedural three.js, lazy-loaded and paused off-screen; the 25 MB source OBJ is not shipped.
- Work slots are labelled placeholders — replace them in `content.ts` once real UGC pieces exist.

## Stack

- React 18 + Vite 5 + TypeScript, Tailwind 3 and shadcn/Radix primitives (`src/components/ui`)
- Three.js 0.183 for the lazily loaded 3D workspace (`src/card/three`)
- Zod for contact validation (shared by the browser and the server)
- Vercel Node.js functions in `api/` for `/q`, `/contact.vcf` and `/api/contact`
- Vitest (unit) and Playwright (end-to-end, using the locally installed Google Chrome — no browser download)
- Self-hosted fonts via `@fontsource-variable` (no font requests to third parties)

All public facts (name, email, links, copy, projects) live in one typed file, `src/card/profile.ts`. The page, the vCard, the static route metadata and the privacy contact all read from it.

## Routes

| Route | What it does | Served by |
|---|---|---|
| `/` | Portfolio homepage (static HTML from `dist/index.html`; unknown paths fall back to the noindex `dist/spa.html`) | `src/site/Home.tsx`, `scripts/card-html.mjs` |
| `/card` | The card experience (canonical) | `dist/card/index.html` + React |
| `/q` | Printed-QR entry: server-side 302 to `/card`, keeping only valid `utm_source` / `utm_medium` / `utm_campaign` (default `utm_source=card`); `Cache-Control: no-store`, `X-Robots-Tag: noindex`; never an open redirect | `api/q.ts` |
| `/privacy` | Privacy notice written from the page's actual behaviour | `dist/privacy/index.html` + React (lazy chunk) |
| `/contact.vcf` | vCard 3.0 download (`text/vcard; charset=utf-8`, `anirudh-sharma.vcf`): name, email, public profile URLs — no phone, title, organisation or address | `api/vcard.ts` + `src/card/vcard.ts` |
| `/api/contact` | `GET` → `{ enabled }`; `POST` → validated, rate-limited delivery when fully configured (disabled by default) | `api/contact.ts` |
| anything else | SPA fallback (`noindex`) showing a not-found page | `dist/index.html` |

## Requirements

- Node.js 20.12 or newer (developed with Node 24.12 and npm 11.6). `npm run serve` uses `process.loadEnvFile`, which needs Node ≥ 20.12.
- Google Chrome installed, for `npm run test:e2e`.

## Install

PowerShell (Windows):

```powershell
cd "C:\Users\aniru\OneDrive\Documents\Portfolio"
node --version
npm ci
```

bash (macOS/Linux/Git Bash):

```bash
cd /path/to/Portfolio
node --version
npm ci
```

If PowerShell blocks the `npm.ps1` wrapper ("running scripts is disabled on this system"), use `npm.cmd` instead of `npm` in every command below — for example `npm.cmd ci` and `npm.cmd run dev`. There is no need to change the execution policy.

## Develop

```powershell
npm run dev
```

Open **http://127.0.0.1:8080/card**. Stop with Ctrl+C. (Port 8080 is the default; `npm run dev -- --port 5199` picks another.) The dev server listens on 127.0.0.1 only, because its middleware runs the real handlers with values from `.env`; to test from a phone on the same network, opt in explicitly with `npm run dev -- --host` and only while `.env` holds no live secrets.

In development a small Vite plugin (`vite.config.ts`) answers `/q`, `/contact.vcf` and `/api/contact` with the real handlers from `api/`, so those routes behave as they will on Vercel. Security headers are **not** applied by the dev server (they would block Vite's hot reload); use the local emulation below to check them.

## Preview the production build (local emulation)

```powershell
npm run preview:vercel
```

This runs `npm run build` and then `npm run serve`, which starts `scripts/local-vercel.mjs` at **http://127.0.0.1:4173/card**. It is a **local emulation of Vercel routing and functions — not a Vercel deployment**: a small Node server (no extra dependencies) that serves `dist/` with the `vercel.json` redirects, rewrites and headers (including the Content-Security-Policy) and runs the `api/*.ts` handlers. Like `@vercel/node`, each function file and each relative module it imports is transpiled on its own (esbuild, no bundling, import paths untouched) into `node_modules/.cache/local-vercel-functions/` and loaded as native Node ESM, so a relative import without its `.js` extension fails here the same way it would on Vercel (`tsconfig.api.json` uses `NodeNext`, so `npm run typecheck` rejects such imports too). It binds to 127.0.0.1 only, never serves files outside `dist/` or dotfiles, and logs only method, path and status. A `.env` file is loaded if present; the startup log says whether it was, and separately whether contact delivery is enabled (read from the contact handler itself, whatever the source of the variables). Change the port with `PORT` (`$env:PORT=5000; npm run serve` in PowerShell, `PORT=5000 npm run serve` in bash). If `dist/` already exists, `npm run serve` alone is enough.

Opening `index.html` directly from disk does not work; always use one of the servers above.

## Checks

| Command | What it runs |
|---|---|
| `npm run typecheck` | `tsc` for the app (`tsconfig.app.json`), the server functions (`tsconfig.api.json`, strict) and `vite.config.ts` (`tsconfig.node.json`) |
| `npm test` | Vitest unit tests, including the contact endpoint (with mocked services), the vCard, `/q` and the static metadata. No test sends a real email or calls a real service. |
| `npm run test:e2e` | Playwright in the installed Google Chrome (desktop 1440 px and mobile 390 px projects). Starts `npm run preview:vercel` automatically, or reuses a server already running on 127.0.0.1:4173. Set `E2E_BASE_URL` to test another **production-like** server — the local emulation on another port or, once one exists, a Vercel preview — e.g. `$env:E2E_BASE_URL="https://<your-preview>.vercel.app"; npm run test:e2e` (bash: `E2E_BASE_URL=https://<your-preview>.vercel.app npm run test:e2e`). Do not point `e2e/routes.spec.ts` at `npm run dev`: it checks production behaviour (homepage HTML at `/`, CSP header, generated route HTML, nothing outside `dist/` served) that the Vite dev server does not provide. Run one file with `npx playwright test e2e/routes.spec.ts`. |
| `npm run lint` | ESLint. **Known pre-existing errors** in generated shadcn files under `src/components/ui/` (`no-empty-object-type`) and in `tailwind.config.ts` (`no-require-imports`), plus warnings there; these predate the card work and are reported separately from new code. |
| `npm run build` | `vite build`, then `scripts/card-html.mjs` writes route-specific HTML, `robots.txt` and (with `SITE_ORIGIN`) `sitemap.xml` |

## Configuration

Copy `.env.example` to `.env` for local use; on Vercel set the same names in **Project Settings → Environment Variables**. Never prefix a secret with `VITE_` — Vite inlines `VITE_*` values into the public browser bundle. Every variable here is read only by server code or the build script.

| Variable | Default | Purpose |
|---|---|---|
| `SITE_ORIGIN` | empty | The real public origin, e.g. `https://card.example.com` — exact HTTPS origin, no path, no trailing slash. **Unset:** pages are `noindex, nofollow`, `robots.txt` disallows everything, no canonical/`og:url`/`og:image`/JSON-LD/sitemap is emitted, the vCard's primary URL is LinkedIn, and every contact `POST` is refused (origin cannot be verified). **Set:** canonical tags, absolute social image, Person JSON-LD, sitemap, crawlable `robots.txt`, vCard URL = `/card`. An invalid value fails the build. |
| `CONTACT_ENABLED` | `false` | Must be exactly `true` (with everything below valid) for delivery to switch on. |
| `RESEND_API_KEY` | empty | Resend API key (server-side only). |
| `CONTACT_TO` | empty | Mailbox that receives messages. |
| `CONTACT_FROM` | empty | Verified Resend sender, e.g. `QR card <card@your-domain>`. |
| `UPSTASH_REDIS_REST_URL` | empty | Upstash Redis REST URL (`https://…`) for the shared rate limiter. |
| `UPSTASH_REDIS_REST_TOKEN` | empty | Upstash REST token. |
| `RATE_LIMIT_SECRET` | empty | Random secret, at least 16 characters (32+ recommended). HMAC key for rate-limit keys and provider idempotency keys. |
| `RATE_LIMIT_MAX` | `5` | Attempts allowed per window per client (1–1000). |
| `RATE_LIMIT_WINDOW_SECONDS` | `600` | Window length in seconds (1–86400). |
| `RATE_LIMIT_GLOBAL_MAX` | `50` | Attempts allowed per global window across **all** clients together (1–100000), so rotating addresses cannot flood the mailbox or the Resend quota. |
| `RATE_LIMIT_GLOBAL_WINDOW_SECONDS` | `86400` | Global window length in seconds (1–604800). |
| `PRIVACY_NOTICE_VERSION` | empty | Must equal `DIRECT_DELIVERY_NOTICE` in `src/card/logic.ts`. That constant is `null` in this repository (the privacy notice says direct delivery is not enabled), so delivery **cannot** be enabled by environment variables alone. |

`GET /api/contact` returns only `{ "enabled": true | false }` — it never says which setting is missing.

### How the contact endpoint behaves

- `POST` only from the exact `SITE_ORIGIN` (`Origin` header), and `Sec-Fetch-Site` must be `same-origin` when present; JSON only (415 otherwise); 10 kB body limit checked on `Content-Length` and while reading the stream (413); Zod validation shared with the form (400); hidden honeypot field (400); `Idempotency-Key` header `^[a-zA-Z0-9-]{16,80}$` (400).
- Shared fixed-window rate limits in Upstash, both counted in one atomic script (`INCR` + `EXPIRE`): one per client and one global ceiling for all clients together. The client key is an HMAC of the client address, with IPv6 reduced to its /64 prefix (and IPv4-mapped IPv6 to the IPv4 address) so one host cannot rotate addresses to reset its allowance — the raw address and form text are never stored or logged. Over either limit: 429 with `Retry-After`.
- Fails closed: missing or invalid configuration, an unreachable limiter or an unexpected limiter reply → 503, and nothing is sent.
- Sends one **plain-text** email through the Resend REST API with a constant subject and `reply_to` set to the sender; CR/LF are stripped from header-bound values. Outbound calls time out (4 s limiter, 8 s provider). Provider failure → 502 with a generic message.
- The provider `Idempotency-Key` is a keyed hash of the client's key plus the message content, so an identical retry is deduplicated by Resend while changed content is not. Resend documents a 24-hour idempotency window — confirm against the current Resend docs when enabling; this is not unlimited exactly-once delivery.
- Every JSON response carries a `requestId`; errors are generic.

### Checklist before enabling direct contact delivery (owner)

1. Confirm the real domain and set `SITE_ORIGIN` for the production environment.
2. Choose and verify a Resend sending domain; set `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO`.
3. Create an Upstash Redis database; set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`; generate `RATE_LIMIT_SECRET`.
4. Decide the retention period and the deletion process for received messages.
5. Update `src/card/Privacy.tsx` to name the email-delivery and rate-limiting providers, the retention period and how to request deletion; change "Last updated". In the same change set `DIRECT_DELIVERY_NOTICE` in `src/card/logic.ts` to that notice revision (e.g. the new date) and update the tripwire test in `src/card/logic.test.ts`; then set `PRIVACY_NOTICE_VERSION` to the same value on the server. Until both match, `readContactConfig` keeps delivery off.
6. Set `CONTACT_ENABLED=true` on a **preview** deployment first; confirm `GET /api/contact` reports `enabled: true`.
7. With the approved test recipient, send one intentional test message; confirm it arrives, then retry the same submission and confirm no duplicate; check the rate limit (429) and an invalid submission (400).
8. Only then enable it in production.

Until all of this is done, "Share a thought" opens an email draft in the visitor's own email app — clearly labelled; nothing is sent by the page.

## Security headers

`vercel.json` (and the local emulation) send on every response: `Content-Security-Policy` (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` and `Strict-Transport-Security: max-age=63072000` (without `includeSubDomains`, so other subdomains of the eventual domain are unaffected). Hashed files under `/assets/` are cached for a year (`immutable`).

## Deploying to Vercel (owner steps — not yet performed)

None of these steps has been carried out; there is no Vercel project, preview URL or production deployment yet.

1. Push the reviewed branch to the intended GitHub repository (see `docs/build-progress.md` for the history decision first).
2. In Vercel, import the repository. The framework preset can stay "Other": `vercel.json` sets `buildCommand` (`npm run build`) and `outputDirectory` (`dist`), and `api/*.ts` become Node.js functions automatically.
3. Leave `CONTACT_ENABLED=false` for the first preview. Set `SITE_ORIGIN` only for an environment whose origin is final.
4. Open the preview and check `/card`, `/q`, `/privacy`, `/contact.vcf` and `GET /api/contact`; inspect the build and function logs.
5. Show the preview to Anirudh before any production deployment, DNS change or QR printing (guide §15).

## What is real and what is simulated

| Real | Simulated / not yet verified |
|---|---|
| `/q` redirect, vCard, privacy page, static metadata and security headers — exercised end to end against the **local emulation only** (functions loaded file-by-file as native ESM, like `@vercel/node`) | The local emulation is not Vercel; no `vercel build` output or Vercel deployment has been tested in this repository, so behaviour on Vercel is unverified until a preview exists |
| Contact validation, origin checks, size limits, rate-limit logic, idempotency keys and failure handling — unit-tested with mocked services | No real email has been sent; Resend and Upstash have never been called; contact delivery is disabled |
| The three demos run entirely in the browser on fictional/sample data | The demos are illustrations, not business results or employer work |
| The 3D workspace is real WebGL (Three.js), loaded on demand, with a static fallback | Real-device checks (iPhone Safari, Android Chrome) are still to do |
| Public facts come from owner-supplied sources (see `docs/content-audit.md`) | The email address's delivery and the LinkedIn link need a manual check by the owner |

## Licences and credits

Third-party notices are published with the site under `public/notices/` (`/notices/3d-credits.txt`, `/notices/bruno-simon-folio-MIT.txt`, `/notices/three-MIT.txt`). Small interpolation helpers are adapted from Bruno Simon's `folio-2025` (MIT); `my-room-in-3d` was used as a visual reference only and none of its code or assets were copied. Fonts are from Fontsource (SIL Open Font License 1.1). No endorsement by any referenced author is implied.

## Project layout

```text
api/                 Vercel functions: q.ts, vcard.ts, contact.ts
src/card/            The card experience: profile.ts (public facts), logic.ts, vcard.ts,
                     contactClient.ts, Privacy.tsx, sections/, demos/, three/
scripts/card-html.mjs    Post-build route HTML, robots.txt, sitemap.xml
scripts/local-vercel.mjs Local emulation of Vercel routing + functions
e2e/                 Playwright specs
docs/                content-audit.md, build-progress.md, review notes
public/              Static files copied to dist/ (icons, social image, notices)
```
