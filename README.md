# The House of Dental

Node-built static website for The House of Dental. The visual design and working-draft content are maintained in `src/` and assembled into a deployable static export by Node.js built-in modules.

## Source layout

- `src/pages/` contains the 12 page inputs: eight full site pages, three minimal information pages, and the 404 page (`404.html`, `about.html`, `accessibility.html`, `contact.html`, `facial-aesthetics.html`, `index.html`, `new-patients.html`, `pre-post-op.html`, `privacy.html`, `reviews.html`, `services.html`, and `terms.html`).
- `api/` contains the Vercel Node Functions for reputation and contact-message delivery.
- `src/templates/` contains the shared full, minimal, and footer shells.
- `src/data/` contains site metadata, service and technology modal records, review cards, and financing calculator values. Service and technology data are embedded in the generated `dist/main.js`.
- `src/styles/` and `src/scripts/` contain ordered, focused source modules that are concatenated into `dist/styles.css` and `dist/main.js`.
- `src/assets/` contains local logos, office media, treatment-care PDFs, and notes for pending authentic team and aesthetics photography.
- `src/static/` contains hosting support files such as headers, redirects, and `robots.txt`.
- `tests/` contains structural and safety assertions for the generated site.
- `dist/` is generated output. The build removes and recreates it, so it must not be edited directly.

## Generated export

`npm run build` creates the 12 HTML pages plus `main.js`, `styles.css`, local assets, `_headers`, `_redirects`, `robots.txt`, and `sitemap.xml`. The generated export is published from `dist/`; `vercel.json` pins that output directory and the Vercel routing/security rules.

## Commands

- `npm run build` regenerates `dist/` from `src/`.
- `npm run validate` checks the generated pages, links, anchors, metadata, assets, and security files.
- `npm run validate:vercel` checks the Vercel config, server entrypoints, form wiring, and environment contract.
- `npm test` runs structural and safety assertions.
- `npm run check` rebuilds the site, validates it, runs the tests and Vercel gate, and syntax-checks all server and browser entrypoints.
- `npm run clean` removes generated output.

## Vercel deployment

The repository is configured for Vercel with `npm ci`, `npm run check`, and `dist/` as the output directory. The Vercel Functions live in `api/`, and the `Vercel QA gate` workflow runs `npm run check` on pushes to `qa` and pull requests targeting `qa` or `main`. The CSP also includes Vercel Toolbar sources so preview feedback can load without permitting arbitrary scripts.

Link the repository to the intended Vercel project before pulling or adding variables:

```bash
vercel link --yes
vercel env add GOOGLE_PLACE_ID production
vercel env add GOOGLE_PLACES_API_KEY production --sensitive
vercel env add APPOINTMENT_BACKEND_URL production
vercel env add APPOINTMENT_BACKEND_TOKEN production --sensitive
vercel env add APPOINTMENT_ALLOWED_ORIGINS production
```

Use `.env.example` as the variable checklist. Keep actual values in Vercel environment variables or a local ignored file; never commit them. Preview variables should be scoped separately and should not receive production notification credentials by default.

## GA4 pilot setup

The export includes a Google tag (gtag.js) integration with Consent Mode v2 advanced defaults. The non-secret pilot configuration lives in `measurement/pilot-site.json`; GA4 remains inactive until it contains an approved Measurement ID and `ga4.enabled` is `true`. Route eligibility lives in `measurement/eligibility/routes.json` and defaults to prohibited, so the tag cannot load on unapproved or unknown routes. When enabled on an approved route, the default consent state denies analytics and advertising storage; the first-party banner can grant analytics storage only, and the integration sends the standard page view without reading or sending appointment form values.

This site uses direct gtag.js, so the Google Tag Manager template APIs are not used. After the Measurement ID, property and stream IDs, route/privacy approval, consent copy, and production approval are confirmed, run `npm run check` to regenerate and validate the export. See `measurement/pilot-site.md` and `docs/ANALYTICS-HANDOFF.md` for the client onboarding sequence.

## Google reputation placeholder

`src/data/site.json` contains the public Google Place ID and fallback values. `src/scripts/90-reputation.js` requests `/api/google-reputation` and replaces the visible values when the response is valid; API failures continue to use the fallback.

`api/google-reputation.js` is a Vercel Node Function. Configure `GOOGLE_PLACE_ID` and `GOOGLE_PLACES_API_KEY` in Vercel; the Function is the sole runtime source for the Place ID and the browser calls it without sending one. Never put the API key in `src/` or browser code. The function requests only `rating`, `userRatingCount`, and `googleMapsUri`, and caches successful results briefly to limit upstream quota exposure.

The static export does not execute serverless functions by itself; Vercel deploys the `api/` entrypoints alongside the `dist/` output.

Run `npm run check` before reviewing a preview. There are no `dev`, `serve`, or `preview` npm scripts because this is a generated static site.

## Local preview

Build the generated site, then serve the `dist/` directory locally:

```bash
npm run build
python3 -m http.server 8000 --directory dist
```

Open <http://localhost:8000> in a browser. A basic local static server can display the appointment form but cannot execute Vercel Functions or deliver submissions.

## Appointment backend

The contact form posts to `/api/appointment`, which validates the request origin and field sizes, rejects the honeypot, sends no logs, and forwards the message over HTTPS with a server-only bearer token. `APPOINTMENT_BACKEND_URL` must point to an approved secure email-delivery or notification endpoint and accept this JSON contract:

```json
{
  "source": "the-house-of-dental-website",
  "submitted_at": "ISO-8601 timestamp",
  "appointment": {
    "name": "string",
    "phone": "string",
    "email": "string",
    "newPatient": "Yes or No",
    "message": "string"
  }
}
```

The adapter intentionally fails closed with a 503 until `APPOINTMENT_BACKEND_URL`, `APPOINTMENT_BACKEND_TOKEN`, and `APPOINTMENT_ALLOWED_ORIGINS` are configured. This repository does not invent or activate an email vendor. The approved email-delivery endpoint remains responsible for provider-specific rate limiting, spam controls, retention, notification delivery, and any required compliance review. A successful delivery is a message accepted for email notification; it is not a booked appointment or a confirmed lead.

## Production boundaries

The contact form is a Vercel Function boundary, not a storage system. Production delivery still requires an approved email-delivery endpoint, security review, and environment-specific configuration. Do not include sensitive medical details in the form.

Building, validating, or previewing the site does not deploy it or approve production content. Legal pages, clinical and business claims, authentic media and reviews, analytics, redirects, integrations, and hosting configuration require their own review before publication.
