/**
 * Deborah & Caleb — private RSVP Google Sheets bridge and organiser tools.
 *
 * Install in the private spreadsheet via Extensions > Apps Script.
 * Script Properties: RSVP_BRIDGE_SECRET (random, at least 32 characters).
 *
 * This script never auto-confirms, never sends a message, and never returns
 * personal data or admission codes to a public caller.
 */

const RSVP_REQUESTS_TAB = 'Requests';
const RSVP_DOOR_TAB = 'Door list';
const RSVP_HELP_TAB = 'Instructions';
const RSVP_COLUMN_COUNT = 16;

function rsvpJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function rsvpSafe_(value, maxLength) {
  const text = String(value == null ? '' : value).trim().slice(0, maxLength || 200);
  // Prevent spreadsheet formula evaluation in user-controlled fields.
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function rsvpBook_() {
  // A web app has no active spreadsheet. Always open the private file by ID.
  const id = PropertiesService.getScriptProperties().getProperty('RSVP_SHEET_ID');
  if (!id) throw new Error('Set Script Property RSVP_SHEET_ID to the private spreadsheet ID.');
  return SpreadsheetApp.openById(id);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents ||
        e.postData.contents.length > 4096) return rsvpJson_({ok:false});

    const payload = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('RSVP_BRIDGE_SECRET');
    if (!secret || secret.length < 32 || payload.bridgeSecret !== secret) {
      return rsvpJson_({ok:false});
    }
    const validCountries = {NG:'+234',GB:'+44',US:'+1',CN:'+86'};
    const validMethods = ['SMS','WhatsApp','WeChat'];
    if (!payload.consent || !validCountries[payload.country] ||
        !validMethods.includes(payload.confirmationMethod) ||
        typeof payload.fullName !== 'string' ||
        payload.fullName.trim().length < 2 ||
        payload.fullName.trim().length > 100 ||
        typeof payload.phone !== 'string' ||
        !payload.phone.startsWith(validCountries[payload.country]) ||
        !/^\+\d{8,15}$/.test(payload.phone) ||
        (payload.confirmationMethod === 'WeChat' &&
         (!payload.wechatId || String(payload.wechatId).trim().length < 2))) {
      return rsvpJson_({ok:false});
    }
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return rsvpJson_({ok:false});
    try {
      const sheet = rsvpBook_().getSheetByName(RSVP_REQUESTS_TAB);
      if (!sheet) throw new Error('Requests tab is missing.');
      const last = sheet.getLastRow();
      if (last >= 2) {
        const existing = sheet.getRange(2,5,last-1,1).getDisplayValues();
        if (existing.some(row => String(row[0]).replace(/^'/,'') === payload.phone)) {
          // Identical response for repeat submissions: do not disclose prior entries.
          return rsvpJson_({ok:true});
        }
      }
      const now = new Date().toISOString();
      // Request status only. No invitation code is created here.
      sheet.appendRow([
        rsvpSafe_(payload.requestId,80), now,
        rsvpSafe_(payload.fullName,100),
        {NG:'Nigeria',GB:'United Kingdom',US:'United States',CN:'China'}[payload.country],
        rsvpSafe_(payload.phone,24),
        payload.confirmationMethod,
        payload.confirmationMethod === 'WeChat' ? rsvpSafe_(payload.wechatId,80) : '',
        now, 'Requested', '', '', '', 'Not sent', '', '', now
      ]);
      const inserted = sheet.getLastRow();
      sheet.getRange(inserted,5).setNumberFormat('@');
      return rsvpJson_({ok:true});
    } finally {
      lock.releaseLock();
    }
  } catch (_) {
    // Never expose spreadsheet errors or guest details through the public bridge.
    return rsvpJson_({ok:false});
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Wedding RSVP')
    .addItem('Issue codes for confirmed guests','issueConfirmedCodes')
    .addItem('Refresh private door list','refreshDoorList')
    .addToUi();
}

function issueConfirmedCodes() {
  const book = rsvpBook_();
  const sheet = book.getSheetByName(RSVP_REQUESTS_TAB);
  const control = book.getSheetByName(RSVP_HELP_TAB);
  const capacity = Number(control.getRange('B19').getValue());
  if (!Number.isInteger(capacity) || capacity < 1) {
    SpreadsheetApp.getUi().alert('Set venue capacity in Instructions!B19 before issuing any codes.');
    return;
  }
  const end = sheet.getLastRow();
  if (end < 2) {SpreadsheetApp.getUi().alert('No RSVP requests yet.');return;}
  const rows = sheet.getRange(2,1,end-1,RSVP_COLUMN_COUNT).getValues();
  const approved = rows.filter(row => row[8] === 'Confirmed');
  if (approved.length > capacity) {
    SpreadsheetApp.getUi().alert('Approved guests exceed venue capacity. Review statuses before issuing codes.');
    return;
  }
  const used = new Set(rows.map(row => String(row[9] || '').trim()).filter(Boolean));
  let issued = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][8] !== 'Confirmed' || rows[i][9]) continue;
    let code;
    do {
      code = 'DC-' + Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase();
    } while (used.has(code));
    used.add(code);
    sheet.getRange(i+2,10).setValue(code);
    sheet.getRange(i+2,16).setValue(new Date().toISOString());
    issued++;
  }
  SpreadsheetApp.getUi().alert(issued + ' code(s) issued. Send each code only after approval, via the guest’s requested channel.');
}

function refreshDoorList() {
  const book = rsvpBook_();
  const source = book.getSheetByName(RSVP_REQUESTS_TAB);
  const dest = book.getSheetByName(RSVP_DOOR_TAB);
  const oldEnd = dest.getLastRow();
  const oldRows = oldEnd >= 2 ? dest.getRange(2,1,oldEnd-1,5).getValues() : [];
  const previous = new Map(oldRows.map(row => [String(row[0]),row]));
  const end = source.getLastRow();
  const data = end >= 2 ? source.getRange(2,1,end-1,RSVP_COLUMN_COUNT).getValues() : [];
  const approved = data.filter(row =>
    row[8] === 'Confirmed' && row[9] &&
    ['Sent','Delivered'].includes(row[12]) && row[10]
  ).map(row => {
    const code = String(row[9]);
    const prior = previous.get(code);
    return [code, row[2], prior ? prior[2] : 'Not arrived',
      prior ? prior[3] : '', prior ? prior[4] : ''];
  });
  if (oldEnd >= 2) dest.getRange(2,1,oldEnd-1,5).clearContent();
  if (approved.length) dest.getRange(2,1,approved.length,5).setValues(approved);
  SpreadsheetApp.getUi().alert('Door list updated: ' + approved.length + ' guest(s) with confirmed invitations and sent messages.');
}

/**
 * When an organiser marks a message Sent or Delivered manually in column M,
 * timestamp and preferred channel are added, unless already present.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (sh.getName() !== RSVP_REQUESTS_TAB || e.range.getRow() <= 1 ||
      e.range.getColumn() !== 13 || e.range.getNumRows() !== 1) return;
  if (!['Sent','Delivered'].includes(String(e.value || ''))) return;
  const row = e.range.getRow();
  if (!sh.getRange(row,11).getValue()) sh.getRange(row,11).setValue(new Date().toISOString());
  if (!sh.getRange(row,12).getValue()) sh.getRange(row,12).setValue(sh.getRange(row,6).getValue());
  sh.getRange(row,16).setValue(new Date().toISOString());
}
