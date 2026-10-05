# Session handoff: Anirudh QR card portfolio

Give this file to a new Claude Code session, opened with the working directory `C:\Users\aniru\OneDrive\Documents\Portfolio`.
It records everything from the previous session as of 2 Oct 2026.

**First instruction for the new session:** read this file, then `docs/build-progress.md`, `docs/content-audit.md` and `README.md`. Then run `git status`.
Do not redo finished work. Re-run the checks before you rely on any earlier result.

---

## 1. What the owner asked for

- **Original request:** `/design:design-critique` plus "build the exact project" described in `C:\Users\aniru\Downloads\Anirudh_QR_Project_Claude_Build_Guide.md`.
  - Follow the guide strictly. Use the linked GitHub repos only as inspiration, with every element "a little tweaked".
  - Use the full stack: React, Node (Vercel functions) and Three.js.
  - The portfolio should look polished and top-notch.
- **Working style the owner set:**
  - If an error keeps recurring, skip it and move on to other tasks.
  - No "still building" status pings and no wasted tokens. Speak only to report real results or blockers.
  - When the owner says "stop", stop all work.
- **Latest state:** the owner asked to stop and to list what is left before pushing. Then they asked for this handoff file.

## 2. Hard rules (the guide plus owner constraints)

- Never publish any of the following:
  - The employer name (a bank).
  - The job title.
  - A phone number.
  - A home address.
  - The employer's internal product name.
  - Unverified metrics.
- **Public email:** `optimus182002@gmail.com`. Never use the old address (`sharma.aniiirudh@…`).
- **LinkedIn:** `linkedin.com/in/-anirudh-sharma`. The owner still needs to confirm this.
- No secrets in `VITE_*` variables.
- No real email sends.
- No push, deploy or DNS change without explicit owner approval.
- Never claim a push, deploy or test that did not actually happen.
- `Downloads\Blaze_Vanguard` is an unrelated project. Never mix anything from it into this one.

## 3. Project facts

| Item | Value |
|---|---|
| Working folder | `C:\Users\aniru\OneDrive\Documents\Portfolio` (cloned from `Downloads\Anirudh_QR_Project\anirudh-qr-project`; the original is untouched) |
| Branch | `feat/qr-card-experience` (from local `main`) |
| Commits | Only one: `63645d0 Initial QR card experience`. **It contains the legacy résumé PDF and personal photos.** |
| Remote | `origin` = https://github.com/aniiiii05/Anirudh-QR-Project.git. Public, **empty**, nothing pushed. |
| Uncommitted work | About 94 changed, deleted or untracked files. All of the new work below is uncommitted. |
| Stack | React 18, Vite 5, TypeScript, Tailwind 3, shadcn/Radix, Three.js 0.183, Zod, Vitest, Playwright (local Chrome with real WebGL), Vercel Node functions in `api/` (NodeNext, explicit `.js` imports) |
| Fonts | Self-hosted `@fontsource-variable` fonts: Bricolage Grotesque (display), Inter (body), JetBrains Mono |
| Toolchain | Node 24.12, npm 11.6, git 2.52. No `gh` CLI. Vercel CLI is present but not linked or authenticated. |
| Dev preview | `.claude/launch.json` has the config `qr-card-dev` on port 8080, bound to 127.0.0.1 |

## 4. Everything that was built (phases 1–9 done)

**Routes**
- `/` redirects to `/card`, which is the canonical page.
- Other routes: `/card`, `/privacy`, `/q` (QR redirect), and a 404 page.
- The legacy Mario-themed portfolio was deleted from the working tree. It is still in git history.

**Design system**
- `src/card/tokens.css` defines:
  - Canvas `#F4F1EA`, ink `#181817`, muted `#666B69` (AA contrast).
  - Lime `#D7FF5A` and cobalt `#315DFF`.
  - Radii, motion values with reduced-motion support, and the focus ring.
- `src/card/card.css` and `src/card/workspace.css` hold the page and 3D-room styles.
- `tailwind.config.ts` fonts map to the card tokens. The legacy VT323 font and the Mario colours were removed.

**Content**
- `src/card/profile.ts` holds the public data shape.
  - Fields: an evidence status, honest project states, a visibility flag, a neutral About section, education, grouped skills, learning, and languages ("Native or Bilingual", "Full Professional").
  - No employer data is in the bundle.
- `docs/content-audit.md` records the source and decision for every public claim.

**Page**
- `src/card/Card.tsx` and `src/card/sections/*` build the page sections.
- `src/card/demos/*` contains honest interactive demos. They are labelled as demos, not as real production systems.

**3D workspace**
- Main files:
  - `src/card/Workspace3D.tsx`
  - `src/card/three/` (`RoomCanvas.tsx`, `roomScene.ts`, `cameraRig.ts`, `layout.ts`, `pins.ts`, `maths.ts`, `webgl.ts`)
- What it does:
  - Lazy-loaded Three.js room with hotspots and a camera rig.
  - Falls back to a poster image when WebGL is unavailable (`public/workspace-room.webp/.png`, `scripts/render-poster.mjs`, `scripts/poster/`).
- Licence notices are in `public/notices/` (three.js MIT, Bruno Simon folio MIT, 3D credits).

**Contact**
- `src/card/ContactSheet.tsx` is the contact sheet.
  - It is a form with Zod validation.
  - When delivery is disabled, it falls back to an email draft (mailto).
  - Drafts persist so nothing is lost.
- `src/card/contactClient.ts`:
  - `GET /api/contact` returns only `{enabled}`.
  - It handles POST with an Idempotency-Key, plus the mailto builder.
- `src/card/logic.ts` defines `DIRECT_DELIVERY_NOTICE = null` because delivery is disabled.
- `src/App.tsx` has a `ContactFallbackBoundary`.

**vCard**
- `src/card/vcard.ts` and `api/vcard.ts` serve a downloadable contact card.

**API (Vercel Node functions)**
- `api/contact.ts`:
  - Zod validation, honeypot and timing checks.
  - Rate limit (bypass fixed). Upstash is optional.
  - Resend sending, gated by environment variables.
  - Privacy-safe logging.
  - Delivery is **disabled** unless the environment is configured.
- `api/q.ts` handles the QR redirect, and `api/vcard.ts` serves the vCard.

**Privacy and metadata**
- `src/card/Privacy.tsx` is the privacy page.
- `index.html` and `scripts/card-html.mjs` set the metadata, OG tags, canonical and robots tags based on `SITE_ORIGIN`.
- `public/robots.txt` and `vercel.json` hold routing and headers.

**Local emulation**
- `scripts/local-vercel.mjs` emulates Vercel routing and functions.
- Run it with `npm run preview:vercel`, which serves on 127.0.0.1:4173.

**Tests**
- Vitest: `src/card/*.test.ts(x)`, `three/cameraRig.test.ts`, `vcard.test.ts`, `contact.test.ts`.
- Playwright in `e2e/` (config in `playwright.config.ts`): `card.spec.ts`, `routes.spec.ts`, `workspace.spec.ts`.

**Removed for privacy**
- `public/Anirudh_Sharma_Resume.pdf`, which contained a phone number, the old email and unverified metrics.
- The personal photos in `src/assets/`.
- `public/placeholder.svg`.

**Docs**
- `README.md`, `.env.example`, `docs/build-progress.md`, `docs/content-audit.md`.
- `docs/QR-CARD-REVIEW.md`, with the employer product name made generic.

### Bugs fixed during review

- Vercel import extensions.
- `--muted` was being overridden by `index.css`.
- Contact-sheet drafts were being lost.
- The Explore section would not scroll.
- On mobile, the status box covered the hotspot buttons.
- The rate limit could be bypassed.
- The dev server bound to all network interfaces; it now binds to 127.0.0.1.
- Contact delivery is now gated by privacy settings and environment variables.

## 5. Last verified results (2 Oct 2026, local only; re-run before trusting them)

| Check | Result |
|---|---|
| `npm run typecheck` | passed |
| `npx vitest run` | 188/188 passed (11 files) |
| `npm run build` | passed. Entry JS 332 kB (103 kB gzip); `RoomCanvas` lazy chunk 520 kB; no source maps |
| `npx playwright test` | 61 passed, 11 skipped, 0 failed |
| `npm run lint` | 3 errors and 7 warnings, all pre-existing in `src/components/ui/*` and `tailwind.config.ts`. Not re-run after the final changes. |
| Sensitive scan of `dist/` and the working tree | clean, except a three.js false positive. **Git history is not clean.** |
| Not done | `vercel build`, any deploy, real email delivery, Lighthouse, testing on real phones, a printed QR scan, a final screenshot of the 3D room in the preview |

## 6. Tasks left (in order)

1. **Owner decision on git history.** This blocks everything else.
   - **A (recommended):** a fresh single clean commit or orphan branch, so the résumé PDF and photos never reach GitHub.
   - **B:** rewrite the existing history to strip the PDF and photos.
   - **C:** push as-is. Not recommended, because it publishes the résumé (with the phone number) and the photos in history.
2. The owner confirms the email, the LinkedIn URL and the domain, then `SITE_ORIGIN` is set.
3. Run `npm run lint` and a final sensitive scan (phone, old email, employer, product name, résumé or photo file names, cities).
4. Commit the uncommitted changes using the method the owner chose in step 1. Before committing, check that `.claude/`, `test-results/`, `artifacts/` and `.lovable/` should be ignored.
5. Push to `https://github.com/aniiiii05/Anirudh-QR-Project.git`, **only with explicit owner approval**.
6. Optional, and only with owner approval:
   - `vercel build`, then a preview deploy, then production.
   - Choose a contact provider (Resend + Upstash) and a retention period. Update the privacy notice and `DIRECT_DELIVERY_NOTICE` together.
   - Send a test email to confirm the owner receives mail at the public address.
   - Generate the final QR for `/q` on the chosen domain, print a proof, and scan it on iOS and Android.
7. Housekeeping: remove the stray `qr-card-dev` entry from `Downloads\Blaze_Vanguard\.claude\launch.json`.

## 7. Known environment issue

- The `security-guidance` plugin's hook failed in the old session. Its script `security_reminder_hook.py` was missing, and every failure produced a "Background security review found issues" notification in a loop.
- The owner has disabled the plugin. A new session will not load it.
- If the notifications appear again, ignore them; they are noise.

## 8. Useful commands

```bash
npm ci
npm run typecheck
npx vitest run
npm run build
npm run lint
npm run preview:vercel   # local Vercel emulation on 127.0.0.1:4173
npx playwright test
```
