# Cloudflare Workers handoff checklist

This document records the client-owned and agency-owned steps that remain outside the repository conversion. No production deployment or DNS change is authorized by local build success.

## Repository and build

- Repository URL and access ownership: pending agency handoff record.
- Production branch: `main`.
- Promotion flow: `dev` → `qa` → `main`.
- Build command: `npm run check`.
- Worker deploy command: `npx wrangler deploy`.
- Preview command: `npx wrangler versions upload`.
- Static Assets directory: `./dist`.
- Worker entrypoint: `./worker/index.mjs`.
- Wrangler configuration: `wrangler.jsonc`.

## Runtime inventory

Plain variables:

- `GOOGLE_PLACE_ID`
- `APPOINTMENT_BACKEND_URL` (pending approval)
- `APPOINTMENT_ALLOWED_ORIGINS` (pending approval; exact production origin only)

Encrypted secrets:

- `GOOGLE_PLACES_API_KEY`
- `APPOINTMENT_BACKEND_TOKEN` (pending approval)

Do not record secret values in this document, Git, tickets, screenshots, logs, or browser payloads.

## Third-party and privacy gates

- Confirm Google Places API billing, key restriction, field mask, and ownership.
- Approve the appointment adapter contract, sender identity, notifications, rate limiting, bot controls, duplicate-send handling, retention, and sensitive free-text policy.
- Approve the healthcare analytics route list, consent copy, event/conversion list, retention, and GA4 property/stream ownership.
- Keep all integrations disabled or fail closed until the corresponding approval is recorded.

## DNS and domain cutover

Before changing GoDaddy nameservers:

1. Export the complete current DNS zone.
2. Reproduce Microsoft 365 MX, SPF, DKIM, DMARC, autodiscover, verification, and any unobserved GoDaddy records in Cloudflare.
3. Verify mail delivery before propagation.
4. Activate the Cloudflare zone and confirm the custom domain target in `wrangler.jsonc`.
5. Obtain preview approval and record HTTPS, headers, clean routes, legacy redirects, custom 404, API fail-closed behavior, and responsive browser evidence.
6. Point the apex to the Worker, add a proxied `www` placeholder, and configure one Cloudflare Single Redirect from `www` to the apex.
7. Verify SSL, mail delivery, and one-hop redirects after propagation.
8. Retain the previous preview as rollback infrastructure until Cloudflare monitoring passes.

## Evidence

Record separate Cloudflare evidence for local Worker verification, preview acceptance, and production acceptance. Do not overwrite historical host-specific evidence or describe local checks as deployment proof.
