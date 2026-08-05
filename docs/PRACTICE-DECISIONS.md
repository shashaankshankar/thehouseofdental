# Practice Decisions Required

These items are carried forward from section 15 of the audit. Unknowns are recorded rather than guessed. Phase 1 only gates the unresolved QuietNite service discovery; it does not resolve the underlying clinical or business questions.

| # | Decision required | Current status / implementation guardrail |
|---:|---|---|
| 1 | Final consumer-facing and legal brand: Winter Park Dental, The House of Dental, or a documented relationship | Pending practice/legal confirmation; current visual brand is preserved |
| 2 | Canonical domain: retain `winterparkdental.com` or approve a domain move | Pending; current route metadata still needs a launch decision |
| 3 | Five highest-priority growth procedures and de-emphasized services | Pending business input; no new priority claims added |
| 4 | Margin, capacity, case acceptance, seasonality, and provider preference by priority procedure | Pending business input |
| 5 | Dental and Facial Aesthetics procedures actively offered, performing provider, and publishable credentials/training | Pending clinical/practice confirmation |
| 6 | Dental laser device(s) and confirmed dental procedures using them | Pending clinical/practice confirmation; no dental Laser Dentistry page added |
| 7 | Exact QuietNite product/protocol, including laser vs oral appliance vs coordinated program, diagnosis/referral, and follow-up | Unresolved; card is non-interactive and marked pending; existing clinical copy is not rewritten |
| 8 | Whether Sleep Apnea treatment remains offered and what physician coordination applies | Pending clinical/practice confirmation |
| 9 | Referral-program eligibility, qualifying visit, reward, benefit, timing, caps, expiry, stacking, and disclosures | Pending practice/compliance approval; no referral flow added |
| 10 | Current implant and new-patient offers and their expiration owner | Pending practice confirmation; no new offer terms added |
| 11 | Current insurance plans, savings-plan terms, and financing partners | Pending practice confirmation; existing content retained for review |
| 12 | Complete office hours, Friday-by-appointment status, and whether the public office email remains current | Pending practice confirmation |
| 13 | Reliable appointment response time and urgent pain/swelling/after-hours routing | Pending practice confirmation; no response promise invented |
| 14 | Scheduling/form/CRM/practice-management destination and failure-alert owner | Pending technical/practice confirmation; form remains unverified |
| 15 | Marketing budget, paid channels, target service mix, and qualified-lead cost | Pending business input |
| 16 | Analytics, call-tracking, advertising accounts, and owners | Pending technical/marketing input; no IDs added |
| 17 | Priority patient geographies | Pending business input; existing Winter Park content preserved |
| 18 | Clinical and operational differentiators beyond technology | Pending practice input |
| 19 | Authentic team, office, and treatment photos; usage rights and alt-text approver | Pending asset owner; missing local images remain documented |
| 20 | Testimonials and before/after cases with documented consent for website and advertising use | Pending practice/compliance confirmation |
| 21 | Current blog/service pages that drive traffic, calls, or backlinks and must be preserved exactly | Pending SEO/analytics export; no redirect map is claimed complete |
| 22 | Named clinical, marketing, technical, and compliance approvers plus release/rollback process | Pending ownership confirmation |

## Phase 1 content gate

QuietNite is represented in `services.html` only as a pending, non-interactive card. The source contains appliance-specific modal/care-guide copy while the audit brief describes a laser-required procedure. Publishing an interactive description or consultation CTA would require a factual assumption, so discovery is explicitly gated until the practice provides the protocol and a clinical/compliance reviewer approves the copy.

## Phase 2 architecture decisions

| Decision | Recorded choice | Guardrail |
|---|---|---|
| Static architecture | Use a dependency-free Node build that emits ordinary HTML into `dist/` | No React, client-side routing, CMS dependency, or JavaScript-only page text/navigation |
| Single sources | Keep global shell in `templates/`, configuration in `config/site.json`, route metadata in `config/routes.json`, and modal/page data in readable HTML/JSON sources | A page fragment must not copy header, footer, metadata, NAP, breadcrumbs, sticky actions, or schema blocks |
| Canonical default | Keep `https://thehouseofdental.com` as the non-deployed canonical default | It is explicitly provisional; practice/legal approval is required before deployment or redirect decisions |
| Indexability | Enable only the eight current routes plus a non-indexable 404; keep planned service/resource/campaign/blog/legal routes disabled and `noindex` in the registry | No placeholder route becomes public factual content by accident |
| Structured data | Emit one route-specific WebPage node, BreadcrumbList only when visible, and one homepage WebSite/Dentist practice graph | No repeated blanket Dentist JSON-LD, review aggregate, or unapproved review source |
| Generated output | Clean and recreate `dist/` on every build; deploy only the generated artifact later | `dist/` is not a source-editing surface; Phase 2 does not deploy |

## Phase 2 unresolved values

The central config intentionally keeps the review source URL, office email, analytics IDs, call-tracking number, complete hours/Friday status, legal links, and production scheduling/form destination unresolved. The phone, address, map, social URLs, displayed Monday–Thursday hours, and appointment path are retained from Phase 1 with explicit pending status. No unresolved value is converted into a public factual claim by the builder.

## Phase 3 gate

Phase 3 may safely add approved service pages through one content fragment plus one `routes.json` entry, followed by `npm test`, `npm run validate`, strict asset validation, browser QA, and named clinical/practice/compliance approval. It must not enable QuietNite, dental laser, offer, referral, insurance/financing, blog, or policy routes until the decisions above have source-of-truth approval.

## Phase 3 decision record — 2026-08-04

| Decision | Local Phase 3 choice | Guardrail / next approval |
|---|---|---|
| Featured service order | Use the audit's safe provisional order: Dental Implants, Same-Day Crowns, Facial Aesthetics, Invisalign | The order is labeled as provisional and is not a popularity, demand, or business-priority claim; practice priorities remain pending |
| Patient-goal discovery | Use Replace Missing Teeth; Repair a Damaged or Painful Tooth; Improve My Smile; Straighten My Teeth; Feel More Comfortable; Maintain Oral Health | Each pathway leads to normal links and confirmed core pages; no blocked topic is implied as offered care |
| Core catalog | Treat the 13 requested core services as the local Phase 3 implementation scope, including Dentures with removable/implant-supported options and Periodontal Therapy with visible SRP | Local indexability supports QA only; active offering, exact scope, provider, and final wording require named practice/clinical/compliance review |
| Missing live-site topics | Record Onlays, Porcelain Crowns, Bridges, Bonding, Whitening, Mouthguards, Pediatric/Adolescent Dentistry, Bone Grafting, and Sleep Apnea as confirmation blockers | Do not silently delete, redirect, or add any of these as Phase 3 public claims |
| QuietNite / Sleep / Laser | Keep all three gated; no approved Phase 3 page or navigation path is generated | Phase 4 factual gate must resolve device/protocol, provider, scope, aftercare, and medical-boundary questions |
| Static architecture | Use `data/service-pages.json` plus one shared `service-page.html` fragment and route registry entries | Service copy remains server/static-rendered; JavaScript is not required for page meaning or service discovery |

For the local Phase 3 QA build, the 13 core routes are enabled/indexable in `dist/`; this is not a change to the public release gate. Deployment and redirects remain blocked until the decisions above and the named approval workflow are complete.

## Phase 4 clinical-content decision record — 2026-08-04

Phase 4 applied the unresolved-input gate to the highest-risk clinical-content areas. The existing decision items for Facial Aesthetics (#5), dental laser (#6), QuietNite protocol (#7), sleep offering/physician coordination (#8), and authentic media/rights/alt approval (#19) remain unresolved. No local source of truth was found that authorizes the missing provider qualifications, active offerings, devices, protocols, indications, contraindications, recovery guidance, result language, or care instructions.

| Area | Local Phase 4 choice | Guardrail / next approval |
|---|---|---|
| Facial Aesthetics | Retain the category and four candidate treatment structures as noindex internal drafts only; remove public nav, homepage/service cards, public technology cards, public CTAs, and active-offering language | The practice must confirm active offerings, provider and qualifications, treatment scope, candidacy/safety, recovery variability, limitations, FAQs, CTA destination, and exact claims before any public promotion |
| Authentic aesthetic media | Use media slots in the drafts and a written asset gate; do not substitute stock, remote, or AI-generated people/treatment imagery | Supply actual practice/equipment media with rights, consent, alt intent, responsive crops, and a named approver |
| Dental laser | Keep the planned public route disabled and provide an unlinked noindex internal draft that separates dental laser from aesthetic skin laser | Confirm exact dental devices/procedures, provider training, indications, limits, aftercare, and review owner |
| Sleep & Snoring | Keep the planned public route disabled and provide an unlinked noindex symptom-led draft with diagnosis and physician-coordination boundaries | Confirm the offered protocol, referral/diagnosis relationship, candidacy, alternatives, follow-up, and exact patient-safe wording |
| QuietNite | Record the appliance-versus-laser conflict without selecting either description; remove appliance copy from service data and public aftercare | Practice must identify the exact product/protocol and approve mechanism, candidacy, benefits, expectations, limitations, alternatives, physician relationship, duration language, FAQ, and care guide |
| Care PDFs | Quarantine the combined guide and all unreviewed aesthetic/QuietNite PDFs outside `assets/`; expose only the remaining dental guides | Clinical owner and practice/compliance approver must re-review each replacement before it returns to the public asset tree |

The existing Facial Aesthetics priority recommendation is therefore preserved as an internal category candidate, not a public navigation or service-offer decision. This record supersedes the Phase 3 provisional featured-service placement until the Phase 4 gates are answered. No deployment was performed.

## Phase 5 patient-support and conversion decisions — 2026-08-04

| Decision area | Local Phase 5 choice | Guardrail / next approval |
|---|---|---|
| Appointment intake | Keep the form client-side accessible and explicit, but unconnected; remove the unverified Netlify-style integration marker | Approve the scheduling/CRM/practice-management destination, notification owner, retention, SLA, and live failure tests before enabling a handler |
| Form data | Collect name, phone, email, new/existing status, reason category, contact preference, optional short message, and a privacy acknowledgment; do not request diagnosis or history | Legal/practice review of minimization, privacy notice, server validation, spam controls, CSRF/rate limiting, and retention |
| New-patient forms | Publish a noindex call-first shell while the secure current URL is unverified | Practice must provide and verify the secure destination before linking it as available |
| Insurance and financing | Use questions and call-to-verify routing only | Confirm current carriers, lenders, estimates, terms, disclaimers, and owner |
| Offers and savings plan | Use a neutral terms-pending hub with no public price, reward, eligibility, expiry, or savings-plan promise | Practice/compliance must approve reusable terms and source attribution |
| Referral | Create only an unlinked noindex draft; do not publish a reward or submission flow | Approve eligibility, reward, caps, expiry, stacking, consent, disclosures, and abuse controls |
| Urgent concerns | Use phone-first routing and separate 911/emergency-department guidance from office contact | Practice must confirm hours, after-hours routing, urgency language, and clinical/legal review |
| Legal pages | Link real Privacy, Terms, and Accessibility routes from the footer, but mark all as noindex pending review | Legal/compliance must replace placeholders with approved text before launch |
| Confirmation and 404 states | Keep appointment/offer status pages noindex and non-claiming; serve a branded local 404 with urgent and phone paths | Connect success redirects only after a real handler reports success; verify production 404 status and links |

Phase 5 remains local-only. The exact test and release blocker record is in `docs/evidence/phase-5/`.

## Phase 6 acquisition integration decision record — 2026-08-04

Phase 6 integrates the completed service and patient-support routes into the main acquisition experience. The implementation remains local-only and intentionally undeployed.

| Decision area | Phase 6 local choice | Guardrail / next approval |
|---|---|---|
| Homepage positioning | Use the audit direction “Advanced Dentistry, Designed Around You,” with Winter Park context, personalized dental care, implants, same-day crowns, preventive care, and appointment/phone CTAs | Keep the hero focused and static; confirm any future service or differentiator claims before publication |
| Featured service order | Use the provisional hybrid order Dental Implants → Same-Day Crowns → Invisalign | `the-house-of-dental-site/data/acquisition.json` is the source of truth; practice priorities, capacity, margins, case acceptance, seasonality, and de-emphasized services remain pending |
| Patient goals | Publish Replace Missing Teeth, Relieve Dental Pain, Improve My Smile, Straighten My Teeth, Feel More Comfortable, and Schedule Routine Care | Each enabled path maps to a dedicated local route; Sleep Better remains disabled until the Phase 4 gate is resolved |
| Facial Aesthetics | Keep it in the configuration as disabled and absent from public homepage/nav surfaces | Phase 4 must approve offerings, provider qualifications, claims, media, and public placement |
| Laser / QuietNite | Keep both featured candidates disabled; do not add public navigation or claims | Phase 4 device/protocol, clinical, provider, and aftercare decisions remain unresolved |
| Trust proof | Use the provider-review state, Same-Day CEREC context, call-to-confirm new-patient availability, and a review-source status link | Do not hard-code review totals or ratings; a maintained source, update owner, and consent record are still needed |
| Offers / referral | Keep Special Offers and Referral Program out of the homepage/global navigation | Phase 5 terms, eligibility, reward, expiry, disclosures, and availability require approval |
| Navigation | Use Services with grouped featured/goal/directory links, New Patients, Patient Resources, About, Reviews, Contact, phone, and Request Appointment | Preserve mobile quick actions first, accessible accordions, and no hidden/unreachable links |
| Measurement | Leave conversion attributes available without placeholder analytics IDs | Phase 9 may add approved analytics identifiers and ownership; no IDs were invented |

The complete Phase 6 evidence and release gate are in `docs/evidence/phase-6/`. No deployment was performed.

## Phase 7 decisions — 2026-08-05

| # | Decision | Local implementation / guardrail |
|---:|---|---|
| 23 | Public provider profile approval | Keep Dr. Mainak Patel’s supplied profile in About with an explicit pending-approval state; keep the dedicated provider page noindex until a named approver confirms every credential, affiliation, expertise, role, and alt description |
| 24 | Team portrait availability | Keep bios and use initials/text states; never request absent team files or imply that an image loaded |
| 25 | Review source | Remove stale counts, ratings, excerpts, and self-serving review schema; publish a platform link only after the practice supplies the approved source, timestamp/update owner, and consent record |
| 26 | Technology proof | Publish only the retained CEREC context on the dedicated Technology page and link it to Same-Day Crowns; hold digital planning/imaging, Emage, DEKA, and dental laser until device/workflow and clinical approval are documented |
| 27 | Technology grouping | Keep dental technology and Facial Aesthetics technology in separate sections and separate approval gates; do not use state-of-the-art or superiority language |
| 28 | Care metadata | Add `lastReviewed` and `clinicalOwner` fields to the care-guide data model but leave all eight values null until the practice supplies them |
| 29 | Care PDFs and QuietNite | Keep the eight supplied dental PDFs public locally; hold the combined guide and QuietNite PDF in quarantine while clinical ownership and the appliance-versus-laser protocol are unresolved |
| 30 | Authentic media | Use the local office exterior with responsive variants; use designed media-optional slots and the manifest for every missing doctor, team, office, consultation, technology, aesthetics, case, and video asset |
| 31 | Release boundary | Treat the Phase 7 build, screenshots, PDF review, and QA as a local handoff only; do not deploy until practice, clinical, compliance, rights, and operational gates are cleared |

The Phase 7 evidence and release gate are recorded in `docs/evidence/phase-7/` and `docs/AUTHENTIC-MEDIA-MANIFEST.csv`.

## Phase 8 SEO and migration decisions — 2026-08-05

| Decision area | Phase 8 local baseline | Gate before launch |
|---|---|---|
| Canonical domain | Use `https://winterparkdental.com` as a provisional current-domain baseline; do not publish a new-domain canonical or execute a domain move | Practice/legal owner confirms the final domain and brand relationship; if moved, verify both properties, deploy one-to-one 301s, submit the new sitemap, and use Change of Address only for the approved move |
| NAP and hours | Use `6504 University Blvd, Winter Park, FL 32792`, `(407) 678-1400`, `office@winterparkdental.com`, map URL, and the observed Mon–Thu 8–3 / Fri by appointment / Sat–Sun closed display | Practice re-confirms ownership, exact hours, email, map pin, and every GBP/contact source before production |
| Social metadata | Reuse the local office-exterior image for every route while route-specific approved social media is unavailable | Practice approves the image, alt text, and any route-specific treatment media/rights |
| Structured data | Emit one graph per route; homepage has WebSite/Organization/Dentist, provider content has linked Person, real service pages have Service and only visible FAQPage | Practice/clinical owner verifies NAP, hours, provider, offered services, FAQ copy, URLs, sameAs, and claims |
| Redirects | Keep 24 candidate one-hop 301 rules in `config/redirects.json` and generated `_redirects`; no mass-home redirects | Production crawl/export and final content parity review confirm every source/destination before host configuration is changed |
| Blog | Inventory 22 observed article URLs plus category/pagination paths; keep author and medical-review fields empty until source evidence exists | Production sitemap/content crawl plus analytics/Search Console export identifies priority articles and supplies source-backed content, dates, authors, review status, links, and image rights |
| Sitemap | Generate only from enabled indexable routes; current-domain sitemap is not submitted | Final domain decision, full URL reconciliation, and live crawl verification |
| Deployment | No deployment, DNS change, Search Console submission, or Change of Address performed | Release owner signs `docs/SEO-LAUNCH-CHECKLIST.md` after all practice, clinical, legal, analytics, and form gates resolve |

The live current-site observations and blocked sitemap retrieval are recorded in `docs/evidence/phase-8/live-current-site.md`. The complete route decisions are in `docs/URL-INVENTORY.csv`.

## Phase 9 privacy, measurement, and campaign decisions — 2026-08-05

Phase 9 adds a privacy-aware, vendor-neutral measurement contract and a reusable campaign-page structure. It does not install a vendor, create an account, submit data externally, or approve a public campaign. The following decisions are the local implementation boundary:

| Decision area | Phase 9 local choice | Guardrail / next approval |
|---|---|---|
| Measurement mode | Keep nonessential measurement disabled; expose only a debug/session buffer for local QA | Approve the vendor, consent behavior, retention, property/container, event map, and publish owner before activation |
| Event vocabulary | Use named events for phone, appointment, form start, confirmed form success, directions, financing, offers, referrals, implant, aesthetics, QuietNite, and emergency intent; use `form_state` only for diagnostics | Practice/marketing and privacy owners approve definitions and destination mapping; success events remain backend-confirmed |
| Event payload | Permit only `event`, `page_type`, `service_slug`, `cta_location`, `conversion_type`, `campaign_source`, and `state` | Never add name, phone, email, message, symptoms, diagnosis, treatment details, referral-friend data, raw URLs, page content, or free text |
| Attribution | Store approved UTM tokens and referrer hostname in session storage only; omit `utm_term` and raw referrer data | Privacy review and documented UTM ownership are required before any external analytics mapping |
| Form/CRM | Keep the appointment handler, CRM/provider, endpoint, and attribution mapping unconfigured; no form success is claimed locally | Approve secure destination, server controls, notification/SLA, retention, access, and live success/failure tests |
| Call tracking | Preserve the canonical static phone; do not substitute a tracking number | Approve vendor, NAP replacement policy, recording/consent, and call-quality verification |
| Consent | Record no vendor/no decision and keep analytics, advertising, session recording, and call recording off | Approve jurisdictional category behavior and vendor configuration before enabling nonessential processing |
| Campaign template | Use one governance-rich template with audience, source, intent, message, CTA, proof, expectations, limitations, FAQs, attribution, thank-you behavior, and approval state | Practice, clinical, compliance, SEO, and implementation owners approve each brief before media or public linking |
| Campaign indexability | Keep all nine variants local/noindex and out of the sitemap; canonicalize only to explicit durable targets | SEO owner approves any durable indexable page, canonical, paid-only variant, expiry, and redirect/removal plan |
| Blocked campaigns | Keep Facial Aesthetics, Laser Dentistry, and QuietNite inquiry paths disabled; keep offer/referral terms pending | Resolve the existing Phase 4 clinical/practice gates and Phase 5 terms/backend/privacy gates first |
| Operations | Record agency access, brief, approval, release, rollback, reporting, and incident ownership in `docs/MARKETING-OPERATIONS.md` | Practice owner assigns named owners and least-privilege access before agency work or spend |

The release gate is in `docs/evidence/phase-9/phase-9-release-gate.md`. No deployment was performed.

## Phase 10 release decision record — 2026-08-05

| Decision area | Phase 10 local choice | Required decision before launch |
|---|---|---|
| Recommended sitemap | Implement the patient-goal Services hierarchy, expanded patient/resource/about groups, comprehensive footer, and human sitemap | Practice/content approves final labels/order and explicitly decides whether gated sections become public |
| Facial Aesthetics | Preserve drafts and IA intent, but keep the top-level/public treatment paths disabled until Phase 4 facts are approved | Confirm offerings, provider qualifications, device/workflow, claims, limitations, media, CTA, and compliance approval |
| Sleep/Laser/QuietNite | Keep the entire group disabled and name it only in the held sitemap section | Resolve the protocol/device/provider contradiction and approve every clinical/public claim |
| Forms and analytics | Keep the form visibly unconfigured and all vendors disabled; do not simulate delivery or conversion success | Approve backend, privacy/security, notifications, consent, event destinations, IDs, and live tests |
| Domain/NAP/migration | Retain the current-domain/NAP observations as a provisional local baseline | Confirm canonical domain, brand relationship, NAP/hours/email/map/socials, production crawl, and every meaningful URL disposition |
| Release | Record **NO-GO** with zero hidden blockers and preserve the verified local candidate | Named practice, clinical, legal/privacy, SEO/migration, technical, marketing, and release owners must clear and retest every blocker |

No Phase 10 implementation choice is production approval. No deployment or external configuration change was performed.
