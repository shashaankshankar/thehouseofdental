# Phase 1 + Phase 2 Implementation Status

**Project:** Winter Park Dental / The House of Dental redesign remediation  
**Scope:** Phase 1 interaction/accessibility remediation and Phase 2 static architecture  
**Status:** Implemented locally; Phase 1 and Phase 2 QA complete for the recorded scope; not published  
**Baseline date:** 2026-08-04

## Scope and guardrails

This phase addresses the critical and high-priority defects identified in `Winter-Park-Dental-Redesign-Audit.md` across the eight existing static routes. The premium noir/ivory/champagne visual language and existing patient-facing copy are preserved. No unsupported practice facts, clinical protocol, offers, review counts, credentials, legal promises, or media have been added. Deployment and publishing are intentionally out of scope.

## Baseline inventory

- Routes: `index.html`, `services.html`, `facial-aesthetics.html`, `new-patients.html`, `about.html`, `reviews.html`, `contact.html`, and `pre-post-op.html`.
- Shared assets: `styles.css`, `main.js`, `assets/logo.svg`, `assets/logo-dark.svg`, `assets/office-exterior.jpg`, care-guide PDFs, and placeholder README files under `assets/aesthetics/` and `assets/team/`.
- Media dependencies: the homepage, About, Services, technology modals, and Facial Aesthetics page still reference remote images; the team and aesthetics local image paths are not populated.
- Forms: one appointment form on `contact.html`, marked with `data-netlify="true"`; delivery, notifications, spam protection, privacy handling, and confirmation behavior remain unverified.
- Inline interaction data/scripts: technology modals on the homepage and About page, service modal data on Services, and the Cherry payment estimator on New Patients.
- Shared interactive behaviors: mobile navigation, scroll reveals, counters, testimonial rotation, before/after comparisons, dialogs, range estimator, and native form validation.
- Metadata baseline: each route has a title and H1, but duplicated Open Graph/Twitter blocks, repeated keywords, blanket Dentist schema, hard-coded review proof, and `thehouseofdental.com` canonicals remain launch-level follow-up items.

## Baseline defects recorded from the audit

1. The mobile menu is constrained by the fixed/backdrop-filtered header at widths up to 1024px; links can render above the visible viewport.
2. The desktop header clips the right-side Book CTA near 1440px.
3. Scaling & Root Planing and QuietNite were nested inside the Services dialog instead of the service grid.
4. Service and technology dialogs do not move focus, trap focus, make the background inert, or return focus to the trigger.
5. Before/after comparisons are mouse/touch-only and do not expose a value to assistive technology.
6. The homepage testimonial rotates automatically without a pause control or programmatic active state.
7. There is no skip link; form focus removes the browser outline; several gold and low-opacity text tokens are too light for normal text.
8. The burger target is 40px and several mobile labels are smaller than the audit's readability recommendation.
9. QuietNite's existing appliance copy conflicts with the practice brief's unresolved laser-required description.

## Phase 1 decisions

- Keep the site static HTML/CSS/JavaScript; no framework or SPA conversion.
- Keep QuietNite visible only as a non-interactive, pending-practice-confirmation service card. The existing QuietNite clinical copy is not rewritten in this phase; the practice decision and clinical review remain blockers.
- Preserve the existing page routes and anchors while improving their shared interaction primitives.
- Use manual testimonial controls instead of automatic rotation.
- Use a native range control for each before/after comparison and preserve pointer/touch dragging.
- Do not deploy or publish.

## Files changed

- Shared behavior and styles: `the-house-of-dental-site/main.js`, `the-house-of-dental-site/styles.css`.
- Route markup and gates: all eight HTML routes under `the-house-of-dental-site/`, including the Services SRP card, non-interactive QuietNite card, QuietNite care-review notice, skip links, main landmarks, favicon links, testimonial controls, and native before/after ranges.
- Repeatable static check: `scripts/validate-static-site.mjs`.
- Handoff records: `docs/PRACTICE-DECISIONS.md`, `docs/URL-INVENTORY.csv`, `docs/CONTENT-APPROVALS.md`, and `docs/QA-MATRIX.md`.
- Rendered evidence: `docs/evidence/phase-1/`.

## Verification evidence

- `node --check the-house-of-dental-site/main.js` — passed.
- `node scripts/validate-static-site.mjs` — passed for all 8 routes, shared CSS/JS, local links, IDs, titles, H1s, and skip links. It reports 11 warnings for the pre-existing, unpopulated `assets/aesthetics/` and `assets/team/` image paths.
- Local browser preview at `http://127.0.0.1:8766/` rendered and structurally checked: `index.html`, `services.html`, `facial-aesthetics.html`, `new-patients.html`, `about.html`, `reviews.html`, `contact.html`, and `pre-post-op.html`. The route pass found 0 browser-console errors or warnings.
- Mobile menu passed at 320×568, 390×844, 768×1024, 820×1180, and 1024×768: full viewport bounds, safe scroll container, no horizontal overflow, focus entry, Tab/Shift+Tab containment, Escape, submenu controls, inert/hidden closed state, and body-scroll restoration.
- Desktop header passed at 1280×720, 1366×768, 1440×900, and 1920×1080: document/body scroll width matched the viewport and the header Book CTA remained inside the visible nav at 1440px.
- Service and technology dialogs passed focus entry, focus containment, Escape/close behavior, background inerting, body-scroll lock, and trigger-focus return. Before/after ranges responded to Arrow keys and updated their accessible percentage output. Testimonial selection was manual with one active panel and selected tab at a time. Visible Contact form controls had names.
- Representative screenshots: `homepage-mobile-menu-390x844.png`, `homepage-desktop-1440x900.png`, `services-mobile-grid-390x844.png`, `services-mobile-dialog-390x844.png`, `contact-mobile-390x844.png`, and `pre-post-op-quietnite-gated-390x844.png`.

## Unresolved blockers and next-phase readiness

The final consumer-facing/legal brand and canonical domain, QuietNite protocol, dental laser devices/procedures, referral terms, current offers, hours, insurance/financing, form handler, analytics IDs, authentic media, clinical claims, review source/count, and launch URL/redirect architecture still require practice or specialist approval. The 11 missing local team/aesthetics image paths are also unresolved. Phase 1 is not production-ready until those inputs and the remaining migration/form/SEO work are completed.

## Phase 2 implementation status

Phase 2 is implemented in a dependency-free Node build that assembles ordinary static HTML. The source of truth is separated as follows:

- `the-house-of-dental-site/config/site.json` owns brand names, provisional canonical base URL, phone, address, hours, social URLs, appointment path, review-source placeholder, analytics placeholders, and legal-link gates. Unresolved values are explicit `null`/status records and are not silently emitted as claims.
- `the-house-of-dental-site/config/routes.json` owns the current eight routes, the generated 404 route, and planned service, resource, campaign, blog, and legal routes. Every registry entry declares title, description, canonical path, H1, indexability, social-image field, breadcrumb, page type, and approval status. Planned routes remain disabled.
- `the-house-of-dental-site/content/` contains page-only HTML fragments. `templates/` owns the document shell, skip link, desktop/mobile navigation, footer/NAP, breadcrumbs, and sticky actions. `data/services.json` and `data/technology.json` keep modal copy editable outside the build logic.
- `build/site.mjs` creates a clean `dist/` tree with static route files, shared assets, `robots.txt`, and `sitemap.xml`. It emits one route-specific metadata block, one WebPage node per page, and only the homepage practice/WebSite nodes; it does not repeat blanket Dentist schema or aggregate-rating claims.

## Phase 2 commands and verification

- `npm run build` — clean build of the deployable `dist/` artifact; generated files are never hand-edited.
- `npm run serve` — local static server for `dist/` at `http://127.0.0.1:4173/`.
- `npm test` — clean build plus structural tests for enabled routes, shared shell uniqueness, and explicit unresolved configuration.
- `npm run validate` — passed for 9 generated routes (8 current routes plus 404), unique metadata/H1s, canonical consistency, duplicate IDs, internal links, referenced assets, JSON-LD, source shell boundaries, and sitemap coverage. It reports the 11 previously documented missing team/aesthetics files as warnings.
- `npm run validate:strict` — failed as intended on those 11 documented pending assets; no missing non-allowlisted asset was hidden.
- Browser QA — all eight current routes returned HTTP 200; menu focus/scroll lock/submenu, dialog focus lifecycle and data-backed content, before/after Arrow-key updates, testimonial selection, payment estimator, form status/errors, and the eight-route console pass were re-run against the rebuilt output.
- Parity evidence — final generated captures are in `docs/evidence/phase-2/` at 390×844 and 1440×900 for homepage, Services, Contact, About, and Facial Aesthetics, with pre-refactor counterparts for visual comparison.

## Phase 2 blockers and Phase 3 readiness

The build system is ready for Phase 3 service-page authoring, but public publication is still gated by the existing practice, clinical, legal, content, asset, form, domain, analytics, and review-source approvals. The 11 missing local image files remain an explicit strict-validation blocker. QuietNite remains non-interactive and must not be promoted until its protocol conflict is resolved.

Phase 3 can safely add service pages at the architecture level: create an approved page fragment, add one registry entry, add approved assets/data, run the clean build and validators, then perform route, accessibility, clinical, and visual QA. For the local Phase 3 artifact, the confirmed core pages are enabled and indexable so crawlability and layout can be verified; no service page should be deployed, redirected, or treated as practice-approved until its exact copy, metadata, schema hooks, claims, and redirects have named approval.

## Phase 3 implementation status — 2026-08-04

Phase 3 is implemented locally and remains explicitly undeployed. The generated `dist/` artifact contains 23 static HTML routes: the prior eight routes, the generated 404 page, the Services overview, the All Services directory, and 13 core service pages. The sitemap contains 22 indexable routes; gated registry routes remain disabled and out of the sitemap.

### Implemented information architecture

- Services overview now has normal crawlable links, a provisional featured order from the audit, six patient-goal pathways, a visible Scaling & Root Planing pathway, an All Services directory link, and an explicit QuietNite/Sleep/Laser gate.
- All Services pairs plain-language and clinical labels and lists only the confirmed Phase 3 core catalog.
- The core catalog has static category/detail pages for Restorative Dentistry, Dental Implants, Same-Day Crowns, Dentures, Root Canal Therapy, Cosmetic Dentistry, Porcelain Veneers, Preventive Care, Periodontal Therapy / Scaling & Root Planing, Invisalign, Oral Surgery, Sedation Dentistry, and TMJ Evaluation & Treatment.
- Shared service-page rendering supplies static problem/goal copy, options, candidacy boundaries, consultation steps, expectations, comfort language, benefits, limitations/alternatives, care and maintenance, financing/insurance questions, visible FAQ answers, related services, local NAP/hours/directions, mapped CTAs, breadcrumbs, canonical/social metadata, WebPage/BreadcrumbList/Service JSON-LD, and pre/post-care links.
- `data/service-pages.json` is the editable content source; `build/site.mjs` emits ordinary HTML and route-specific schema. Essential service copy is not modal-only or JavaScript-only.

### Page status and release gates

| Status | Pages/topics | Current treatment |
|---|---|---|
| Complete locally; awaiting named approval | Services overview, All Services, and all 13 core service pages | Enabled/indexable in the local artifact for QA only; practice, clinical, compliance, redirect, and content approval remain open |
| Blocked; no Phase 3 public page | Laser Dentistry, QuietNite, Sleep & Snoring, Teeth Whitening, and the migration topics Onlays, Porcelain Crowns, Bridges, Bonding, Mouthguards, Pediatric/Adolescent Dentistry, and Bone Grafting | Disabled/noindex in the route registry or recorded as blocked in `docs/URL-INVENTORY.csv`; no new public claim added |
| Noindex draft | None created in Phase 3 | No useful unapproved draft was needed; blocked topics remain unlinked |

The current public service URLs and live-catalog topics are accounted for in `docs/URL-INVENTORY.csv`. Redirects are not configured or deployed. The canonical domain remains provisional, and the 11 pre-existing missing local team/aesthetics image files continue to block strict validation.

### Phase 3 verification

- `npm run build` — passed; 23 static HTML routes generated.
- `npm test` — passed; all four structural tests passed.
- `npm run validate` — passed for route metadata, canonical URLs, IDs, internal links, assets, JSON-LD, source boundaries, and sitemap coverage, with the 11 documented pending-asset warnings.
- `npm run validate:strict` — intentionally remained blocked at the Phase 3 snapshot; Phase 7 replaces the missing image requests with explicit text/media-optional states and the current strict check passes.
- Local Playwright route matrix — all 13 service pages returned 200 and passed title/H1, canonical, description/social metadata, breadcrumb, Service schema, visible FAQ, related-link, care-guide, CTA, static-copy, and local-destination checks.
- Responsive/accessibility QA — Services overview, All Services, and the service-detail template were checked at 320×568, 390×844, 768×1024, 1024×768, 1366×768, and 1920×1080 with no normal horizontal overflow. Skip-link focus, mobile menu entry/containment/Escape/return focus, submenu state, desktop first focus, and enlarged-text reflow were checked; visible content remained within 320px at 200% text size after the navigation/reflow fix.
- Evidence — 18 screenshots are saved in `docs/evidence/phase-3/`; the QA matrix records the exact filenames and results.

## Phase 4 implementation status — 2026-08-04

Phase 4 is implemented locally and intentionally undeployed.

### Public-surface changes

- Removed Facial Aesthetics from the public header/footer navigation, homepage service/technology cards, and homepage conversion path while the category remains unapproved.
- Removed the public QuietNite care section, QuietNite pending navigation label, aesthetic aftercare sections, and the combined-care-guide download. The aftercare page now links only to the remaining dental care guides.
- Removed unresolved aesthetic technology records from public technology data and removed the QuietNite appliance record from public service data.
- Kept planned `/services/sleep-snoring/`, `/services/laser-dentistry/`, and `/services/laser-dentistry/quietnite/` routes disabled. No public service schema, offer, CTA, sitemap entry, or internal link is generated for them.

### Internal draft structure

The local build includes nine noindex draft routes for review only: the existing Facial Aesthetics category draft, an internal draft hub, four candidate aesthetic treatment drafts, and separate Dental Laser, Sleep & Snoring, and QuietNite drafts. These pages are enabled only so the team can review structure locally; they are not in public navigation or the sitemap, and draft routes emit WebPage metadata rather than Service schema.

Drafts use image-optional layouts and explicit media slots. They do not claim an active offering, provider qualification, device/protocol, candidacy, outcome, recovery duration, or care instruction. Consultation buttons remain visibly blocked until the approval gates are answered.

### Quarantined clinical materials

The combined care guide and five unresolved aesthetic/QuietNite PDFs were moved out of `assets/care-pdfs/` into `quarantine/care-pdfs/`. They are recoverable but are not copied into `dist/`. The quarantine README records the clinical-owner and practice/compliance re-approval requirement.

### Release status

No deployment, redirect, external publication, or Sites handoff was performed. Remaining open gates are the exact Facial Aesthetics offerings/provider/claims/media, dental laser device/procedure/provider facts, Sleep/QuietNite protocol and physician relationship, and named clinical/compliance approval of any care-material replacement.

## Phase 5 implementation status — 2026-08-04

Phase 5 is implemented in the local static artifact and intentionally undeployed.

### Patient-support and conversion surface

- Added Patient Resources, New Patient Forms, Insurance & Financing, Special Offers, Urgent Dental Needs, Referral Program draft, policy placeholders, and appointment/offer status routes.
- Reworked New Patients and the homepage conversion panels to remove unapproved offer and emergency promises while preserving clear call/request paths.
- Added shared urgent callouts from service pages, a phone-first urgent route, and a branded 404 that returns local HTTP 404 status with phone and urgent links.
- Added a real footer link set for Privacy, Terms, and Accessibility; each placeholder is noindex and explicitly pending legal review.
- Added mobile sticky Call and Request Appointment actions with safe-area spacing and bottom-content clearance.

### Form behavior

The appointment form collects only the approved minimum field categories, avoids diagnosis/history prompts, warns against sensitive detail, labels required fields, exposes an error summary and live status, and handles invalid, unconfigured, network, server, retry, honeypot, duplicate, loading, and simulated adapter-success states. It has no approved production endpoint, does not claim a sent request in the local build, and does not emit patient fields to analytics. See `docs/evidence/phase-5/phase-5-integration-tests.md`.

### Verification and blockers

- `npm run build`, `npm test`, and normal validation pass; normal validation reports seven pre-existing missing About-team image warnings.
- The strict validator remained intentionally blocked by those seven practice assets at the Phase 4 snapshot; Phase 7 closes that generated-output gap without inventing media.
- Browser QA covers 320×568, 390×844, 412×915, 768×1024, and 1440×900 contact captures, menu Escape/focus, route/indexability states, form error states, and the branded 404. Evidence is in `docs/evidence/phase-5/`.
- Production remains blocked by the appointment handler/notification/security integration, secure forms destination, offers/referral/insurance/savings inputs, legal copy, and named approvals. No deployment was performed.

## Phase 6 implementation status — 2026-08-04

Phase 6 is implemented in the local static artifact and intentionally undeployed.

### Acquisition integration

- Rebuilt the homepage around a single static office-exterior hero with the audit direction “Advanced Dentistry, Designed Around You,” Winter Park location context, personalized care copy, appointment/phone CTAs, and no carousel.
- Added the maintainable trust strip, direct patient-goal pathways, provisional featured-care order, doctor credibility, manual patient-perspective tabs, benefit-led technology cards, neutral payment questions, location/hours/directions, and final appointment CTA.
- Added `the-house-of-dental-site/data/acquisition.json` as the source of truth for featured services, patient-goal paths, navigation labels, approval gates, and provisional-priority basis.
- Reworked the shared header/footer navigation to generate grouped Services links, New Patients, Patient Resources, About, Reviews, Contact, phone, and Request Appointment from that configuration. Facial Aesthetics, Laser/QuietNite, offers, and referral remain gated and absent from public acquisition surfaces.
- Updated the Services overview to consume the same featured-service and patient-goal configuration so acquisition order and direct destinations remain synchronized.
- Removed homepage/reviews hard-coded review totals and ratings; the public review CTA now uses a transparent review-source status state.
- Preserved mobile sticky Call + Request Appointment actions, accessible mobile accordions, manual testimonials, and accessible technology dialogs.
- Reduced hero height/padding and compacted the trust strip for short landscape tablet viewports so verified proof is visible above the sticky bar.

### Phase 6 verification and evidence

- `npm test` — passed all five tests, including the Phase 6 acquisition/gating regression test.
- `npm run validate` — passed all 42 routes with seven known About-team pending-asset warnings at the Phase 6 snapshot; Phase 7 removes those requests and the current normal and strict checks pass.
- Local browser QA passed the 12 required viewports, 63 homepage same-origin links across 22 unique routes, all same-origin fragments, phone/directions/appointment destinations, mobile menu focus/Escape, desktop Services dropdown, sticky actions, manual testimonials, and technology dialog lifecycle.
- Evidence is saved under `docs/evidence/phase-6/`; the release gate and still-provisional priorities are recorded in `phase-6-release-gate.md` and `docs/PRACTICE-DECISIONS.md`.

### Remaining gates

Practice priority inputs, Facial Aesthetics approval, dental laser facts, Sleep/QuietNite protocol, review-source ownership, appointment integration, offers/referral terms, legal copy, hours, authentic team assets, and named clinical/compliance approvals remain unresolved. No deployment was performed.

## Phase 7 — credibility, anxiety reduction, and existing-patient support

**Status:** Implemented and verified locally; production release blocked on practice inputs; no deployment performed.
**Date:** 2026-08-05

### Implemented

- Added a dedicated, noindex Dr. Mainak Patel provider-review draft and kept the public About provider proof explicitly pending approval.
- Removed remote doctor, consultation, team, and technology image requests. Team cards now use consistent initials/text states, and the office exterior uses local wide/mobile variants.
- Added `docs/AUTHENTIC-MEDIA-MANIFEST.csv` for all required practice-owned media, including consent, crops, alt intent, and owner fields.
- Replaced review excerpts, stale counts, and ratings with a transparent source-status state. No patient statement or review schema is fabricated.
- Added a dedicated Technology page with only the retained CEREC context and patient-benefit framing. Digital planning/imaging, Emage, DEKA, and dental laser are visibly held for confirmation and remain separated by dental versus Facial Aesthetics category.
- Added `data/care-guides.json` with explicit `lastReviewed` and `clinicalOwner` fields. All eight values remain null until clinical input.
- Preserved the eight local dental care PDFs and matching HTML instructions. Added search, category filters, sticky treatment index, direct fragments, button accordions, print restoration, urgent warning routing, and local PDF download links. Complete-care-guide and QuietNite materials remain quarantined.
- Added a no-JS reveal fallback so page meaning and care content remain visible when the interaction script is unavailable.
- Added Phase 7 regression tests and strict generated-output checks for empty/remote image references and absent team/aesthetics requests.

### Verification and evidence

- `npm run build` — passed; 44 static routes, 25 indexable sitemap routes.
- `npm run validate` — passed.
- `npm run validate:strict` — passed with zero pending-asset warnings.
- `npm test` — passed all six tests.
- Browser QA: seven review routes at 390×844, 768×1024, and 1440×900; no horizontal overflow, main/H1 present, zero console errors, and 25 screenshots saved in `docs/evidence/phase-7/` (21 full-page plus four focused mobile captures).
- Care-guide search, filter, direct fragment, click/keyboard accordion, print-after-filter, no-JS source, urgent callout, and PDF link checks are recorded in `docs/evidence/phase-7/phase-7-care-guides.json`.
- PDF parsing, page counts, first-page renders, and held downloads are recorded in `docs/evidence/phase-7/phase-7-pdf-review.json`.

### Remaining practice inputs

The release gate still requires named provider/clinical approval, review source/update ownership and consent, clinical owners/dates for each guide, the exact QuietNite protocol, confirmed technology workflows, and practice-owned rights-cleared media. The complete list is in `docs/evidence/phase-7/phase-7-release-gate.md`.

## Phase 8 — SEO-safe replacement and migration package

**Status:** Implemented locally and verification-ready; production release remains blocked.
**Date:** 2026-08-05

### Implemented

- Switched the generated metadata/schema/social baseline to the current public `winterparkdental.com` domain and marked it explicitly provisional/blocked pending the practice/legal domain decision.
- Propagated the current observed email and hours into config, footer, contact content, NAP/schema, migration inventory, and launch documentation while retaining practice-confirmation gates.
- Added page-level OG/Twitter fields, a shared local social image, one coherent homepage practice graph, linked provider Person data, service Service/visible FAQPage data, breadcrumbs, and review-schema guardrails.
- Added `the-house-of-dental-site/config/redirects.json` and generated `dist/_redirects` with 24 candidate one-hop 301s. No deployment or host configuration change was made.
- Replaced the URL inventory with the required nine-field migration table covering current navigation, service, provider/technology, new-patient, legal, blog/category/article, sitemap, and robots decisions. Current sitemap/blog completeness is explicitly held where a production crawl is unavailable.
- Added the 22-entry blog manifest, blog index/article source templates, and `docs/BLOG-PUBLISHING.md`; no author, medical-review, update-date, or article equivalence was invented.
- Added `docs/SEO-LAUNCH-CHECKLIST.md` and current-site evidence under `docs/evidence/phase-8/`.
- Added `scripts/validate-phase-8.mjs` and the Phase 8 regression test.
- Sequential verification passed: `npm run build`, `npm run validate`, `npm run validate:phase8`, `npm run validate:strict`, and `npm test` (seven tests). The local preview returned HTTP 200 for `/` and HTTP 404 for an unknown path.

### Remaining blockers

- Practice/legal final domain and brand relationship.
- Production crawl/export of the current sitemap and all URLs, including orphan and blog/category/article URLs.
- Analytics/Search Console access for URL and blog prioritization.
- Practice, clinical, legal, media-rights, form/integration, GBP, review-source, and hours approvals already recorded in earlier phase gates.

No deployment, DNS change, Search Console submission, Change of Address, or live redirect change was performed.

## Phase 9 — privacy-aware measurement and marketing-agency readiness

**Status:** Implemented locally; nonessential integrations and public campaign release remain blocked.
**Date:** 2026-08-05

### Implemented

- Added `data/measurement.json` as the vendor-neutral event source of truth with the requested named events, diagnostic form states, exact allowed fields, session-only attribution, debug behavior, and prohibited payload keys.
- Added a reusable campaign-page template and nine governed campaign records for implants, same-day crowns, facial aesthetics, Invisalign, QuietNite, Laser Dentistry, Emergency Dentistry, New Patient Offer, and Referral Program.
- Added campaign registry routes that render locally as `noindex, nofollow`, stay out of the sitemap and public/indexable links, and canonicalize only where an explicit durable service target is named.
- Added safe event attributes to phone, appointment, directions, financing, service, emergency, and form surfaces. No free-text form value is read by the event layer.
- Made form-start diagnostic tracking and named success events conditional on confirmed backend success. Offer/referral/aesthetics/QuietNite success or inquiry paths remain reserved or blocked until their approvals and destinations exist.
- Added `docs/MEASUREMENT-EVENT-VALIDATION.md` and `docs/MARKETING-OPERATIONS.md` with contract, privacy, ownership, access, brief, approval, release, rollback, reporting, incident, and dashboard requirements.
- Added `scripts/validate-phase-9.mjs`, `npm run validate:phase9`, generated contract/indexability evidence, and the Phase 9 release gate.

### Integration status — live versus placeholder

| Integration | Local state | Live? |
|---|---|---|
| GA4 | `measurementId: null`; no script or network call | No |
| Tag manager | `containerId: null`; no script or network call | No |
| Call tracking | Vendor/number `null`; canonical static NAP phone retained | No |
| CRM/practice-management attribution | Provider/endpoint `null`; mapping gate false | No |
| Consent platform | Vendor `null`; required decision `null`; nonessential categories disabled | No |
| Ad pixels/session recording/call recording | No configuration or generated scripts | No |
| Appointment/contact handler | Handler URL/provider `null`; local truthful unconfigured/error states | No |

The local debug buffer is not a live marketing integration. It is available only with `hod_debug=1` or `hod_debug=true`, remains in the current browser session, and performs no external request.

### Verification

- `npm run build` — passed; 53 enabled static HTML routes generated and 25 indexable URLs emitted.
- `npm test` — passed after the Phase 9 changes.
- `npm run validate` — passed; Phase 8 validation continues to honor campaign canonical targets.
- `npm run validate:phase8` — passed; campaign variants remain outside sitemap/indexable counts.
- `npm run validate:phase9` — passed; nine campaign variants, event contract, privacy gates, and generated vendor surface checked.
- Browser QA evidence is recorded under `docs/evidence/phase-9/`; the final local matrix covers campaign indexability, debug events, form lifecycle, payload keys, network surface, responsive layout, and keyboard/focus states.

### Remaining blockers

- Final practice/legal brand and domain decision, NAP/hours/map confirmation, and named public campaign approvals.
- Phase 4 clinical/provider/protocol/media approvals for Facial Aesthetics, dental Laser Dentistry, and QuietNite.
- Phase 5 offer/referral terms, consent, secure backend, anti-abuse controls, expiry owner, and disclosures.
- Approved form destination, server-side validation, spam/rate controls, notifications, retention, SLA, and live success/failure testing.
- Optional analytics, tag manager, call-tracking, CRM, and consent vendor decisions with named owners, access, privacy review, and event mapping.
- Production crawl/Search Console/GBP access and final SEO/cutover evidence.

No deployment, vendor registration, external data submission, DNS change, Search Console action, or ad campaign activation was performed.

## Phase 10 verification and hardening status — 2026-08-05

Phase 10 is implemented and fully rebuilt locally. The candidate remains **NO-GO** and undeployed because the named external approval, form, analytics, domain/NAP, legal, clinical, media, and migration gates remain open.

### Implemented

- Replaced the flat Services navigation with the recommended patient-goal hierarchy and shared it across desktop mega navigation, mobile accordions, and the human sitemap.
- Expanded New Patients, Patient Resources, About, and the footer to the approved/gated hierarchy without exposing blocked Facial Aesthetics, Sleep, Laser, QuietNite, referral, blog, or campaign claims.
- Added `/sitemap/`, responsive local AVIF/WebP hero sources, build-time CSS minification, deferred JavaScript, zero external font requests, explicit performance budgets, and query-gated local lab diagnostics.
- Fixed hidden form retry rendering, mobile open-menu/sticky-action overlap, control target sizing, hero contrast, and removed unverified technology “coming soon” language.
- Added `scripts/validate-phase-10.mjs`, nine Phase 10 regression assertions, and the six required Phase 10 reports.

### Final local verification

- Clean build: 54 routes, 26 indexable routes, no manual `dist/` edits required.
- Tests/validators: 9/9 tests passed; normal, strict, Phase 8, and Phase 9 validators passed; Phase 10 reports only the explicit blocked migration inventory and eight external launch gates.
- Responsive browser QA: 108 checks across nine representative routes and all 12 required sizes, 0 failures; 54 route captures at 390×844 had no failed image or document overflow.
- Interaction QA: mobile menu/submenu/Escape/focus return, technology dialog lifecycle, care search/filter/accordion, form validation, and unconfigured form failure passed.
- Local HTTP: home 200, sitemap 200, unknown route 404.
- Performance: all eight mobile/desktop local lab runs had CLS 0, no third-party requests, and budgets passed; see `docs/PERFORMANCE-REPORT.md`.

The authoritative Phase 10 verdict and owner table are in `docs/LAUNCH-READINESS.md`. No deployment, redirect activation, vendor installation, external form submission, DNS change, or Search Console action was performed.
