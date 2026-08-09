# GA4 pilot approval and activation handoff

House of Dental is configured as the first healthcare pilot for the measurement and reporting platform. The website-side adapter, measurement contract, and route safety controls are in place, but GA4 remains inactive until client and privacy approvals are complete.

## Single source of configuration

Use `measurement/pilot-site.json` for all non-secret GA4 pilot settings. It is the only file that needs the client-provided Measurement ID, GA4 property ID, web-stream ID, timezone, and future connector principal. The static website receives only the public provider, enablement flag, Measurement ID, consent configuration, event policy, and route eligibility. It never receives platform credentials or private property metadata.

## Client inputs and approvals

- Confirm that the client owns the GA4 property and its web stream.
- Provide the numeric GA4 property ID, numeric web-stream ID, Measurement ID (`G-XXXXXXXXXX`), and property timezone.
- Approve the healthcare analytics eligibility decision and privacy-policy/consent wording.
- Grant the agency reporting connector's service-account principal **Viewer** access with `analytics.readonly`.
- Approve which routes change from `requires_review` to `approved` in `measurement/eligibility/routes.json`.
- Confirm that the appointment endpoint's delivery destination is an approved first-party system and that the privacy policy describes its actual behavior.

Do not add service-account keys, OAuth client secrets, appointment tokens, or other secrets to this repository.

## Event contract

| Event | Current status | Meaning |
| --- | --- | --- |
| `form_start` | Implemented | First focus in the eligible appointment form. |
| `form_submit` | Implemented | The appointment endpoint confirms technical delivery. |
| `appointment_request` | Implemented | An approved appointment request was delivered. |
| `phone_click` | Implemented | A visitor activates an annotated phone link. |
| `email_click` | Ready when a mailto link exists | A visitor activates an annotated email link. |
| `cta_click` | Implemented | A visitor activates an annotated appointment or directions CTA. |
| `generate_lead` | Intentionally blocked | Requires an approved downstream valid-lead confirmation. |

Every event is consent-gated, route-gated, and parameter-whitelisted. Only pathname, approved CTA location/type, and approved service category may be sent. Form values, patient information, query strings, titles, and other prohibited data are excluded.

## Activation and verification

1. Update the client values in `measurement/pilot-site.json`.
2. Obtain the required healthcare/privacy approvals, then change only approved routes in `measurement/eligibility/routes.json`.
3. Set `ga4.enabled` to `true`.
4. Run `npm run check`.
5. In the deployed environment, verify no-consent, grant, deny, changed-consent, prohibited-route, unknown-route, and query-string cases; then validate events in GA4 DebugView.
6. Add the connection, property, stream, reporting scope, effective dates, and status to the reporting platform's `website_analytics_assignments` record.

Passing local checks does not grant client approval, establish GA4 access, or prove that production traffic has reached GA4.
