# The House of Dental

Dependency-free static website for The House of Dental. The visual design and working-draft content are maintained in `src/` and assembled into a deployable static export by Node.js built-in modules.

## Source layout

- `src/pages/` contains the 12 page inputs: eight full site pages, three minimal information pages, and the 404 page (`404.html`, `about.html`, `accessibility.html`, `contact.html`, `facial-aesthetics.html`, `index.html`, `new-patients.html`, `pre-post-op.html`, `privacy.html`, `reviews.html`, `services.html`, and `terms.html`).
- `src/templates/` contains the shared full, minimal, and footer shells.
- `src/data/` contains site metadata, service and technology modal records, review cards, and financing calculator values. Service and technology data are embedded in the generated `dist/main.js`.
- `src/styles/` and `src/scripts/` contain ordered, focused source modules that are concatenated into `dist/styles.css` and `dist/main.js`.
- `src/assets/` contains local logos, office media, treatment-care PDFs, and notes for pending authentic team and aesthetics photography.
- `src/static/` contains hosting support files such as headers, redirects, and `robots.txt`.
- `tests/` contains structural and safety assertions for the generated site.
- `dist/` is generated output. The build removes and recreates it, so it must not be edited directly.

## Generated export

`npm run build` creates the 12 HTML pages plus `main.js`, `styles.css`, local assets, `_headers`, `_redirects`, `robots.txt`, and `sitemap.xml`. The generated export is the artifact to preview or hand to a static host.

## Commands

- `npm run build` regenerates `dist/` from `src/`.
- `npm run validate` checks the generated pages, links, anchors, metadata, assets, and security files.
- `npm test` runs structural and safety assertions.
- `npm run check` rebuilds the site, validates it, runs the tests, and syntax-checks `dist/main.js`.
- `npm run clean` removes generated output.

## GA4 setup

The export includes a Google tag (gtag.js) integration with Consent Mode v2 advanced defaults. It remains inactive until `src/data/site.json` contains an approved GA4 Measurement ID and `"enabled": true` in the `analytics` object. When enabled, the default consent state denies analytics and advertising storage; the first-party banner can grant analytics storage only, and the integration sends the standard page view without reading or sending appointment form values.

This site uses direct gtag.js, so the Google Tag Manager template APIs are not used. After the Measurement ID, privacy language, consent copy, consent-storage choice, and production approval are confirmed, run `npm run check` to regenerate and validate the export.

Run `npm run build` before `npm run validate` or `npm test` when `dist/` may be stale. There are no `dev`, `serve`, or `preview` npm scripts because this is a dependency-free static site.

## Local preview

Build the generated site, then serve the `dist/` directory locally:

```bash
npm run build
python3 -m http.server 8000 --directory dist
```

Open <http://localhost:8000> in a browser. A basic local static server can display the appointment form but cannot deliver submissions.

## Production boundaries

The appointment form is a native Netlify-compatible `POST` form. Production delivery still requires the approved hosting, notification, and security configuration. Do not include sensitive medical details in the form.

Building, validating, or previewing the site does not deploy it or approve production content. Legal pages, clinical and business claims, authentic media and reviews, analytics, redirects, integrations, and hosting configuration require their own review before publication.
