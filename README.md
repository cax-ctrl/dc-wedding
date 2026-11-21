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

The **Gifts** page now leads into an ivory, sage and champagne **full-screen registry** before the sponsors page. It includes twelve curated funds/gifts, photo cards, filters, Amazon UK browsing references, contribution forms, and reservation statuses. The approved enlarged D&C ivory seal replaces the previous small drawn SVG without changing the opening animation.

- To test reservation and purchased status locally in your browser without making a real booking, add `?registryDemo=1#registry` to the preview URL and open the envelope. This is clearly marked as a preview and uses session-only state.
- Live shared reservations require deploying the D1-backed Worker in `registry-worker/` and setting `WEDDING_REGISTRY_CONFIG.apiBase` in `registry-config.js`.
- Payment buttons remain disabled until receiving accounts and a separate verified checkout service are connected. No money is taken and no funding progress is invented.
- Amazon links lead to **Amazon UK search results**, not approved exact SKUs; the physical delivery location remains undecided.
