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
