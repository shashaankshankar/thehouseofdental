# The House of Dental static site

Phase 2 adds a dependency-free static build around the existing Phase 1 HTML/CSS/JavaScript experience. The build produces ordinary crawlable HTML files; the main page copy remains in readable HTML fragments and the shared shell is maintained once.

## Source and generated output

- `the-house-of-dental-site/content/` contains the eight current page fragments plus the branded 404. Fragments contain page content only; they must not contain `html`, `head`, `body`, `header`, or `footer` markup.
- `the-house-of-dental-site/config/site.json` is the central brand, canonical, NAP, hours, social, appointment, review-source, analytics-placeholder, and legal-link configuration. Unresolved values are explicit `null`/status records and are not emitted as factual claims.
- `the-house-of-dental-site/config/routes.json` is the route/content registry. It includes all current routes and planned/gated service, resource, campaign, blog, and policy routes. Planned routes stay disabled until their source content and approvals exist.
- `the-house-of-dental-site/templates/` contains the shared document layout, header/navigation, footer, breadcrumb, and mobile-action components.
- `the-house-of-dental-site/components/accessible-patterns.html` documents reusable service/category cards, links/buttons, dialogs, forms/statuses, FAQ disclosure, trust callouts, responsive images, and related-service links.
- `the-house-of-dental-site/styles.css`, `main.js`, and `assets/` are shared runtime sources. Phase 1 interaction and accessibility fixes remain here.
- `dist/` is generated output and the deployable static artifact. Do not hand-edit it; `npm run build` removes and recreates it.

## Commands

```text
npm run build             # cleanly generate dist/
npm run serve             # serve dist/ at http://127.0.0.1:4173/
npm run validate          # validate generated routes and report approved pending-asset warnings
npm run validate:strict   # also fail on the 11 explicitly pending team/aesthetics assets
npm test                  # clean build plus structural regression tests
```

The project has no runtime or build dependencies beyond Node.js. No deployment command is included in Phase 2; `dist/` is the handoff artifact for a later static host.

## Adding a page

1. Add an HTML fragment under `the-house-of-dental-site/content/` with one H1 and ordinary, editable page copy.
2. Add one route object to `config/routes.json` with a unique `title`, `description`, `h1`, `canonicalPath`, `pageType`, `indexable`, `socialImage`, `breadcrumb`, and `approvalStatus`.
3. Keep the route disabled while copy, clinical facts, legal terms, assets, or approvals are pending. Set `enabled: true` only when its source fragment is ready.
4. Use `{{BREADCRUMB}}` where the visible breadcrumb belongs. The builder supplies it from the registry. Use `{{STATIC_PREFIX}}` for asset paths in nested future routes.
5. Run `npm test`, then inspect the generated page and `view-source:` from the local server. A page's main text and navigation must work without JavaScript.

Global navigation, phone/address/hours display, footer links, skip link, sticky actions, metadata, canonical URLs, and structured-data scaffolding belong in the shared templates/config. A page fragment should never copy those blocks.

## Metadata and schema

The route registry owns one title, description, H1, canonical, indexability state, social-image field, breadcrumb trail, page type, and approval status per route. The build emits one metadata block per page and omits `og:image`/`twitter:image` when no approved social image exists.

Each page receives a `WebPage` JSON-LD node. The homepage additionally receives one practice `Dentist` and one `WebSite` node. Interior pages receive `BreadcrumbList` only when a visible breadcrumb is defined. Self-serving aggregate ratings and the repeated blanket Dentist block were intentionally removed.

## Assets and validation

Local links, `src`, `srcset`, duplicate IDs, metadata uniqueness, canonical consistency, JSON-LD parsing, source-shell boundaries, and sitemap coverage are validated. The normal validator reports the 11 known missing team/aesthetics files as explicit warnings because Phase 1 recorded them as pending practice assets; `npm run validate:strict` treats them as failures. Any other missing referenced asset or internal link fails normal validation.

Responsive parity and Phase 1 browser evidence are stored under `docs/evidence/phase-2/`. The project remains local-only until practice, clinical, legal, form, asset, domain, and analytics approvals are complete.

## Phase 5 local-only handoff

Phase 5 adds patient-support and lead-conversion infrastructure outside the homepage: New Patient Forms, Insurance & Financing, Special Offers, Patient Resources, urgent phone-first routing, legal-review placeholders, appointment/offer status routes, and a branded 404. The appointment form is intentionally unconnected until an approved scheduling/CRM/practice-management destination exists; the local build never claims a request was sent when it was not.

See `docs/evidence/phase-5/phase-5-release-gate.md`, `phase-5-integration-tests.md`, and `phase-5-browser-qa.json` for the exact QA matrix and remaining blockers. Normal validation currently reports seven pre-existing missing About-team assets; strict validation remains blocked by those assets. Do not deploy this artifact until the practice, legal, and integration approvals are complete.
