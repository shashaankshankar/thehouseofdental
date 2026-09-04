# GA4 production measurement and reporting handoff

House of Dental is the first live website on the measurement and reporting platform. Consent-gated GA4 collection is active on the public Cloudflare site. The implementation uses advanced Consent Mode v2: analytics and advertising storage default to denied, restricted cookieless measurement may occur before a choice, and business events require an explicit analytics grant. The server-side reporting connection remains inactive until read-only property access is granted, the property metadata is reconciled, and the open privacy/governance evidence is recorded.

## Single source of configuration

Use `measurement/site.json` for all non-secret GA4 site settings. It is the only file that needs the Measurement ID, GA4 property ID, web-stream ID, timezone, attribution policy, and future connector principal. The static website receives only the public provider, enablement flag, Measurement ID, consent configuration, UTM-only attribution policy, event policy, and route eligibility. It never receives platform credentials or private property metadata.

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
| `form_step` | Implemented | A numeric step transition in the eligible appointment flow; only steps 1–3 are accepted. |
| `form_submit` | Implemented | The contact-message endpoint confirms technical delivery. |
| `appointment_request` | Implemented | The appointment/contact request was accepted for email notification; this is not a booked appointment. |
| `phone_click` | Implemented | A visitor activates an annotated phone link. |
| `email_click` | Ready when a mailto link exists | A visitor activates an annotated email link. |
| `cta_click` | Implemented | A visitor activates an annotated approved CTA, including review, financing, care, and offer links. |
| `file_download` | Implemented | A visitor activates a care-guide PDF download; only the generic `care_guide` category is sent. |
| `generate_lead` | Implemented | The validated request is accepted by Resend for delivery to the office; it is not a booked appointment. |

Every event is consent-gated, route-gated, and parameter-whitelisted. `page_path` is the clean pathname. `page_location` contains only the origin, pathname, and validated `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` keys. Unknown query parameters, unsafe UTM values, and unapproved fragments fail closed; fragments are never forwarded. Page title, referrer, file name, treatment name, form values, patient information, and other prohibited data are excluded.

## Production reconciliation and reporting connection

1. Reconcile the values in `measurement/site.json` with the client-owned GA4 property. The repository source of truth currently records property `549721844`, web stream `15427015396`, and Measurement ID `G-TC66MQQ0T7`.
2. Record the required healthcare/privacy approval and the owner who approved the production route and consent configuration.
3. Run `npm run check`.
4. In production, verify denied, granted, changed-consent, prohibited-route, unknown-route, approved-UTM, unapproved-query, and fragment cases; then validate each implemented event in GA4 DebugView. Confirm `file_download` contains only `file_category=care_guide` and `form_step` contains only an integer from 1 through 3.
5. Grant the reporting principal Viewer access and add the connection, property, stream, reporting scope, effective dates, and status to the reporting platform's `website_analytics_assignments` record.

Passing local checks does not grant client approval or establish server-side GA4 access. Local tests do not send real analytics or contact messages. A public browser audit confirmed a consent-controlled request to Measurement ID `G-TC66MQQ0T7`, but only GA4 account evidence can confirm receipt in the intended property and stream.
