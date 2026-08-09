# House of Dental pilot configuration

`pilot-site.json` is the single non-secret setup file for this website's measurement pilot. It intentionally keeps GA4 disabled until the client has approved healthcare analytics, supplied the correct property and web-stream details, and granted read-only access.

## Client setup inputs

Populate only these empty fields when the client confirms them:

- `ga4.measurementId` — web stream Measurement ID, in the form `G-XXXXXXXXXX`.
- `ga4.propertyId` — GA4 numeric property ID for the reporting assignment.
- `ga4.webStreamId` — GA4 numeric web data-stream ID.
- `ga4.timezone` — the property's reporting timezone.
- `ga4.connection.principal` — the agency connector service-account email after it is created.

The client grants that principal **Viewer** access to its GA4 property. Do not put a service-account key, OAuth client secret, appointment backend token, or other secret in this repository.

## Activation sequence

1. Complete the route and consent approvals in `measurement/eligibility/routes.json`.
2. Change only the approved routes from `requires_review` to `approved`.
3. Set `ga4.enabled` to `true` and add the confirmed Measurement ID.
4. Run `npm run check`, then test consent states and DebugView in the deployed environment.
5. Register the property, stream, connection, and effective date in the reporting platform's `website_analytics_assignments` record.

The application exports only the public GA4 tag configuration. Property IDs, stream IDs, timezone, and connection details remain local configuration for platform onboarding and are not embedded in the static website.
