# Winter Park Dental Implementation Prompts for a 5.6 Luna Max Agent

These prompts turn the complete redesign audit into ten implementation sessions. Run them **in order**, one prompt per new session. Each phase is deliberately bounded so a less-capable agent can complete, verify, and hand off the work without silently skipping requirements.

The project is a healthcare website. The agent must never invent clinical facts, provider qualifications, treatment availability, offers, referral rewards, insurance participation, financing terms, hours, review counts, legal language, or patient outcomes.

## Phase sequence

| Phase | Outcome | Depends on |
|---|---|---|
| 1 | Critical UX/accessibility defects fixed; baseline and decision ledger established | None |
| 2 | Maintainable static-site architecture and shared site shell | Phase 1 |
| 3 | Complete services information architecture and core dental service pages | Phase 2 |
| 4 | Facial Aesthetics completed; Laser/QuietNite/Sleep content safely gated | Phase 3 |
| 5 | Patient acquisition/support flows: forms, new patients, offers, referrals, emergency, legal, 404 | Phase 2–4 |
| 6 | Homepage, service prioritization, navigation, and CRO integration | Phase 3–5 |
| 7 | Trust content, authentic-media readiness, About/Reviews/Technology, pre/post-op UX | Phase 2–6 |
| 8 | Technical SEO, local SEO, schema, domain/URL migration, blog preservation | Phase 2–7 |
| 9 | Analytics, attribution, campaign landing pages, and agency operating workflow | Phase 5–8 |
| 10 | Performance, cross-device QA, accessibility verification, launch package | All prior phases |

## Persistent handoff files

Every phase must read and update these files. Phase 1 creates them if absent.

- `docs/IMPLEMENTATION-STATUS.md`: completed work, files changed, test results, screenshots, remaining work, blockers.
- `docs/PRACTICE-DECISIONS.md`: verified business facts and unresolved questions. Unresolved facts stay unresolved.
- `docs/URL-INVENTORY.csv`: current URL, proposed URL, status, redirect, indexability, notes.
- `docs/CONTENT-APPROVALS.md`: content owner, clinical approval, compliance approval, asset approval, publication state.
- `docs/QA-MATRIX.md`: routes × viewport/device × interaction/accessibility checks.

Use these exact status labels: `verified`, `implemented-unverified`, `blocked-practice-input`, `blocked-external-integration`, `not-started`, `complete`.

---

## Phase 1 prompt — Stabilize critical UX and accessibility

```text
You are implementing Phase 1 of the Winter Park Dental / The House of Dental redesign remediation.

WORKSPACE
- Work in: /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental
- Website source: /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental/the-house-of-dental-site
- Required audit: /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental/Winter-Park-Dental-Redesign-Audit.md
- Read the entire audit before editing. Treat it as the implementation specification.

OPERATING RULES
1. Inspect the current files first because earlier sessions may have changed them. Preserve correct existing work and unrelated user edits.
2. Implement the phase; do not merely write a plan.
3. Keep the existing premium black/ivory/champagne visual language. Do not redesign the brand.
4. Keep the output a crawlable static website. Do not convert it to a SPA or introduce a large framework.
5. Do not invent practice facts, treatment facts, review counts, offers, legal promises, provider credentials, or assets.
6. Do not deploy or publish.
7. Run the site locally and inspect the rendered result, not only source.
8. Create/update the persistent handoff files under docs/. Record unknowns instead of guessing.

PRIMARY GOAL
Remove the critical and high-priority interaction/accessibility defects in the existing eight pages before larger architectural work begins.

TASKS
A. Establish a baseline
- Inventory all routes, assets, scripts, styles, forms, metadata, and interactive components.
- Create docs/IMPLEMENTATION-STATUS.md, docs/PRACTICE-DECISIONS.md, docs/URL-INVENTORY.csv, docs/CONTENT-APPROVALS.md, and docs/QA-MATRIX.md if they do not exist.
- Populate the decision file with every unresolved item from audit section 15, especially final brand/domain, QuietNite protocol, laser devices/procedures, referral terms, current offers, hours, insurance/financing, form handler, analytics IDs, and authentic media.
- Record the current route list and baseline behavior before editing.

B. Fix the critical mobile navigation defect
- Inspect styles.css around the fixed header/backdrop-filter and mobile .menu rules, and main.js mobile-nav logic.
- Make the mobile overlay fill the viewport at every width <=1024 px. It must use the visual viewport safely (100dvh with a reasonable fallback), allow vertical scrolling, respect safe-area insets, and never position links above the visible screen.
- Avoid a fixed overlay being constrained by a transformed/filtered ancestor. Move the overlay outside that containing block or restructure the header so the overlay is truly viewport-fixed.
- When closed, the menu must not be focusable or exposed as active content. Use hidden/inert/state behavior appropriate to the implementation.
- Add aria-expanded and aria-controls to the menu button. Change its accessible label between Open menu and Close menu.
- Make submenu disclosure controls separate and understandable; do not make the same link both navigate and ambiguously expand.
- Support Escape to close, focus entry into the menu, focus containment while open, and focus return to the opener.
- Closing via a real navigation link must restore body scrolling and state.

C. Fix the 1440 px desktop header overflow
- Reproduce the clipping near the right-side Book CTA at 1440×900.
- Use fluid gaps/font sizing/CTA padding or an earlier compact breakpoint. Do not hide the problem with overflow-x clipping.
- Verify at 1280, 1366, 1440, and 1920 widths.

D. Repair Services page defects
- Move Scaling & Root Planing and QuietNite cards out of the modal panel and into the correct service grid or intentionally hide QuietNite from public discovery if its status is unresolved. Document the decision.
- Make the existing service dialog accessible: move focus into it, trap focus, close on Escape/backdrop/close button, make the background inert, and return focus to the exact trigger.
- Ensure dialog content remains scrollable on short mobile viewports.
- Do not rewrite QuietNite clinical copy in this phase.

E. Repair shared accessibility problems
- Add a visible-on-focus skip link to every page.
- Replace outline:none patterns with a clearly visible, consistent focus indicator on all interactive elements.
- Darken normal-sized gold-deep text and low-opacity fine print so it meets WCAG 2.2 AA contrast. Preserve the palette.
- Convert the before/after comparison controls into keyboard-operable, screen-reader-understandable controls. Expose a meaningful name and current percentage/value. Support arrow keys, Home, and End.
- Make the testimonial rotator manual/static or add a real Pause/Play control and expose the active item programmatically. Respect prefers-reduced-motion.
- Increase very small mobile labels enough for readability and make the burger touch target comfortably sized.
- Verify headings and labels remain intact; do not remove meaningful alt text.

F. Add lightweight regression checks
- Add a repeatable local validation command or documented script that checks internal links, missing local assets, duplicate IDs, required page titles/H1s, and missing skip links.
- Do not add a heavy framework solely for testing.

REQUIRED VERIFICATION
- Render and interact with the homepage, Services, Contact, About, Facial Aesthetics, New Patients, Reviews, and Pre/Post-Op pages.
- Test the menu at 320×568, 390×844, 768×1024, 820×1180, and 1024×768.
- Test desktop navigation at 1280×720, 1366×768, 1440×900, and 1920×1080.
- Test keyboard-only opening, submenu use, tab sequence, Escape, focus trap, and focus return.
- Test service dialog keyboard behavior and the before/after control.
- Check for horizontal scrolling, console errors, trapped body scrolling, and inaccessible off-canvas links.
- Save representative before/after screenshots under docs/evidence/phase-1/.

ACCEPTANCE CRITERIA
- Every mobile-nav link and submenu is reachable and visible at all tested sizes.
- No header clipping at 1440 px.
- SRP is correctly discoverable. QuietNite is either correctly placed or explicitly gated pending practice input.
- Menu, dialog, sliders, focus states, skip link, contrast, and changing testimonial content have WCAG-oriented behavior.
- No broken route or regression on the eight current pages.

HANDOFF
- Update all persistent handoff files.
- In docs/IMPLEMENTATION-STATUS.md, list exact files changed, exact tests run, screenshots, unresolved blockers, and the next phase readiness.
- In your final response, lead with the implemented outcome, then list verification evidence and blockers. Do not claim production readiness.
```

---

## Phase 2 prompt — Create a maintainable static-site foundation

```text
You are implementing Phase 2 of the Winter Park Dental / The House of Dental redesign. Phase 1 should already be present in the workspace.

WORKSPACE AND SOURCES
- Work in /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental
- Website source: the-house-of-dental-site/
- Read Winter-Park-Dental-Redesign-Audit.md completely.
- Read docs/IMPLEMENTATION-STATUS.md, docs/PRACTICE-DECISIONS.md, docs/URL-INVENTORY.csv, docs/CONTENT-APPROVALS.md, and docs/QA-MATRIX.md before editing.

RULES
- Preserve Phase 1 fixes and all unrelated edits.
- Implement, test, and document; do not only propose.
- Preserve the existing visual design and static/crawlable output.
- Do not introduce React, client-side routing, or a CMS dependency without a proven need.
- Do not invent business or clinical facts.
- Do not deploy.

PRIMARY GOAL
Remove copy-pasted global markup and create a safe, minimal system for adding many static service, resource, policy, blog, and campaign pages without metadata/schema/navigation drift.

TASKS
1. Inspect the current project and choose the smallest maintainable architecture.
   - Preferred direction: a dependency-light or dependency-free static build process that outputs ordinary HTML files.
   - Shared sources must cover header, desktop/mobile navigation, footer, skip link, contact/NAP, CTA components, metadata, social metadata, breadcrumbs, and structured-data hooks.
   - Content should remain editable as clear HTML/Markdown/data files. Do not bury all page copy in one unreadable script.
   - If a build step is added, include a package manifest and simple commands such as build, serve, validate, and test. Output must be deployable as static files.
2. Create one central site configuration for brand name, alternate name, canonical base URL, phone, address, hours, social URLs, appointment URL, review source, and analytics placeholders.
   - Any unresolved value must be explicitly marked and must not silently become a public factual claim.
   - The current public domain can be the non-deployed default only if documented as provisional in PRACTICE-DECISIONS.
3. Create a route/content registry for all current and planned routes, including title, description, canonical path, H1, indexability, social image, breadcrumb, page type, and approval status.
4. Generate or assemble the shared shell so changing the phone, hours, footer legal links, nav, or schema source requires one edit.
5. Preserve the exact current visual output as closely as practical while eliminating duplicated metadata blocks and repeated blanket Dentist JSON-LD.
6. Create reusable accessible patterns for:
   - service cards and category cards;
   - buttons/links and sticky mobile actions;
   - breadcrumb navigation;
   - dialog only if dialogs remain necessary;
   - labeled forms, errors, success messages, and status regions;
   - FAQ disclosure;
   - trust/review callouts;
   - responsive images;
   - related-service links.
7. Ensure every current route still resolves. If output paths change internally, preserve public-facing URLs or provide local rewrite compatibility and document it.
8. Add validation for unique titles/descriptions/H1s, canonical consistency, duplicate IDs, broken internal links, missing referenced assets, malformed JSON-LD, and sitemap coverage.
9. Add a concise developer README explaining source vs generated output, commands, page creation, metadata, schema, assets, tests, and deployment artifact location.

DO NOT
- Rewrite the visual design.
- Change service claims, offers, review counts, hours, domain, QuietNite, or referral terms.
- Remove the eight current pages before generated equivalents are verified.
- Make a page dependent on JavaScript for its main text or navigation.

REQUIRED VERIFICATION
- Build from a clean generated-output directory without hand-editing generated files.
- Serve the output and verify all eight existing routes.
- Compare homepage, Services, Contact, About, and Facial Aesthetics at 390×844 and 1440×900 against the pre-refactor design.
- Re-run Phase 1 menu, focus, dialog, slider, link, and console checks.
- Confirm view-source contains titles, descriptions, canonical, H1 content, internal links, and page text.
- Save parity screenshots under docs/evidence/phase-2/.

ACCEPTANCE CRITERIA
- Shared global content is single-source.
- Static HTML is produced for every route.
- Existing routes and Phase 1 accessibility fixes still work.
- A new page can be created without copying an entire header/footer/schema block.
- Validation commands fail meaningfully when metadata, links, or assets are broken.

HANDOFF
- Update the five persistent docs with architecture, routes, commands, tests, blockers, and approval status.
- Clearly state whether Phase 3 can safely add service pages.
```

---

## Phase 3 prompt — Build the service architecture and core dental pages

```text
You are implementing Phase 3: the complete core dental service information architecture.

START HERE
- Work in /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental
- Read Winter-Park-Dental-Redesign-Audit.md in full, especially sections 4, 5, 8, 9, 11, 12, and the landing-page portfolio.
- Read all docs/ handoff files and inspect the Phase 2 build architecture.
- Inspect the current public service catalog at https://winterparkdental.com/dental-services/ only as a live content/migration reference. The local redesign and verified practice decisions control the implementation.

RULES
- Preserve verified prior work and the black/ivory/champagne design.
- Create server/static-rendered HTML content. Do not put essential service copy only in modals or JavaScript.
- Never invent offered procedures, qualifications, outcomes, pricing, timelines, risks, or insurance coverage.
- If a service is not confirmed, create no public claim. Record it as blocked or produce an unlinked noindex draft only when useful.
- Do not deploy.

PRIMARY GOAL
Replace the shallow modal-only service experience with a patient-centered, crawlable, internally linked service system while retaining the Services overview as the discovery hub.

INFORMATION ARCHITECTURE TO IMPLEMENT
1. Services overview with two layers:
   - Featured services driven by verified business priorities. If priorities remain unknown, label the order provisional in internal docs and use the audit's safe provisional order without implying popularity.
   - Patient-goal pathways: Replace Missing Teeth; Repair a Damaged or Painful Tooth; Improve My Smile; Straighten My Teeth; Feel More Comfortable; Maintain Oral Health.
2. An All Services directory with plain-language and clinical labels.
3. Category and detail pages for the confirmed core catalog:
   - Dental Implants
   - Restorative Dentistry
   - Same-Day Crowns
   - Dentures / implant-supported dentures if confirmed
   - Root Canal Therapy
   - Cosmetic Dentistry
   - Porcelain Veneers
   - Preventive Care
   - Periodontal Therapy / Scaling & Root Planing
   - Invisalign
   - Oral Surgery
   - Sedation Dentistry
   - TMJ Evaluation/Treatment
4. Do not implement Laser Dentistry, QuietNite, or Sleep as approved public pages in this phase; Phase 4 handles their factual gate.

PAGE REQUIREMENTS
Each service page must include only verified, patient-safe content and contain:
- explicit service + Winter Park context in title/H1/copy without keyword stuffing;
- patient problem or goal;
- what the service is and what confirmed options the practice offers;
- who may or may not be a candidate, phrased without diagnosis promises;
- consultation/diagnostic process;
- what to expect, comfort/anxiety support, timing only if confirmed;
- benefits plus limitations/alternatives;
- recovery/maintenance and links to relevant pre/post-op guides;
- provider/technology proof only when verified;
- financing/insurance context without promising coverage;
- FAQ with visible answers;
- related services;
- address/phone/local trust;
- primary and secondary CTAs tailored to intent;
- unique metadata, canonical, breadcrumb, social metadata, and accurate page-level schema hooks.

CTA MAP
- Implants: Request an Implant Consultation
- Same-Day Crowns: Explore Same-Day Crowns / Request an Appointment
- Pain/root canal: Call About Tooth Pain / Request an Evaluation
- Dentures: Request a Tooth-Replacement Consultation
- Cosmetic/Veneers: Request a Cosmetic Consultation
- Preventive: Schedule a New Patient Visit
- Invisalign: Request an Invisalign Consultation
- Oral Surgery/TMJ: Request an Evaluation
- Sedation: Ask About Comfortable Care

SERVICES OVERVIEW BEHAVIOR
- Convert service cards from modal-only buttons to normal links.
- A preview dialog may remain only if it adds value and is fully accessible, but the link/page must be primary.
- SRP must be correctly visible.
- QuietNite must remain gated until Phase 4.
- Keep service discovery within two or three interactions from home/navigation.

CONTENT MIGRATION
- Compare every current public service URL with docs/URL-INVENTORY.csv.
- Preserve useful verified information but rewrite it in the redesign's direct, reassuring voice.
- Do not copy outdated design patterns or unverified claims.
- Mark public-site topics absent from the confirmed catalog—bridges, onlays, bonding, whitening, mouthguards, pediatric dentistry, bone grafting, sleep apnea—for practice confirmation rather than deleting or adding them silently.

REQUIRED VERIFICATION
- Build and serve all pages.
- Check every service URL, breadcrumb, related link, CTA, title, H1, canonical, description, and schema syntax.
- Test Services overview and at least every distinct page template at 320×568, 390×844, 768×1024, 1024×768, 1366×768, and 1920×1080.
- Test keyboard navigation, focus order, zoom/reflow, and CTA destinations.
- Ensure no main content requires JS and no orphaned service page exists.
- Save screenshots under docs/evidence/phase-3/ and update the QA matrix.

ACCEPTANCE CRITERIA
- Every confirmed core service has a useful, indexable static page.
- Services overview supports both featured and patient-goal discovery.
- All cards are valid links, not dead/modally trapped content.
- No unverified procedure or claim was introduced.
- Current public URLs are accounted for in the migration inventory.

HANDOFF
- Update status, URL inventory, approvals, decision blockers, and QA matrix.
- List pages that are complete, blocked, noindex draft, or awaiting clinical approval.
```

---

## Phase 4 prompt — Facial Aesthetics, Laser Dentistry, QuietNite, and Sleep

```text
You are implementing Phase 4, the highest-risk clinical-content area of the redesign.

WORKSPACE
- /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental
- Read the full audit and every docs/ handoff file before changing anything.
- Inspect the current built Facial Aesthetics page, service architecture, pre/post-op content, assets/aesthetics/README.txt, and all QuietNite references.

NON-NEGOTIABLE SAFETY RULES
- Do not infer what QuietNite is. The audit found a direct conflict: the site describes a mandibular advancement appliance while the business brief calls it laser-required.
- Do not say a treatment cures sleep apnea, replaces diagnosis, replaces physician-prescribed therapy, works for everyone, guarantees an outcome, is safe for all skin types, or has no downtime.
- Do not invent devices, procedures, provider credentials, contraindications, durations, or results.
- Do not use AI-generated people/treatment images as if they were the practice or real outcomes.
- If required facts are unresolved in docs/PRACTICE-DECISIONS.md, build only a clearly blocked/noindex/unlinked draft structure. Do not place it in public navigation or schema as an offered service.
- Do not deploy.

PRIMARY GOALS
1. Make Facial Aesthetics credible, patient-centered, accessible, and conversion-ready.
2. Establish a safe, understandable dental Laser/Sleep/QuietNite architecture without publishing conflicting claims.

FACIAL AESTHETICS TASKS
- Keep Facial Aesthetics as a top-level navigation category and homepage/service priority candidate.
- Improve the category page with: concerns addressed; confirmed treatments; who performs them and verified qualifications; consultation process; candidacy; safety/contraindication framing; recovery variability; limitations; FAQ; related care instructions; consultation CTA.
- Create dedicated static treatment pages when approved/search-worthy for DEKA CO2 resurfacing, Microneedling, Emage 3D Skin Analysis, and Custom HydroDerm Facials.
- Rewrite or qualify claims identified in the audit, including safe across all skin types, essentially no downtime, and overly certain outcome language.
- Preserve useful factual explanations only after source/clinical review status is recorded.
- Remove the missing-local-file-then-Unsplash fallback pattern. If authentic approved media is unavailable, use a polished image-optional layout and an internal asset requirement note; do not represent stock imagery as real practice treatment.
- Add authentic-media slots/specifications to docs/CONTENT-APPROVALS.md: subject, crop, consent, alt intent, desktop/mobile dimensions.

LASER DENTISTRY TASKS
- Read PRACTICE-DECISIONS for confirmed dental laser device(s), procedures, provider, and indications.
- If confirmed, create /services/laser-dentistry/ explaining service vs technology, confirmed applications, patient benefit, candidacy, expectations, limitations, related services, and Schedule a Laser Dentistry Consultation CTA.
- If not confirmed, create only an internal content brief or noindex draft. Do not list unconfirmed laser gingivectomy, gum contouring, periodontal uses, or other procedures as offered.
- Keep aesthetic DEKA skin laser and dental laser content clearly separated.

QUIETNITE / SLEEP TASKS
- Search the full project for QuietNite, sleep apnea, snoring, airway, connectors, mandibular advancement, CPAP, and laser references.
- Resolve implementation strictly from verified practice input:
  A. If it is an oral appliance: place it under Sleep & Snoring/Oral Appliance Therapy; correct the brief conflict in internal notes; retain only medically reviewed appliance content.
  B. If it is a laser protocol: place it under Laser Dentistry and cross-link to Sleep & Snoring; remove appliance-specific statements unless the confirmed program also includes one.
  C. If it is a combined/coordinated protocol: explain the components separately and accurately.
  D. If still unresolved: remove it from public navigation, offers, schema, service cards, PDFs/aftercare navigation where publication could mislead; retain an internal noindex draft and mark blocked-practice-input.
- The eventual page structure must cover: symptom/problem; what it is; mechanism; why laser is involved if verified; candidacy; benefits; expectations; comfort/recovery; limitations; duration of results only if known; alternatives; physician/diagnosis relationship; FAQ; consultation CTA.
- Add explicit safe language that evaluation does not replace a medical diagnosis and treatment is not appropriate for every patient.
- Update or quarantine the QuietNite care PDF/text so it cannot contradict the approved protocol.

INTERNAL LINKING
- Connect approved pages among Facial Aesthetics, Technology, Laser Dentistry, QuietNite, Sleep & Snoring, Consultation, and care instructions.
- Do not create dead-end or orphaned pages.

REQUIRED VERIFICATION
- Build and inspect every page changed at mobile, tablet, and desktop.
- Check claims against approval status line by line.
- Verify missing assets do not produce 404s or hidden empty frames.
- Verify no unresolved QuietNite/Laser claim appears in public nav, sitemap, schema, metadata, offer, or internal link.
- Test CTA destinations and all FAQ/disclosure keyboard behavior.
- Save evidence in docs/evidence/phase-4/.

ACCEPTANCE CRITERIA
- Facial Aesthetics is complete except explicitly tracked authentic-asset/clinical approvals.
- No unsupported medical/cosmetic claim remains.
- Laser/QuietNite/Sleep structure exactly matches verified practice decisions or is safely unpublished.
- The site cannot simultaneously present QuietNite as two incompatible treatments.

HANDOFF
- Update status, decisions, approvals, URL inventory, and QA matrix with exact claim/asset gates.
```

---

## Phase 5 prompt — Patient acquisition, support, forms, offers, referral, emergency, legal, and 404

```text
You are implementing Phase 5: all major patient-support and lead-conversion infrastructure outside the homepage.

START
- Work in /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental.
- Read the complete audit and all docs/ handoff files.
- Inspect the actual hosting/deployment configuration before choosing a form backend. data-netlify=true is not a working integration unless the deployment platform supports and enables it.
- Preserve all prior accessibility, architecture, service, and clinical-content work.

RULES
- Implement real behavior where the required external system/config is available.
- If an integration or legal/business term is unavailable, create a truthful non-deceptive state and document the blocker. Never fake successful submission, reward eligibility, scheduling, or analytics.
- Minimize collected information. Never send free-text or health details to analytics.
- Do not invent legal language, referral rewards, offer terms, insurance participation, financing approvals, hours, or response times.
- Do not deploy.

PRIMARY GOAL
Create reliable, accessible, privacy-aware pathways for new patients, routine inquiries, urgent dental needs, offers, referrals, financing, directions, and error recovery.

CONTACT / APPOINTMENT
- Replace the unverified form behavior with an integration appropriate to the confirmed host or approved external system.
- If no handler is approved, implement the complete accessible frontend and integration adapter/documentation, but do not show a false success. Keep click-to-call prominent.
- Fields: name, phone, email, new/existing patient, reason-for-visit category, contact preference, optional message. Avoid collecting diagnosis/history. Make required status explicit.
- Provide accessible client and server error handling, error summary/live region, field associations, retry behavior, loading/submitting state, and success confirmation.
- Add honeypot/rate limiting/CSRF or platform-equivalent protections as applicable.
- Add a reviewed privacy link and copy warning against sensitive medical details.
- Add an appointment thank-you route, normally noindex, with expected next step only if the office has approved an SLA.
- Confirm email/CRM notification failure handling and document how to test it.

URGENT / EMERGENCY PATH
- Create a concise Emergency Dentistry page if the practice confirms the service/response policy.
- Use click-to-call as primary action, distinguish office contact from 911/emergency-room situations using clinically/legal-approved wording, and avoid diagnosis.
- Add urgent routing from contact/service pages without letting emergency inquiries disappear into a slow generic form.

NEW PATIENTS
- Restructure New Patients into clear sections/routes: What to Expect, Forms, Insurance & Financing, Savings Plan, Special Offers.
- Migrate a secure current new-patient form link only after verifying the destination.
- Replace vague insurance claims with approved plan names or a call-to-verify message.
- Treat financing calculators as illustrations, not approval or binding payment estimates.
- Confirm Friday hours, email, insurance, lenders, and savings-plan terms in PRACTICE-DECISIONS.

SPECIAL OFFERS
- Create an evergreen Special Offers hub and reusable offer-card/detail pattern.
- Every public offer needs verified eligibility, inclusions, exclusions, expiration, stacking rules, payment/insurance restrictions, owner, approval, and automatic/manual expiry workflow.
- If current terms are unavailable, do not invent them. Show only approved offers or a neutral contact prompt.
- Add a privacy-safe offer claim/source value and thank-you state.

REFERRAL PROGRAM
- Create /patient-resources/referral-program/ and a distinct Special Offers card only if program terms are approved.
- Required content: participant eligibility, referred-patient definition, reward, any new-patient benefit, qualifying completed visit/treatment, issuance timing, limits, expiry, stacking, submission method, disclaimers.
- If terms are unresolved, create an unlinked noindex draft shell and mark blocked-practice-input; do not advertise a reward.
- Suggested minimum form: referrer name and contact; friend's name and preferred contact only with appropriate consent; consent checkbox; privacy/terms; campaign/referral code; honeypot. Do not ask for a condition or needed treatment.
- Add a truthful confirmation and CRM/practice-management attribution only if the system is confirmed.
- Flag Florida professional-board, insurance, privacy, anti-kickback, and marketing review; do not make legal conclusions.

POLICY / ERROR PAGES
- Migrate or create reviewed Privacy, Terms, and Accessibility pages. If approved public policy text exists, preserve it rather than making new promises; mark it for legal review.
- Replace plain footer labels with real links.
- Create a branded 404 page with correct 404 status, Home, Services, Contact, phone, and emergency path.
- Create appropriate noindex thank-you/error routes.

CTA SYSTEM
- Implement contextual CTAs from the audit: Schedule a New Patient Visit, Send Appointment Request, Call About a Dental Emergency, Refer a Friend, See Current Offers, Review Insurance & Payment Options, Get Directions.
- Add a mobile sticky Call + Request Appointment bar that does not block content, inputs, cookie controls, or safe areas.

REQUIRED VERIFICATION
- Test valid, invalid, network-failure, server-failure, duplicate-submit, and success states. If a live handler is unavailable, document exactly what cannot be tested.
- Verify no form logs or analytics payloads contain message text or sensitive details.
- Keyboard/screen-reader test labels, errors, live status, consent, and thank-you navigation.
- Test mobile form completion at 320×568, 390×844, and 412×915; tablet and desktop at 768×1024 and 1440×900.
- Test phone, mail, directions, forms, policy, offer, referral, emergency, and 404 links.
- Save evidence in docs/evidence/phase-5/.

ACCEPTANCE CRITERIA
- No form can silently fail or falsely claim success.
- Urgent visitors have a clear phone-first path.
- Offers/referrals are public only with approved terms.
- Policies are real links; 404 and thank-you states exist.
- Mobile CTAs are persistent but non-obstructive.

HANDOFF
- Update all persistent docs, including external-integration and legal/compliance blockers.
```

---

## Phase 6 prompt — Homepage, navigation, service prioritization, and CRO

```text
You are implementing Phase 6: integrate the completed service and patient flows into the main acquisition experience.

WORKSPACE
- /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental
- Read the audit and all docs/ handoff files.
- Inspect every route created in Phases 1–5 before editing navigation/homepage.

RULES
- Keep one focused static hero. Do not add an auto-rotating hero carousel.
- Preserve the premium design while improving clarity and conversion.
- Use verified practice priorities. If priorities are still unknown, use a clearly documented provisional order and keep the design data-driven so it is easy to change.
- Do not invent review totals, credentials, new-patient status, offers, or outcomes.
- Do not deploy.

PRIMARY GOAL
Make the homepage and global navigation answer, within five seconds: who the practice is, where it is, what it offers, why it is credible, whether the visitor has a relevant path, and what to do next.

HOMEPAGE IMPLEMENTATION
1. Hero
- Eyebrow: Dentist in Winter Park, Florida, if verified.
- Use the audit's recommended direction: Advanced Dentistry, Designed Around You.
- Supporting copy should explicitly mention personalized dental care, implants, same-day crowns, preventive care, and Facial Aesthetics only when confirmed.
- Primary CTA: Request an Appointment. Secondary: Call (407) 678-1400.
- Keep the authentic office exterior and intentional crop; add a mobile-specific source/crop if needed.
2. Trust strip
- Use verified, maintainable proof: provider credential, same-day crowns, new-patient availability, and review link/source.
- Do not hard-code a review count without a maintained source and update owner. If unavailable, use Read Verified Patient Reviews.
3. Patient-goal pathways
- Replace Missing Teeth; Relieve Dental Pain; Improve My Smile; Straighten My Teeth; Feel More Comfortable; Schedule Routine Care; Sleep Better only when the service is approved.
- Each pathway must lead to a useful page, not a generic modal.
4. Featured services
- Use the hybrid model: a small set of verified business priorities followed by goal/category discovery.
- Safe provisional candidates from the audit are Implants, Same-Day Crowns, Facial Aesthetics, Invisalign, and confirmed Laser/QuietNite. Never publish the last item if unresolved.
- Whitening must not be featured in the hero or priority cards.
5. Trust/content sequence
- Doctor credibility, real patient review, technology tied to patient benefit, Facial Aesthetics, approved Laser/QuietNite, offers/referral, financing, location/hours/directions, final appointment CTA.
- Hide rather than fabricate unapproved sections.
6. CTA behavior
- Use intent-matched copy from the audit and Phase 3 pages.
- Preserve the sticky mobile Call + Request Appointment bar.
- Trackable attributes may be present for Phase 9, but no placeholder analytics IDs.

GLOBAL NAVIGATION
- Desktop top level: Services, Facial Aesthetics, New Patients, Patient Resources, About, Reviews, Contact, plus phone and Request Appointment.
- Services dropdown: Featured, goal categories, and All Services. Avoid a wall of 14 equal links.
- Mobile: Call and Request Appointment first/sticky; accessible accordions for Services and Resources; no hidden/unreachable links.
- Include Special Offers and Referral Program only if approved/available.
- Include Laser/QuietNite only if Phase 4 marked them approved-public.
- Make service/technology distinctions understandable.

CONSUMER-PSYCHOLOGY GUARDRAILS
- Use primacy and progressive disclosure ethically.
- Reduce anxiety and cognitive load.
- Do not use false scarcity, deceptive urgency, hidden pricing, preselected consent, or pressure-based healthcare language.

RESPONSIVE WORK
- Reduce tablet hero height if trust proof is unnecessarily pushed off-screen.
- Maintain no horizontal scroll and no 1440 px header clipping.
- Keep line lengths, card heights, CTA wrapping, image crops, and touch targets consistent.

REQUIRED VERIFICATION
- Five-second comprehension review at 390×844 and 1440×900.
- Test all homepage and nav links, goal pathways, featured services, sticky actions, phone, directions, and appointment path.
- Test all twelve audit viewports: 320×568, 360×800, 375×812, 390×844, 412×915, 768×1024, 820×1180, 1024×768, 1280×720, 1366×768, 1440×900, 1920×1080.
- Keyboard/screen-reader test desktop and mobile navigation.
- Verify no unapproved offer, review count, Laser/QuietNite claim, referral reward, or provider fact appears.
- Save evidence under docs/evidence/phase-6/.

ACCEPTANCE CRITERIA
- Homepage communicates practice, location, care, differentiators, and next action quickly.
- All priority/goal paths have real destinations.
- Navigation is understandable and fully operable on desktop/mobile.
- The service order is data/config-driven and its business basis is documented.
- No carousel was introduced.

HANDOFF
- Update persistent docs and record any still-provisional priorities.
```

---

## Phase 7 prompt — Trust, authentic media, About, Reviews, Technology, and care-guide UX

```text
You are implementing Phase 7: strengthen credibility, patient anxiety reduction, content accuracy, and existing-patient support.

START
- Work in /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental.
- Read the complete audit and all handoff docs.
- Inspect About, Reviews, Technology content, all image references, assets/team/README.txt, assets/aesthetics/README.txt, and pre-post-op.html/PDFs.

RULES
- Do not generate fake staff portraits, fake patient photos, fake testimonials, or fake before/after cases.
- Do not hotlink the current public site or stock CDN in production output.
- If authentic assets are not supplied, implement a polished image-optional state and an explicit asset manifest. Never create broken frames or hide errors silently.
- Verify credentials and claims against PRACTICE-DECISIONS/CONTENT-APPROVALS.
- Do not deploy.

PRIMARY GOAL
Replace fragile/placeholder trust signals with honest, maintainable proof and make the long care-guide experience usable on mobile.

ABOUT / DOCTOR / TEAM
- Create or complete a dedicated Dr. Mainak Patel page if approved, preserving verified education, affiliations, expertise, local connection, and care philosophy.
- Make technology claims subordinate to patient benefit.
- Keep team bios, but remove broken image requests. When authentic portraits are unavailable, use a consistent text/initial treatment that does not pretend an image loaded.
- Create an authentic-media production manifest with filenames, subjects, consent status, shot purpose, aspect ratios, desktop/mobile crops, alt intent, and owner.
- Include doctor portrait, team group/individuals, office tour, consultation interaction, technology demonstration, aesthetics team, consented testimonial/case, and optional introduction video.

REVIEWS / SOCIAL PROOF
- Remove stale hard-coded counts unless a maintained source/update process exists.
- Link clearly to the approved review platform and provide source/timestamp when manual.
- Do not fabricate, rewrite, or selectively combine patient statements.
- Do not use self-serving Dentist/LocalBusiness review schema.
- Make review content accessible and avoid automatic motion.

TECHNOLOGY
- Create/complete a dedicated Technology page only for confirmed devices/workflows.
- Explain CEREC, digital planning/imaging, Emage, DEKA, and dental laser only where verified, each linked to relevant service pages.
- Separate dental technologies from Facial Aesthetics technologies.
- Avoid state-of-the-art or superiority claims unless substantiated.

PRE/POST-OP CARE
- Preserve all useful, clinician-approved care guides and PDF downloads.
- Replace the 34,000-pixel mobile scroll with search/filter, a sticky treatment index, and accessible accordions or section navigation.
- Accordions must use buttons with aria-expanded and controls; content must remain available for printing and direct fragment links.
- Add last-reviewed date and clinical owner fields in the content system. Do not invent dates or owners.
- Add prominent, approved urgent-warning/contact callouts without diagnosing.
- Reconcile or quarantine QuietNite instructions according to Phase 4.
- Validate every PDF link and the complete-care-guide download.

GLOBAL COPY PASS
- Review every page for clarity, scannability, grammar, repetition, jargon, unsupported claims, anxiety, local relevance, and CTA consistency.
- Lead with patient concern/outcome, then procedure/technology.
- Remove or qualify best, unmatched, guaranteed, safe for everyone, no downtime, predictable outcome, and similar claims.
- Preserve the direct, reassuring tone from the redesign.

IMAGE QUALITY
- For every approved image, create local optimized responsive variants, explicit dimensions/aspect ratio, meaningful alt or empty alt when decorative, and intentional object-position.
- Do not crop faces or text badly. Use separate mobile crops where the composition requires it.

REQUIRED VERIFICATION
- Run a missing-asset check; production output must make zero requests for absent team/aesthetic files.
- Inspect About, provider, Reviews, Technology, Facial Aesthetics, homepage trust sections, and Pre/Post-Op at mobile/tablet/desktop.
- Test care-guide search/filter, direct anchors, accordions, keyboard operation, print/download links, and no-JS content availability where practical.
- Review every visible claim against approval status.
- Save evidence under docs/evidence/phase-7/.

ACCEPTANCE CRITERIA
- No fake/hotlinked/404 trust asset remains.
- Provider/team/review/technology proof is accurate and transparent.
- Pre/Post-Op care is findable quickly on mobile and remains printable/downloadable.
- Copy is patient-centered and unsupported claims are removed or gated.

HANDOFF
- Update status, approvals, asset manifest, decisions, routes, and QA matrix. Clearly list media still required from the practice.
```

---

## Phase 8 prompt — Technical SEO, local SEO, structured data, migration, and blog preservation

```text
You are implementing Phase 8: make the redesign safe to replace the current public website without discarding search equity.

WORKSPACE
- /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental
- Read the audit sections on SEO, migration, structured data, local SEO, routes, and current-vs-redesign comparison.
- Read all handoff docs and inspect every generated route.
- Re-check the live current site and its sitemap because URLs/content may have changed. Use primary search-engine documentation for current technical guidance.

RULES
- Never mass-redirect unrelated URLs to the homepage.
- Never publish canonicals for an unconfirmed new domain.
- Do not create thin doorway pages for nearby cities.
- Do not add unsupported review schema or mark up hidden FAQ.
- Do not deploy or submit Search Console changes in this phase.

PRIMARY GOAL
Produce correct page-level metadata/schema/local signals and a complete, testable migration package for every current indexable URL.

DOMAIN / BRAND GATE
- Read PRACTICE-DECISIONS for the final brand and domain.
- If unresolved, treat winterparkdental.com as the provisional non-deployed migration baseline because it is the current public domain, and explicitly mark the decision blocked. Do not execute a domain move.
- If a domain move is approved, document both-domain verification, one-to-one 301s, Search Console Change of Address, canonical/sitemap changes, and at-least-one-year redirect retention.

METADATA
- Ensure exactly one unique title, description, canonical, robots directive, OG block, Twitter block, and suitable social image per indexable route.
- Remove duplicated tags and meta keywords.
- Confirm one meaningful H1 and logical heading hierarchy.
- Add breadcrumbs visibly and in schema where appropriate.
- Set thank-you, drafts, campaign variants, and unresolved clinical pages to noindex as documented.

STRUCTURED DATA
- Home: one consistent @graph with WebSite, Organization, and accurate Dentist/LocalBusiness data.
- Provider page: Person linked to the practice.
- Service pages: WebPage and Service only for real offered services.
- Interior hierarchy: BreadcrumbList matching visible crumbs.
- FAQPage only for visible FAQs and only when useful; do not promise rich-result eligibility.
- Remove repeated blanket Dentist schema and self-serving aggregateRating markup.
- Validate NAP, geo, hours, URLs, sameAs, founder/provider, and availableService against verified decisions.

LOCAL SEO
- Maintain exact NAP and confirmed hours across page content, schema, contact, footer, migration docs, and GBP launch checklist.
- Add natural Winter Park context to home/provider/contact/service pages.
- Mention Orlando and nearby communities only where accurate and useful, not as duplicated city pages.
- Build service-to-location and related-service internal links.
- Add GBP appointment/service URL + UTM recommendations, review request/response process, directions/map, and local partnership/link plan to docs.

URL MIGRATION
- Crawl/export the entire current public route set, including service pages, provider/technology pages, new-patient resources, legal pages, blog index, and every blog article.
- Complete docs/URL-INVENTORY.csv with current URL, final destination, content parity, redirect code, canonical, indexability, owner, status, and notes.
- Preserve current slugs where practical. If changed, map one-to-one with a single-hop 301.
- Create the platform-appropriate redirect configuration but do not deploy it.
- Add automated redirect tests for status, destination, no chains, no loops, and no mass-home redirects.
- Create a branded 404 and confirm actual 404 status.

BLOG / CONTENT PRESERVATION
- Identify current blog pages with organic traffic/backlinks if data is available; otherwise inventory all and mark prioritization blocked-analytics-access.
- Migrate or prepare static equivalents for valuable current articles, preserving author/date/medical-review status, metadata, internal links, images/rights, and canonical intent.
- Create a maintainable blog index/article template and publishing instructions.
- Do not invent authorship, review dates, or update dates.

SITEMAP / ROBOTS
- Generate sitemap.xml from the approved indexable route registry using final canonical URLs.
- Do not include noindex, redirect, draft, or error routes.
- Keep robots.txt simple and reference the correct sitemap.

LAUNCH DOCUMENTATION
- Create docs/SEO-LAUNCH-CHECKLIST.md covering prelaunch crawl, Search Console verification, DNS/TLS, redirects, sitemap, robots, canonicals, structured data, URL inspection, change of address if applicable, index monitoring, 404s, rankings, conversions, and CWV.

REQUIRED VERIFICATION
- Run metadata uniqueness, canonical, schema syntax, heading, broken-link, sitemap, robots, redirect, indexability, and 404 tests.
- View source on representative home/category/service/provider/blog/contact pages.
- Verify every public URL is accounted for.
- Save reports/evidence under docs/evidence/phase-8/.

ACCEPTANCE CRITERIA
- Every indexable route has clean unique metadata and appropriate schema.
- NAP/domain are consistent or explicitly blocked.
- Every current public URL has a reviewed migration decision.
- Blog/service equity is preserved rather than redirected generically.
- Redirect and SEO launch artifacts are testable but not deployed.

HANDOFF
- Update all persistent docs and clearly identify decisions/access still needed for launch.
```

---

## Phase 9 prompt — Analytics, attribution, campaign landing pages, and agency operations

```text
You are implementing Phase 9: privacy-aware measurement and marketing-agency readiness.

START
- Work in /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental.
- Read the full audit and all handoff docs.
- Inspect the actual analytics, tag manager, call tracking, CRM/practice-management, appointment, consent, and hosting decisions. Do not assume vendors or IDs.

RULES
- Never insert fake GA4/GTM/pixel IDs.
- Never send names, phone numbers, email addresses, form text, symptoms, treatment details, referral friend data, or page content that reveals health interest as custom analytics parameters without qualified privacy/compliance approval.
- Do not enable ad pixels, session recording, call recording, or consent banners without approved vendors/configuration.
- Implement a vendor-neutral event/data layer and wire real integrations only when credentials/config are supplied.
- Do not deploy.

PRIMARY GOAL
Make conversion performance measurable, campaign pages repeatable, and agency releases governed without compromising patient privacy.

EVENT MODEL
Implement or document these privacy-safe events with consistent fields such as page_type, service_slug, cta_location, conversion_type, campaign_source, and success/failure state:
- click_to_call
- appointment_click
- form_start
- appointment_submit_success
- contact_submit_success
- directions_click
- financing_click
- offer_claim
- referral_submit_success
- implant_inquiry
- facial_aesthetics_inquiry
- quietnite_inquiry only if approved
- emergency_call

Requirements:
- Fire success only after confirmed backend success, never on button click.
- Avoid duplicate events on refresh/back navigation.
- Preserve UTMs/referrer through the conversion journey using a documented, privacy-reviewed method.
- Add debug/test mode and an event validation document.
- Exclude all free-text input values from the data layer.

INTEGRATIONS
- If GA4/GTM IDs are provided, integrate through central config and verify debug events.
- If call tracking is approved, preserve canonical crawlable NAP and document dynamic-number replacement behavior/failure fallback.
- If CRM/practice-management attribution is approved, map source/service/campaign fields and document retry/failure handling.
- If consent management is required/selected, implement category-based blocking and accessible controls. If no vendor/decision exists, document exact requirements and keep nonessential tracking disabled.
- Add Search Console/GBP/analytics/call/CRM access requirements using least privilege.

CAMPAIGN LANDING PAGES
Create a reusable accessible landing-page template and approved pages/variants for:
- Dental Implants
- Same-Day Crowns
- Facial Aesthetics
- Invisalign
- QuietNite only after Phase 4 approval
- Laser Dentistry only after Phase 4 approval
- Emergency Dentistry
- New Patient Offer only with approved terms
- Patient Referral Program only with approved terms

Each page must define:
- audience, traffic source, search/ad intent;
- one clear message and CTA;
- practice/provider proof;
- service explanation, expectations, limitations, FAQ;
- concise accessible form or phone-first action;
- approved disclaimers;
- source/UTM/landing-page attribution;
- thank-you route/event;
- indexability. Use the audit portfolio: durable service pages can be indexed; short-lived/duplicate campaign variants should normally be noindex/canonicalized.

Do not create duplicate thin SEO pages. Reuse durable service-page content or create a clearly differentiated campaign variant.

AGENCY OPERATIONS
Create docs/MARKETING-OPERATIONS.md with:
- responsibilities for practice, developer, agency, SEO, writer, photographer, and compliance reviewer;
- least-privilege access list;
- page/campaign brief template;
- content/clinical/compliance approval gates;
- staging, QA, release, rollback, and offer-expiry workflow;
- weekly triage, release cadence, monthly reporting, quarterly accessibility/performance review;
- incident/failure owners for forms, calls, analytics, expired offers, and incorrect hours;
- a dashboard specification: qualified calls, confirmed appointment requests, completion rate, lead-to-scheduled rate, service mix, cost per qualified lead, landing-page conversion, GBP actions, non-brand organic clicks, coverage, rankings, review velocity, 404s, redirects, and CWV.

REQUIRED VERIFICATION
- Use a test/debug mode to prove each implemented event fires exactly once with only approved fields.
- Verify form failures do not emit success.
- Inspect network/data-layer output for PII or message content.
- Test campaign pages and thank-you flows on mobile/tablet/desktop and keyboard.
- Verify noindex/canonical decisions and that unapproved pages are absent from sitemap/nav.
- Save evidence in docs/evidence/phase-9/.

ACCEPTANCE CRITERIA
- There is a coherent vendor-neutral event model.
- Real integrations are present only when approved configuration exists.
- No sensitive form content is exposed to analytics/ad tools.
- Landing pages are useful, non-duplicative, and correctly indexed/noindexed.
- Agency ownership, approval, release, and reporting are documented.

HANDOFF
- Update persistent docs with exact live-vs-placeholder integration status and all remaining access/compliance blockers.
```

---

## Phase 10 prompt — Performance, complete QA, and launch-readiness package

```text
You are implementing the final Phase 10: verify and harden the entire redesign for production. Do not assume prior phases are correct; inspect and test them.

WORKSPACE
- /Users/shashaankshankar/Desktop/Creative/Websites/House of Dental
- Read Winter-Park-Dental-Redesign-Audit.md and every docs/ handoff file.
- Inspect all source, generated output, build scripts, route registry, redirects, forms, analytics, assets, and deployment configuration.

RULES
- Fix defects you find when they are in scope and facts are known.
- Never mark an unverified external integration, clinical fact, legal page, offer, redirect, or analytics event complete.
- Do not invent Core Web Vitals numbers. Measure with available tools and label lab vs field data.
- Do not deploy unless the user explicitly asks in this session. If the target is the existing Sites project, reuse the existing project/static-only workflow rather than creating a duplicate.

PRIMARY GOAL
Produce a verified launch candidate and a clear go/no-go report with zero hidden blockers.

PERFORMANCE
- Run Lighthouse or equivalent lab tests on representative home, Services, Implants, Facial Aesthetics, New Patients, Contact, Pre/Post-Op, and a campaign page at mobile and desktop.
- Record LCP, INP proxy/TBT where applicable, CLS, TTFB, FCP, total transfer, requests, image/font/CSS/JS weight, and third-party impact. Label lab measurements.
- Optimize the actual causes:
  - local responsive AVIF/WebP images with width/height, srcset/sizes, intentional crops, lazy loading below fold, and priority/preload only for true LCP media;
  - self-host/subset or otherwise optimize only the font files/weights used, with good fallbacks and font-display behavior;
  - minify/compress static assets and remove clearly unused CSS/JS without destabilizing design;
  - eliminate failed asset requests and unnecessary third-party connections;
  - ensure new analytics/consent/call scripts are deferred/conditioned and owned.
- Establish documented performance budgets and remeasure after changes.

FULL RESPONSIVE QA
Test every major route/component at:
320×568, 360×800, 375×812, 390×844, 412×915, 768×1024, 820×1180, 1024×768, 1280×720, 1366×768, 1440×900, 1920×1080.

Check:
- image distortion vs intentional crop vs poor object-position;
- horizontal scroll, overlap, clipping, broken grids, long lines, tiny text, button wrapping, blank space, card height, layout shift, sticky obstruction, safe areas, zoom/reflow, menu closing, forms, modal/accordion states, and touch targets;
- every header/footer/nav/CTA/link/form/download/offer/referral/emergency/directions/financing path;
- save representative screenshots for every route and all distinct component states in docs/evidence/phase-10/.

ACCESSIBILITY QA
- Run automated accessibility checks where available, then keyboard and screen-reader-oriented manual tests.
- Verify landmarks, skip link, headings, labels, errors/status, alt text, link/button names, contrast, focus visibility/order, menu/submenu, dialogs, accordions, before/after control, testimonial/motion, reduced-motion, 200%/400% zoom, reflow, and mobile target spacing.
- Remediate all critical/high findings and document any lower-risk remaining item with owner/date.

FUNCTIONAL / CONTENT QA
- Build from clean source; validate no generated file requires manual edits.
- Check internal/external links, missing assets, duplicate IDs, console errors, PDF downloads, form success/failure, phone/directions, 404 status, noindex routes, and external integrations.
- Check every visible business/clinical claim against PRACTICE-DECISIONS and CONTENT-APPROVALS.
- Confirm no stale review count, expired offer, unapproved referral reward, unresolved QuietNite/Laser claim, broken team image, stock fallback, fake asset, or old-brand remnant remains.
- Confirm terms/privacy/accessibility links and current NAP/hours.

SEO / MIGRATION QA
- Crawl the launch candidate.
- Validate unique titles/descriptions/H1s, canonicals, robots, sitemap coverage, structured data, breadcrumbs, status codes, redirect map, no chains/loops, blog/service parity, and 404 recovery.
- Perform a migration dry run against docs/URL-INVENTORY.csv.
- Confirm every current public URL returns an equivalent 200 destination or an intentional one-hop 301 in the test environment.

CONVERSION / ANALYTICS QA
- Test each conversion path from entry page to confirmed result: call, appointment, new patient, contact, implant, cosmetic, Facial Aesthetics, approved QuietNite/Sleep/Laser, offer, referral, financing, directions, emergency.
- Verify event uniqueness, correct attribution, no PII/health-text leakage, failure handling, and consent behavior.
- If any real backend/ID/access is missing, mark launch blocked rather than simulating success.

DELIVERABLES
Create/update:
- docs/LAUNCH-READINESS.md with go/no-go verdict, severity-ranked findings, owner, status, evidence, and retest result;
- docs/LAUNCH-CHECKLIST.md with exact prelaunch, launch-window, rollback, and first-30-day steps;
- docs/PERFORMANCE-REPORT.md with before/after measured results and limitations;
- docs/ACCESSIBILITY-REPORT.md with automated/manual results;
- docs/MIGRATION-VALIDATION.md;
- docs/FORM-AND-ANALYTICS-VALIDATION.md;
- all persistent status/decision/approval/URL/QA files.

GO/NO-GO GATES
The candidate is NO-GO if any of these remains:
- broken mobile menu or unreachable content;
- unverified form delivery or false success;
- unresolved public QuietNite/Laser contradiction;
- missing one-to-one migration for meaningful current URLs;
- inconsistent domain/canonical/NAP;
- missing legal/privacy review for public forms/referrals/offers;
- critical/high accessibility barrier;
- broken assets/routes or significant responsive failure;
- analytics leaking PII/health content;
- unapproved clinical/business claims.

FINAL RESPONSE
- Lead with GO or NO-GO.
- List what you implemented and fixed.
- Give exact commands/tests, measured results, evidence paths, and remaining blockers.
- Do not deploy unless explicitly authorized.
```

## Recommended use

1. Start a new 5.6 Luna Max session in the same workspace.
2. Paste Phase 1 only.
3. Do not proceed until its acceptance criteria and handoff file are complete.
4. Start a new session and paste Phase 2. Continue in order.
5. Between phases, answer or record practice decisions in `docs/PRACTICE-DECISIONS.md`; the most consequential checkpoints are the domain/brand, service priorities, Laser/QuietNite protocol, form backend, referral terms, offers, insurance/financing, hours, and authentic assets.
6. Phase 10 is the release gate. A NO-GO result should not be overridden merely because all ten prompts were run.
