# Content audit — `/card`

Audit date: 2 October 2026. Scope: every public claim made by the QR card experience at `/card`, its contact sheet, the vCard (`/contact.vcf`), the privacy page (`/privacy`), the static route HTML and the page metadata.

This is a public document. Facts that were reviewed and deliberately withheld are described **by category only** (see "Excluded by category"); their values are not repeated here.

## How to read this audit

- **Source** — where the wording or fact comes from. "Profile (2 Oct 2026)" is the owner-supplied, LinkedIn-style profile added on 2 October 2026. "Brief" is the owner's implementation brief for this page. Neither is an independently verified record.
- **Verification status** — one of:
  - `owner-supplied`: stated by the owner; not independently verified.
  - `link-checked`: an automated request on 2 Oct 2026 confirmed the destination (result recorded below).
  - `needs-clarification`: the sources disagree or omit something material; only the undisputed part is published.
- **Publish decision** — what the page does with the claim.

Public claims live in one typed configuration, `src/card/profile.ts`. The page, the vCard (`src/card/vcard.ts`), the static route metadata (`scripts/card-html.mjs`, which imports `profile.ts` at build time) and the privacy contact all read from it; a unit test checks that `index.html` repeats the same name, tagline, description and links. Withheld facts are kept out of that file and out of the browser bundle entirely — a visibility flag is display control, not privacy.

## Claims on the page

| Claim | Source | Verification status | Publish decision |
|---|---|---|---|
| Name: **Anirudh Sharma** | Profile (2 Oct 2026); brief §4; public GitHub profile name | owner-supplied; link-checked (GitHub profile name matches) | Publish (page, vCard, metadata, JSON-LD once a domain is set). |
| Monogram and header: `AS.` / `01 / A PERSON ON THE INTERNET` | Brief §6 | owner-supplied (design copy) | Publish. |
| Tagline: **Human, But Automated.** | Brief §3 | owner-supplied | Publish (hero, page title, social image). |
| Hook: **You found my offline profile.** | Brief §3, §6 | owner-supplied | Publish. |
| Hero: "Hi, I'm Anirudh." / "I turn messy ideas into useful systems." / "Data brain. Product curiosity. A soft spot for automating the boring bits." | Brief §6 | owner-supplied (personal voice; no measurable claim) | Publish as written. |
| Hero supporting line: "The card worked. Now let's make the conversation interesting." | Brief §6 | owner-supplied | Publish. |
| Capability strip: DATA — "Find the signal. Make it useful." / AUTOMATION — "Give the repetitive work a better job." / PRODUCT — "Make the idea real enough to test." | Brief §6 | owner-supplied (interests, not results) | Publish. |
| Page description: "I turn messy ideas into useful systems. A personal introduction through data, automation and product experiments." | Brief §6; employer-neutral positioning in brief §4A | owner-supplied | Publish (`<meta name="description">`, `og:description`, `twitter:description`, no-JavaScript fallback). |
| About heading: "Curious by default. Practical on purpose." | Brief §6 | owner-supplied | Publish. |
| About copy: "I'm Anirudh Sharma, a mechanical engineering graduate from NIT Durgapur. My interests sit at the intersection of data engineering, automation and product—from making data easier to work with to turning a small idea into something useful. I enjoy Python, SQL, cloud platforms and exploring practical applications of agentic AI. This space is for my personal projects and experiments." | Brief §4A "Default updated About copy"; Profile (2 Oct 2026) | owner-supplied | Publish verbatim (`profile.about[0]`). |
| About line: "I like thoughtful questions, useful experiments, and making a process easier to use." | Brief §6 | owner-supplied | Publish (`profile.about[1]`). |
| Education: **B.Tech, Mechanical Engineering — National Institute of Technology Durgapur, 2022–2026** | Profile (2 Oct 2026): November 2022–June 2026 | owner-supplied (degree not independently verified) | Publish as "graduate" (not "student"). No grades, rank or honours — none were supplied. |
| Skills — **Data engineering**: Python, SQL, ETL/ELT pipelines, Data modelling, Data warehousing, Azure Cloud | Profile (2 Oct 2026) summary competencies | owner-supplied (self-described) | Publish as a plain list. No proficiency levels, percentages, years, "expert" labels, production-scale claims or cloud certifications. |
| Skills — **Practical automation**: Workflow automation, Exploring agentic AI, Data automation platforms, Git | Profile (2 Oct 2026) summary competencies | owner-supplied (self-described) | Publish. Agentic AI is framed as exploration, not delivered systems. |
| Skills — **Product curiosity**: Statistical data analysis, Business intelligence, Digital strategy, SEO, Excel | Profile (2 Oct 2026) "Top Skills" and competencies; Excel is named in an internship description | owner-supplied (self-described) | Publish, listed after the data and automation groups so SEO and digital strategy do not overwhelm the data/product identity. |
| **Learning & credentials** (exact titles): "Master Zoho CRM: Sales, Automation & Management for Success"; "Google AI Essentials"; "Start Writing Prompts like a Pro"; "Speed Up Data Analysis and Presentation Building"; "Design Prompts for Everyday Work Tasks" | Profile (2 Oct 2026) "Certifications" list | owner-supplied; credential type, issuer, date and ID not supplied → needs-clarification for anything beyond the titles | Publish the five titles only, under "Learning & credentials". No issuer logos, badges, dates, IDs or "certified" wording. |
| Languages: Hindi, English, Bengali with the profile's proficiency labels | Profile (2 Oct 2026) | owner-supplied | Publish in the expanded About view. The profile's exact labels are "Native or Bilingual" and "Full Professional"; `profile.ts` now uses these exact labels. No test scores or qualifications implied. |
| Email: **optimus182002@gmail.com** | Profile (2 Oct 2026) contact block | owner-supplied; **delivery not yet verified** | The **only** email: contact sheet, `mailto:` links, vCard, privacy contact, no-JavaScript fallback. Owner confirms delivery before launch. |
| LinkedIn: **https://www.linkedin.com/in/-anirudh-sharma/** | Legacy portfolio source; the public GitHub profile's linked social account (exact match); Profile (2 Oct 2026) | link-checked: **blocked automated check** (HTTP 999 from LinkedIn) — not a broken link; identity cross-checked via the GitHub profile | Publish this exact URL. Owner opens it manually once before launch. |
| GitHub: **https://github.com/aniiiii05** | Brief §2, §4; legacy portfolio source | link-checked (HTTP 200; profile name "Anirudh Sharma") | Publish. |
| Work heading: "A few things I've made, mapped, or made easier." | Brief §7 | owner-supplied | Publish. |
| **The operations lens** — DATA — `Exploring · demo`. An on-time, in-full (OTIF) explainer built on explicitly fictional orders; the percentage is calculated from the sample records. | Brief §7A; built for this page | owner-supplied (synthetic data; no employer data) | Publish with the visible note that figures are illustrative, not business performance or anyone's results. |
| **One small intention** — PRODUCT — `Exploring · demo` (state: prototype). Intention, next step, completion toggle. | Brief §7B; built for this page | owner-supplied | Publish as a prototype created for this page — not a launched product, not a case study, not linked to any named venture. Inputs stay in the tab and clear on refresh. |
| **The useful workflow** — AUTOMATION — `Exploring · demo`. Deterministic, browser-only list clean-up. | Brief §7C; built for this page | owner-supplied | Publish with the note "no AI provider, no upload". |
| Workspace copy: "A LITTLE ROOM FOR IDEAS" / "Different tools. Same curiosity." / "An imaginary workspace for the things I like making. Pick a corner and take a closer look." | Brief §8 | owner-supplied | Publish. The room is explicitly imaginary — not the owner's home or office. |
| 3D credits and licences (`/notices/3d-credits.txt`, `/notices/bruno-simon-folio-MIT.txt`, `/notices/three-MIT.txt`) | `brunosimon/folio-2025` `license.md` (MIT, © 2025 Bruno Simon) at commit `41046b57eeed8d156d9c3fd7fa259900baef7816`; `brunosimon/my-room-in-3d` `package.json` `"license": "UNLICENSED"` at commit `5d00b3f870da81f103e901e0d12e20bbcc816834`; npm `three` 0.183.2 `LICENSE` (MIT) | link-checked (both repositories HTTP 200; both commits unchanged) | Publish. Only small MIT interpolation helpers are adapted from folio-2025 (its `package.json` says ISC; the root MIT notice is retained). my-room-in-3d is a conceptual reference only — no code, models, textures or audio copied. No endorsement implied. |
| Conversation: "What should we make less annoying?" / "Tell me about a small bottleneck or an interesting idea. I like thoughtful problems." | Brief §6 | owner-supplied | Publish. Implies conversation only — not paid availability or an agency offer. |
| Footer: "You scanned. We should probably say hi." / "Anirudh Sharma © [year]" / "Built as a personal project" / "Personal work and opinions; no employer affiliation implied." | Brief §6 | owner-supplied | Publish. |
| vCard (`/contact.vcf`): FN/N, the approved email, a primary URL (the canonical `/card` address once `SITE_ORIGIN` is set, otherwise LinkedIn) plus labelled LinkedIn and GitHub URLs | Brief §9; generated from `src/card/profile.ts` by `src/card/vcard.ts` | owner-supplied | Publish. No phone, employer, job title or address (unit- and end-to-end-tested). |
| Contact form copy (consent "I understand Anirudh may reply by email"; success and failure messages) | Brief §10 | n/a (behavioural copy) | The sending form appears only when `GET /api/contact` reports `enabled: true`, which requires the provider, limiter and origin to be configured. Until then "Share a thought" opens a clearly labelled email draft — never "sent". |
| Privacy notice (`/privacy`, last updated 2 October 2026) | Written from the page's actual behaviour: no analytics, cookies or tracking; self-hosted fonts; browser-only demos; email-draft contact; vCard from public details; hosting request data; external links; deletion contact | needs-clarification (delivery provider and retention period not yet chosen) | Publish the email-draft version. Rewrite and re-date it — naming providers, retention and deletion — before enabling form delivery or analytics. |
| Metadata: title, description, `og:*`, `twitter:card` per route in the initial HTML | `scripts/card-html.mjs` from `profile.ts` | n/a | Until the real domain is configured (`SITE_ORIGIN`), every page is `noindex, nofollow`, `robots.txt` disallows all, and no canonical, `og:url`, `og:image`, sitemap or JSON-LD is emitted — no domain is invented. |
| Social preview image `/card-og.png` ("AS.", "Hi, I'm Anirudh.", tagline, "DATA / AUTOMATION / PRODUCT") and static room render `/workspace-room.png` | Original artwork for this page | owner-supplied | Publish. Replaces the legacy social image, whose signed URL has expired. `card-og.png` may be regenerated later to match the final design. |
| Favicon (`/card-icon.svg`, `/favicon.ico`) | `card-icon.svg` ("AS." monogram); `favicon.ico` regenerated from it on 2 Oct 2026 | n/a | Publish. The previous `favicon.ico` was a generic folder illustration inherited from the legacy site and has been replaced. |

## Excluded by category

The following were reviewed and are **not** published on `/card`, in the vCard, in metadata, in `src/card/profile.ts` or in the build output. Values are intentionally not repeated in this document.

- **Telephone / WhatsApp number** — omitted from the page and vCard unless the owner explicitly asks for it.
- **Home address and city of residence** — the sources give two different cities; no city is published.
- **Current employer, job title, programme, dates and work description** — builder context only. Employer-identifying wording needs the owner's explicit approval.
- **Employer data and artefacts** — datasets, systems, architecture, project names, dashboards, report files, screenshots or logos from any current or past employer or internship. Demos use original synthetic data instead. A repository being public is not treated as permission to republish employer work.
- **Unverified performance metrics** — percentages, record volumes, uptime figures, hours saved, adoption rates, audience and conversion counts, budgets and similar numbers from the legacy portfolio and an older résumé.
- **An internship target misread as a result** — an objective stated in the profile is not presented as an achieved outcome (see "Unresolved conflicts").
- **Skill proficiency ratings** — percentage bars, "expert" labels and years of experience.
- **Unsubstantiated credentials** — issuers, dates, badges and certification names that the latest profile does not list.
- **Job-seeking or target-employer statements** — the page must not imply unemployment, an intention to leave a job, an agency business or unrestricted availability for paid work.
- **The older résumé PDF** — removed from `public/`; not linked or deployed.
- **Personal photographs and character art from the legacy site** — not used on `/card`; deleted from this repository's working tree.
- **The previous email address** — replaced by the latest owner-supplied address; the two are never shown together.
- **Venture and product claims** — launch status, users, funding, outcomes or ownership of any personal product or venture name, until confirmed.
- **Awards, leadership and volunteering claims from the legacy site** that the latest profile does not substantiate.
- **Secondary-school details** — supplied, but omitted from the short page for focus.
- **Raw profile text, the source PDF and private builder notes** — never committed or bundled.

## Unresolved conflicts

| Topic | What the sources say | Handling until the owner clarifies |
|---|---|---|
| Email change | The latest profile gives a new address; the legacy source and older résumé use a different one. | Publish only the new address. Owner verifies delivery. |
| Residence | The profile header lists one city; the current role lists a different city. A role location is not a home address. | No city or location on the page. |
| Cisco Campus Ambassador end date | Structured entry: October 2024–June 2025. Narrative text: a term of October 2024–September 2025. | Do not publish an end month or duration. |
| OctaNet internship naming and dates | Structured entry: "OctaNet Services Pvt Ltd.", Development Intern, June 2024–July 2024. Narrative: a remote web development internship with "TechOctaNet Services Pvt Ltd." "during June 2024". | Keep the structured range as the source-reported timeline; confirm the exact organisation name before any detailed entry. |
| Tata Motors delivery-efficiency target | The profile states an *objective* of improving delivery efficiency to a percentage target. It does not state that the target was reached or that any measured improvement was delivered. | Never publish the target as an achieved result, an OTIF increase or any percentage improvement. The OTIF demo uses fictional data only. |
| PDF4me "shadow role" | The experience entry says "Data Specialist Intern" (October 2025–June 2026); the summary calls it "Data Specialist Intern (Shadow Role)". | If a career entry is ever shown, use "contributed to / supported / gained exposure to" and keep the shadow-role nuance until its meaning is clarified. |
| Present-tense durations | The current-role entry carries a relative duration that goes stale. | Use month/year with "Present" only, and re-verify current status before any later launch. Nothing about the current role is on the default page. |
| Language label capitalisation | The profile writes "Native or Bilingual" / "Full Professional". | Resolved: `profile.ts` now matches exactly. |

## Proposed career copy pending owner approval

**Not on the page.** A career timeline is intentionally absent from `/card`. Because the current role is withheld under the employment publication boundary, a timeline could only list past internships — and showing only past roles while omitting the current one could imply that Anirudh is unemployed or looking to move, which the brief forbids. The timeline should therefore appear either complete (with owner-approved wording for the current role) or not at all.

If the owner approves a career section, use **only** these source-safe candidates:

| Entry | Proposed copy | Conditions |
|---|---|---|
| Current role | *(withheld — not drafted here)* | Requires the owner's explicit approval of employer-identifying wording: restrained title, employer, month/year and general scope only. Must be present if any past roles are shown. |
| PDF4me — Data Specialist Intern, October 2025–June 2026 | "Supported data-centric product work, technical documentation and workflow improvements during a Data Specialist internship." | Keep the shadow-role nuance if the full entry is shown before it is clarified. |
| Tata Motors — Data Analyst (Supply Chain & Logistics Management) Intern, May 2025–August 2025 | "Worked on OTIF analysis and Excel reporting to support supply-chain visibility and operational decision-making." | No percentage, target or result. No employer data, dashboards or screenshots. |
| Cisco — Campus Ambassador | "Campus Ambassador, Cisco." | No end month or duration until the date conflict is resolved. No event counts, attendance or outcomes. |
| OctaNet — Development Intern, June 2024–July 2024 (source-reported) | "Completed a remote web development internship, gaining practical experience through hands-on development work." | Confirm the exact organisation name first. No user counts or delivery claims. |

## Legacy portfolio

The older portfolio (the previous homepage and its components, the résumé PDF and the personal images) has been **deleted from this repository's working tree**: it is not routed, not imported and not in the build output (the build is checked for the legacy contact details and file names). `/` redirects to `/card`, which is canonical.

That material **has not been verified by this audit** and still exists elsewhere: in this repository's first local commit (not pushed), in the original public portfolio repository and on its live deployment. It includes contact details, a location, older role titles, proficiency percentages, and performance and audience claims that the latest profile does not substantiate, and some of it may relate to internship work whose publication permission has not been reviewed. Keeping it out of the new repository's published history, and any clean-up of the original repository or site, are owner decisions. The new page being conservative does **not** mean the old site has been reviewed.

## Link checks (2 October 2026)

Automated requests with a browser-like User-Agent, following redirects.

| URL | Result | Classification |
|---|---|---|
| https://github.com/aniiiii05 | HTTP 200 | OK |
| https://www.linkedin.com/in/-anirudh-sharma/ | HTTP 999 (LinkedIn bot response) | Blocked automated check — not broken; owner verifies manually |
| https://anirudh-s-data-canvas.vercel.app/ | HTTP 200 | OK (legacy site; not evidence that its claims are current) |
| https://github.com/aniiiii05/Anirudh-QR-Project | HTTP 200 | OK (repository exists; empty at check time) |
| https://github.com/brunosimon/folio-2025 | HTTP 200 | OK |
| https://github.com/brunosimon/my-room-in-3d | HTTP 200 | OK |
| https://threejs.org/ | HTTP 200 | OK |

Re-run these checks against the final deployment before printing a QR code.
