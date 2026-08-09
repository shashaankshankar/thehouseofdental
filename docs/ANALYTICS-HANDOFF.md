# GA4 approval and activation handoff

## Current state

GA4 is prepared but inactive. The public configuration is deliberately fail-closed:

```json
"analytics": {
  "provider": "gtag",
  "enabled": false,
  "measurementId": ""
}
```

With this configuration, the site does not create a Google Analytics request, consent banner, or conversion event. Do not enable it until every approval below is documented.

After activation, Consent Mode v2 initializes the Google tag with every storage category denied. This may send consent-mode requests without analytics storage; the five custom conversion events below remain blocked until a visitor selects “Allow analytics.” The client’s approved privacy and consent language must describe this behavior accurately.

## Client approvals required

- GA4 property ownership: the client confirms its Google account owns the GA4 property and controls access.
- Measurement ID: provide the approved web-stream ID in the form `G-XXXXXXXXXX`.
- Privacy language: approve the privacy-policy wording that describes Google Analytics and its purpose.
- Consent wording: approve the banner text and the choice labels, including the denied-by-default setting.
- Event and conversion list: approve the five events below and identify which should be marked as GA4 key events.
- Retention settings: approve GA4 data-retention, Google Signals, advertising features, and access settings in the client-owned property.

## Prepared measurement plan

| Event | When it is sent | Allowed metadata |
| --- | --- | --- |
| `phone_click` | A visitor selects a phone link | `page_path`, `cta_location: phone_link` |
| `appointment_cta_click` | A visitor selects a Book Appointment link | `page_path`, `cta_location: appointment_link` |
| `form_start` | The appointment form receives its first focus | `page_path`, `cta_location: appointment_form` |
| `appointment_request_success` | The appointment endpoint confirms successful delivery | `page_path`, `cta_location: appointment_form` |
| `directions_click` | A visitor selects a directions link | `page_path`, `cta_location: directions_link` |

The event whitelist never accepts form field names or values. Names, emails, phone numbers, messages, health details, appointment details, and other sensitive data must not be sent to GA4. The form conversion is sent only after the endpoint reports successful delivery; a submission attempt or error is not a conversion.

## Activation after approval

Make only this configuration change in `src/data/site.json`:

```json
"analytics": {
  "provider": "gtag",
  "enabled": true,
  "measurementId": "G-XXXXXXXXXX"
}
```

Then rebuild, run the full test suite, verify accept/decline behavior locally, and verify received events in GA4 DebugView. Do not treat a successful local check as client approval or as confirmation that GA4 has received production traffic.
