# House of Dental SEO implementation

Implemented on `feat/seo-optimization`. Website scope only; no deployment, external listing changes, or Search Console administration.

## Content and navigation

The build now generates 41 HTML pages: the 23 existing pages plus 18 treatment pages. `/services` and `/facial-aesthetics` remain overview pages. Existing card styling is retained; cards now link to complete HTML pages. Legacy section IDs remain valid, and the retired service dialog no longer opens. Technology dialogs remain available.

Treatment content lives in `src/data/treatments.json`, rendered by `scripts/render-treatments.mjs` using the existing article layout. Each record defines an explicit path, copy, questions, image, related treatments, and optional care/source links. Add useful original content to a record rather than creating city or keyword variants. Update the overview links and measurement route inventory when adding a page.

| Dental pages | Facial aesthetics pages |
| --- | --- |
| `/services/dental-implants` | `/facial-aesthetics/co2-laser-resurfacing` |
| `/services/same-day-crowns` | `/facial-aesthetics/microneedling` |
| `/services/porcelain-veneers` | `/facial-aesthetics/hydroderm-facials` |
| `/services/invisalign` | `/facial-aesthetics/3d-skin-analysis` |
| `/services/full-mouth-restoration` | |
| `/services/dentures` | |
| `/services/root-canal-treatment` | |
| `/services/cosmetic-dentistry` | |
| `/services/preventive-dentistry` | |
| `/services/oral-surgery` | |
| `/services/sedation-dentistry` | |
| `/services/tmj-treatment` | |
| `/services/scaling-root-planing` | |
| `/services/quietnite-sleep-appliance` | |

Existing articles link to their corresponding treatment pages. Blog publication dates migrated from the former shared date without changing their original date. The September 9 modification date records the related-care link update. Future edits must use actual per-article dates. An optional `author` requires a real name and existing profile `path`; `reviewer` also requires `reviewedAt`. No clinician review or authorship has been invented.

Facial-aesthetics overview and technology copy now qualify suitability, recovery, and outcomes. New treatment copy needs the practice's normal clinical/editorial sign-off before publication; analytics approval is separate. Existing practice credentials were retained, not independently certified. Prices were not invented or expanded to additional services. Current offers stay on the existing offer/new-patient pages.

## Technical behavior

- Unique titles, descriptions, social previews, self-canonicals, and crawlable internal links.
- One stable practice identifier, page-specific WebPage markup, treatment breadcrumbs, and article markup. Removed self-serving review aggregate markup. Visible reviews still use the existing reputation integration.
- Sitemap contains canonical indexable content URLs; existing legal/accessibility exclusions remain. Dates are included only where recorded. Google ignores sitemap priority/change-frequency hints, so the generator no longer emits them.
- Generated `worker/site-routes.mjs` limits normalization to known pages. HTTP/alternate-host and legacy/`.html`/trailing-slash variants resolve directly to the canonical URL. Query strings are preserved; browser fragments stay client-side. Unknown paths remain 404; API handling is unchanged.
- New `validate:seo` checks discovery, titles/descriptions, canonicals, robots, sitemap coverage, image dimensions, structured-data parsing, breadcrumbs, and editorial dates. Tests deliberately corrupt representative output to verify that important failures are detected.
- Text reveal animations progressively enhance readable HTML; content remains visible when JavaScript is unavailable.

## Image and font delivery

`sharp` is a pinned development dependency used only during builds. The optimizer creates WebP variants of referenced raster images at up to 480, 960, and 1440 pixels, without upscaling. Content-hashed output names work with the existing immutable asset cache. Original images remain available as HTML picture fallbacks and for existing references. Dimensions reserve image space. New treatment pictures reuse existing imagery.

The same Marcellus, Jost, and Cormorant Garamond font families are served locally as Latin WOFF2 subsets, with their OFL licenses in `src/assets/fonts`. No external Google Fonts request is needed. Font swapping is retained.

## Analytics approval

The workspace owner explicitly reviewed and approved all 40 public routes across the website on September 9, 2026. `measurement/evidence/treatment-route-review-2026-09-09.json` records that authorization. All 40 public routes (core pages, blog articles, and treatment routes) are now `approved` under the existing consent-gated contract. Unknown routes remain `prohibited`; validators also support explicit `requires_review` entries for future additions. No new event types, personal-data fields, or automatic approvals were added.

Local validation establishes configuration and browser behavior. It does not establish GA4 receipt, production collection, or appointment delivery.

## Verification and release checklist

Run `npm run check` to rebuild, validate content/measurement/Cloudflare configuration, run tests, and perform a deployment dry run. Use `npm run dev -- --port 8791` for local checks. The local-upstream setting avoids applying the production HTTPS redirect to Wrangler's local hostname. Stop the dev server before a full rebuild, because the build replaces `dist`.

Browser artifacts and the pre-change inventory are in `output/playwright/` (ignored by Git). Local tests use an isolated browser; reputation/analytics are stubbed where needed to keep UI checks independent of provider access. Test contact submissions must be intercepted locally, never sent to the practice.

Before deployment:

1. Review new clinical copy and the actual diff; confirm treatment names, availability, offers, and business details with the practice.
2. Confirm the full check passes and inspect representative desktop, tablet, and 390px mobile layouts.
3. Re-run representative Google Rich Results code tests if schema changes.

After a separately authorized deployment:

1. Fetch every sitemap URL and representative redirect variants on production; confirm 200 canonical destinations and real 404s.
2. Verify production robots/edge behavior using an actual Google inspection tool. Automated HTTP probes received 403 during planning while a normal browser loaded the site; this does not prove Googlebot is blocked. Hosting configuration is an external dependency.
3. Have the Search Console owner verify indexing/canonical selection and sitemap processing. This account work is outside the implementation scope.
4. Confirm GA4 receipt under the approved consent policy independently; an inquiry is not a confirmed appointment.
5. Compare organic impressions, clicks, relevant landing-page traffic, and inquiry outcomes over time if the account owner supplies data. Do not interpret these local checks as ranking or business-outcome evidence.

Revert the source and generated artifacts together if a release needs rollback. Rebuild before deployment so HTML, asset URLs, sitemap, and Worker route manifest remain consistent.

## Implementation verification — September 9, 2026

- Final `npm run check`: 58 tests passed, all content/SEO/measurement/Cloudflare validators passed, Worker and client syntax passed, deployment dry run passed. No deployment was performed.
- HTTP checks: all 40 public canonical pages returned 200; representative legacy, `.html`, and trailing-slash URLs returned 301 to the canonical path; an unknown URL returned 404.
- Browser coverage: all 40 routes at 390px and 1440px, plus six representative routes at 768px (86 page/viewport combinations). No horizontal overflow, missing images, or browser script errors in isolated checks. New routes initialized the approved analytics module; collection remains subject to consent.
- Appointment interaction: old services fragment to new treatment link, active navigation, empty-step error, Escape/focus restoration, and successful mocked submission passed. The mock included both `ok` and `accepted`, matching the existing acceptance contract. No message was sent to the practice. Technology modal and JavaScript-disabled service/treatment navigation also passed.
- Representative final mobile, tablet, and desktop screenshots were captured; mobile and desktop treatment headers were visually inspected after dismissing the consent banner.

Google Rich Results **code** tests used generated structured-data scripts, not a production fetch:

- [Treatment breadcrumb test](https://search.google.com/test/rich-results/result?id=iT3KPBmkx96Lq6QbFm5Usw): one valid breadcrumb item.
- [Article and breadcrumb test](https://search.google.com/test/rich-results/result?id=wjb4ZxpCgaTLk5DVdfhSjQ): two valid items. Four noncritical warnings concern optional publication/modification times and timezones. Date-only values are retained because exact publication times are not known; no timestamps were invented. These tests do not establish indexing or guarantee a rich result.

Local performance samples used fresh Chromium contexts at 390×844, DPR 1, and a 2.2-second observation window. Recorded resource bytes exclude opaque cross-origin responses; moving fonts from Google to the local origin changes what is measurable. These are development measurements, not field Core Web Vitals or ranking evidence. Samples were collected before the final removal of unused service-modal JavaScript.

| Page | Before recorded bytes | After recorded bytes | Before/after local LCP | Before/after CLS |
| --- | ---: | ---: | --- | --- |
| Home | 3,340,317 | 322,390 | 380 / 172 ms | 0.002 / 0.054 |
| Services | 63,909 | 105,452 | 296 / 96 ms | 0.057 / 0.005 |
| Facial aesthetics | 362,112 | 119,724 | 308 / 288 ms | 0.004 / 0.055 |
| Dental implants article | 234,355 | 117,264 | 332 / 124 ms | 0.015 / 0.054 |

The homepage's recorded transfer fell about 90%, largely through responsive image delivery. Services' recorded bytes increased with locally measurable fonts. Layout shifts increased on three samples but remained below 0.1 during the short local observation; production field performance still needs measurement after release.
