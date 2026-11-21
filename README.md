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
- The bank transfer and Alipay receiving details supplied by the organisers are displayed for manual transfers. PayPal and Stripe remain disabled until integrated and tested.
- The layout uses 100svh panels with CSS scroll snapping, with overflow fallback for small heights and reduced-motion settings.
## Wedding registry

The single-page-flow invitation moves from Gratitude to Wishlist, then With thanks. The registry retains upright serif headings and the approved wax seal, without corner botanicals or a separate commerce navigation page.

There are **15 gift options**, including a vehicle fund referencing [Jovico Cars](https://jovicoworld.com/cars), kitchen/home sourcing references at [SourceAxis Global pricing](https://sourceaxisglobal.com/pricing), reproductive-health equipment at [CP Biomed products](https://cpbiomed.com/products/), education and career support at [HubX](https://hubxconsulting.com/), and a proposed maternal/newborn care contribution whose card displays the existing TotalCare Medical logo.

The registry distinguishes **Contribute** (funds, experiences and causes) from **Gift this** (purchasable gifts). Gift this opens the established browse/vendor-reference or transfer options; it does not mark anything as purchased. The Wedding Memories card retains its previously approved image. Six supplied editorial photo references were applied to other cards while the TotalCare Medical logo was preserved. By default the gallery shows 6 gifts on desktop or 4 on mobile; **See more gifts** reveals the remaining items and **Show less** restores the compact view. Filters reset to the compact view. All transfer forms show EUR (€), USD ($), GBP (£), NGN (₦) and CNY (¥), then an amount and Bank transfer, PayPal, Stripe or Alipay transfer. **Alipay transfer is displayed for CNY only** until any alternative settlement/currency arrangements have been established. The Custom gift option collects the name or purpose, amount, currency and payment method. The currency and amount controls have equal 52px outer heights.

`registry-config.js` now contains the bank transfer instructions provided by the organisers for EUR, GBP, USD and NGN, plus a self-hosted Alipay QR and the Alipay contact number for CNY. These details are intentionally public because guests need them to make manual transfers; they have not been independently checked against financial-institution account records. The QR was reproduced from the supplied screenshot after decoding and verifying its payment-link payload. Payments are **not automatically recorded or confirmed**. PayPal and Stripe checkout remain disabled. The proposed maternal/newborn care fund is not represented as an established charity or tax-deductible scheme: confirm the programme, legal beneficiary, consent, accounting and disbursement terms before collecting donations. Amazon browse links are generic searches; SourceAxis pricing describes sourcing assessments, not a consumer product catalogue. CP Biomed's catalogue contains specialist reproductive-health/laboratory equipment. HubX is a service reference and not a retail checkout.

The private delivery address is not published; the contact option directs guests to the person who shared their invitation until an approved wedding contact is configured. Gift status labels require a separately hosted backend (not connected). Existing RSVP security conditions continue to apply.

## Private RSVP manager

The private organiser Google Sheet is shared directly with authorised organisers, not linked from this public repository. See [rsvp-service/README.md](rsvp-service/README.md) for deployment and approval instructions, country-specific validation, message channels, invitation-code issuance, and entrance check-in.

## Website privacy and terms

The final sponsor page shows one **Trust & Legals** link **above Back to the beginning**, opening a same-page panel with **Privacy**, **Terms of Use** and **Cookies** tabs. The RSVP form has one concise **Privacy Policy** link to that same panel.

**Pending before the RSVP service is opened:** confirm the formal data controller's legal identity and direct contact, HubX Limited's role (if any), any specific optional HubX outreach purpose and consent channel, the records retention/deletion schedule, cross-border processing details, and gift/donation receiver/refund terms. Do not repurpose wedding telephone numbers for HubX marketing merely because they were supplied for RSVP. A separate unticked, specific opt-in and an auditable consent record will be needed before implementing secondary marketing; this is intentionally not activated yet.

## Sponsorship and gift-payment acknowledgements

The sponsor button on the final invitation page now opens an on-site form for the **NGN 10,000,000** sponsorship package. It collects sponsor name, contact email, an optional PNG/JPEG/WebP logo (2 MB maximum), preferred payment currency and method, and an optional transfer reference. The existing HubX Limited-DC Event Kuda details are shown for NGN bank transfer. GBP, USD, EUR and CNY are enquiries for an agreed equivalent; no exchange rate is invented. Stripe and PayPal are not currently active for sponsorship. Uploaded logos are not displayed publicly until approval.

Bank and Alipay gift screens now include **I have sent a transfer**. This opens a payment-notice form. A genuine backend acknowledgment is labelled **Gift notice received**; only an organiser-verified payment is labelled **Gift Recorded**. This does not claim that copying bank details or opening Alipay completes payment. The frontend has no simulated payment-success state.

The secure D1/R2 giving service is in [giving-service/](giving-service/) but is **not deployed or connected**. The public `registry-config.js` keeps `givingApiBase` empty. Until configured and tested, submitting a sponsor enquiry or gift notice offers a clear copy-to-clipboard fallback, which must be sent to an organiser separately and is not recorded. Logo previews in this mode stay on the user's device. The giving service requires private Cloudflare bindings and administrator-controlled verification.

Privacy and terms now describe the additional sponsor and gift notice data. The organiser must still finalise legal responsibility, retention, package benefits, logo usage, international settlements and refund arrangements before launching real intake.

## Invitation soundtrack and final copy review (22 November 2026)

The **user-selected recording** is now self-hosted as `assets/wedding-by-leberch.mp3` (original 256 kbps stereo MP3, 58.54 seconds, 1,873,293 bytes). It is *Wedding* by **leberch**, supplied under the **Pixabay Content Licence**: https://pixabay.com/music/wedding-wedding-584474/. The track is copyrighted and Content ID registered, not public-domain or copyright-free. Keep the track source and licence evidence for future reuse, especially in videos. Pixabay's content licence permits use within this creative wedding website, subject to its restrictions; do not redistribute the audio as a standalone music download.

The controls combine **Previous page · Music · Next page** in one extremely translucent, three-part right-side capsule with fine divider lines. A single tap changes the music icon to a slashed note when muted, and back when unmuted. Audio starts from the guest's opening-seal gesture, continues between pages, and uses a 2.6-second Web Audio crossfade to produce a seamless repeat. The audio remains at its current playback position while muted. The interface does not load third-party players or audio scripts.

The eleven-page review updated the cover location to Lekki · Lagos · Nigeria; removed the period in *You're invited* and replaced its introductory wording; added **#DC2027** to Our Story; revised the guest notice to refer to limited **seats** and individual RSVPs on or before 20 December 2026; updated the RSVP deadline; removed the temporary Unsplash photo-credit line from the Gratitude page; changed the registry eyebrow to **Wish-list**; changed the designer credit to **Designed by**; and vertically centred the sponsorship page. The temporary RSVP-unavailable note is hidden automatically as soon as the real RSVP endpoint is configured successfully; the submit button remains disabled until then.
