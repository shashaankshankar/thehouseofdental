# Phase 10 Form and Analytics Validation

## Verdict

**Blocked for launch.** The local form and event contract are safe and fail closed, but no production backend, notification path, CRM, analytics, consent, call-tracking, or campaign vendor has been approved or live-tested.

## Appointment form results

| Test | Result | Evidence |
|---|---|---|
| Empty submit | Seven required controls marked invalid; visible live status; focus moved to `f-name` | `docs/evidence/phase-10/contact-form-validation.json` |
| Unconfigured handler | Explicit error: nothing was sent; no success redirect/event; submit state restored | `docs/evidence/phase-10/contact-form-unconfigured.json` |
| Hidden retry state | Fixed; `hidden=true` now computes to `display:none` until a retryable configured-network failure | `final-contact-form-unconfigured-390x844.png` |
| Data minimization | No diagnosis/history request; optional note warns against sensitive medical detail; privacy acknowledgement required | Generated contact source |
| Honeypot | Present, keyboard-excluded, hidden from the visual layout | Generated contact source |
| Production delivery | Not tested because the handler is intentionally empty | Launch blocker |

The local dummy values used for browser QA used an `.invalid` email and were not transmitted. No external submission was attempted.

## Analytics/privacy results

- No GA4, GTM, ad pixel, session recorder, call tracker, CRM, consent platform, or third-party runtime request is present.
- The event builder allowlists aggregate fields only: event, page type, service slug, CTA location, conversion type, campaign source, and state.
- Names, phone numbers, email addresses, messages, symptoms, diagnoses, treatment detail, raw URLs, page text, and free-text query values are not accepted by the event contract.
- Form success is reserved for an approved backend response with explicit success; validation, unconfigured, network, and server failures cannot become a conversion success.
- Campaign variants remain local/noindex; blocked Facial Aesthetics, QuietNite, Laser, offer, and referral actions do not expose unapproved success events.
- Lab performance instrumentation is opt-in by `?hod_perf=1`, document-local, and never sent externally.

## Required production integration tests

1. Approve the handler/CRM, data map, server validation, spam/rate/CSRF controls, retention, access, notification owner, SLA, monitoring, and privacy notice.
2. Use authorized practice-owned test data to verify success, rejection, timeout, duplicate, retry, notification, backend record, thank-you state, and operator recovery.
3. Inspect browser network, server logs, analytics debug view, tag manager, CRM, email/SMS notifications, and URLs to prove that PII/health/free text is absent from analytics and unnecessary logs.
4. Approve consent categories and verify default-denied behavior where required, state changes, withdrawal, and no pre-consent nonessential requests.
5. Verify every call, appointment, implant, cosmetic, aesthetics, financing, directions, emergency, offer, referral, and approved campaign event fires once with correct aggregate attribution.
6. Verify call-tracking number replacement does not break canonical NAP, call quality, consent/recording rules, or mobile links.

Do not enable a real endpoint or analytics vendor until legal/privacy, practice, technical, and marketing owners sign off and the production-like tests pass.
