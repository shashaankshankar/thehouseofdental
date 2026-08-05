# Phase 5 form and integration test record

Date: 2026-08-04  
Environment: local generated `dist/` preview at `http://127.0.0.1:4173/`  
Deployment: not performed

## Current production integration state

The appointment form has no approved handler URL, provider, notification destination, or server-side integration in `config/site.json`. The generated form therefore omits the old unverified `data-netlify` attribute and renders `data-handler-status="blocked_no_approved_handler"`. The user-facing fallback says that nothing was sent and directs the patient to call the office.

The client includes required-field validation, an error summary, field associations, loading/disabled state, in-flight duplicate protection, a honeypot, retry behavior, a ten-second network timeout, and safe status messaging. Platform rate limiting, CSRF protection, server-side validation, notification delivery, and failure alerting remain pending the approved destination; they are not represented as complete by the static build.

## Browser state matrix

The test adapter seam was used only to exercise deterministic UI states. No patient payload, sensitive detail, or credential was logged.

| State | Result |
|---|---|
| Empty submit | Seven required controls are marked invalid; the summary is visible with seven focusable error links and the live status asks the user to review the fields. |
| Unconfigured handler | No request is sent; the status says online requests are not connected in the local build and provides the call fallback. |
| Network exception | No success is shown; the status says nothing was confirmed and exposes Retry. |
| Non-2xx/server rejection | No success is shown; the status says the intake system did not accept the request and exposes Retry. |
| Duplicate submit | The submit control is disabled while the first request is pending; a second submit receives “This request is already being processed.” |
| Approved-adapter success | A simulated `{ok:true}` result shows the success status and can redirect to the noindex appointment status route. This is a seam test, not proof of a live integration. |
| Honeypot | A populated hidden field blocks sending and directs the caller to the office. |

## Required follow-up before production

1. Confirm the practice-approved scheduling, CRM, or practice-management destination.
2. Confirm the notification recipient, failure-alert owner, retention policy, and response workflow.
3. Implement and verify server-side validation, rate limiting, CSRF/platform equivalent, and duplicate handling at that destination.
4. Test live success, network failure, server rejection, duplicate submission, retry, and confirmation routing without exposing form contents to analytics or logs.
5. Replace the temporary policy placeholders only after legal/compliance review.
