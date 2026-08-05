# Phase 10 Migration Validation

## Verdict

**Blocked for launch.** The local redirect graph and generated SEO surfaces are internally consistent, but one-to-one production parity is not proven for every meaningful current public URL.

## Local dry run

- Inventory: `docs/URL-INVENTORY.csv` with the required source, destination, parity, status, canonical, indexability, owner, state, and notes fields.
- Redirect configuration: 24 candidate direct rules validated with no chain, loop, duplicate source, or home catch-all.
- Candidate output: 54 generated routes; 26 indexable sitemap entries; gated/noindex routes excluded as configured.
- Unique route metadata, H1, canonical, robots directive, breadcrumbs, JSON-LD syntax, sitemap coverage, and 404 source passed `npm run validate:phase8` and `npm run validate:phase10`.
- Local HTTP smoke: home 200, human sitemap 200, unknown URL 404.
- Human sitemap added at `/sitemap/` and linked from the footer; XML sitemap remains generated from indexable routes only.

## Blocked inventory result

Thirty-seven rows contain 39 blocked/held markers. The largest unresolved group is preserved blog content that still needs a complete production crawl and analytics/Search Console prioritization. Teeth whitening and other unmatched service topics cannot be redirected until an equivalent approved destination exists. Candidate redirect rules are not production approval.

## Required evidence before GO

1. Export the current production sitemap(s), CMS URL list, server logs or analytics landing pages, and Search Console indexed/top-linked URLs.
2. Reconcile every meaningful URL against `docs/URL-INVENTORY.csv`, including query/case/trailing-slash variants, PDFs, images, categories, pagination, author pages, campaigns, and hidden orphan URLs.
3. For each source, approve either equivalent 200 preservation, a direct one-hop 301 to equivalent content, a justified 410, or an explicit hold. Never use a mass-home redirect.
4. Deploy rules in a production-like preview and crawl every source. Record source status, `Location`, hop count, final status, canonical, robots, H1, parity, and internal-link destination.
5. Verify no redirect chain/loop, mixed host/protocol, canonical contradiction, sitemap redirect, soft 404, orphan, or indexable noindex route.
6. Re-run after the final domain and brand decision, then preserve the redirect map for the agreed retention period.

## Evidence

- `docs/evidence/phase-10/phase-10-static-qa.json`
- `docs/evidence/phase-8/redirect-report.json`
- `docs/evidence/phase-8/sitemap-report.json`
- `docs/evidence/phase-8/404-report.json`
- `docs/SEO-LAUNCH-CHECKLIST.md`

No redirect, canonical-domain change, DNS action, sitemap submission, or Search Console change was performed.
