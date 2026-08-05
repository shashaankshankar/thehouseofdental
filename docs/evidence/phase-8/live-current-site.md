# Live current-site observations — 2026-08-05

This evidence records what was re-checked from the current public website during Phase 8. It is not a replacement for a production crawl/export.

## Source pages checked

- [Current homepage](https://winterparkdental.com/)
- [Current service hub](https://winterparkdental.com/dental-services/)
- [Current blog index](https://winterparkdental.com/blog/)
- [Current contact page](https://winterparkdental.com/contact-us/)
- [Current sitemap index link](https://winterparkdental.com/sitemap_index.xml)

## Verified observations

- Practice phone: `(407) 678-1400`.
- Practice address: `6504 University Blvd, Winter Park, FL 32792`.
- Current public email observed on the contact surface: `office@winterparkdental.com`.
- Current homepage hours observed: Monday–Thursday, 8:00am–3:00pm. The current contact search-visible text also shows Friday by appointment only and Saturday/Sunday closed.
- Current service navigation exposed the service hub, restorative/cosmetic/preventive categories, dental implants, dentures, same-day crowns, root canals, veneers, teeth whitening, Invisalign, oral surgery, sedation, TMJ, and sleep apnea URLs.
- The live blog DOM exposed 22 article URLs and the category/pagination URLs recorded in `docs/URL-INVENTORY.csv`. Two newly observed articles exposed page metadata dates: `2026-07-26` for “How Dental Implants Help Preserve Jawbone Health” and `2026-07-24` for “Do Veneers Look Natural? What You Need to Know.”
- Current blog source fields observed: title `Blog | Winter Park Dental`, H1 `Blog`, canonical `https://winterparkdental.com/blog/`, description `Stay in track with the latest dental news in with Winter Park Dental! Learn health tricks, best practices, ideal treatment paths and more!`, and an index/follow robots directive. The redesign keeps the local blog route disabled until the complete source content is captured and reviewed.
- No author or medical-review attribution was assumed from the available surfaces. The blog manifest leaves those fields `null` until source content is captured.

## Sitemap and completeness limitation

The sitemap index link is known, but this environment could not retrieve the sitemap response reliably: direct page opening was blocked, the shell could not resolve the production host, and the browser page could not load the sitemap as a normal document. The current URL inventory therefore marks the sitemap-only/blog completion gate as blocked rather than claiming that navigation-based extraction is complete.

Before launch, run a production crawl/export that includes XML sitemap URLs, Search Console pages, analytics landing pages, redirects, orphan pages, pagination, legal pages, and every current article. Reconcile that export against `docs/URL-INVENTORY.csv` and update the redirect registry before deployment.

## Domain gate

`https://winterparkdental.com` is used as a provisional, non-deployed canonical baseline because the practice/legal decision about the final brand/domain is unresolved. No new-domain canonical, DNS change, domain move, Change of Address, deployment, or Search Console submission was performed in Phase 8.
