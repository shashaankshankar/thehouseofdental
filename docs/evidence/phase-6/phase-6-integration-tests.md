# Phase 6 integration tests

Date: 2026-08-04  
Scope: homepage acquisition hierarchy, global navigation, patient-goal paths, sticky actions, and responsive/accessibility integration  
Deployment: intentionally not performed

## Automated local checks

- `npm test` — passed all five tests, including the Phase 6 data-driven acquisition and approval-gate regression test.
- `npm run validate` — passed all 42 generated routes, metadata, canonical URLs, IDs, internal links, assets, JSON-LD, source shell boundaries, and sitemap coverage. It reports seven existing pending About-team image warnings.
- The build generated 42 routes, with 24 indexable routes and five planned/gated registry routes.

## Browser destination checks

- The homepage sweep found 63 same-origin links across 22 unique routes. Every route returned HTTP 200 with one H1; every same-origin fragment target existed.
- Featured service destinations passed for Dental Implants, Same-Day Crowns, and Invisalign.
- Goal destinations passed for Replace Missing Teeth, Relieve Dental Pain, Improve My Smile, Straighten My Teeth, Feel More Comfortable, and Schedule Routine Care.
- Phone links resolve to `tel:+14076781400`.
- Directions resolve to the maintained Google Maps URL `https://goo.gl/maps/CT32JzwGHYR7qNJX6`.
- Request Appointment resolves to `/contact.html#book`, and the appointment section is present without submitting the form.

## Browser interaction checks

- At 390×844, the mobile menu puts Call and Request Appointment first, exposes Services/New Patients/Patient Resources/About accordion buttons, and does not hide unreachable links.
- Escape closes the mobile menu, restores `aria-expanded="false"`, and returns focus to the Open menu trigger.
- At 1440×900, hovering Services exposes grouped Featured care, Choose by patient goal, and Directory links.
- Manual testimonial tabs update the selected tab and visible panel; no auto-rotation or carousel behavior exists.
- Technology cards open an accessible dialog; CT Scan opens with `aria-hidden="false"`, and Escape closes it with `aria-hidden="true"`.

## Responsive checks

The required twelve viewport checks are recorded in `phase-6-browser-qa.json` and screenshots are saved alongside it. At every viewport, document scroll width matched the viewport, attempted horizontal scrolling left `window.scrollX` at 0, headers were not clipped, hero CTAs fit, and hero CTA heights met the 44px touch-target check. The short 1024×768 tablet refinement keeps all four verified trust values above the sticky action bar.
