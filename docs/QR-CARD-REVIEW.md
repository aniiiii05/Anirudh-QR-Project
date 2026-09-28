# QR card review and launch notes

This branch adds `/card` without replacing the existing `/` portfolio. It is a review build, not a production launch. Do not merge or print a QR until the gates below are settled.

## Evidence and public content

- Repository inspected: `aniiiii05/anirudh-s-data-canvas`, a React 18 / Vite / TypeScript app. Existing app, assets and dependencies retained.
- Name and GitHub handle confirmed against the repository and public GitHub profile on 27 September 2026.
- LinkedIn target matches both the existing ContactSection and GitHub profile. LinkedIn blocks automated retrieval; the owner must check the destination manually.
- Email copied exactly from the existing public ContactSection. Mailbox ownership/delivery still needs an owner check.
- Graduate description is owner-supplied and consistent with existing repository copy; it is not independent verification of a degree.
- No phone, exact address, current employer, employment title, compensation, employer logo, private work, internship metrics or availability promise was added.
- All three work entries are demos built with this page. They do not claim prior shipped products, customer results, or employer work. Alignaa and employer case studies are excluded pending permission and factual review.
- `src/card/profile.ts` is the source for public identity, links and visible project records. `publicApproval` marks safe demo records, not owner approval of historical claims. Set false to hide any record.
- The original `/` portfolio is preserved and still contains older claims and phone information. These are not verified by this change and should be reviewed separately before using `/` as a current profile.

## Development

`npm install`, `npm run dev`, then open `/card`. `npm run typecheck`, `npm test`, and `npm run build` check the implementation. Vite serves the client only; run a Vercel preview to exercise server functions. No secret belongs in a `VITE_` variable.

## Contact delivery

Until configured, `/api/contact` rejects delivery and the page explicitly says direct delivery is pending setup. Email links work independently. Never claim that a form notification was delivered during a mocked test.

To activate: approve the public email, verified Resend sender and private recipient; configure server-only `.env.example` variables in Vercel; create a shared Upstash Redis database; generate a random rate-limit HMAC secret; set SITE_ORIGIN to the exact allowed HTTPS origin. Requests are origin checked, Zod validated, rate limited to five requests per ten minutes using a short-lived HMAC address key, and provider-idempotent for matching retries. Resend's idempotency window limits duplicate protection; it is not an unlimited exactly-once guarantee. No raw form content is logged or stored by this app. Email providers still retain mail under their policies.

Before CONTACT_ENABLED=true, replace the setup notice and privacy copy with the actual providers, retention duration, deletion process and appropriate disclosures. Test one real notification, retry, invalid input, limit exceeded and provider failure. Do not enable without that review. Demo inputs never leave the browser; analytics are intentionally absent pending a provider/privacy decision.

## Deployment gates

1. Owner approves public copy, email, LinkedIn and demo framing.
2. Choose exact personal domain or suitable subdomain. Existing Alignaa product/domain and DNS remain untouched.
3. Deploy a Vercel preview from this branch; verify `/q`, `/card`, `/privacy`, `/contact.vcf` and `/api/contact`. SITE_ORIGIN controls canonical and social metadata at build time. Without it the card is noindex.
4. Configure real contact delivery and update privacy copy as above, or launch with email only and remove the unavailable form.
5. Check real iOS Safari and Android Chrome, keyboard, screen reader and slow-network behavior. Run production Lighthouse; scores are targets, not claimed results.
6. After copy and preview approval, publish and test the final HTTPS `/q` address; only then generate a print QR and physically scan the proof.

Optional AI profile, production analytics, real domain/DNS changes and a print QR are deliberately not enabled in this review build.

## Verification in this build session

- TypeScript client and API checks passed.
- 17 tests passed, including contact rejection, disabled delivery, shared limiter failure, rate exhaustion, provider failure and stable retry idempotency headers. Provider responses were mocked; no real email was sent.
- Production build passed; the original portfolio is split into a separate lazy-loaded chunk.
- ESLint passed for new/changed application and API files. Existing repository-wide lint issues are outside this scoped check.
- The existing public Vercel homepage responded with HTTP 200.
- Full browser QA could not run: agent-browser could not start its daemon and alternate Chromium failed GPU/runtime initialization in this environment. Mobile layout, keyboard/focus and actual-device checks therefore remain unverified; no Lighthouse score is claimed.

## 3D addition

A user-requested miniature workspace adds opt-in Three.js rendering, bounded camera focus for the Data/Product/Automation areas, pointer parallax, reduced-motion handling, mobile pixel-ratio caps, off-screen rendering suspension, WebGL failure fallback, resource disposal, and equivalent HTML controls. It is explicitly an imaginary workspace. Loading the base page does not load the Three.js rendering chunk.

`folio-2025` was inspected at commit `41046b57eeed8d156d9c3fd7fa259900baef7816`. Its MIT-licensed interpolation helpers are adapted with the complete licence notice; its camera and quality architecture informed the design. The root MIT licence is retained despite a conflicting ISC label in that repository's package metadata.

`my-room-in-3d` was inspected at commit `5d00b3f870da81f103e901e0d12e20bbcc816834`. It is marked UNLICENSED and was used solely as a visual/conceptual reference. No source, models, textures or sounds were copied. All room geometry is original procedural Three.js geometry. Attribution is available from the page, including Three.js's MIT notice.

The static fallback is rendered from the same scene geometry using a CPU depth buffer. Rebuild it with `node scripts/render-room.mjs && python3 scripts/render-room.py` (Python requires numpy and Pillow); these optional tools are not deployment dependencies. The fallback image was visually inspected. The WebGL runtime remains subject to the browser-testing limitation above. Two additional DOM tests check the non-WebGL area-selection flow and camera-reset state.

Automatic approval review blocked publishing this branch because public contact details and copy require owner approval. No push, PR, production deploy or DNS change is claimed.
