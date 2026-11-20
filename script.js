'use strict';

// A single invitation at a time, just as in the original full-screen reference.
// GitHub Pages can display the invitation, but cannot store private RSVPs.
const $ = id => document.getElementById(id);
const rsvpAPIBase = (window.WEDDING_RSVP_API_BASE_URL || '').trim().replace(/\/$/, '');
const lookupForm = $('lookup-form');
const rsvpForm = $('rsvp-form');
const statusEl = $('rsvp-status');
const codeInput = $('invitation-code');
const formGuests = $('invited-guests');
const success = $('rsvp-success');
let currentCode = '';
let currentParty = null;

// Do not pretend that RSVPs are received until the separately hosted,
// access-controlled invitation API is actually connected.
if (!rsvpAPIBase) {
  const notice = document.createElement('p');
  notice.className = 'rsvp-preview-notice';
  notice.setAttribute('role','status');
  notice.textContent = 'Private RSVP opens once individual invitations have been issued. This preview is not yet collecting responses.';
  lookupForm.replaceWith(notice);
}
function status(text) { statusEl.textContent = text; }
function loading(button, busy, idleText) {
  button.disabled = busy;
  button.textContent = busy ? 'Please wait…' : idleText;
}
async function postJSON(path, body) {
  let response;
  try {
    if (!rsvpAPIBase) throw new Error('RSVP is not yet available');
    response = await fetch(rsvpAPIBase + path, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
  } catch (_) { throw new Error('Unable to connect to RSVP service. Please try again later.'); }
  let data = {};
  try { data = await response.json(); } catch (_) { /* backend may be unavailable */ }
  if (!response.ok) throw new Error(data.error || 'Your request could not be completed. Please try again.');
  return data;
}
function guestChoice(guest) {
  const el = document.createElement('div'); el.className = 'guest-choice';
  const head = document.createElement('div'); head.className = 'guest-choice-head';
  const name = document.createElement('strong'); name.textContent = guest.name;
  const category = document.createElement('small'); category.textContent = guest.category === 'child' ? 'INVITED CHILD' : 'INVITED GUEST';
  head.append(name, category); el.append(head);
  const choices = document.createElement('div'); choices.className = 'guest-choice-buttons';
  for (const [value, label] of [['yes','Accepts'], ['no','Declines']]) {
    const option = document.createElement('label');
    const radio = document.createElement('input'); radio.type='radio'; radio.name = `guest-${guest.id}`;radio.value=value; radio.required=true;
    if (guest.attending === value) radio.checked = true;
    option.append(radio, document.createTextNode(label)); choices.append(option);
  }
  el.append(choices); return el;
}
function displayInvitation(data) {
  currentParty = data; lookupForm.hidden = true; success.hidden = true; rsvpForm.hidden = false;
  $('invite-lead').textContent = data.leadName;
  $('invite-party-note').textContent = `${data.guests.length} named ${data.guests.length === 1 ? 'guest' : 'guests'}`;
  formGuests.replaceChildren(...data.guests.map(guestChoice));
  $('guest-phone').value = data.phone || ''; $('guest-message').value = data.message || ''; status('');
}
async function lookup(code) {
  if (!code.trim()) { status('Please enter your private invitation code.'); return; }
  const button = $('lookup-btn');loading(button,true,'Find my invitation');status('');
  try {
    const data = await postJSON('/api/invitation/lookup', {code:code.trim()});
    currentCode = code.trim(); displayInvitation(data);
  } catch(e){status(e.message);}finally{loading(button,false,'Find my invitation');}
}
lookupForm.addEventListener('submit', e => {e.preventDefault();lookup(codeInput.value);});
rsvpForm.addEventListener('submit', async e => {
  e.preventDefault();status(''); if (!currentParty) return;
  const choices=[];
  for (const guest of currentParty.guests) {
    const selected = rsvpForm.querySelector(`input[name="guest-${guest.id}"]:checked`);
    if (!selected) {status(`Please select a response for ${guest.name}.`);return;}
    choices.push({guestId:guest.id, attending:selected.value});
  }
  const phone = $('guest-phone').value.trim();
  if (!/^\+?[\d ()-]{7,23}$/.test(phone) || (phone.match(/\d/g)||[]).length < 7) {
    status('Please include a reachable contact number.'); return;
  }
  if (!$('guest-consent').checked) {status('Please confirm the contact information notice.');return;}
  const button=$('submit-rsvp');loading(button,true,'Submit my RSVP');
  try {
    const data=await postJSON('/api/rsvp', {code:currentCode,phone,choices,message:$('guest-message').value.trim(),consent:true});
    rsvpForm.hidden=true;success.hidden=false;$('success-ref').textContent=data.reference;
    currentParty.guests.forEach(g=>{g.attending=choices.find(c=>c.guestId===g.id)?.attending||null;});
    $('success-copy').textContent=data.acceptedCount?`We have recorded your response for ${data.acceptedCount} attending ${data.acceptedCount===1?'guest':'guests'}.`:'We have recorded your response. Thank you.';
    $('message-status').textContent=data.smsStatus==='sent'?'A confirmation text was sent.':'Keep your on-screen reference; SMS confirmations are not enabled.';
    success.focus();
  } catch(e){status(e.message);}finally{loading(button,false,'Submit my RSVP');}
});
$('change-invite').addEventListener('click',()=>{rsvpForm.hidden=true;lookupForm.hidden=false;currentParty=null;currentCode='';status('');codeInput.value='';codeInput.focus();});
$('edit-rsvp').addEventListener('click',()=>{if(currentParty) displayInvitation(currentParty); else {success.hidden=true;lookupForm.hidden=false;}});
const invitationCode = new URLSearchParams(location.search).get('invite');
if (invitationCode && rsvpAPIBase) {
  history.replaceState({},'',location.pathname+location.hash);
  codeInput.value=invitationCode;
  // Show the RSVP panel immediately for a personally addressed invitation.
  requestAnimationFrame(()=>{$('rsvp').scrollIntoView({behavior:'instant'}); lookup(invitationCode);});
}



// Self-contained first-screen envelope: full-screen and direct to the homepage.
(function setupEnvelope(){
  const stage=document.getElementById('opening-stage');
  const pages=document.getElementById('pages');
  const open=document.getElementById('open-seal');
  const skipLink=document.querySelector('.skip-link');
  if(!stage || !pages || !open) return;
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inviteFromLink = new URLSearchParams(window.location.search).has('invite');
  if (inviteFromLink && window.WEDDING_RSVP_API_BASE_URL) return;
  stage.hidden=false;
  pages.inert=true;
  if (skipLink) skipLink.inert=true;
  open.focus({preventScroll:true});
  let running=false;
  let finished=false;
  const timers=[];
  const after=(ms,fn)=>timers.push(window.setTimeout(fn,ms));
  function finish(){
    if(finished) return;
    finished=true;
    pages.inert=false;
    if (skipLink) skipLink.inert=false;
    stage.hidden=true;
    stage.className='opening-stage';
    document.getElementById('home').scrollIntoView({block:'start',behavior:'instant'});
  }
  function play(){
    if(running || finished) return;
    running=true;
    stage.classList.add('is-unsealing');
    if(reduceMotion){
      stage.classList.add('is-opening','is-opened','is-revealing');
      finish();
      return;
    }
    after(180,()=>stage.classList.add('is-opening'));
    after(1320,()=>stage.classList.add('is-opened'));
    after(1520,()=>stage.classList.add('is-revealing'));
    after(2080,finish);
  }
  open.addEventListener('click',play);
})();
