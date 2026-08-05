# Phase 1 + Phase 2 QA Matrix

## Repeatable validation

Run from the project root:

```text
node scripts/validate-static-site.mjs
```

The validator checks the generated routes for internal links, missing local assets, duplicate IDs, unique titles/descriptions/H1s, canonical consistency, JSON-LD parsing, sitemap coverage, one title, one H1, and a skip link targeting `#main-content`. It is intentionally lightweight and does not replace browser, screen-reader, clinical, form, or production QA.

## Route coverage

| Route | Rendered page | Main interactions | Target |
|---|---|---|---|
| `index.html` | Homepage | Mobile menu, testimonials, technology modal, before/after controls, CTAs | Required |
| `services.html` | Services overview | Mobile menu, service grid, service dialog, hash deep links | Required |
| `contact.html` | Appointment/contact | Mobile menu, form focus/validation, tel/maps links | Required |
| `about.html` | Doctor/team/technology | Mobile menu, technology dialog | Required |
| `facial-aesthetics.html` | Aesthetics treatments | Mobile menu, anchor navigation, treatment CTAs | Required |
| `new-patients.html` | New patients/payment | Mobile menu, Cherry range estimator | Required |
| `reviews.html` | Reviews | Mobile menu, review links | Required |
| `pre-post-op.html` | Care instructions | Mobile menu, care navigation, PDF links, QuietNite gate | Required |

## Responsive matrix

| Viewport | Mobile menu | Horizontal overflow | Header/CTA clipping | Status |
|---:|---|---|---|---|
| 320×568 | Pass | None | Not applicable | Local browser QA |
| 390×844 | Pass | None | Not applicable | Local browser QA |
| 768×1024 | Pass | None | Not applicable | Local browser QA |
| 820×1180 | Pass | None | Not applicable | Local browser QA |
| 1024×768 | Pass | None | Not applicable | Local browser QA |
| 1280×720 | Desktop nav | None | No clipping | Local browser QA |
| 1366×768 | Desktop nav | None | No clipping | Local browser QA |
| 1440×900 | Desktop nav | None | No Book CTA clipping | Local browser QA |
| 1920×1080 | Desktop nav | None | No clipping | Local browser QA |

## Keyboard and interaction checks

- Skip link becomes visible on focus and moves focus to `#main-content` on every route.
- Burger exposes `aria-expanded`, `aria-controls`, and Open/Close menu labels.
- Menu focus enters the first menu control, wraps with Tab/Shift+Tab, closes on Escape, and returns focus to the burger.
- Top-level links navigate; separate submenu buttons expose and toggle submenu state.
- Closing a menu link restores body scrolling and removes the open state.
- Services dialog moves focus to its close control, traps focus, closes by close/backdrop/Escape, makes the background inert, scrolls on short viewports, and returns focus to the exact card trigger.
- Technology dialogs receive the same focus lifecycle where present.
- Before/after ranges expose a current percentage, support Arrow keys/Home/End, and preserve pointer/touch dragging.
- Testimonial controls are manual, expose the active item, and do not auto-rotate; reduced motion disables reveal transitions/parallax.
- Contact fields have visible focus indicators and native required/type validation.
- Browser console errors/warnings were absent across the eight-route pass. The static validator still reports 11 known missing local team/aesthetics image paths; these are recorded as asset blockers rather than hidden.

## Evidence filenames

Representative screenshots are saved under `docs/evidence/phase-1/`: `homepage-mobile-menu-390x844.png`, `homepage-desktop-1440x900.png`, `services-mobile-grid-390x844.png`, `services-mobile-dialog-390x844.png`, `contact-mobile-390x844.png`, and `pre-post-op-quietnite-gated-390x844.png`. Screenshots are evidence, not a production sign-off; screen-reader, device safe-area, clinical, form-delivery, SEO, and launch QA remain follow-up work.

## Phase 2 generated-output QA

| Check | Result | Evidence/command |
|---|---|---|
| Clean static generation | Pass; 9 HTML outputs generated (8 current routes plus 404), with `dist/` recreated by the build | `npm run build` |
| Structural regression | Pass; enabled routes, shared shell uniqueness, and explicit unresolved config checks | `npm test` |
| Normal validation | Pass with 11 documented warnings for the pre-existing missing team/aesthetics assets | `npm run validate` |
| Strict asset validation | Fails intentionally on the same 11 pending assets | `npm run validate:strict` |
| Current route HTTP coverage | Pass; `index.html`, `services.html`, `facial-aesthetics.html`, `new-patients.html`, `about.html`, `reviews.html`, `contact.html`, and `pre-post-op.html` each returned 200 from the local server | Local HTTP route pass |
| View-source/crawlability | Pass; generated pages contain title, description, canonical, H1, internal links, static page text, skip link, and JSON-LD without requiring JavaScript | Generated `dist/*.html`; validator |
| Phase 1 menu/focus/dialog checks | Pass; full-viewport mobile menu, focus entry/return, scroll lock, submenu state, service/technology dialog lifecycle, and Escape close behavior | Local Playwright pass |
| Slider/testimonial/form checks | Pass; Arrow-key percentage output, manual testimonial state, Cherry estimator updates, and contact validation/status region | Local Playwright pass |
| Console/link checks | Pass; no browser console errors across the eight-route pass and no broken non-pending internal targets | Local Playwright pass; `npm run validate` |
| Responsive parity | Captured at 390×844 and 1440×900 for homepage, Services, Contact, About, and Facial Aesthetics against pre-refactor screenshots | `docs/evidence/phase-2/` |

Phase 2 remains local-only. The strict asset failure and the content/practice/legal/clinical blockers in the approval register must be resolved before a production release.

## Phase 3 QA matrix — 2026-08-04

### Generated route coverage

| Route group | Coverage | Result |
|---|---|---|
| Services overview | `/services.html` with featured normal links, six goal pathways, visible SRP, All Services link, and QuietNite/Sleep/Laser gate | Pass locally |
| All Services directory | `/services/all-services/` with plain-language and clinical labels for the confirmed core catalog | Pass locally |
| Service-detail template | 13 routes: Restorative Dentistry, Dental Implants, Same-Day Crowns, Dentures, Root Canal Therapy, Cosmetic Dentistry, Porcelain Veneers, Preventive Care, Periodontal Therapy/SRP, Invisalign, Oral Surgery, Sedation Dentistry, TMJ Evaluation & Treatment | Pass locally |
| Blocked routes/topics | Sleep & Snoring, Laser Dentistry, QuietNite, Teeth Whitening, and unconfirmed live-site topics | No public Phase 3 page; blocked/noindex or inventory-only |

The 13-page Playwright matrix returned HTTP 200 for every route. Each page had one H1 with Winter Park context, unique title/description/canonical/social metadata, a breadcrumb, valid page-level `Service` JSON-LD, four visible FAQ answers, related services, a care-guide link, the mapped CTA text, static body copy, and zero broken local destinations.

### Required responsive evidence

| Template | 320×568 | 390×844 | 768×1024 | 1024×768 | 1366×768 | 1920×1080 |
|---|---|---|---|---|---|---|
| Services overview | Pass | Pass | Pass | Pass | Pass | Pass |
| All Services directory | Pass | Pass | Pass | Pass | Pass | Pass |
| Service detail — Dental Implants representative | Pass | Pass | Pass | Pass | Pass | Pass |

All 18 viewport captures are in `docs/evidence/phase-3/`:

- `services-overview-{320x568,390x844,768x1024,1024x768,1366x768,1920x1080}.png`
- `all-services-{320x568,390x844,768x1024,1024x768,1366x768,1920x1080}.png`
- `service-detail-dental-implants-{320x568,390x844,768x1024,1024x768,1366x768,1920x1080}.png`

Normal viewport checks found no horizontal overflow and all H1/main/template regions were visible. At 320px with 200% enlarged text, visible page content also reflowed without overflow after the off-canvas menu, grid min-width, eyebrow, All Services callout, and mobile-action fixes.

### Keyboard, focus, and destination checks

- Skip-link first focus was `#main-content` on the desktop representative and mobile overview.
- The mobile menu opened with `aria-expanded="true"`, moved focus into the menu, exposed submenu buttons, toggled submenu state by keyboard, closed on Escape, restored `aria-hidden="true"`, and returned focus to the burger.
- Desktop first focus remained the skip link; the representative service page exposed normal on-page and related links.
- Service CTA labels matched the map, including phone-first root-canal pain actions and the Same-Day Crowns Explore/Request pair. Local CTA, breadcrumb, related, guide, and page links returned below-400 statuses in the route matrix.
- Service pages contain no `SERVICE_PAGE_CONTENT`, modal-only service data, or `data-service-data` requirement; essential service copy is present in generated HTML.

### Build and release checks

| Check | Result | Evidence/command |
|---|---|---|
| Clean generation | Pass; 23 static HTML routes, 22 indexable sitemap routes | `npm run build` |
| Structural tests | Pass; all four tests | `npm test` |
| Normal static validation | Pass with 11 documented pre-existing missing team/aesthetics asset warnings | `npm run validate` |
| Strict asset validation | Blocked intentionally by the same 11 pending assets; no new Phase 3 asset failure | `npm run validate:strict` |
| Live public migration accounting | Pass; current public service URLs plus absent topics are recorded in `docs/URL-INVENTORY.csv` | URL inventory review; [current Winter Park Dental service catalog](https://winterparkdental.com/dental-services/) used only as migration reference |
| Deployment | Not run by instruction | Local-only handoff |

## Phase 4 verification matrix — 2026-08-04

| Scope | Required check | Evidence target | Status |
|---|---|---|---|
| Public changed pages | Build and inspect homepage, Services, All Services, About, Pre & Post Treatment Care, Facial Aesthetics draft, header/footer, and generated sitemap at mobile/tablet/desktop | `phase-4-browser-qa.json` plus `home-*`, `services-*`, `all-services-*`, `about-*`, `pre-post-op-*`, and `facial-aesthetics-*` captures | Pass; 42 captures, all HTTP 200, no overflow; About has seven known pre-existing team-photo warnings |
| Internal drafts | Inspect the hub, category, four aesthetic treatment drafts, Laser, Sleep & Snoring, and QuietNite at mobile/tablet/desktop | `phase-4-browser-qa.json` plus `phase-4-drafts-{mobile,tablet,desktop}.png` and `draft-*-{mobile,tablet,desktop}.png` captures | Pass; all draft captures have visible H1/main and readable media slots |
| Claims | Line-by-line scan indexable output for QuietNite/Sleep/Laser/aesthetic offer, mechanism, outcome, credential, recovery, and care claims; confirm draft-only claims are noindex and gated | `phase-4-claims-scan.json` | Pass; no unresolved clinical claim in indexable output |
| Navigation/indexability | Confirm no blocked topic is in public nav, service card, offer, schema, metadata, sitemap, or public internal link; confirm draft URLs are absent from sitemap | `phase-4-public-surface.json` | Pass; 21 indexable routes and nine noindex drafts |
| Assets | Request every image/PDF URL in changed pages; confirm no 404, empty frame, stock/AI fallback, or quarantined PDF is public | `phase-4-asset-checks.json` | Pass for Phase 4; strict validation remains blocked by seven known About team-photo gaps |
| Keyboard/accessibility | Verify skip link, mobile menu, draft links, FAQ/content focus, disabled CTA presentation, visible focus, and no horizontal overflow at checked viewports | `phase-4-accessibility.json` | Pass; menu/submenu/escape and CTA focus verified |
| Release gate | Do not deploy; report unresolved practice/clinical/compliance inputs | `phase-4-release-gate.md` | Complete; local-only handoff |

## Phase 5 QA matrix — 2026-08-04

| Scope | Check | Result | Evidence |
|---|---|---|---|
| Appointment form | Empty submit, field associations, visible summary, seven required fields | Pass; seven invalid fields and seven focusable summary items | `phase-5-browser-qa.json` |
| Appointment form | Unconfigured, network, server rejection, retry, duplicate, and simulated adapter success | Pass; no false success; live production handler remains blocked | `phase-5-integration-tests.md` |
| Privacy/data | No unverified `data-netlify`, no patient fields in safe analytics hooks, no diagnosis/history prompt | Pass locally; server-side controls await approved integration | `phase-5-integration-tests.md` |
| Responsive contact | 320×568, 390×844, 412×915, 768×1024, 1440×900 | Pass; no horizontal overflow and sticky actions present | `contact-*.png`, `phase-5-browser-qa.json` |
| Mobile navigation | Open state, focus entry, Escape close, focus return, no overflow | Pass at 390×844 | `phase-5-browser-qa.json` |
| Patient support routes | Resources, forms, insurance/financing, offers, urgent path, legal placeholders, confirmation routes | Pass; expected 200 responses and indexability states | `phase-5-browser-qa.json` |
| Offers/referral | No unapproved public terms, no referral inbound link, no reward eligibility claim | Pass; referral is unlinked/noindex and offers are neutral | `phase-5-release-gate.md` |
| Urgent routing | Phone-first, 911/ER distinction, no diagnosis/same-day promise | Pass locally; practice routing/hours still pending | `urgent-dental-needs-390x844.png` |
| 404 | Missing route returns HTTP 404 and branded page with Home, Services, Contact, phone, urgent path | Pass | `404-390x844.png`, `phase-5-browser-qa.json` |
| Assets | Normal and strict validation | Normal pass with seven known About-team warnings; strict remains blocked by those warnings | `npm run validate`, `npm run validate:strict` |
| Release gate | Do not deploy until integration/legal/practice blockers resolve | Complete as local-only handoff | `phase-5-release-gate.md` |

## Phase 6 acquisition QA matrix — 2026-08-04

| Scope | Check | Result | Evidence |
|---|---|---|---|
| Five-second comprehension | 390×844 and 1440×900 static hero review | Pass; practice, Winter Park location, care categories, next action, and premium office imagery are immediately legible | `home-390x844.png`, `home-1440x900.png` |
| Required responsive matrix | 320×568, 360×800, 375×812, 390×844, 412×915, 768×1024, 820×1180, 1024×768, 1280×720, 1366×768, 1440×900, 1920×1080 | Pass; document scroll width matches viewport, actual horizontal scroll remains 0, headers are not clipped, CTAs fit, and mobile sticky actions are present | `phase-6-browser-qa.json`, `home-*.png` |
| Short tablet hierarchy | 1024×768 hero/trust/sticky relationship | Pass; all four verified trust values clear the sticky bar after height-specific refinement | `home-1024x768.png`, `phase-6-browser-qa.json` |
| Global desktop nav | Services, New Patients, Patient Resources, About, Reviews, Contact, phone, Request Appointment at 1440px | Pass; no 1440px clipping; Services dropdown is grouped rather than a wall of equal links | `desktop-services-dropdown-1440x900.png` |
| Global mobile nav | Call and Request Appointment first; Services/Resources accordions; no hidden/unreachable links | Pass; menu focus entry, submenu state, Escape close, and focus return verified | `mobile-menu-390x844.png`, `phase-6-integration-tests.md` |
| Homepage pathways | Featured services and six enabled patient goals | Pass; every enabled item leads to a real route; Services overview consumes the same configuration | `phase-6-browser-qa.json`, `services-390x844.png`, `services-1440x900.png` |
| Sticky actions | Mobile Call and Request Appointment | Pass; `tel:+14076781400` and `/contact.html#book` verified without submitting the form | `phase-6-browser-qa.json` |
| Directions | Homepage directions link | Pass; maintained Google Maps target verified | `phase-6-browser-qa.json` |
| Keyboard/screen reader structure | Skip link, banner/nav labels, menu aria-expanded, accordion buttons, tabs, dialog lifecycle | Pass locally; accessible snapshot and Escape/focus checks completed | `phase-6-integration-tests.md` |
| Trust/claims | No hard-coded review total/rating, unapproved offer, referral, Facial Aesthetics, Laser, QuietNite, Sleep Better, or fabricated credential on homepage/nav | Pass; homepage and indexable-output scans are clean | `phase-6-browser-qa.json`, Phase 6 regression test |
| Carousel guardrail | Static focused hero and manual testimonials only | Pass; no carousel/autoplay/auto-rotation or `setInterval` behavior | Phase 6 regression test |
| Release gate | Do not deploy; record provisional service order and open approvals | Complete as local-only handoff | `phase-6-release-gate.md`, `docs/PRACTICE-DECISIONS.md` |

## Phase 7 credibility, care, and media QA matrix — 2026-08-05

| Scope | Check | Result | Evidence |
|---|---|---|---|
| Trust media | Generated HTML/CSS has no remote image, stock CDN image, empty image source, or absent team/aesthetics request | Pass; strict validation and output scan are clean | `phase-7-asset-checks.json`, `npm run validate:strict` |
| Responsive proof | About, provider draft, Reviews, Technology, Facial Aesthetics, homepage trust sections, and Pre/Post-Op at 390×844, 768×1024, 1440×900 | Pass; 21 full-page screenshots plus four focused mobile captures, no horizontal overflow, H1/main present | `phase-7-browser-qa.json`, `*-{mobile,tablet,desktop}.png` |
| Provider/team | About uses pending provider approval and initials/text portrait fallbacks; dedicated provider page is noindex | Pass with practice approval gate | `about-*.png`, `provider-*.png`, `phase-7-release-gate.md` |
| Reviews | No hard-coded count/rating, manual excerpt, fabricated statement, automatic motion, or aggregate review schema | Pass; source-status register is visible | `reviews-*.png`, Phase 7 regression test |
| Technology | CEREC is the only confirmed public context; dental versus Facial Aesthetics gates are separated; unconfirmed devices stay held | Pass with clinical/practice gate | `technology-*.png`, `phase-7-release-gate.md` |
| Care findability | Search for swelling, category filter, sticky treatment index, direct `#implants` fragment | Pass; 4 search results and 1 combined restorative result observed | `phase-7-care-guides.json` |
| Care controls | Buttons expose `aria-expanded` and `aria-controls`; panels use labelled regions; click and keyboard Enter work | Pass | `phase-7-care-guides.json` |
| Care print/download | Filtering does not remove content from print; eight local PDF links resolve; held PDFs are not public | Pass | `phase-7-care-guides.json`, `phase-7-pdf-review.json` |
| Care clinical metadata | Eight guides have `lastReviewed` and `clinicalOwner` fields, all empty rather than invented | Pass with clinical owner gate | `data/care-guides.json`, `phase-7-care-guides.json` |
| Urgent routing | Prominent non-diagnostic callout includes breathing/swallowing 911/ER direction and office/urgent links | Pass locally; hours/clinical wording still needs approval | `pre-post-op-*.png`, `phase-7-care-guides.json` |
| No-JS behavior | Source care panels are not initially hidden; no-js CSS fallback keeps reveal content visible; PDF links are ordinary anchors | Pass by source check | `phase-7-care-guides.json` |
| Runtime | Browser console and local request review | Pass; zero console errors and zero external image requests | `phase-7-browser-qa.json` |
| Release gate | Do not deploy until practice inputs, media rights, clinical review, and named ownership are complete | Complete as local-only handoff | `phase-7-release-gate.md`, `docs/AUTHENTIC-MEDIA-MANIFEST.csv` |
