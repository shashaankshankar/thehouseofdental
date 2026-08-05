# Phase 6 release gate

Date: 2026-08-04  
Scope: integration of Phase 1–5 service, support, and patient flows into homepage/global acquisition  
Deployment: intentionally not performed

## Verified locally

- Homepage hero uses the approved audit direction: “Advanced Dentistry, Designed Around You,” Winter Park location context, personalized dental care, implants, same-day crowns, preventive care, primary appointment CTA, and phone CTA.
- The office exterior remains the hero image with intentional responsive cropping; no carousel or auto-rotating hero was introduced.
- Trust proof is maintainable and non-numeric: Dr. Mainak Patel, DMD; Same-Day CEREC Crowns; new-patient appointments with call-to-confirm language; and Read Verified Patient Reviews.
- Homepage goal cards and the Services overview use `data/acquisition.json` and lead to dedicated routes rather than generic modals or dead anchors.
- Featured care is data-driven and currently provisional: Dental Implants, Same-Day Crowns, and Invisalign. The order is explicitly labeled as an audit-safe hybrid, not a popularity or business-priority claim.
- Facial Aesthetics, Laser Dentistry, QuietNite, Sleep Better, Special Offers, and Referral Program are absent from public homepage/global navigation because their Phase 4/5 approval gates remain unresolved.
- Desktop navigation is grouped and compact at 1440px; mobile navigation exposes quick actions first and uses accessible accordion controls for Services, New Patients, Patient Resources, and About.
- Tablet hero height/padding is reduced for short landscape viewports so the verified trust strip clears the sticky mobile action bar.
- Review counts/ratings, unapproved offers, outcomes, scarcity, provider facts, and credentials were not invented. The public indexable output contains no hard-coded `5.0`, `332`, Google rating, or Google review total.
- Persistent local QA evidence is in `phase-6-browser-qa.json`, `phase-6-integration-tests.md`, the twelve homepage viewport captures, the navigation captures, and the Services captures.

## Still provisional or blocked

- Practice priority order, capacity, margins, case acceptance, seasonality, and de-emphasized services still need named business input. Update `the-house-of-dental-site/data/acquisition.json` rather than changing page markup when those inputs arrive.
- Facial Aesthetics public placement and credentials/media, dental laser facts, Sleep & Snoring/QuietNite protocol, current offers/referral terms, review-source ownership, appointment handler, legal copy, hours, and complete practice approvals remain open.
- The seven missing local About-team images remain normal-validation warnings and strict-validation blockers.
- The appointment form is still a local unconfigured handoff; no live submission or CRM integration was enabled.

This is a local QA handoff, not production approval. Do not deploy until the practice and clinical/compliance owners resolve the open gates and the live appointment path is verified.
