# Deborah & Caleb — RSVP requests and private guest list

This package supports the public wedding website without making Google Sheets accessible to website visitors. A request is **not** a booking, and no invitation code is sent or generated during public submission.

## Components

- `/rsvp.js` — the public request form and validation. The form stays closed until `rsvp-config.js` contains a verified Worker URL.
- `worker/src/index.js` — Cloudflare Worker endpoint `POST /api/rsvp/request`, with origin checking, input validation, honeypot and rate limits. It does not store guest data.
- `apps-script/Code.gs` — Google Apps Script web app. It appends submissions to the **private** Google Sheet, deduplicates by phone and provides organiser-only menu actions for issuing admission codes and refreshing the door list.
- Private native Google Sheet: open it from your Google Drive. Do not publish its URL in this repository.

## Activate (owner action required)

1. Open the private Google Sheet, check tabs **Requests**, **Door list** and **Instructions**, and set the venue capacity in **Instructions!B19**. Keep the file restricted to authorised organisers.
2. From that spreadsheet, open **Extensions → Apps Script**. Replace the default Code.gs contents with `apps-script/Code.gs` from this repository. Save.
3. In Apps Script **Project Settings → Script Properties**, add **RSVP_SHEET_ID** (the spreadsheet ID from your private Google Sheet URL) and **RSVP_BRIDGE_SECRET** (a new strong random secret of at least 32 characters). Keep the values private; never put the secret in GitHub or browser JavaScript.
4. Deploy the Apps Script project: **Deploy → New deployment → Web app**, **Execute as: Me**, **Who has access: Anyone** (required for the Worker to POST). Copy the `.../exec` URL. Anyone can call this endpoint, but requests without the secret will be rejected. Restrict editor access to the script and spreadsheet.
5. Deploy the Cloudflare Worker from `worker/wrangler.toml` and `worker/src/index.js`, using Wrangler or the Workers dashboard. Configure two Worker secrets, **APPS_SCRIPT_URL** (the deployed /exec URL) and **RSVP_BRIDGE_SECRET** (the *same* secret used in Apps Script). Ensure rate-limit namespaces are unique in your Cloudflare account and the binding names match. Review `ALLOWED_ORIGINS`; the current source uses the site origin `https://cax-ctrl.github.io`.
6. Verify an authorised test submission appears in the private Sheet as **Requested**, without an admission code; verify a duplicate phone doesn't add a second row; verify invalid country/phone and high-rate requests fail. Remove test records before going live.
7. Only after that, set `window.WEDDING_RSVP_CONFIG.apiBase` in the public `/rsvp-config.js` to your deployed HTTPS Worker origin. Never put the Apps Script URL or shared secret in this file.
8. Test the full process in desktop and mobile Safari and from a mainland China network where guests will use it. GitHub Pages and related CDNs may not be equally reachable in all locations; use an accessible custom-domain deployment if needed.

## Organiser workflow

1. Every distinct valid mobile number appears in Requests with **Requested** status. There is no public guest login, queue rank or seat guarantee.
2. Review each request. Set **Review status** (column I) to **Confirmed**, **Waitlisted** or **Declined**. One person = one place. Do not confirm more people than the number in Instructions!B19.
3. Click the **Wedding RSVP → Issue codes for confirmed guests** menu in Google Sheets. This checks capacity and creates unique random `DC-` codes (column J) only for manually confirmed requests. Anyone not confirmed has no valid admission code.
4. Send approved guests a personal SMS, WhatsApp or WeChat message with their **name and code**. The system **does not send messages**. In column M select `Sent` or `Delivered` after sending; column K will be stamped automatically. Column L records the channel.
5. Select **Wedding RSVP → Refresh private door list**. It includes only **Confirmed** requests with generated codes and messages marked Sent/Delivered. It retains prior check-in marks when refreshed.
6. Entrance staff verify both code and name, and mark the person as Checked in. **Do not share the Requests tab** with entrance staff or publish the Sheet. For least privilege, export or copy the Door list for the entrance team.
7. After the celebration, remove personal contact data according to the privacy notice and your intended retention period.

## Example approval message (organiser sends it personally)

Dear [Guest Name], we are delighted to confirm your place at Deborah & Caleb's wedding on 1 January 2027 at The Conservatory Garden, Lekki Phase 1, Lagos. Your personal invitation code is [CODE]. Please present your code and name at the entrance. This invitation is for you only.

## Important safeguards

- The website form is deliberately disabled before deployment. It must never claim a submission has been received if nothing was saved.
- Origin checking does not authenticate visitors, and the rate limit is a basic abuse control. Check logs and add Cloudflare WAF or further bot protection if abuse becomes material. Do not rely on browser-side validation.
- Google Apps Script executes with the owner's spreadsheet permissions; protect the secret and limit authorised script editors.
- Scripts do not automatically send messages or confirm guests, nor do they make Google Sheets available in mainland China. Guests submit to the Worker instead.
- No private mobile numbers, messages, WeChat IDs or admission codes belong in this public GitHub repository.
