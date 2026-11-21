'use strict';
/* Public request form. A request is never an invitation or an admission code. */
(function () {
  const form = document.getElementById('rsvp-request-form');
  if (!form) return;
  const cfg = window.WEDDING_RSVP_CONFIG || {};
  const apiBase = String(cfg.apiBase || '').trim().replace(/\/$/, '');
  const status = document.getElementById('rsvp-status');
  const country = document.getElementById('rsvp-country');
  const number = document.getElementById('rsvp-phone');
  const prefix = document.getElementById('rsvp-dial-code');
  const wechatWrap = document.getElementById('rsvp-wechat-wrap');
  const wechat = document.getElementById('rsvp-wechat');
  const submit = document.getElementById('rsvp-submit');
  const serviceNote = document.getElementById('rsvp-service-note');
  const success = document.getElementById('rsvp-success');
  const dialCodes = {NG:'234',GB:'44',US:'1',CN:'86'};
  const mobileRules = {
    NG:/^[789][0-9]{9}$/,
    GB:/^7[0-9]{9}$/,
    US:/^[2-9][0-9]{2}[2-9][0-9]{6}$/,
    CN:/^1[3-9][0-9]{9}$/
  };

  function showStatus(text) { status.textContent = text || ''; }
  function activeMethod() {
    return form.querySelector('input[name="confirmationMethod"]:checked')?.value || '';
  }
  function updateCountry() {
    prefix.textContent = '+' + dialCodes[country.value];
    number.placeholder = country.value === 'US' ? '201 555 0123' :
      country.value === 'CN' ? '138 0012 3456' :
      country.value === 'GB' ? '07123 456789' : '0803 123 4567';
  }
  function updateMethod() {
    const isWeChat = activeMethod() === 'WeChat';
    wechatWrap.hidden = !isWeChat;
    wechat.required = isWeChat;
    if (!isWeChat) wechat.value = '';
  }
  function normaliseMobile(raw, countryCode) {
    let digits = String(raw || '').trim();
    const intl = digits.startsWith('+') || digits.startsWith('00');
    digits = digits.replace(/[^\d]/g, '');
    if (intl && digits.startsWith('00')) digits = digits.slice(2);
    const prefixValue = dialCodes[countryCode];
    if (!prefixValue) throw new Error('Choose a supported country.');
    if (intl) {
      if (!digits.startsWith(prefixValue)) throw new Error('Your mobile country code does not match your selected country.');
      digits = digits.slice(prefixValue.length);
    } else if (digits.startsWith(prefixValue) && !mobileRules[countryCode].test(digits)) {
      // Accept pasted international numbers even if the leading + was omitted.
      digits = digits.slice(prefixValue.length);
    }
    if (countryCode !== 'US' && digits.startsWith('0')) digits = digits.slice(1);
    if (!mobileRules[countryCode].test(digits)) {
      throw new Error('Enter a valid mobile number for the selected country.');
    }
    return '+' + prefixValue + digits;
  }
  function ready() {
    return /^https:\/\/[^/]+/.test(apiBase);
  }
  if (ready()) {
    submit.disabled = false;
    serviceNote.textContent = 'Submitting a request does not confirm a seat. Only a personal message with an invitation code confirms admission.';
  } else {
    submit.disabled = true;
    serviceNote.textContent = 'RSVP requests are not open yet. Please check back soon.';
  }
  updateCountry();
  updateMethod();
  country.addEventListener('change', updateCountry);
  form.querySelectorAll('input[name="confirmationMethod"]').forEach(function (radio) {
    radio.addEventListener('change', updateMethod);
  });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!ready()) return;
    showStatus('');
    const fullName = document.getElementById('rsvp-name').value.trim().replace(/\s+/g,' ');
    const method = activeMethod();
    const wechatId = wechat.value.trim();
    if (fullName.length < 2 || fullName.length > 100) {showStatus('Please enter your full name.');return;}
    if (!['SMS','WhatsApp','WeChat'].includes(method)) {showStatus('Choose a confirmation method.');return;}
    if (method === 'WeChat' && (!wechatId || wechatId.length > 80)) {showStatus('Enter your WeChat ID.');wechat.focus();return;}
    if (!document.getElementById('rsvp-consent').checked) {showStatus('Please confirm the contact information notice.');return;}
    let phone;
    try {phone=normaliseMobile(number.value,country.value);} catch(error) {showStatus(error.message);number.focus();return;}
    submit.disabled = true;
    submit.textContent = 'Submitting…';
    try {
      const response = await fetch(apiBase + '/api/rsvp/request', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        cache:'no-store',
        body:JSON.stringify({
          fullName, country:country.value, phone, confirmationMethod:method,
          wechatId:method === 'WeChat' ? wechatId : '',
          consent:true, website:document.getElementById('rsvp-website').value
        })
      });
      const result = await response.json().catch(function(){return {};});
      if (!response.ok || result.accepted !== true) throw new Error(result.error || 'We could not receive your request. Please try again later.');
      form.hidden = true;
      success.hidden = false;
      success.focus();
      showStatus('');
    } catch (error) {
      showStatus(error.message || 'Unable to submit. Please try again later.');
    } finally {
      submit.disabled = !ready();
      submit.textContent = 'Request an Invitation';
    }
  });
})();