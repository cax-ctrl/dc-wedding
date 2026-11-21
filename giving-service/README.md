# Wedding gifting & sponsorship enquiries

This is a private intake service for the Deborah & Caleb wedding invitation. The website is static GitHub Pages. This Cloudflare Worker uses **D1** to store transfer notices and sponsor enquiries, and **private R2** for optional logo uploads. These services do **not** move money or verify transfer receipts automatically.

## Two different confirmations

- **Gift notice received**: a guest has reported a manual bank or Alipay transfer, and a private notice was successfully stored. Funds are **not** deemed received. The notice receives an unguessable access token for private status checking.
- **Gift Recorded**: a privileged organiser has independently verified the transaction against the receiving bank/Alipay account and explicitly marked the record `verified`.
- **Sponsor request received**: a sponsor name, email, preferred method/currency and optional private image/logo have been stored. The ₦10,000,000 sponsorship is not paid, approved or publicly displayed until reviewed and confirmed.

## Cloudflare setup (must be performed by an authorised account owner)

1. Create a D1 database named `dc-wedding-giving`. Apply `schema.sql` before submitting requests.
2. Create a **private** R2 bucket named `dc-wedding-sponsor-logos`. Do not enable public access. The Worker restricts logo uploads to PNG, JPEG or WebP at 2 MB maximum. An uploaded image is not automatically inserted into the public wedding website.
3. Create a Worker from `src/index.js`, using the `wrangler.example.toml` as a starting point. Replace the example D1 ID, names and rate-limit namespace IDs with the values from your account.
4. Bind D1 as `GIVING_DB`, R2 as `SPONSOR_LOGOS`, and both built-in rate limiters as `IP_LIMITER` and `GLOBAL_LIMITER`.
5. Set the Worker variable `ALLOWED_ORIGINS` to your exact wedding-site origin, e.g. `https://cax-ctrl.github.io`. Include other verified domains only if used.
6. Create a strong, random `GIVING_ADMIN_TOKEN` as a **Worker secret**; never commit it. Authorise any administrative change with the header `Authorization: Bearer <secret>`.
7. Test these flows before activating:
   - valid sponsor request without logo and with a small, safe PNG logo (both should be `pending` in D1);
   - invalid/oversized and SVG files must be rejected, and uploaded logos must not be publicly accessible;
   - valid gift notice returns a unique notice ID and private token, with status `pending`;
   - `POST /api/gifts/status` with JSON `{"id":"<notice-id>","token":"<access-token>"}` returns `pending`;
   - only an authenticated organiser can update an independently verified gift using `POST /api/admin/verify` with `{"kind":"gift","id":"<notice-id>","status":"verified"}`;
   - subsequent guest status check returns `verified` and the website displays **Gift Recorded**;
   - unauthorised attempts, duplicates/spam and failure paths do not claim payment success.
8. After deployment and successful testing, set `givingApiBase` in the public `registry-config.js` to the HTTPS Worker origin. It is currently blank on purpose. Do not put any Worker secret, sponsor address list or private logo bucket in public JavaScript.

## Organiser workflow

Use D1 in the Cloudflare dashboard (or secure admin tools) to review `gift_notices` and `sponsor_requests`; do not expose D1 administration to public visitors. For a reported bank transfer, verify matching currency, exact amount, beneficiary, payment reference and receipt in the bank's own system. Only then call the admin endpoint to update its status to `verified`. Mark a rejected/unmatched notice `rejected`, and contact the guest separately if needed.

The fixed sponsorship package is **NGN 10,000,000**. The existing HubX Limited-DC Event Kuda account is displayed for NGN transfers only. GBP, USD, EUR and CNY are enquiry options: obtain an agreed quote/settlement arrangement before making a transfer, and do not fabricate conversions. PayPal and Stripe are presented as unavailable until real checkout and payment webhooks have been connected and tested. Do not treat the personal wedding-gift Alipay QR as a verified HubX corporate sponsorship account.

An optional sponsor logo is stored in private R2, not published automatically. Obtain permission to use it and approve the sponsor before adding any logo to the final-page sponsor list. The package's benefits, placement commitments, refund/termination terms and responsible legal entity should be agreed in writing before collecting sponsorship funds.

## When the backend is not connected

The site stays useful as a design preview: a guest can copy a payment notice, and a sponsor can copy an enquiry. **This does not transmit, save, or verify anything.** Optional images can be previewed locally but must be sent separately to the organisers until the private upload endpoint is active.

## Security and privacy

D1 and R2 should have strict account access controls, retention limits and backups. Public form origin checks are not authentication; the rate limit is only one abuse control, so add stronger anti-bot checks if necessary. Never send uploaded files or banking details to an unauthorised third party. The legal privacy statement should cover sponsor names, emails, payment notices and optional uploaded brand assets before the intake service is enabled.

References: [D1 Worker API](https://developers.cloudflare.com/d1/worker-api/), [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).
