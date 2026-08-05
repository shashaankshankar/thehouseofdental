# Marketing operations and agency handoff

**Status:** local operating model and release checklist; no agency access or vendor connection has been granted
**Applies to:** The House of Dental website, campaign variants, local SEO, measurement, forms, offers, and content releases

## Operating principles

- The practice owns clinical truth, patient safety, privacy, legal terms, hours, NAP, offers, and final publication approval.
- A marketing agency may prepare briefs, media, copy, QA, and reporting only within the access and approval scope granted by the practice.
- Campaign variants are not automatically durable SEO pages. Short-lived, duplicate, paid, or approval-pending variants remain noindex and out of the sitemap until the SEO owner approves a durable indexable page.
- No analytics or marketing vendor is installed by assumption. Measurement stays vendor-neutral until the practice approves the vendor, consent behavior, retention, event mapping, and access owner.
- No event may include patient identity, contact information, health-interest details, diagnosis, treatment details, referral-friend data, or free-form text.

## Roles and ownership

| Role | Owns | Must approve or be consulted |
|---|---|---|
| Practice owner | Final business truth, NAP, hours, offer/referral terms, budget, release decision | Every public campaign, vendor, and material conversion change |
| Clinical owner | Clinical accuracy, candidacy, risks, limitations, care, urgent wording, provider scope | Service/campaign copy, FAQs, care guides, laser/QuietNite/aesthetics gates |
| Compliance/legal owner | Privacy, consent, advertising language, offer/referral disclosures, media consent, retention | Forms, pixels, recording, offers, referral flows, claims, testimonials |
| Website implementation owner | Build, data layer, integration gates, accessibility, source integrity, rollback artifact | All code/config changes and release evidence |
| Marketing agency | Briefs, channel execution, approved creative, landing-page QA, reporting, optimization recommendations | Practice/clinical/compliance approval before publication or spend |
| SEO/content owner | Information architecture, metadata, canonical/indexability, redirects, content calendar | Practice/clinical/legal review for facts and claims |
| Form/CRM owner | Handler, notifications, dedupe, spam/security, retention, response SLA | Practice, privacy, and implementation owner before live success events |

## Access and least privilege

Grant only the access required for the current work and review it quarterly or after a personnel change.

| System or asset | Default owner | Agency access | Guardrail |
|---|---|---|---|
| Source repository and build | Practice/implementation owner | Review or scoped branch access only | No direct production deploy permission by default |
| Hosting/DNS | Practice owner or designated technical owner | None unless explicitly approved | Separate deploy approval from content approval |
| Analytics/property | Practice/marketing owner | Read or analyst role only until trusted | No audience export, identity data, or unreviewed custom dimensions |
| Tag manager | Practice/technical owner | No publish permission by default | Two-person review for tags, triggers, consent, and destinations |
| CRM/practice management | Practice/form owner | No patient-record access by default | Use aggregate reporting or redacted exports only |
| GBP/social/ad accounts | Practice/marketing owner | Channel-specific role | No unapproved offer, claim, review, or patient media |
| Media and consent records | Practice owner/compliance | Upload/review only | Rights, consent, alt intent, and expiry owner recorded |
| Search Console | Practice/SEO owner | Read or delegated analysis | No Change of Address or sitemap submission without launch signoff |

Credentials must remain outside the repository. Rotate exposed credentials immediately and record the incident.

## Campaign and content brief

Every new campaign or durable page starts with a written brief containing:

1. Audience and exclusion criteria.
2. Traffic source and channel owner.
3. Search/ad intent and the single patient question being answered.
4. Approved message, headline, support copy, and one primary CTA.
5. Proof source: practice-approved NAP, provider, technology, media, cases, reviews, or other evidence.
6. What happens after the CTA, including owner, response expectation, and fallback phone path.
7. Limitations, alternatives, candidacy boundaries, safety/urgent guidance, and FAQ answers.
8. Offer/referral terms, if applicable: eligibility, inclusions, exclusions, expiry, stacking, payment/insurance, consent, and abuse controls.
9. Attribution plan using only approved aggregate fields and a documented UTM pattern.
10. Thank-you or confirmation behavior based on confirmed backend success.
11. Indexability decision: durable indexable page, noindex campaign variant, canonical target, and expected removal date.
12. Named practice, clinical, compliance, SEO, and implementation approvers.

The local campaign template records these fields in `the-house-of-dental-site/data/campaign-pages.json` and visibly exposes the governance state on each noindex preview.

## Approval and release gates

### Content and clinical gate

- Confirm the service, provider, device, protocol, candidacy, risks, alternatives, recovery variability, care, and claims.
- Verify every NAP, hour, map, phone, email, and response expectation against the practice source of truth.
- Approve authentic media, rights, consent, crop, and alt intent.

### Privacy and integration gate

- Approve vendor, purpose, consent category, retention, access, and data-processing terms.
- Approve the event map and confirm that no field or URL projection contains PII, health-interest content, or free text.
- Approve form/CRM destination, server validation, spam controls, dedupe, notification owner, retention, and failure behavior.

### Release gate

- Build cleanly and run structural, Phase 8, and Phase 9 validation.
- QA mobile, tablet, desktop, keyboard/focus, form states, CTA destinations, noindex/canonical/sitemap state, and network requests.
- Record the release commit, evidence, approver names/date, rollback artifact, and monitoring owner.
- For paid campaigns, confirm the ad destination, UTM pattern, budget, audience, exclusions, frequency, and expiry owner.

### Rollback and expiry

- Pause media and paid traffic first when a claim, offer, form, tracking, or clinical issue is discovered.
- Restore the last approved artifact and configuration; do not delete the evidence or overwrite the source of truth.
- Remove or noindex expired campaign variants, revoke obsolete vendor access, and archive the brief, terms, and final report.

## Operating cadence

| Cadence | Review |
|---|---|
| Each release | Build, validation, route/indexability, accessibility, form truthfulness, event payload, network/vendor surface, and approval record |
| Weekly | Leads by source, qualified calls, appointment requests, failed forms, response SLA, spend/pacing, offer/referral status, urgent-path issues, and 404s |
| Biweekly | Search queries/landing pages, service mix, creative/CTA tests, campaign quality, local actions, consent/vendor changes, and backlog |
| Monthly | Lead-to-scheduled and completion rates, CPL, landing conversion, nonbrand organic clicks, GBP actions, ranking movement, reviews, redirects, CWV, and content performance |
| Quarterly | Access review, vendor/consent inventory, event contract, privacy/retention, NAP/hours, offer terms, clinical claims, media rights, redirects, and disaster recovery |

## Incident and escalation playbook

Escalate immediately to the practice owner, implementation owner, and compliance/clinical owner as applicable for:

- a form that reports success without confirmed backend success;
- a missing, duplicated, or misrouted appointment notification;
- any analytics or CRM payload containing identity, health-interest, referral-friend, or free-text data;
- an unapproved pixel, session recorder, call recorder, vendor script, or consent behavior;
- a clinical, offer, referral, review, provider, media-rights, NAP, hours, or legal-claim discrepancy;
- a broken urgent path, wrong phone number, broken directions, exposed draft, 404 surge, redirect loop, or material CWV regression.

Pause the affected campaign, preserve redacted evidence, identify the last approved state, remediate, re-test, and document the decision before resuming spend or publication. Do not email credentials, patient data, or unredacted form payloads during escalation.

## Dashboard specification

The reporting view should distinguish measured, confirmed, and unavailable metrics. Until approved integrations exist, values that depend on analytics, call tracking, CRM, GBP, Search Console, or ad platforms remain explicitly unavailable rather than estimated.

### Conversion and operations

- qualified calls;
- confirmed appointment requests;
- form completion rate;
- lead-to-scheduled rate;
- service mix;
- cost per lead;
- landing-page conversion rate;
- form failure/timeout rate and response-SLA attainment.

### Local and organic visibility

- Google Business Profile actions;
- nonbrand organic clicks;
- coverage/indexing status;
- rankings for approved service/local-intent terms;
- review velocity and source status;
- 404s, redirect errors, canonical/indexability exceptions;
- Core Web Vitals and material performance regressions.

Every dashboard tile needs a definition, source, owner, date range, filter scope, freshness timestamp, and known limitation. No dashboard should expose raw form submissions, patient identifiers, health-interest text, referral-friend data, or call recordings.
