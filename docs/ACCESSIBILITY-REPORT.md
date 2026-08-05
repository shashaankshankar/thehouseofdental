# Phase 10 Accessibility Report

## Result

No critical or high accessibility barrier remains in the verified local implementation. Production remains NO-GO for other launch gates, and the placeholder Accessibility Statement still requires legal/organizational review.

## Automated/static coverage

`npm run validate:phase10` checked all 54 generated routes for language, landmarks, skip link, one H1, duplicate IDs, form associations, accessible control names, `aria-controls` targets, image dimensions/alt structure, safe external-link attributes, stale review claims, and public QuietNite exposure. Result: no route-level accessibility finding.

The browser matrix checked 108 route/viewport combinations for failed images, horizontal overflow, duplicate IDs, missing visible-control labels, unnamed links/buttons, heading jumps, and sub-24px visible targets. Result: 0 failures. Evidence: `docs/evidence/phase-10/phase-10-browser-qa.json`.

## Manual keyboard and screen-reader-oriented checks

| Pattern | Result | Evidence |
|---|---|---|
| Skip link and landmarks | Pass; skip link precedes banner/navigation and targets `#main-content`; banner, main, complementary, navigation, and contentinfo are exposed | DOM snapshots and static QA |
| Headings | Pass in checked output; one route H1 and no visible heading-level jump in the matrix | Browser QA JSON |
| Mobile menu/submenus | Pass; quick actions first, expanded state exposed, body locked, open menu reachable, sticky actions hidden while open, Escape closes, focus returns to burger | `final-mobile-menu-services-open-390x844.png`, `mobile-menu-state.json` |
| Desktop mega menu | Pass; grouped labels and normal service links, no 1440px clipping | `desktop-services-mega-menu-1440x900.png` |
| Dialog | Pass; labelled dialog, initial focus, inert background, body lock, close/Escape path, trigger focus return | `technology-dialog-state.json`, `technology-dialog-open-390x844.png` |
| Care search/filter/accordion | Pass; labelled search, unique filtered result, button expanded/control relationship, panel region, keyboard-operable native controls | `care-control-state.json`, `care-search-filtered-390x844.png` |
| Appointment errors/status | Pass; seven required fields receive errors, live summary is visible, focus moves to first invalid field, unconfigured handler reports a failure rather than success | `contact-form-validation.json`, `contact-form-unconfigured.json` |
| Touch targets | Pass in matrix; checkbox is 24px and range control has a 44px interaction height; buttons/links checked at the defined floor | Browser QA JSON |
| Focus visibility/order | Pass on checked menu, dialog, form, care controls, and ordinary navigation; custom focus styles remain visible | State captures and screenshots |
| Motion/reduced motion | Pass by source review; no carousel/autoplay, and the shared reduced-motion branch disables nonessential animation/transitions | Source/static QA |
| Reflow/zoom | Pass using 1280/640 and 320px reflow proxies for 200%/400% desktop zoom plus the full 320px matrix; no document overflow or unreachable main content | Browser QA JSON |
| Before/after/testimonial | No public automatic testimonial rotation or unsupported public patient proof; retained comparison controls are native range inputs with accessible value behavior | Source/static QA |

## Contrast and visual review

The final screenshots were reviewed across dark and ivory surfaces. Body copy opacity was raised where needed, hero text no longer uses the weakest token, focus states remain gold/white against dark surfaces, and no text is placed over an uncontrolled image crop. Exact production contrast should be rechecked after any brand-color, image, or font change.

## Remaining lower-risk/organizational items

| Item | Owner | Due | Status |
|---|---|---|---|
| Replace and approve the Accessibility Statement with the practice’s actual support process and contact ownership | Legal / practice | Before launch | Open blocker through legal gate |
| Re-run automated tooling in the production-like HTTPS preview after vendor scripts, consent, and form integration are added | Accessibility / technical | Before launch | Open retest |
| Test with at least one production screen reader/browser pair after integrations are final | Accessibility / release | Before launch | Open retest |

Any newly added vendor widget, chat, scheduling embed, consent layer, video, or campaign component reopens the accessibility gate.
