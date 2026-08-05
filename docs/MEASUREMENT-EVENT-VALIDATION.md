# Phase 9 measurement and event validation

**Status:** vendor-neutral local contract only; nonessential tracking is disabled
**Owner:** practice/marketing owner after named approval; implementation owner maintains the contract
**Source of truth:** `the-house-of-dental-site/data/measurement.json`, `config/site.json`, and the generated layout/runtime

## Release boundary

This document describes what the local site is prepared to emit. It is not an approval to install GA4, a tag manager, ad pixels, session recording, call recording, or a consent platform. The local artifact contains no vendor IDs, no vendor scripts, no call-tracking number, no CRM destination, and no consent vendor decision. The canonical NAP phone remains the static practice phone until a call-tracking vendor and replacement-number policy are approved.

The data layer is disabled in normal browsing. A QA reviewer can use the debug query parameter `?hod_debug=1` or `?hod_debug=true`; debug output stays in the browser session and does not send a network request.

## Event contract

Every emitted event is an object with only these keys, in addition to the event name:

`event`, `page_type`, `service_slug`, `cta_location`, `conversion_type`, `campaign_source`, `state`

Null values are allowed for context that does not apply. Values are configuration-derived or controlled tokens. No form value, page body text, query-string blob, raw URL, or free-text input is projected into the event.

| Event | Trigger | Success rule / state | Allowed context |
|---|---|---|---|
| `click_to_call` | A phone CTA is activated | Click activation only; not a connected-call claim | page, CTA location, campaign source |
| `appointment_click` | Request/book appointment CTA is activated | Click activation only; not a submitted appointment | page, CTA location, service/campaign context |
| `form_start` | First focus in an appointment/contact form | Once per form and browser journey | page, conversion type, campaign source, `started` |
| `appointment_submit_success` | Approved appointment handler returns `{ ok: true }` | Backend-confirmed success only; once per journey | page, form CTA location, `success` |
| `contact_submit_success` | Approved contact handler returns `{ ok: true }` | Backend-confirmed success only; once per journey | page, form CTA location, `success` |
| `directions_click` | Directions/map CTA is activated | Click activation only | page, CTA location, campaign source |
| `financing_click` | Financing/insurance CTA is activated | Click activation only | page, CTA location, campaign source |
| `offer_claim` | Reserved for an approved offer backend | Never on a button click; only after backend confirmation | page, campaign source, `success` |
| `referral_submit_success` | Reserved for an approved referral backend | Never on a button click; only after backend confirmation | page, campaign source, `success` |
| `implant_inquiry` | Approved implant inquiry CTA is activated | Current local preview records the intent click; appointment success remains separate | page, service slug, CTA location |
| `facial_aesthetics_inquiry` | Reserved until Phase 4 approval | Disabled while facial-aesthetics offering, provider, content, form, and privacy gates are open | No event is emitted locally |
| `quietnite_inquiry` | Reserved until Phase 4 protocol approval | Disabled while the appliance-versus-laser conflict remains unresolved | No event is emitted locally |
| `emergency_call` | Urgent/emergency phone CTA is activated | Click activation only; not a diagnosis or availability claim | page, CTA location, campaign source |

`form_state` is diagnostic rather than a conversion. It may use `started`, `failure`, `validation_error`, `blocked`, or `timeout` to describe a truthful form state. It must not contain submitted values.

## Lifecycle rules

1. A CTA event may describe an activated link or button, but it cannot describe a completed appointment, offer, or referral.
2. A form success event is emitted only after the configured handler resolves successfully with `result.ok === true`.
3. Refreshes, back navigation, and repeated success rendering do not create a second success event in the same browser journey. The runtime uses a session-scoped dedupe key.
4. An unconfigured or failed handler emits a diagnostic state only; the page must not claim that a request was sent.
5. CRM attribution is opt-in and remains disabled unless `crmMappingEnabled === true` is supplied by an approved integration configuration. The current generated configuration is false.

## Privacy-safe attribution

Attribution is kept in `sessionStorage` for the current browser session only. The runtime accepts only these query keys:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`

Each value must be a lowercase ASCII token of at most 80 characters. Spaces, query syntax, email-like values, free text, and `utm_term` are rejected. Referrers are reduced to the hostname only; path, query, fragment, and same-origin referrers are discarded. Events expose one controlled `campaign_source` value rather than raw UTM values or a referrer URL.

The runtime does not use `localStorage`. The current browser session is the retention boundary unless an approved privacy review changes the contract.

## Prohibited payload content

The following must never enter the data layer, analytics payload, CRM attribution projection, URL query, or debug event buffer:

`name`, `phone`, `email`, `message`, `symptoms`, `diagnosis`, `treatment_details`, `referral_friend_data`, `page_content`, `referrer_url`, and `utm_term`.

This includes free-form form messages, health-interest descriptions, diagnosis or treatment details, and information about a referred friend. The event layer is not a form mirror and does not read input values.

## Local QA procedure

1. Start the generated static site locally with `npm run build` followed by `npm run serve`.
2. Open a representative route with `?hod_debug=1&utm_source=qa&utm_medium=debug&utm_campaign=phase9&utm_content=event-contract`.
3. Inspect `window.__HOD_MEASUREMENT__.config`, `window.__HOD_MEASUREMENT__.getAttribution()`, `window.__HOD_EVENTS__`, and `window.dataLayer`.
4. Activate a phone, appointment, directions, and financing CTA. Confirm only named contract events appear and that each object contains only the allowed fields.
5. Focus the appointment form. Confirm one `form_start` event. Submit invalid data and confirm `form_state` with `validation_error`, with no success event.
6. In a local browser-only test, install a temporary approved test adapter that returns `{ ok: true }`. Submit once and confirm exactly one named success event and the truthful confirmation route. Repeat refresh/back navigation and confirm no second success event for the same journey.
7. Inspect requests. With the current configuration there must be no GA4, tag-manager, advertising, session-recording, call-recording, or CRM request.
8. Run `npm run validate:phase9` and retain the generated JSON evidence under `docs/evidence/phase-9/`.

## Integration status and enablement checklist

| Integration | Current local state | Required before enablement |
|---|---|---|
| GA4 | `measurementId: null`; no script | Approved property/stream, privacy decision, ownership, retention, event mapping, and QA |
| Tag manager | `containerId: null`; no script | Approved container, workspace owner, consent behavior, vendor inventory, and QA |
| Call tracking | No vendor or tracking number; canonical phone retained | Approved provider, number replacement/NAP policy, recording policy, disclosures, and call-quality QA |
| CRM/practice management | No provider or endpoint; attribution gate false | Approved destination, field mapping, retention, access controls, failure/retry behavior, and data-processing review |
| Consent | No vendor or required decision | Approved jurisdiction/vendor/category behavior before nonessential scripts are installed |
| Offer/referral | Terms and secure backend absent | Approved terms, consent, anti-abuse controls, expiry owner, backend confirmation, and named success event |

No production integration is live in this Phase 9 artifact.
