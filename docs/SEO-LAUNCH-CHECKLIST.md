# SEO launch checklist — Phase 8

Status: local-only migration package. No deployment, DNS change, domain move, Search Console submission, or Change of Address action has been performed.

The current public domain, `https://winterparkdental.com`, is the provisional canonical baseline because the practice/legal domain decision is unresolved. Replace it only after the decision is recorded in `docs/PRACTICE-DECISIONS.md` and the full-domain move gate is approved.

## Required approvals and source access

- [ ] Practice/legal owner confirms the final brand, relationship to `winterparkdental.com`, canonical domain, and whether a domain move is authorized.
- [ ] Practice owner re-confirms the exact NAP: 6504 University Blvd, Winter Park, FL 32792; (407) 678-1400; `office@winterparkdental.com`; map URL; and hours.
- [ ] Named clinical/content owner approves each public service, service claim, FAQ answer, provider credential, technology reference, and care guide.
- [ ] Analytics/Search Console access is granted to prioritize current blog and service URLs by traffic, backlinks, query demand, and conversions.
- [ ] Current sitemap index and all current public URLs are successfully crawled/exported from an environment that can reach the production host.
- [ ] Scheduling/form handler, notification destination, secure new-patient form, and privacy/data-retention controls are approved and tested.
- [ ] Authentic people, office, treatment, before/after, testimonial, and case media have rights/consent and approved alt text.

## Prelaunch crawl and URL mapping

- [ ] Crawl both `http`/`https` and host variants, record status, title, canonical, robots, indexability, content type, word count, internal links, images, structured data, and last-modified signals.
- [ ] Reconcile the crawl against `docs/URL-INVENTORY.csv`, `config/routes.json`, the current sitemap index, Search Console pages, analytics landing pages, and backlink exports.
- [ ] Review every service, provider, technology, new-patient, legal, blog index, category, pagination, and article URL. Do not infer completeness from navigation alone.
- [ ] Preserve a current slug where content is equivalent. For changed slugs, use one direct 301 from the exact source to the approved equivalent. No chains, loops, wildcard catch-all, or mass-home redirect.
- [ ] Confirm all redirect sources and destinations return the expected status, preserve query handling as intended, and do not redirect unrelated clinical/content topics.
- [ ] Confirm a branded unknown-path response returns actual HTTP 404, is not indexable, and links to Home, Services, Contact, phone, and urgent guidance.
- [ ] Keep old redirect rules for at least one year after an approved domain move, then re-check logs and Search Console before retirement.

## Domain, DNS, and Search Console

- [ ] If no domain move is approved, keep the current-domain baseline and do not publish a new-domain canonical or sitemap.
- [ ] If a domain move is approved, verify both old and new properties in Search Console before launch.
- [ ] Confirm DNS, TLS certificates, host redirects, HSTS, preferred host, and origin/edge caching for every intended variant.
- [ ] Deploy one-to-one 301 mappings and the new-domain canonicals/sitemap only in the approved cutover window.
- [ ] Submit the new sitemap and use Search Console Change of Address only for a genuine domain move, after redirects and verification are live.
- [ ] URL-inspect representative home, category, service, provider, blog article, contact, legal, and 404 URLs after launch.
- [ ] Monitor indexed pages, excluded pages, crawl errors, redirect errors, canonical selection, soft 404s, manual actions, and structured-data issues daily during the first week and weekly for the first month.

## Metadata and indexability

- [ ] Every indexable route has one unique title, meta description, canonical, robots directive, Open Graph block, Twitter block, and suitable social image.
- [ ] No route emits meta keywords, duplicate titles/descriptions, a canonical to an unapproved domain, or a canonical that points to a redirect/error/noindex page.
- [ ] Every public indexable page has one meaningful H1 and a logical heading hierarchy.
- [ ] Visible breadcrumbs match `BreadcrumbList` schema where breadcrumbs are present.
- [ ] Thank-you routes, drafts, campaign variants, unresolved clinical pages, and held blog/article routes remain noindex until approved.
- [ ] Natural Winter Park context, exact NAP, and approved hours are present across relevant page content, footer, contact page, and schema. Do not create duplicated nearby-city doorway pages.

## Structured data

- [ ] Homepage emits one coherent graph with `WebSite`, `Organization`, accurate `Dentist`/`LocalBusiness` practice data, provider relationship, address, phone, URL, social URLs, and verified hours.
- [ ] Provider content uses a `Person` linked to the practice only for confirmed provider facts.
- [ ] Service pages use `WebPage` and `Service` only for real offered services; disabled or unresolved services stay out of the public sitemap and graph.
- [ ] `FAQPage` is used only when the questions and answers are visibly present; no hidden FAQ or rich-result promise is made.
- [ ] Remove self-serving `aggregateRating`, unsupported review counts, ratings, review quotes, and blanket repeated `Dentist` blocks.
- [ ] Validate JSON-LD syntax and inspect representative source after every schema change.

## Sitemap, robots, and internal links

- [ ] Generate `sitemap.xml` from the approved indexable route registry and final canonical URLs.
- [ ] Confirm the sitemap contains no noindex, draft, redirect, error, campaign, or unresolved blog routes.
- [ ] Keep `robots.txt` simple, permit normal crawling, and reference exactly the active sitemap URL.
- [ ] Crawl internal links for broken destinations, redirect hops, fragment failures, orphan pages, and links to blocked clinical content.
- [ ] Maintain service-to-related-service and service-to-approved-resource links; never use local city pages as doorway links.

## Local SEO and conversion readiness

- [ ] Update the approved Google Business Profile appointment URL and service links. Use a documented UTM pattern such as `utm_source=google&utm_medium=organic&utm_campaign=gbp&utm_content=appointment` after analytics ownership approves it.
- [ ] Verify GBP name, address, phone, hours, category, service list, map pin, photos, and website URL against the practice-approved source of truth.
- [ ] Define a compliant review-request process, platform/source ownership, response owner, escalation rules, and consent policy. Do not add review schema until the source and policy are approved.
- [ ] Keep directions/map links working and test the appointment CTA, phone links, form states, confirmation states, and urgent path on mobile and desktop.
- [ ] Document local partnership/link opportunities that are truthful and useful: approved community organizations, professional referrals, local health resources, and relevant Winter Park organizations. No paid/undisclosed or doorway link scheme.

## Performance, accessibility, and measurement

- [ ] Test mobile, tablet, and desktop rendering for every routed view and representative source documents.
- [ ] Check Core Web Vitals, image dimensions/format, font loading, layout shift, interaction delay, console errors, and request failures before and after launch.
- [ ] Verify keyboard focus, skip link, menu state, labels, contrast, form errors, reduced motion, and no horizontal overflow.
- [ ] Instrument approved aggregate events only: page type, CTA location, conversion type, campaign source, and state. Never send patient names, contact details, symptoms, diagnoses, treatment details, or free-form messages to analytics.
- [ ] Establish baseline rankings, organic sessions, calls, appointment requests, form completion, and urgent-path usage before cutover.

### Phase 9 privacy and campaign checks

- [ ] Review `docs/MEASUREMENT-EVENT-VALIDATION.md` and approve the final event vocabulary, aggregate fields, attribution retention, vendor destinations, and named owner.
- [ ] Confirm GA4/tag-manager IDs, call-tracking number policy, CRM/practice-management mapping, and consent behavior from approved configuration; never replace the current `null` placeholders with guessed values.
- [ ] Confirm no event payload contains name, phone, email, free-form message, symptoms, diagnosis, treatment details, referral-friend data, page content, raw referrer URL, or `utm_term`.
- [ ] Confirm form success events are downstream of an approved handler's confirmed success response and that offer/referral success events are never button-click events.
- [ ] Review every campaign brief for audience, source, intent, message, CTA, proof, expectations, limitations, FAQs, thank-you behavior, attribution, approval, expiry, and indexability.
- [ ] Keep paid-only, duplicate, short-lived, blocked, and approval-pending campaign variants noindex and absent from the sitemap; canonicalize only to an approved durable target.
- [ ] Test debug mode, form start/validation/failure/success, session dedupe, keyboard focus, responsive campaign routes, and network requests before enabling any vendor.
- [ ] Assign agency/practice/clinical/compliance/implementation owners, least-privilege access, rollback trigger, monitoring cadence, dashboard definitions, and incident contact.

## Cutover, rollback, and evidence

- [ ] Save the prelaunch crawl, redirect test, sitemap/robots files, source inspections, screenshots, and approval record under `docs/evidence/phase-8/`.
- [ ] Deploy only after all blocking approvals are resolved and the release owner signs the checklist.
- [ ] During cutover, smoke-test home, services, one representative service, provider/about, blog index/article, contact, legal, sitemap, robots, and unknown path.
- [ ] Keep the previous artifact and host configuration recoverable. Define the rollback owner, trigger, and maximum rollback time before DNS/host changes.
- [ ] Record launch time, deployed commit, host, sitemap submission, Search Console actions, redirect log sample, and first 24-hour monitoring results.

## Phase 10 revalidation — 2026-08-05

- Local metadata/schema/sitemap/robots/redirect checks still pass across 54 generated routes and 26 sitemap URLs.
- The human sitemap is available locally at `/sitemap/`; unknown local routes return HTTP 404.
- The 24 candidate redirect rules remain direct and loop-free, but no production rule was activated.
- Thirty-seven URL inventory rows contain 39 blocked/held markers; one-to-one migration is not complete.
- Final domain/canonical/NAP, complete production crawl, Search Console/analytics evidence, blog parity, and live redirect testing remain **NO-GO** gates.

See `docs/MIGRATION-VALIDATION.md` and `docs/LAUNCH-READINESS.md`. No SEO platform action was performed.
