# Phase 5 release gate

Date: 2026-08-04  
Scope: patient-support and lead-conversion infrastructure outside the homepage  
Deployment: intentionally not performed

## Verified locally

- New Patients support paths exist for forms, insurance/financing questions, savings-plan context, special offers, patient resources, and urgent dental needs.
- The secure new-patient form destination is not invented: the page is noindex, calls out that verification is pending, and provides a phone fallback.
- Insurance/financing copy is call-to-verify and does not claim carrier participation, lender approval, rates, or savings terms.
- Offers are a reusable neutral hub with no public price, eligibility, expiration, or reward claim until terms are approved.
- Referral is an unlinked noindex draft with no reward or submission flow.
- Urgent routing is phone-first, distinguishes 911/emergency-department guidance, and does not diagnose or promise same-day care.
- Privacy, Terms, and Accessibility are real footer links but remain noindex legal-review placeholders; no invented legal language is presented as approved policy.
- Appointment validation and truthful unconfigured/error states are covered by the local browser matrix in `phase-5-browser-qa.json` and `phase-5-integration-tests.md`.
- Appointment and offer status routes are noindex and do not claim a successful submission or offer eligibility in the static build.
- Missing URLs return the branded 404 document with a local HTTP 404 status, Home/Services/Contact links, a phone link, and the urgent path.
- Mobile sticky Call and Request Appointment actions remain present without horizontal overflow at the checked viewports.

## Release blockers

- No approved appointment handler, CRM/practice-management destination, notification recipient, response SLA, or live delivery test exists.
- Platform/server-side spam controls, rate limiting, CSRF equivalent, server-side validation, and failure-alert ownership are pending that integration.
- The secure current new-patient forms URL is not verified.
- Offers, savings-plan terms, referral terms/reward, insurance participation, financing partners, and Friday/after-hours routing require practice input.
- Privacy, Terms, and Accessibility copy requires legal/compliance review.
- Normal validation still reports seven pre-existing missing About-team image assets; strict validation is intentionally blocked by those files.

This is a local QA handoff, not a production approval. Do not deploy until the blockers above have named owners and passing live verification.
