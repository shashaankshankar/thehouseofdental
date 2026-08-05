# Content and Asset Approval Register

Phase 1 does not invent or silently approve practice facts. The following items need named practice, clinical, compliance, legal, or marketing owners before public launch.

| Content area | What requires approval | Current treatment | Owner/status |
|---|---|---|---|
| Brand/domain/NAP | Consumer-facing name, legal relationship, canonical domain, phone, address, hours, email | Existing local content retained; no new identity claims | Practice/legal — pending |
| QuietNite and sleep care | Device/protocol, laser requirement, diagnosis/referral boundary, provider, follow-up, alternatives, care instructions | Services card is gated; existing clinical copy is not rewritten | Clinical/practice/compliance — blocker |
| Dental laser | Device(s), dental procedures, provider training, indications, limitations, aftercare | No new dental Laser Dentistry content added | Clinical/practice — pending |
| Facial Aesthetics | Providers, qualifications, candidacy, contraindications, downtime, outcomes, claims such as skin-type suitability | Existing copy retained for review; missing local images remain | Clinical/compliance/practice — pending |
| Services catalog | Active procedures, removed/de-emphasized services, priority order, scope of oral surgery/sleep care | Existing cards retained except QuietNite gate and SRP placement | Practice/clinical — pending |
| Offers | Current implant/new-patient offers, eligibility, inclusions, price, expiry, restrictions, disclosure owner | Existing displayed offer retained for review; no new terms | Practice/compliance — pending |
| Referral program | Eligibility, benefit/reward, qualifying visit, caps, expiry, consent model, disclosure | Not added in Phase 1 | Practice/compliance/legal — pending |
| Insurance/financing/savings plan | Current carriers, lenders, terms, rates, exclusions, estimates, renewal/cancellation rules | Existing page content retained for review | Practice/finance/compliance — pending |
| Reviews | Current rating/count, source URL, timestamp, testimonial consent | No rating, count, excerpt, or review schema is exposed; the source-status state remains | Practice/marketing/compliance — pending |
| Provider/team | Credentials, memberships, roles, bios, team names, authentic portraits, usage rights, alt descriptions | Bios retained with provider approval state and initials/text fallbacks; absent image files are not referenced | Practice/clinical/asset owner — pending |
| Before/after cases | Patient consent, allowed placements, paid-ad rights, case labels | Existing imagery retained for functional QA only | Practice/compliance — pending |
| Appointment form | Destination system, data processing, notifications, failure alerts, spam controls, response SLA, privacy notice, urgent routing | Existing form behavior retained; delivery is not claimed verified | Technical/practice/legal — blocker |
| Analytics/call tracking | Account IDs, events, consent, data minimization, call recording/transcription notices, ownership | No tracking IDs added | Marketing/technical/privacy — pending |
| Legal/accessibility | Reviewed Privacy, Terms, Accessibility pages and consent language | Footer labels remain a launch follow-up outside Phase 1 | Legal/compliance — pending |
| Care guides | Clinical accuracy, last-reviewed date, owner, medication/recovery language, emergency callouts | Eight local dental guides retained with metadata fields pending; combined guide and QuietNite remain quarantined | Clinical owner — pending |

## Approval rule

An item remains pending until the practice supplies the source of truth and a named reviewer approves the exact public wording or asset. A URL, offer, treatment, or clinical claim should not be promoted to a conversion path based only on a local placeholder, a third-party image, or the audit's provisional recommendation.

## Phase 2 source and release register

| Phase 2 artifact | Current treatment | Approval/status |
|---|---|---|
| `config/site.json` | Centralizes the retained NAP/phone/map/social values and explicitly marks provisional or unresolved fields | Practice/legal/technical review pending before launch |
| `config/routes.json` | Registers 8 current routes, 404, and planned service/resource/campaign/blog/legal routes with per-route metadata and approval status | Current routes retained for review; planned routes disabled |
| Shared templates and components | Header, mobile/desktop nav, skip link, footer/NAP, breadcrumbs, sticky actions, metadata/schema hooks, and accessible pattern examples are single-source | Architecture approved for local Phase 2; visual and content signoff still pending |
| `data/services.json` and `data/technology.json` | Makes existing modal copy editable outside the build script while preserving Phase 1 visible copy | Existing content retained; clinical/practice approval remains pending |
| Generated `dist/` | Clean static artifact with ordinary HTML, robots, sitemap, and copied assets | Local verification only; no deployment performed |
| Phase 2 evidence | Pre-refactor and generated screenshots at 390×844 and 1440×900 for five required routes | Evidence supports parity review; not a launch approval |
| Validation | Normal validation passes with 11 documented pending-asset warnings; strict mode fails on those unresolved assets | Asset owner must supply/approve authentic files before strict release |

Phase 3 service-page enablement remains contingent on approved service copy, claim boundaries, provider/credential evidence where used, image rights and alt text, metadata, schema, links, redirects, and named practice/clinical/compliance approval. The build system is ready; public claims are not pre-approved by the registry placeholders.

## Phase 3 service-page release register — 2026-08-04

| Area | Local implementation | Approval still required |
|---|---|---|
| Core service catalog | 13 static pages plus the All Services directory are generated and indexable in the local artifact for QA | Named practice confirmation that each service is actively offered, its final priority/category, and its exact scope |
| Clinical copy | Patient-safe, consultation-led copy includes candidacy boundaries, limitations, alternatives, care guidance, visible FAQs, and no universal outcome/timeline/coverage promises | Clinical review of the exact wording, care-guide references, urgent-routing language, and provider/referral boundaries |
| Technology/provider proof | Only the confirmed CEREC context is retained on Same-Day Crowns; no new provider credentials or unsupported devices are claimed | Practice/clinical evidence and named approver for any expanded technology or provider proof |
| CTAs and financing | CTAs follow the Phase 3 map; financing/insurance is framed as questions and does not promise coverage or approval | Practice confirmation of form destination, response workflow, financing terms, and insurance language |
| Metadata/schema/links | Unique title, description, canonical, social metadata, breadcrumb, WebPage, BreadcrumbList, and page-level Service hooks are emitted | SEO/legal review of canonical domain, redirects, schema wording, and final deployment URLs |
| Blocked catalog topics | Laser, QuietNite, Sleep, Whitening, and absent live-site topics are excluded, disabled, or recorded as blocked | Factual gate and named practice/clinical/compliance approval before any public page or redirect |

The local Phase 3 output is a QA artifact, not a public approval. No deployment, redirect, or external publication was performed.

## Phase 4 content and media approval register — 2026-08-04

Nothing in this register is approved for public publication. Each item stays internal/noindex until the named practice, clinical, and compliance owners provide the source of truth and approve the exact copy.

| Content area | Draft treatment | Required approval before public use |
|---|---|---|
| Facial Aesthetics category | `/facial-aesthetics.html` is a noindex internal category draft; four treatment drafts are linked only from the internal draft hub and category draft | Active offering, provider/qualifications, concerns, candidacy/safety, recovery variability, limitations, FAQ, care links, CTA destination, metadata, and final claims |
| DEKA CO2 resurfacing | Noindex treatment draft with an authentic-equipment media slot; no device/procedure claim is published as practice fact | Exact device/protocol, indications, contraindications, skin-type language, provider, comfort/recovery, limitations, alternatives, care, claims, and media approval |
| Microneedling | Noindex treatment draft with no image fallback | Exact device/procedure, candidacy and skin-type language, provider, recovery variability, limitations, alternatives, care, claims, and media approval |
| Emage 3D Skin Analysis | Noindex diagnostic-content draft with report/privacy/provider gates | Exact system, measurements, responsible reviewer, diagnostic limitations, privacy/consent, follow-up, claims, and media approval |
| Custom HydroDerm Facials | Noindex treatment draft with product/protocol and media gates | Exact protocol/products, provider, candidacy, contraindications, recovery, limitations, frequency language, care, claims, and media approval |
| Dental Laser / Sleep & Snoring / QuietNite | Unlinked noindex drafts; no public nav, offer, schema, CTA, or aftercare link | Confirm device/protocol, provider scope, patient selection, diagnosis/physician relationship, alternatives, recovery, care, disclosures, and exact public wording |

### Phase 4 media specifications

| Required file | Subject | Minimum source/crop | Rights and review gate |
|---|---|---|---|
| `deka-laser.jpg` | Actual DEKA equipment or treatment room | 1600×1200 desktop, 800×600 mobile crop, 4:3 landscape | Usage rights, patient/staff consent if identifiable, alt intent, named approver, approval date |
| `microneedling.jpg` | Actual practice treatment-room or equipment image | 1600×1200 desktop, 800×600 mobile crop, 4:3 landscape | Same rights, consent, alt, and named-approval gate |
| `emage-scanner.jpg` | Actual scanner or analysis room | 1600×1200 desktop, 800×600 mobile crop, 4:3 landscape | Same rights, consent, alt, and named-approval gate |
| `hydroderm-facial.jpg` | Actual equipment or treatment room | 1600×1200 desktop, 800×600 mobile crop, 4:3 landscape | Same rights, consent, alt, and named-approval gate |

Stock and AI-generated people, treatment scenes, and apparent outcomes are not acceptable substitutes. Missing local assets must remain a designed media slot rather than a remote fallback.

### Phase 4 care-material gate

The following are quarantined under `the-house-of-dental-site/quarantine/care-pdfs/`: `complete-care-guide.pdf`, `deka-co2-care.pdf`, `emage-scan-care.pdf`, `hydroderm-care.pdf`, `microneedling-care.pdf`, and `quietnite-care.pdf`. A named clinical owner must approve the exact replacement content and a practice/compliance owner must approve its public link before any file returns to `assets/care-pdfs/`.

## Phase 5 patient-support and lead-conversion approval register — 2026-08-04

| Area | Local treatment | Approval required before production |
|---|---|---|
| Appointment request | Accessible static form with truthful unconfigured/error states, call fallback, honeypot, and adapter seam | Approved handler, data-processing destination, notification/failure owner, server controls, retention, SLA, and live test evidence |
| New-patient forms | Noindex destination-verification page; no guessed secure URL | Current secure form URL and document-unavailable fallback owner |
| Insurance/financing | Neutral call-to-verify page and generic illustration language | Current participation, lenders, terms, estimates, and disclosures |
| Offers/savings | Reusable neutral hub; no public offer claim or reward | Exact offer terms, eligibility, pricing, expiry, restrictions, source, and compliance approval |
| Referral | Unlinked noindex draft shell; no reward, form, or public CTA | Program terms, benefit/reward, qualifying action, caps, expiry, consent, abuse controls, and disclosures |
| Urgent path | Phone-first page and service-page callouts; 911/ER distinction; no diagnosis or same-day promise | Hours, after-hours instructions, office availability, clinical/legal wording, and emergency disclaimer review |
| Legal/accessibility | Real footer links to noindex placeholders explicitly marked pending review | Approved Privacy, Terms, Accessibility, and consent wording |
| Confirmation/404 | Non-claiming noindex status routes and branded 404 with phone/urgent links | Live success semantics, approved confirmation copy, and production 404 verification |

No Phase 5 row is a practice or legal approval. The detailed release gate and test evidence are in `docs/evidence/phase-5/phase-5-release-gate.md` and `docs/evidence/phase-5/phase-5-integration-tests.md`.

## Phase 7 credibility, media, technology, and care register — 2026-08-05

| Area | Local Phase 7 treatment | Approval required before production |
|---|---|---|
| Dr. Mainak Patel | About retains a pending provider state; a dedicated `/drafts/about/dr-mainak-patel/` page contains only supplied details and is noindex | Named practice/clinical approver for DMD, education, affiliations, expertise, local connection, care philosophy, role, and final alt text |
| Team proof | Team bios remain, but missing portraits are replaced by initials and `Authentic portrait pending`; no broken image requests remain | Authentic portraits, role/name confirmation, written consent/rights, crop approval, and alt intent |
| Reviews | Homepage and Reviews use a source-status state with no quotes, count, rating, or review schema | Approved platform URL, source snapshot/feed, timestamp or update owner, original patient statements, and consent record |
| Dental technology | Public Technology page names only the retained CEREC context and links to Same-Day Crowns; digital planning/imaging and dental laser remain held | Confirmed active device/workflow, patient benefit, limitations, care, provider scope, and named practice/clinical approver |
| Facial Aesthetics technology | Emage and DEKA are separated into internal review gates; no public aesthetic device claim or image is added | Exact offering, device/workflow, provider, claims, contraindications, recovery, privacy/consent, and media approval |
| Public dental care guides | Eight supplied dental PDFs and matching HTML guides remain available with search, filter, index, accordion, print, and direct anchors | Named clinical owner and last-reviewed date for each guide; exact medication, warning, and recovery wording review |
| Held care material | Combined guide and QuietNite care remain outside `assets/`; aesthetic care PDFs remain quarantined | Clinical owner, review date, protocol resolution, practice/compliance approval, and replacement/public-link approval |
| Authentic media | `docs/AUTHENTIC-MEDIA-MANIFEST.csv` records required filenames, subjects, rights/consent, crops, alt intent, and owners; only local office variants are used | Practice-owned doctor/team/office/consultation/CEREC/aesthetics/case/video media and all rights/consent/alt approvals |
| Before/after and testimonial proof | No patient photo, quote, testimonial, or before/after case is published | Original source, patient consent, case labels, clinical review, and website/advertising usage rights |

Nothing in this register is public approval. The release gate and evidence are in `docs/evidence/phase-7/phase-7-release-gate.md` and the `docs/evidence/phase-7/` JSON records.

## Phase 8 SEO, schema, migration, and content register — 2026-08-05

| Area | Local Phase 8 treatment | Approval or access required before production |
|---|---|---|
| Domain/canonical | Current `winterparkdental.com` is a provisional, non-deployed baseline; no new-domain canonical is emitted | Practice/legal final brand/domain decision and, if moved, both-domain verification, DNS/TLS, one-to-one redirects, Change of Address, sitemap, and redirect-retention plan |
| NAP/hours/email | Current public observations are propagated through content, footer, contact, schema, and launch docs with pending confirmation status | Practice confirms street, phone, email, map, hours, and GBP source of truth |
| Metadata | Every generated route has one title, description, canonical, robots, OG/Twitter block, shared local social image, H1, and controlled indexability | SEO/content owner approves final copy and route indexability |
| Structured data | Homepage graph, linked provider Person, service Service/visible FAQPage, breadcrumbs, and no review markup are generated locally | Practice/clinical owner verifies identity, NAP, hours, service reality, FAQ visibility, provider data, and sameAs |
| Redirects | Candidate `_redirects` file contains direct one-hop 301s and no home catch-all | Production crawl, final parity review, host syntax check, status/destination/loop tests, and release-owner approval |
| Blog preservation | 22 observed current articles are manifest-backed; index/article templates and publishing instructions are ready; author/review fields are null | Analytics/Search Console export, full source crawl, article body/media/rights, author/date/review evidence, internal-link audit, and content/clinical approvals |
| Local SEO | Launch checklist covers GBP appointment/service URL with UTM pattern, review process, directions/map, and truthful local partnerships | Practice/marketing owner supplies approved GBP link, UTM ownership, review policy, map, and partnership targets |
| Launch evidence | Reports under `docs/evidence/phase-8/` will capture metadata, schema, headings, sitemap, robots, redirects, inventory, route source, and 404 checks | Final crawl, live HTTP smoke test, Search Console URL inspection, and release signoff |

Nothing in this Phase 8 register is production approval. Do not deploy or submit Search Console changes while the domain, sitemap crawl, blog source, clinical, legal, form, analytics, and practice-owner gates remain open.

## Phase 9 privacy-aware measurement and campaign register — 2026-08-05

Nothing in this register enables a production vendor or approves a public campaign. The Phase 9 artifact is local-only and vendor-neutral.

| Area | Local Phase 9 treatment | Approval or access required before production |
|---|---|---|
| Event contract | Named CTA, form-start, backend-success, directions, financing, emergency, implant, and reserved offer/referral/inquiry events are documented in `data/measurement.json`; only aggregate context fields are allowed | Practice/marketing, privacy, implementation, and clinical/compliance owners approve event definitions, destinations, retention, and QA |
| Form success | `appointment_submit_success` and `contact_submit_success` are emitted only after an approved handler returns confirmed success; current handler remains `null` | Secure handler/CRM/practice-management destination, server validation, spam controls, notification owner, retention, SLA, and live test |
| Attribution | Session-only storage accepts `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content`; referrer is hostname-only; `utm_term`, raw URLs, and free text are rejected | Privacy review, approved UTM convention, retention/access decision, and agency reporting owner |
| GA4/tag manager | No measurement ID, container ID, vendor script, or network integration exists; generated data layer is disabled except local debug buffers | Approved vendor/property, consent behavior, data-processing terms, event mapping, access owner, and two-person publish review |
| Call tracking | No vendor or tracking number; canonical static phone/NAP remains in use | Approved provider, tracking-number/NAP policy, recording/consent decision, call-quality owner, and live tests |
| CRM attribution | No provider, endpoint, or field mapping; runtime gate is false | Approved destination, aggregate mapping, retention, access controls, failure/retry behavior, and privacy review |
| Consent | No consent vendor or required decision is configured; nonessential tracking remains disabled | Jurisdiction/vendor/category decision before analytics, advertising, session recording, or call recording |
| Campaign portfolio | Nine reusable variants exist as noindex local previews; paid/social/offer/referral variants do not expose unapproved claims or success paths | Named page brief, practice/clinical/compliance approval, approved media/terms, traffic owner, expiry owner, and release QA |
| Facial Aesthetics / QuietNite / Laser | Structures exist only as blocked Phase 4 previews; no inquiry event or active CTA is emitted | Resolve offering, provider, device/protocol, clinical boundaries, media, form destination, privacy, and named approval |
| New-patient offer / referral | Terms-pending noindex previews; no offer or referral claim/submission event is active | Exact terms, eligibility, expiry, consent, anti-abuse controls, secure backend confirmation, disclosures, and ownership |
| Indexability | Campaign variants are excluded from sitemap and public/indexable links; durable targets are explicit where approved | SEO owner approves durable canonical, indexability, paid-only treatment, and removal/expiry plan |

See `docs/MEASUREMENT-EVENT-VALIDATION.md`, `docs/MARKETING-OPERATIONS.md`, and `docs/evidence/phase-9/phase-9-release-gate.md`. Do not deploy while these gates remain open.

## Phase 10 final approval register — 2026-08-05

Phase 10 did not convert any pending fact into an approval. The implementation was re-scanned so gated content stays absent from active public navigation, indexable campaigns, success states, and third-party runtime behavior.

| Approval package | Current local status | Named approval/evidence required |
|---|---|---|
| Public identity and local facts | Provisional current-domain/NAP/hours/email/map/social baseline | Practice/legal/SEO confirmation against authoritative live sources |
| Core services/provider/FAQs/care | Rendered for local QA with explicit approval history | Practice and clinical line review, clinical owner, review date, provider verification |
| Facial Aesthetics, Sleep, Laser, QuietNite | Held/noindex/disabled | Offering, protocol/device/provider, candidacy, benefits/limits, care, compliance, media, CTA approval |
| Legal/accessibility/form notice | Placeholder/noindex or pending | Legal/privacy-approved final text, support contact/process, retention and consent decisions |
| Offers/referrals/financing | Neutral or blocked; no public reward/price/expiry claim | Exact terms, eligibility, disclosures, dates, funding, anti-abuse controls, owner |
| Form/CRM/notifications | Unconfigured and fail-closed | Approved destination, security controls, data map, notification/SLA owner, live authorized tests |
| Analytics/call tracking/consent | No vendor or IDs; no external requests | Vendor/property/container, consent categories, access/retention, payload QA, publish owner |
| Media/reviews/testimonials | Office exterior only; other proof uses text/held states | Original assets/source, rights/consent, crops/alt, maintained review owner, clinical/content approval |
| URL migration | Candidate local redirect graph only | Complete production crawl, analytics/Search Console evidence, parity signoff, test-environment HTTP report |

The release owner must attach dated evidence to `docs/LAUNCH-READINESS.md` and rerun the Phase 10 suite before changing NO-GO to GO.
