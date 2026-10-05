# Build progress — QR card experience

Resume from here after a context reset: read the guide (`Anirudh_QR_Project_Claude_Build_Guide.md`), this file, `git status`, and rerun the checks. Historical results are not evidence for the current build.

## Project decision (Phase 1)

| Item | Finding |
|---|---|
| Working folder | `C:\Users\aniru\OneDrive\Documents\Portfolio` — cloned 2 Oct 2026 from the existing local repo `Downloads\Anirudh_QR_Project\anirudh-qr-project` (original left untouched). |
| Not used | `Downloads\Blaze_Vanguard` is an unrelated employer-challenge prototype; nothing from it belongs on this site. |
| Framework | React 18, Vite 5, TypeScript, Tailwind 3, shadcn/Radix, Three.js 0.183, Zod, Vitest. Vercel Node functions in `api/`. Kept as-is (healthy app). |
| Repository | Standalone `Anirudh-QR-Project`. Remote `origin` = https://github.com/aniiiii05/Anirudh-QR-Project.git — exists, public, **empty** (no refs) as of 2 Oct 2026. Nothing pushed. |
| Branch | `feat/qr-card-experience` from local `main` (`63645d0 Initial QR card experience`). |
| Routes | Standalone rule: `/` redirects to `/card` (canonical). The legacy portfolio source has since been deleted from the working tree (it remains in git history). |
| Toolchain | Node 24.12.0, npm 11.6.2, git 2.52. No `gh` CLI. Vercel CLI present (not authenticated/linked — not checked yet). Chrome + Edge installed; headless Chrome renders real WebGL. |

## Baseline (before changes, 2 Oct 2026)

- `npm ci` OK. `typecheck` passed. `npm test` 19/19 passed. `npm run build` passed (main chunk 403 kB / 126 kB gzip; RoomCanvas lazy chunk 499 kB).
- `npm run lint`: 4 errors + 8 warnings, all pre-existing in `src/components/ui/*` and `tailwind.config.ts`.
- Real-browser check (headless Chrome, 1440 and 390): `/card` loads with no console errors and no horizontal overflow; the WebGL scene opens.

## Phase status

- [x] Phase 1 — inspect & choose project
- [x] Phase 2 — visual system & copy
- [x] Phase 3 — honest demos
- [x] Phase 4 — 3D workspace
- [x] Phase 5 — routes, contact sheet, vCard
- [x] Phase 6 — contact delivery & security
- [x] Phase 7 — privacy, analytics, metadata
- [x] Phase 8 — local preview
- [x] Phase 9 — verification & acceptance (local only; see below)
- [ ] Phase 10 — GitHub handoff
- [ ] Phase 11 — Vercel preview / domain / QR (owner-gated)

## Changes so far

- `src/card/profile.ts`: public data shape (evidence status, honest project state, visibility flag), updated email from Profile.pdf, neutral About copy from guide §4A, education, grouped skills, learning titles, languages. Employer data deliberately absent from the bundle.
- `src/card/contactClient.ts`: contact status/send/email-draft contract.
- The public résumé PDF removed from the deployable `public/` folder (contains a phone number, the old email and unverified metrics). The original remains in the owner's Downloads copy.

## Integration pass (2 Oct 2026)

All three areas (platform, UI, 3D) were implemented, reviewed and fixed. Integration changes:

- `tailwind.config.ts`: `font-sans/heading/mono` now map to the card tokens (`--font-body`, `--font-display`, `--font-mono`) instead of the legacy VT323 / Press Start 2P; legacy `mario` colours removed.
- `src/card/profile.ts`: language labels use the profile's exact casing ("Native or Bilingual", "Full Professional"); `docs/content-audit.md` updated.
- `public/placeholder.svg` (unused template file) removed.
- `docs/QR-CARD-REVIEW.md`: employer product name replaced with a generic description.
- `playwright.config.ts`: comment now says E2E_BASE_URL must be a production-like server, not `npm run dev`.

## Verification results (2 Oct 2026, local only)

| Check | Result |
|---|---|
| `npm run typecheck` (app, api NodeNext, node) | passed (exit 0) |
| `npx vitest run` | passed: 11 files, 188/188 tests |
| `npm run build` | passed; entry JS 332.32 kB (102.86 kB gzip), entry CSS 114.43 kB (23.11 kB gzip), lazy `RoomCanvas` 519.73 kB (134.63 kB gzip, holds all three.js); Privacy 2.99 kB, NotFound 0.63 kB, QRRedirect 0.25 kB lazy chunks; no source maps emitted |
| `npm run lint` | 3 errors + 7 warnings, all pre-existing in `src/components/ui/*` (command, textarea + 7 fast-refresh warnings) and `tailwind.config.ts` (`require()`); new files clean |
| `npx playwright test` (all specs, desktop-chrome + mobile-chrome, against `npm run preview:vercel` on 4173) | passed: 61 passed, 11 skipped (single-project tests and dev-only 3D hook tests), 0 failed |
| Sensitive scan of `dist/` (phone, old email, employer names, résumé/photo file names, cities) | no hits |
| Sensitive scan of working-tree tracked + untracked files | no hits after the doc edits above. Git history (commit `63645d0`) still contains the legacy résumé, photos and old content |
| Screenshots (headless Chrome, `npm run serve`) | 1440 and 390 full page, 3D active, contact sheet both views, expanded demo: no horizontal overflow, no console errors |
| `vercel build` / Vercel deployment | not run |
| Real email delivery, Resend, Upstash | not run (delivery is disabled by design) |
| Lighthouse, real phones, printed QR scan | not run |

## Blockers / owner decisions

- Pushing local history: commit `63645d0` contains the legacy résumé PDF and personal photos. Pushing it to the public repo would publish them in history — owner to decide (a clean history is recommended).
- Domain: choose the personal domain or subdomain; then set `SITE_ORIGIN` (controls canonical, OG and indexing).
- Contact provider and retention: decide whether to enable direct delivery (Resend + Upstash) and how long messages are kept; enabling also requires updating the privacy notice and `DIRECT_DELIVERY_NOTICE` together.
- LinkedIn: manually check that `linkedin.com/in/-anirudh-sharma` is the right public profile.
- Email delivery: send a test message to the public address and confirm it arrives (mailbox ownership).
- Push / history: decide whether to push a fresh history (recommended) rather than the existing commit.
- Production deploy: run `vercel build`, smoke-test each function, deploy a preview, then production — owner-gated.
- Print proof: generate the final QR for the chosen domain (`/q`), print a proof and scan it on iOS and Android.
