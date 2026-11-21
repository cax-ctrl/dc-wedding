# Deborah & Caleb — Wedding Website

Website for the white wedding of Deborah and Caleb, Friday 1 January 2027.

This redesign takes structural inspiration from Rainier-PS's full-screen invitation demo, while using original layout, writing, styling, typography hierarchy and custom wedding palette. The original reference uses a full-viewport scroll-snap layout; this site preserves that simplicity with an ivory/sage/soft-gold visual system.

- **Preview**: `https://cax-ctrl.github.io/dc-wedding/`
- **Venue**: The Conservatory Garden, 18 Wole Olateju Crescent, off Admiralty Way, Lekki Phase One, Lagos.
- **Schedule**: Venue opens noon, guests seated from 12:30 pm, service 1 pm and reception at the same venue.
- **Guest list**: Invitation only; no additional guests, including children, unless named.
- **RSVP deadline**: 20 December 2026.

## Technical notes

- GitHub Pages only hosts the static website. It **does not receive or save RSVPs**.
- Public `/rsvp-config.js` intentionally leaves `WEDDING_RSVP_API_BASE_URL` blank. Only configure once you deploy and secure the separate RSVP API and approved guest database. Never commit guest data, payment credentials, API secrets or invitation-code lists.
- Photography references are temporary Unsplash images already used in the previous design, to be replaced with the couple's own photos. The story is intentionally a placeholder; no personal history has been invented.
- Wedding gift/payment links will remain inactive until supplied and verified.
- The layout uses 100svh panels with CSS scroll snapping, with overflow fallback for small heights and reduced-motion settings.
## Wedding registry

The Gifts page links to the registry through one **Wishlist ↓** link, followed by a single **With thanks ↓** link to the sponsors page. The Story, Colours and RSVP pages now also have explicit next-page links. The registry uses the invitation's non-italic typography and restrained ivory/sage/champagne palette.

All 12 gift cards have **one Contribute button**. For five physical gift ideas, the pop-up offers **Browse Amazon** (Amazon UK search in a new tab) or **Transfer** (same-page pop-up). For the seven flexible gifts, Contribute goes directly to the transfer selection. Guests can choose USD, GBP or NGN, enter any amount, and choose Bank transfer, PayPal or Stripe. Gift prices and funding progress are not invented.

**Receiving accounts and payments are not yet connected.** The public `registry-config.js` has empty bank, contact and checkout settings. Bank details only appear after verified account data is configured. PayPal and Stripe buttons only enable after a secured checkout service and corresponding method have been configured. The registry includes a contact-for-delivery action; until an approved wedding contact is provided, it directs guests to the person who shared their invitation.

Shared gift status badges, when available, can be read from the separately hosted Worker service in `registry-worker/`. The previous browser-only reservation demonstration and multiple actions on individual cards have been removed from the guest interface. Amazon shopping actions do not themselves reserve or confirm purchases. The Worker is not deployed or connected by this frontend change.

The enlarged approved ivory D&C seal and envelope animation remain in place. The sponsors page and other invitation content remain otherwise intact.
