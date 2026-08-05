# Blog preservation and publishing instructions

Phase 8 keeps the current blog out of the generated public sitemap until its source content has been crawled and approved. This avoids replacing article equity with thin placeholders or inventing clinical provenance.

## Current inventory

- Source domain: `https://winterparkdental.com`
- Observed date: 2026-08-05
- 22 article URLs are recorded in `the-house-of-dental-site/data/blog-articles.json`.
- Current category and pagination URLs are recorded in `docs/URL-INVENTORY.csv`.
- Organic-traffic/backlink prioritization is `blocked_analytics_access`; obtain Search Console/analytics exports before deciding which articles need first-wave migration.
- The current sitemap index could not be retrieved from this environment. Treat this inventory as a source-backed hold set, not a completed crawl export.

## Required article record before enabling a route

For every source URL, the content owner must capture and approve:

1. Exact source URL and final slug.
2. Title, meta description, canonical intent, publication date, and any actual modification date.
3. Author and medical-review attribution only when the source or practice supplies it. Leave unknown values empty.
4. Complete article body, headings, tables, lists, references, internal links, related services, and CTA destinations.
5. Featured/in-body image URLs, alt text, ownership/usage rights, patient consent if applicable, and responsive crops.
6. Clinical claims, disclaimers, limitations, and last-reviewed owner/date where the content is medical or treatment-related.
7. Existing inbound links, analytics, Search Console clicks/impressions, ranking queries, conversions, and backlink notes when access is granted.

## Publishing flow

1. Copy the current source into the article working record without rewriting away useful search intent.
2. Preserve the source slug when practical. If the slug changes, add one direct 301 in `config/redirects.json` to the approved equivalent; never redirect an article to the homepage or an unrelated service.
3. Use `templates/blog-index.html` for the index and `templates/blog-article.html` for an article fragment. Keep content in ordinary HTML so it remains usable without JavaScript.
4. Emit one title, description, canonical, robots directive, social preview, and H1. Use `noindex` while the article is a draft or clinical review is incomplete.
5. Add visible breadcrumbs and only links that resolve to approved pages. Do not add Article/Person/medical-review structured data until the corresponding source fields are verified.
6. Add the route to `routes.json` only when its content, images, rights, clinical review, and destination links are ready. Add it to the sitemap only when it is indexable.
7. Run `npm run build`, `npm run validate`, `npm run validate:phase8`, and `npm test`, then inspect the generated article source and representative mobile/desktop rendering.

## Do not publish

- invented authors, reviewers, review dates, update dates, patient stories, outcomes, ratings, or quotes;
- hidden FAQ text or FAQPage markup that is not visible on the page;
- an article shell with only a title, a short paragraph, or a generic appointment CTA;
- a local city page that repeats the article for Winter Park, Orlando, or nearby communities without distinct useful content;
- an article in the sitemap while its canonical, indexability, image rights, or clinical approval is unresolved.
