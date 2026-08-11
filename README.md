# The House of Dental

Node-built static website for The House of Dental. The visual design and working-draft content are maintained in `src/` and assembled into a Cloudflare Workers Static Assets deployment by Node.js built-in modules.

## Source layout

- `src/pages/` contains the 12 page inputs: the 11 public pages plus the custom 404 page.
- `src/templates/` contains the shared full, minimal, and footer shells.
- `src/data/` contains site metadata, clean public paths, redirect aliases, service and technology modal records, review cards, and financing values.
- `src/styles/` and `src/scripts/` contain ordered source modules concatenated into `dist/styles.css` and `dist/main.js`.
- `src/assets/` contains local logos, office media, treatment-care PDFs, and notes for pending authentic team and aesthetics photography.
- `src/static/` contains hosting support files such as headers and `robots.txt`.
- `worker/index.mjs` contains the API and clean-route Worker entrypoint.
- `wrangler.jsonc` is the tracked Worker and Static Assets configuration.
- `tests/` contains structural, privacy, route, redirect, and Worker endpoint assertions.
- `dist/` is generated output. Do not edit it directly.

## Generated export

`npm run build` creates the 12 HTML pages plus `main.js`, `styles.css`, local assets, `_headers`, generated `_redirects`, `robots.txt`, and `sitemap.xml`. Public page URLs are extensionless; the Worker resolves clean paths to the generated flat HTML assets, while `_redirects` permanently moves legacy `.html` and alias URLs to their final clean destinations.

## Commands

- `npm run build` regenerates the site and redirect inventory.
- `npm run validate` checks generated pages, clean internal links, anchors, metadata, assets, and security files.
- `npm run validate:measurement` checks the healthcare analytics contract and route-policy drift against `src/data/site.json`.
- `npm run validate:cloudflare` checks Wrangler configuration, Worker wiring, redirects, headers, environment documentation, and generated runtime files.
- `npm test` runs structural, privacy, accessibility-runtime, route, and Worker endpoint tests.
- `npm run check` rebuilds the site, runs every local gate, syntax-checks the Worker, and runs `wrangler deploy --dry-run`.
- `npm run clean` removes generated output.

## Cloudflare Workers deployment

The target is one isolated Worker named `thehouseofdental` with Static Assets from `dist/`. The configuration keeps `workers_dev` disabled, enables preview URLs, invokes Worker code for `/api/*`, serves the custom 404 page for non-API misses, and targets the custom domain `thehouseofdentalwp.com` once its Cloudflare zone is active.

Workers Builds settings:

- Production branch: `main`
- Build command: `npm run check`
- Deploy command: `npx wrangler deploy`
- Preview command: `npx wrangler versions upload`
- Existing `dev` → `qa` → `main` promotion flow remains in place.
- Public preview URLs should be protected with Cloudflare Access before client review.

Build and local Worker verification:

```bash
npm ci
npm run check
npx wrangler dev
```

Local Worker development uses the ignored `.env`/`.env.local` files or `.dev.vars` file. Keep the Resend key in one ignored local file only; never commit real values. Deployed Workers require the encrypted `RESEND_API_KEY` secret and the approved contact variables in the deployment environment.

## Runtime environment contract

Plain variables:

- `GOOGLE_PLACE_ID` — server-side runtime value for the configured Google Business location.
- `CONTACT_FROM_EMAIL` — a verified Resend sender address, such as `website@your-verified-domain.com`.
- `CONTACT_RECIPIENT_EMAIL` — the dental office inbox that should receive website messages.
- `CONTACT_ALLOWED_ORIGINS` — exact allowed form origins, initially `https://thehouseofdentalwp.com`.

Encrypted secrets:

- `GOOGLE_PLACES_API_KEY`
- `RESEND_API_KEY` — store the real key as an encrypted Worker secret. Replace `re_xxxxxxxxx` with the real API key when configuring it; never commit it.

The Google reputation endpoint reads the Place ID and API key only from Worker bindings, validates the upstream rating/count, and caches successful public data for five minutes. Failures are never cached. The contact endpoint validates the exact origin, body size, fields, and honeypot, then sends a server-generated email through Resend. It never creates or confirms an appointment and never logs request bodies, personal information, or secrets.

The browser form posts to `/api/contact` using URL-encoded form data. The Worker maps it to the Resend API payload with the office as `to` and the visitor as `reply_to`. A successful delivery means the office received a contact email; it does not create or confirm an appointment.

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

A successful adapter response means the message was accepted for notification; it is not a booked appointment or confirmed lead.

## Clean routes and redirects

The `path` field in `src/data/site.json` is the single source for canonical URLs, Open Graph URLs, sitemap entries, measurement eligibility, and generated legacy redirects. The public paths are `/`, `/about`, `/accessibility`, `/contact`, `/facial-aesthetics`, `/new-patients`, `/pre-post-op`, `/privacy`, `/reviews`, `/services`, and `/terms`.

The generated `_redirects` file sends every former public `.html` URL directly to its clean path and sends `/home`, `/about-us`, `/dental-services`, `/new-patient`, and `/contact-us` directly to their final destinations. The custom 404 page is served by Static Assets `404-page` handling rather than a wildcard rewrite.

## GA4 pilot controls

The export uses direct `gtag.js` with Consent Mode v2. The route policy defaults to prohibited, and the approved list contains only the clean paths declared in the site metadata. Analytics events are consent-gated and allowlist only page path, approved CTA location/type, and service category; appointment form values, query strings, and other direct identifiers are not sent. Cloudflare Web Analytics is not enabled. See `measurement/pilot-site.md` and `docs/ANALYTICS-HANDOFF.md` for the client approval and activation sequence.

## Ownership and production gates

The agency manages the Cloudflare account, Worker, secrets, and Git repository. The client retains the GoDaddy domain registration. Before nameserver changes, export the complete DNS zone and reproduce Microsoft 365 MX, SPF, DKIM, DMARC, autodiscover, verification, and other observed records in Cloudflare; verify mail delivery before and after propagation.

This repository conversion does not deploy, change DNS, create secrets, enable Cloudflare Access, activate appointment delivery, approve analytics, or publish clinical/legal/content claims. Keep the historical validation evidence unchanged and record Cloudflare-specific evidence separately after preview and production approval. The handoff checklist is in `docs/CLOUDFLARE-HANDOFF.md`.
