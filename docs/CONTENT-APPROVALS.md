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
| Reviews | Current rating/count, source URL, timestamp, testimonial consent | Existing testimonials and count retained for review | Practice/marketing/compliance — pending |
| Provider/team | Credentials, memberships, roles, bios, team names, authentic portraits, usage rights, alt descriptions | Existing text retained; missing team files remain unresolved | Practice/clinical/asset owner — pending |
| Before/after cases | Patient consent, allowed placements, paid-ad rights, case labels | Existing imagery retained for functional QA only | Practice/compliance — pending |
| Appointment form | Destination system, data processing, notifications, failure alerts, spam controls, response SLA, privacy notice, urgent routing | Existing form behavior retained; delivery is not claimed verified | Technical/practice/legal — blocker |
| Analytics/call tracking | Account IDs, events, consent, data minimization, call recording/transcription notices, ownership | No tracking IDs added | Marketing/technical/privacy — pending |
| Legal/accessibility | Reviewed Privacy, Terms, Accessibility pages and consent language | Footer labels remain a launch follow-up outside Phase 1 | Legal/compliance — pending |
| Care guides | Clinical accuracy, last-reviewed date, owner, medication/recovery language, emergency callouts | Existing guides retained; QuietNite is visibly flagged pending | Clinical owner — pending |

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
