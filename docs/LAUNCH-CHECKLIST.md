# Launch Checklist

This checklist starts from the Phase 10 **NO-GO** candidate. A release owner must record a name, date, and evidence link for every completed item.

## Prelaunch — required before GO

- [ ] Practice/legal approves the public brand relationship and final canonical domain.
- [ ] Practice confirms address, phone, email, hours, Friday status, map pin, and social ownership against the production source of truth.
- [ ] Clinical/practice/compliance approves every enabled service, provider fact, FAQ, care guide, warning, and local-business schema fact.
- [ ] Facial Aesthetics, Sleep, Laser Dentistry, and QuietNite are either fully approved with source-backed copy or remain disabled/noindex with no active campaign.
- [ ] Legal approves Privacy, Terms, Accessibility, form notice, offers, referrals, financing language, and consent behavior.
- [ ] Authentic media, review source, testimonials, case imagery, rights, consent, crops, and alt intent are approved.
- [ ] Appointment handler/CRM is configured in a test environment with server validation, spam protection, rate limiting, notification ownership, retention, monitoring, retry/failure behavior, and real success confirmation.
- [ ] Analytics/call tracking/consent vendor decisions, IDs, payload mapping, access, retention, and publish ownership are approved; a privacy review confirms no PII or health/free text leaks.
- [ ] Complete production crawl and Search Console/analytics export; resolve the 39 blocked/held markers across 37 URL rows.
- [ ] Approve every one-hop redirect and verify meaningful current URLs return an equivalent 200 or direct 301 to an equivalent 200; no chains, loops, or mass-home redirects.
- [ ] Re-run `npm test`, every validator, the 12-viewport browser matrix, the accessibility manual suite, and mobile/desktop performance lab on the release commit.
- [ ] Test the exact deployment artifact in a production-like preview with compression, TLS, canonical host, security headers, 404 behavior, robots, sitemap, and cache rules.
- [ ] Obtain final GO signoff from practice, clinical, legal/privacy, SEO/migration, technical, and release owners.

## Launch window

- [ ] Freeze content, configuration, redirects, analytics, and form mappings to the signed release commit.
- [ ] Record the previous deploy identifier and keep the prior static artifact available for rollback.
- [ ] Deploy through the existing static-only project/workflow; do not create a duplicate project.
- [ ] Verify home, Services, Implants, New Patients, Contact, care guidance, legal pages, sitemap, robots, and one unknown URL over production HTTPS.
- [ ] Verify representative old URLs return the approved one-hop 301 and their destinations return 200.
- [ ] Complete a real authorized appointment submission with practice-owned test data; confirm notification, backend record, thank-you state, failure alerting, and deduplicated analytics.
- [ ] Verify phone, directions, financing, emergency, approved campaign, consent, and analytics paths without exposing entered data in URLs, logs, or event payloads.
- [ ] Inspect production canonical/schema/NAP, mobile navigation, focus behavior, images, console, requests, and field/lab performance.
- [ ] Submit the approved sitemap and complete Search Console actions only after the canonical-domain decision is active.
- [ ] Record launch time, release owner, deployment ID, test results, and any accepted lower-risk issue.

## Rollback triggers and steps

Rollback immediately for false form success, lost submissions, PII/health-text leakage, broken mobile navigation, widespread 4xx/5xx, incorrect canonicals/domain, redirect loops, missing meaningful content, legal/clinical contradiction, or significant accessibility regression.

1. Stop campaign traffic and nonessential tracking first if either contributes to the incident.
2. Restore the previous known-good static artifact using the existing project workflow.
3. Restore the prior redirect/canonical configuration if the incident is migration-related.
4. Disable the form handler and return to the explicit call-first/unconfigured state if submission integrity is uncertain.
5. Confirm home, contact, phone, 404, robots, sitemap, and representative redirects after rollback.
6. Notify practice, technical, privacy/legal, clinical, and SEO owners; preserve timestamps and sanitized evidence.
7. Reopen launch only after root cause, fix, approval, and full retest are recorded.

## First 30 days

- Day 0–1: monitor availability, 404s, form success/failure, notifications, consent, analytics uniqueness, crawlability, sitemap processing, and priority redirects.
- Days 2–7: review Search Console coverage, redirect hits, top landing pages, field Core Web Vitals, conversion failures, phone/directions paths, and user-reported accessibility issues daily.
- Days 8–14: reconcile old/new URL traffic, orphaned content, blog parity, schema warnings, unlinked pages, and campaign attribution; correct only with approved evidence.
- Days 15–30: compare field performance against budgets, review form/CRM SLA and data minimization, audit permissions, validate review/media ownership, and close or schedule remaining low-risk items.
- Day 30: produce a signed post-launch report with uptime, forms, redirects, indexing, field CWV, accessibility feedback, conversion integrity, incidents, and retained rollback plan.
