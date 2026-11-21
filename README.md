# Deborah & Caleb — Wedding Website

Website for the white wedding of Deborah and Caleb, Friday 1 January 2027.

This redesign takes structural inspiration from Rainier-PS's full-screen invitation demo, while using original layout, writing, styling, typography hierarchy and custom wedding palette. The original reference uses a full-viewport scroll-snap layout; this site preserves that simplicity with an ivory/sage/soft-gold visual system.

- **Preview**: `https://cax-ctrl.github.io/dc-wedding/`
- **Venue**: The Conservatory Garden, 18 Wole Olateju Crescent, off Admiralty Way, Lekki Phase One, Lagos.
- **Schedule**: Venue opens noon, guests seated from 12:30 pm, service 1 pm and reception at the same venue.
- **Guest list**: Invitation only; no additional guests, including children, unless named.
- **RSVP deadline**: 20 December 2026.

## Technical notes

- GitHub Pages hosts the invitation and international RSVP request form, but **does not itself save guest details**.
- The private Google Sheets guest-management workbook has been created. A Cloudflare Worker and Google Apps Script bridge are implemented in `rsvp-service/` but must be deployed and verified before guest submissions are enabled.
- Public `/rsvp-config.js` leaves `WEDDING_RSVP_CONFIG.apiBase` blank until the server-side service is ready. Do not commit guest details, Apps Script URLs, credentials, or invitation-code lists.
- Anyone with the link may **request** an invitation; only personally confirmed guests sent a unique code have a place. No automatic approval or messaging occurs.
- Photography references are temporary Unsplash images already used in the previous design, to be replaced with the couple's own photos. The story is intentionally a placeholder; no personal history has been invented.
- Wedding gift/payment links will remain inactive until supplied and verified.
- The layout uses 100svh panels with CSS scroll snapping, with overflow fallback for small heights and reduced-motion settings.
## Wedding registry

The single-page-flow invitation moves from Gratitude to Wishlist, then With thanks. The registry retains upright serif headings and the approved wax seal, without corner botanicals or a separate commerce navigation page.

There are **15 gift options**, including a vehicle fund referencing [Jovico Cars](https://jovicoworld.com/cars), kitchen/home sourcing references at [SourceAxis Global pricing](https://sourceaxisglobal.com/pricing), reproductive-health equipment at [CP Biomed products](https://cpbiomed.com/products/), education and career support at [HubX](https://hubxconsulting.com/), and a proposed maternal/newborn care contribution whose card displays the existing TotalCare Medical logo.

Every card has **Contribute**. Cards with a vendor reference open that vendor or Transfer. All transfer forms show USD ($), GBP (£), NGN (₦) and CNY (¥), then an amount and Bank transfer, PayPal, Stripe or Alipay transfer. **Alipay transfer is displayed for CNY only** until any alternative settlement/currency arrangements have been established. The Custom gift option collects the name or purpose, amount, currency and payment method. The currency and amount controls have equal 52px outer heights.

No unverified bank, Alipay, PayPal or Stripe account is displayed; all receiving details are blank in `registry-config.js`. The site does not yet accept or verify payments. The proposed maternal/newborn care fund is not represented as an established charity or tax-deductible scheme: confirm the programme, legal beneficiary, consent, accounting and disbursement terms before collecting donations. Amazon browse links are generic searches; SourceAxis pricing describes sourcing assessments, not a consumer product catalogue. CP Biomed's catalogue contains specialist reproductive-health/laboratory equipment. HubX is a service reference and not a retail checkout.

The private delivery address is not published; the contact option directs guests to the person who shared their invitation until an approved wedding contact is configured. Gift status labels require a separately hosted backend (not connected). Existing RSVP security conditions continue to apply.

## Private RSVP manager

Organiser Google Sheet: https://docs.google.com/spreadsheets/d/1cZ2IelToxKsCgEpwf3ANswE44nAqq_0PmoXBNDfsMUM/edit (restricted access). See [rsvp-service/README.md](rsvp-service/README.md) for deployment and approval instructions, country-specific validation, message channels, invitation-code issuance, and entrance check-in.
