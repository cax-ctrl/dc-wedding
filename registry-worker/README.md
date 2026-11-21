# Wedding registry service

The invitation frontend is static GitHub Pages. Its interactive registry requires a separate Cloudflare Worker with D1 for real, shared reservation states.

## Setup
1. Create a D1 database using Cloudflare. Apply `schema.sql` to initialise the five physical gift rows.
2. Create a Cloudflare Worker from `src/index.js` and bind the database as `REGISTRY_DB`.
3. Configure Worker variable `ALLOWED_ORIGINS` to the exact invitation origin(s), for example `https://cax-ctrl.github.io`. Do not include the URL path.
4. Add `REGISTRY_ADMIN_TOKEN` as a **Worker secret**, not in GitHub or in the browser.
5. Deploy over HTTPS, test two simultaneous reservations on the same gift, and verify the second receives HTTP 409. Set `window.WEDDING_REGISTRY_CONFIG.apiBase` in `/registry-config.js` to the Worker origin only after testing.
6. Administrator marking of an item as purchased: authenticated `POST /api/registry/admin/mark` with JSON `{"itemId":"luggage","status":"purchased"}`. To release a guest hold: `POST /api/registry/release` using the guest's private reservation token.

Reservations are time-limited to 72 hours and release automatically on subsequent API traffic. The public GET endpoint never returns guest names or email addresses. Data are not sent to Amazon.

## Payments
The checkout endpoint deliberately returns 503. Connecting Paystack, Stripe or PayPal requires verified receiving accounts, server-side payment creation, signed webhook verification, refunds handling, and a ledger before the frontend can show confirmed contribution amounts or funded progress. Never enter provider secrets into `registry-config.js`.

## Before launch
- Add rate-limiting/Turnstile or another abuse control.
- Put access controls and retention/erasure arrangements in place for guest personal information.
- Add email confirmation with a verified sending service if desired.
- Verify image licences, selected Amazon listings, receiving currencies and legal/privacy wording.
- Test with keyboard, small-screen Safari and real payment sandboxes before switching live.
