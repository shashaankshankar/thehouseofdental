# House of Dental measurement configuration

`site.json` is the single non-secret setup file for this website's measurement configuration. The public site is live and consent-gated GA4 collection is enabled. The reporting connection remains separate and must stay disabled until the client grants read-only access and the open healthcare/privacy requirements are recorded.

## Client setup inputs

Confirm these values against the client-owned GA4 property before enabling the reporting connection:

- `ga4.measurementId` — web stream Measurement ID, in the form `G-XXXXXXXXXX`.
- `ga4.propertyId` — GA4 numeric property ID for the reporting assignment.
- `ga4.webStreamId` — GA4 numeric web data-stream ID.
- `ga4.timezone` — the property's reporting timezone.
- `ga4.connection.principal` — the agency connector service-account email after it is created.

The client grants that principal **Viewer** access to its GA4 property. Do not put a service-account key, OAuth client secret, appointment backend token, or other secret in this repository.

## Reporting connection sequence

1. Record the named healthcare/privacy and consent approvals that govern the live collection.
2. Confirm the property ID, web-stream ID, property timezone, and Measurement ID against the client-owned GA4 property.
3. Grant the agency reporting principal Viewer access; do not expose credentials to the static site.
4. Run `npm run check`, then verify consent states and each implemented event in GA4 DebugView.
5. Register the property, stream, connection, and effective date in the reporting platform's `website_analytics_assignments` record.

The application exports only the public GA4 tag configuration. Property IDs, stream IDs, timezone, and connection details remain local configuration for platform onboarding and are not embedded in the static website.
