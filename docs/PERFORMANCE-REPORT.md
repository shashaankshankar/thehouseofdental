# Phase 10 Performance Report

## Scope and method

Measurements were collected on 2026-08-05 in the Codex in-app Chromium browser against the local static server. Eight representative routes were measured at 390×844 and 1440×900 with a query-gated, local-only observer. These are **lab measurements**, not field Core Web Vitals. TBT is a long-task proxy; INP requires production field data or controlled interaction tooling. Local TTFB does not represent CDN, TLS, geographic latency, or production caching.

Raw results: `docs/evidence/phase-10/phase-10-performance-browser.json`.

## Budgets

| Budget | Limit | Final |
|---|---:|---:|
| HTML gzip per route | 25 KB | Home 8,162 B; checked routes below budget |
| Shared CSS gzip | 20 KB | 18,024 B |
| Shared JavaScript gzip | 15 KB | 11,007 B |
| Home critical mobile estimate | 175 KB | 78,275 B |
| Home critical desktop estimate | 175 KB | 134,851 B |
| Home requests before optional runtime | 8 | 5 mobile / 6 desktop in lab |
| Third-party requests | 0 | 0 |

## Before/after asset measurements

The before column is measured from repository `HEAD` before Phase 10 changes. A pre-change browser lab trace was not captured, so no pre-change LCP/CLS/TBT number is claimed.

| Asset/surface | Before | After | Change |
|---|---:|---:|---:|
| Shared CSS raw | 117,976 B | 97,753 B | -17.1% |
| Shared CSS gzip | 21,773 B | 18,024 B | -17.2% and inside budget |
| Shared JS raw | 40,388 B | 44,112 B | +9.2% for privacy-safe lab diagnostics and final behavior fixes |
| Shared JS gzip | 10,103 B | 11,007 B | +8.9%, still inside budget |
| Desktop hero source | 262,233 B JPEG | 90,648 B AVIF | -65.4% selected image source |
| Mobile hero source | 131,436 B JPEG | 34,072 B AVIF | -74.1% selected image source |
| External font surface | Google Fonts CSS plus two preconnects | none | third-party font dependency removed |

## Final lab results

| Route | Profile | TTFB | FCP | LCP | CLS | TBT proxy | Transfer | Requests | Third party |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Home | Mobile | 0.7 ms | 92 ms | 92 ms | 0 | 0 ms | 233,591 B | 5 | 0 |
| Home | Desktop | 1.2 ms | 160 ms | 160 ms | 0 | 11 ms | 324,539 B | 6 | 0 |
| Services | Mobile / Desktop | 1.3 / 0.6 ms | 64 / 104 ms | 64 / 104 ms | 0 / 0 | 0 / 0 ms | 187,396 B each | 4 each | 0 |
| Dental Implants | Mobile / Desktop | 0.6 / 0.8 ms | 80 / 92 ms | 80 / 92 ms | 0 / 0 | 0 / 0 ms | 192,484 B each | 4 each | 0 |
| Facial Aesthetics draft | Mobile / Desktop | 1.2 / 1.1 ms | 76 / 84 ms | 76 / 84 ms | 0 / 0 | 0 / 0 ms | 183,873 B each | 4 each | 0 |
| New Patients | Mobile / Desktop | 0.7 / 0.7 ms | 92 / 80 ms | 92 / 80 ms | 0 / 0 | 0 / 0 ms | 185,413 B each | 4 each | 0 |
| Contact | Mobile / Desktop | 1.0 / 0.9 ms | 76 / 100 ms | 76 / 100 ms | 0 / 0 | 0 / 0 ms | 187,860 B each | 4 each | 0 |
| Pre/Post-Op | Mobile / Desktop | 1.0 / 0.8 ms | 76 / 92 ms | 76 / 92 ms | 0 / 0 | 0 / 0 ms | 205,932 B each | 4 each | 0 |
| Implant campaign | Mobile / Desktop | 0.7 / 1.0 ms | 60 / 72 ms | 60 / 72 ms | 0 / 0 | 0 / 0 ms | 185,690 B each | 4 each | 0 |

## Implemented optimizations

- Responsive AVIF/WebP/JPEG hero sources, intrinsic dimensions, mobile/desktop crops, and a single viewport-matched LCP preload.
- No Google Fonts request; resilient system serif/sans stacks avoid font blocking and privacy/availability risk.
- Build-time CSS minification and deferred shared script.
- No failed assets or external runtime requests in the checked matrix.
- Images below the hero retain lazy loading through the shared content patterns.
- Performance instrumentation runs only with `?hod_perf=1`, stores results in the document for QA, and never transmits them.

## Required production retest

Run mobile and desktop Lighthouse (or equivalent) against the approved HTTPS preview and then production with cache-cold and cache-warm passes. Record real compression, CDN/TLS/TTFB, image selection, request priority, TBT/INP proxy, accessibility, and third-party impact. After sufficient traffic, use field LCP, INP, and CLS; do not replace field values with these localhost lab numbers.
