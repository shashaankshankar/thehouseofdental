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
- `npm run validate:strict` — intentionally remains blocked by those same 11 missing team/aesthetics assets; no new Phase 3 asset warning was introduced.
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
- The strict validator remains intentionally blocked by those seven practice assets.
- Browser QA covers 320×568, 390×844, 412×915, 768×1024, and 1440×900 contact captures, menu Escape/focus, route/indexability states, form error states, and the branded 404. Evidence is in `docs/evidence/phase-5/`.
- Production remains blocked by the appointment handler/notification/security integration, secure forms destination, offers/referral/insurance/savings inputs, legal copy, and named approvals. No deployment was performed.
