# The House of Dental — client setup and launch handoff

This document lists the information, accounts, approvals, and production checks needed before a production release or DNS change on Cloudflare Workers. Local build success is not deployment approval. Client-owned setup and final go-live approval remain separate gates.

## 1. Who owns what

### Client provides or approves

- Access to the GoDaddy domain account or coordination with the person who manages DNS.
- Confirmation that `thehouseofdentalwp.com` is the approved production domain.
- Resend sender-domain authorization and the inbox that should receive website messages.
- Google Business Profile/Google Cloud ownership and approval for the public review integration.
- GA4 property ownership, privacy approval, and analytics event approval, if analytics will be enabled.
- Final approval of website content, legal pages, contact behavior, and the preview.
- Final written approval to change DNS and publish the Worker.

### Agency performs

- Builds and validates the source-controlled site.
- Configures the Cloudflare Worker and Static Assets deployment.
- Adds approved Worker variables and encrypted secrets without exposing them in Git.
- Deploys the approved Worker version.
- Performs preview and production browser checks.
- Records separate preview and production evidence.

## 2. Values to confirm

These are the intended production values. The client should confirm that the recipient inbox, sender identity, and domain are correct before deployment.

| Setting | Value | Client action |
| --- | --- | --- |
| Production domain | `thehouseofdentalwp.com` | Confirm |
| Contact sender | `website@thehouseofdentalwp.com` | Authorize in Resend |
| Contact recipient | `office@thehouseofdentalwp.com` | Confirm inbox and staff access |
| Contact origin | `https://thehouseofdentalwp.com` | Confirm |
| Google Place ID | Client-provided value | Provide and confirm location |
| Google Places API key | Secret; never send in this document | Create/restrict and transfer securely |
| Resend API key | Secret; never send in this document | Create and transfer securely |

The sender and recipient addresses are not interchangeable: Resend sends from the sender address, while website messages are delivered to the recipient inbox. A successful website response means the message was accepted for email delivery; it does not book or confirm an appointment.

## 3. Cloudflare account and domain setup

The target is one Worker named `thehouseofdental`, serving Static Assets from `dist/` at the approved custom domain. The agency currently manages the Worker and repository. The client retains control of the domain registration unless a different arrangement is approved.

Client checklist:

- Confirm who owns the Cloudflare account and who can approve production changes.
- Confirm that the Cloudflare zone for `thehouseofdentalwp.com` is available to the agency, or provide the required invitation.
- Confirm who owns the GoDaddy account and provide a contact for the nameserver change.
- Do not change nameservers until the agency provides the final DNS record plan and written go-live approval.

## 4. DNS and website domain setup

Before any nameserver change:

1. Export or record the complete current GoDaddy DNS zone.
2. Identify the records required for the website domain and any other active services that must remain available.
3. Recreate the required website and service records in Cloudflare before changing nameservers.
4. Confirm the final Cloudflare preview and rollback plan.

The planned web routing is:

- Apex: `https://thehouseofdentalwp.com` → Cloudflare Worker.
- `www`: proxied placeholder with a single redirect to the apex domain.
- HTTPS: required for the production domain.

The client must approve the DNS change because an incorrect nameserver migration can interrupt the domain or other connected services even when the website itself is working.

## 5. Resend contact-email setup

The current website contact form posts to `/api/contact`. It sends the submitted name, phone, email, new-patient selection, and message to the office inbox through Resend. It does not create or confirm an appointment.

Client checklist:

- Create or confirm the Resend account used for the practice.
- Verify the sending domain `thehouseofdentalwp.com` in Resend.
- Add the SPF/DKIM records Resend provides to the authoritative DNS zone.
- Confirm that `website@thehouseofdentalwp.com` is an authorized sender.
- Confirm that `office@thehouseofdentalwp.com` is monitored by the office.
- Decide who should receive delivery notifications and how long messages should be retained.
- Approve the contact-message wording, privacy notice, and instruction not to submit sensitive medical information.
- Approve spam/rate-limit handling and the process for missed or failed messages.

The client must provide the Resend API key through an approved secure channel. It must be stored as an encrypted Worker secret and must not be placed in Git, this document, screenshots, tickets, browser fields, or chat messages.

### Contact retry safety and optional delivery correlation

Each browser submission attempt gets a cryptographically secure UUID in the `Idempotency-Key` header. The browser reuses that UUID when the same submission is retried. The Worker validates the format, generates a replacement UUID when necessary, and sends Resend a website-scoped key in the form `website-contact:<uuid>`. This protects only website contact messages and does not change the separate Email Reports integration.

The contact response remains explicit: `200` with `accepted: true` is returned only after Resend accepts an email and returns a message ID; the honeypot returns a generic `202` with `accepted: false`; validation remains `422`. Honeypot and validation responses do not emit lead events.

The Worker has an optional `DELIVERY_DB` D1 path for technical delivery correlation. When enabled, it stores only a request ID, a SHA-256 submission-attempt hash, Resend message ID, provider status/status code, webhook IDs, and timestamps. Resend webhook events are deduplicated by `svix-id`. With no binding, the Worker continues to operate without D1 and does not store form contents or identity data.

Manual provisioning is intentionally not performed in this repository because no production D1 database ID has been supplied. If the client approves this storage path, provision it through the approved Cloudflare account:

```bash
npx wrangler d1 create thehouseofdental-delivery
```

Copy the real `database_id` from Wrangler into `wrangler.jsonc`; do not commit the placeholder below:

```json
"d1_databases": [
  {
    "binding": "DELIVERY_DB",
    "database_name": "thehouseofdental-delivery",
    "database_id": "<returned database ID>",
    "migrations_dir": "./migrations"
  }
]
```

Apply the schema, then run the normal local checks and deploy the approved Worker configuration:

```bash
npx wrangler d1 migrations apply thehouseofdental-delivery --remote --config ./wrangler.jsonc
npm run check
npx wrangler deploy
```

Record the D1 binding, migration result, deployment version, webhook acceptance, and delivery evidence as separate production evidence. D1 provisioning and migration are not required for the Worker to serve the website.

## 6. Google review/reputation setup

The website can load the practice rating and review count through the server-side endpoint `/api/google-reputation`. The browser never receives the Google Places API key.

Client checklist:

- Confirm the Google Business location represented by the site.
- Provide the correct Google Place ID through a secure, non-public channel.
- Use a Google Cloud project owned or approved by the client.
- Enable billing and the required Places API capability for that project.
- Create an API key restricted to the required server-side API usage.
- Approve the displayed rating, review count, Google link, fallback behavior, and refresh/cache behavior.
- Confirm that the displayed review claims and structured-data claims are accurate and approved.

The API key must be stored as an encrypted Worker secret. If the key or billing setup is not ready, the site must remain in its neutral fail-closed state rather than exposing a key or inventing live review data.

## 7. GA4 and privacy approval

Analytics is a separate approval gate from deployment. The client must decide whether the production site should collect GA4 data at launch.

If analytics is approved, provide or confirm:

- GA4 property ownership.
- Numeric property ID.
- Numeric web-stream ID.
- Measurement ID in `G-XXXXXXXXXX` format.
- Property timezone.
- Approved healthcare/privacy route list.
- Approved consent wording and privacy-policy language.
- Approved events and conversions.
- Retention and reporting access requirements.
- Read-only access for the agency reporting connector, if reporting is being connected.

The live repository contains production analytics settings, but local configuration and a public collection request are not proof of client approval or receipt in the intended GA4 property. Record written approval and complete production DebugView verification; otherwise disable GA4 until those gates are satisfied.

Required live evidence, if enabled:

- Analytics storage remains denied before consent; advanced Consent Mode may send restricted cookieless pings.
- Correct behavior after consent and after decline.
- Each applicable event appears exactly once in the approved GA4 property.
- Only approved UTM keys may appear in `page_location`; no names, emails, phone numbers, messages, health information, titles, referrers, fragments, file names, query strings, or other direct identifiers are sent.
- Approved routes, prohibited routes, and unknown routes behave correctly.

The separate [GA4 approval handoff](./ANALYTICS-HANDOFF.md) contains the event contract and activation sequence.

## 8. Content, legal, and clinical approval

Before preview approval, the client should review every page and explicitly confirm:

- Practice name, address, phone number, hours, and contact details.
- Doctor, team, credentials, services, pricing, financing, and insurance statements.
- Review counts, ratings, before/after images, testimonials, photos, and social links.
- Medical, cosmetic, treatment, and outcome claims.
- Privacy policy, terms, accessibility page, consent wording, and contact-form instructions.
- Downloadable care instructions and their clinical accuracy.
- Whether any content needs a disclaimer or legal revision.

The client owns final approval of clinical, legal, privacy, and marketing claims. The agency should not publish unapproved proof, patient information, testimonials, or clinical guarantees.

## 9. Preview approval checklist

The agency will provide a preview URL after the approved configuration is available. The client should test the preview on a phone and desktop and report exact URLs for any issue.

Approve or reject each item:

- Home page and all navigation links.
- All 23 generated pages, including the blog index and ten educational articles.
- Phone links and contact calls to action.
- Contact form validation and success/failure messaging.
- Receipt of one approved synthetic contact message, if Resend is enabled.
- Google review display and Google link, if enabled.
- Consent banner and privacy choices.
- Mobile menu, modals, downloads, anchors, and back-to-top behavior.
- Browser tab title, social preview basics, favicon, and 404 page.
- No visible console errors or broken images.
- Correct redirects, HTTPS, headers, and clean URLs.

Preview approval should include the approver, date, environment URL, and any remaining accepted limitations.

## 10. Production go-live checklist

Production is ready only after all applicable boxes are complete:

- [ ] Client confirms domain and DNS owner.
- [ ] DNS zone is exported and required website/service records are documented.
- [ ] Cloudflare zone and Worker access are confirmed.
- [ ] Resend sender domain is verified.
- [ ] Resend recipient inbox is confirmed.
- [ ] Resend API key is securely installed as an encrypted Worker secret.
- [ ] Google Place ID and Places key are configured, restricted, and approved, or the integration remains disabled.
- [ ] GA4 is approved and live-tested, or disabled for production.
- [ ] Content, clinical claims, privacy policy, terms, and accessibility content are approved.
- [ ] Preview is approved in writing.
- [ ] Final release is promoted to `main`.
- [ ] Client approves DNS and production publish.
- [ ] DNS, SSL, redirects, email delivery, APIs, routes, responsive layouts, and console behavior are checked after propagation.
- [ ] Production evidence and rollback details are recorded.

## 11. What the client should send back

Use this checklist in the handoff response:

```text
Production domain confirmed: thehouseofdentalwp.com
Cloudflare/DNS owner:
GoDaddy/DNS contact:
Resend sender domain verified: yes / no
Resend sender approved: website@thehouseofdentalwp.com
Resend recipient confirmed: office@thehouseofdentalwp.com
Google Place ID confirmed: yes / no
Google Places integration approved: yes / no / defer
GA4 production decision: enable / disable / defer
Content and legal review approved: yes / no
Preview approved: yes / no
DNS change approved: yes / no
Production publish approved: yes / no
Approver name and date:
Remaining issues or accepted limitations:
```

Never paste API keys, access tokens, service-account keys, passwords, or other secrets into this response. Use the agreed secure transfer method instead.

## Evidence and release boundary

Record separate evidence for local Worker verification, preview acceptance, and production acceptance. Do not describe local tests, a Wrangler dry-run, or a generated bundle as proof of deployment, DNS propagation, email delivery, GA4 receipt, or production approval.
