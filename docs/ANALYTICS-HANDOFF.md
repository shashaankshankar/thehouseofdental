# GA4 production measurement and reporting handoff

House of Dental is the first live website on the measurement and reporting platform. Consent-gated GA4 collection is active on the public Cloudflare site. The server-side reporting connection remains inactive until read-only property access is granted, the property metadata is reconciled, and the open privacy/governance evidence is recorded.

## Single source of configuration

Use `measurement/site.json` for all non-secret GA4 site settings. It is the only file that needs the Measurement ID, GA4 property ID, web-stream ID, timezone, and future connector principal. The static website receives only the public provider, enablement flag, Measurement ID, consent configuration, event policy, and route eligibility. It never receives platform credentials or private property metadata.

## Client inputs and approvals

- Confirm that the client owns the GA4 property and its web stream.
- Provide the numeric GA4 property ID, numeric web-stream ID, Measurement ID (`G-XXXXXXXXXX`), and property timezone.
- Approve the healthcare analytics eligibility decision and privacy-policy/consent wording.
- Grant the agency reporting connector's service-account principal **Viewer** access with `analytics.readonly`.
- Record the named approval for the production routes currently marked `approved` in `measurement/eligibility/routes.json`.
- Confirm that the contact-message delivery destination is an approved email/notification system and that the privacy policy describes its actual behavior.

Do not add service-account keys, OAuth client secrets, appointment tokens, or other secrets to this repository.

## Event contract

| Event | Current status | Meaning |
| --- | --- | --- |
| `form_start` | Implemented | First focus in the eligible appointment form. |
| `form_submit` | Implemented | The contact-message endpoint confirms technical delivery. |
| `appointment_request` | Implemented | The appointment/contact request was accepted for email notification; this is not a booked appointment. |
| `phone_click` | Implemented | A visitor activates an annotated phone link. |
| `email_click` | Ready when a mailto link exists | A visitor activates an annotated email link. |
| `cta_click` | Implemented | A visitor activates an annotated appointment or directions CTA. |
| `generate_lead` | Intentionally blocked | Requires an approved downstream valid-lead confirmation. |

Every event is consent-gated, route-gated, and parameter-whitelisted. Only pathname, approved CTA location/type, and approved service category may be sent. Form values, patient information, query strings, titles, and other prohibited data are excluded.

## Production reconciliation and reporting connection

1. Reconcile the values in `measurement/site.json` with the client-owned GA4 property. The repository source of truth currently records property `549721844`, web stream `15408312790`, and Measurement ID `G-TC66MQQ0T7`.
2. Record the required healthcare/privacy approval and the owner who approved the production route and consent configuration.
3. Run `npm run check`.
4. In production, verify denied, granted, changed-consent, prohibited-route, unknown-route, and query-string cases; then validate each implemented event in GA4 DebugView.
5. Grant the reporting principal Viewer access and add the connection, property, stream, reporting scope, effective dates, and status to the reporting platform's `website_analytics_assignments` record.

Passing local checks does not grant client approval or establish server-side GA4 access. A public browser audit confirmed a consent-controlled request to Measurement ID `G-TC66MQQ0T7`, but only GA4 account evidence can confirm receipt in the intended property and stream.
