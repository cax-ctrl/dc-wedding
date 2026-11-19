'use strict';
const $ = (id) => document.getElementById(id);
const menuButton = document.querySelector('.nav-toggle');
const nav = $('primary-navigation');
menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');}));
// Accessible visual fallback in offline previews or if remote Unsplash images fail.
document.querySelectorAll('.unsplash-image').forEach(img => {
  img.addEventListener('error', () => {img.style.display = 'none';});
});
// Countdown to the ceremony: 1 January 2027, 1 p.m. WAT (UTC+1).
const eventStart = new Date('2027-01-01T13:00:00+01:00').getTime();
function updateCountdown(){
  let seconds = Math.max(0,Math.floor((eventStart-Date.now())/1000));
  const parts={days:Math.floor(seconds/86400),hours:Math.floor(seconds%86400/3600),minutes:Math.floor(seconds%3600/60),seconds:seconds%60};
  for(const [name,value] of Object.entries(parts)){const el=document.querySelector(`[data-count="${name}"]`);if(el)el.textContent=String(value).padStart(name==='days'?1:2,'0');}
}
updateCountdown();setInterval(updateCountdown,1000);

const lookupForm=$('lookup-form'),rsvpForm=$('rsvp-form'),statusEl=$('rsvp-status'),codeInput=$('invitation-code'),formGuests=$('invited-guests'),success=$('rsvp-success');
// GitHub Pages hosts the invitation, not a database. The public preview must not
// collect RSVPs until a secure, separately hosted API is deployed and configured.
// Configure via ./rsvp-config.js AFTER deploying and securing the RSVP service.
const rsvpAPIBase=(window.WEDDING_RSVP_API_BASE_URL||'').trim().replace(/\/$/,'');
if (!rsvpAPIBase) {
  const form=lookupForm;
  const p=document.createElement('p');
  p.setAttribute('role','status');
  p.className='rsvp-preview-notice';
  p.textContent='Online RSVP will be available once private guest invitations are issued. This is a website preview; no guest details are being collected yet.';
  form.replaceWith(p);
  document.querySelector('.rsvp-intro p:nth-of-type(3)')?.remove();
}

let currentCode='', currentParty=null;
function status(text){statusEl.textContent=text;}
function setLoading(button, isLoading, idleText){button.disabled=isLoading;button.textContent=isLoading?'Please wait…':idleText;}
async function postJSON(path,body){
  let response;
  try{if(!rsvpAPIBase) throw new Error('The RSVP service is not yet available.');response=await fetch(rsvpAPIBase+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}catch(e){throw new Error('Unable to connect to RSVP service. Please try again later.');}
  let data={};try{data=await response.json();}catch(e){/* unparseable response */}
  if(!response.ok)throw new Error(data.error||'Your request could not be completed. Please try again.');
  return data;
}
function guestChoice(guest){
  const container=document.createElement('div');container.className='guest-choice';
  const heading=document.createElement('div');heading.className='guest-choice-head';
  const name=document.createElement('strong');name.textContent=guest.name;
  const cat=document.createElement('small');cat.textContent=guest.category==='child'?'INVITED CHILD':'INVITED GUEST';heading.append(name,cat);container.append(heading);
  const radios=document.createElement('div');radios.className='guest-choice-buttons';
  for(const [value,label] of [['yes','Joyfully accepts'],['no','Regretfully declines']]){
    const option=document.createElement('label');const radio=document.createElement('input');
    radio.type='radio';radio.name=`guest-${guest.id}`;radio.value=value;radio.required=true;if(guest.attending===value)radio.checked=true;
    option.append(radio,document.createTextNode(label));radios.append(option);
  }
  container.append(radios);return container;
}
function displayInvitation(data){
  currentParty=data;lookupForm.hidden=true;success.hidden=true;rsvpForm.hidden=false;
  $('invite-lead').textContent=data.leadName;
  $('invite-party-note').textContent=`${data.guests.length} named ${data.guests.length===1?'guest':'guests'} on this invitation`;
  formGuests.replaceChildren(...data.guests.map(guestChoice));
  $('guest-phone').value=data.phone||'';
  $('guest-message').value=data.message||'';
  status('');
}
async function lookup(code){
  if(!code.trim()){status('Please enter the code on your invitation.');return;}
  const b=$('lookup-btn');setLoading(b,true,'Find my invitation');status('');
  try{const data=await postJSON('/api/invitation/lookup',{code:code.trim()});currentCode=code.trim();displayInvitation(data);}
  catch(e){status(e.message);}
  finally{setLoading(b,false,'Find my invitation');}
}
lookupForm.addEventListener('submit',e=>{e.preventDefault();lookup(codeInput.value);});
rsvpForm.addEventListener('submit',async e=>{
  e.preventDefault();status('');
  if(!currentParty)return;
  const choices=[];
  for(const guest of currentParty.guests){
    const checked=rsvpForm.querySelector(`input[name="guest-${guest.id}"]:checked`);
    if(!checked){status(`Please select a response for ${guest.name}.`);return;}
    choices.push({guestId:guest.id,attending:checked.value});
  }
  const phone=$('guest-phone').value.trim();
  if(!/^\+?[\d ()-]{7,23}$/.test(phone) || (phone.match(/\d/g)||[]).length<7){status('Please enter a reachable telephone number, including country code where possible.');return;}
  if(!$('guest-consent').checked){status('Please agree to the RSVP contact-information notice.');return;}
  const b=$('submit-rsvp');setLoading(b,true,'Submit my RSVP →');
  try{
    const data=await postJSON('/api/rsvp',{code:currentCode,phone,choices,message:$('guest-message').value.trim(),consent:true});
    rsvpForm.hidden=true;success.hidden=false;$('success-ref').textContent=data.reference;
    currentParty.guests.forEach(g => {g.attending=choices.find(c=>c.guestId===g.id)?.attending||null;});
    $('success-copy').textContent=data.acceptedCount?`We have received your reply for ${data.acceptedCount} attending ${data.acceptedCount===1?'guest':'guests'}. Keep this reference for your records.`:'We have recorded your reply. Thank you for letting us know.';
    $('message-status').textContent=data.smsStatus==='sent'?'A confirmation text has also been sent to your contact number.': 'Your reply is stored. SMS delivery is not yet enabled; please retain your on-screen reference.';
    status('');success.focus();
  }catch(err){status(err.message);}finally{setLoading(b,false,'Submit my RSVP →');}
});
$('change-invite').addEventListener('click',()=>{rsvpForm.hidden=true;lookupForm.hidden=false;currentParty=null;currentCode='';status('');codeInput.value='';codeInput.focus();});
$('edit-rsvp').addEventListener('click',()=>{if(currentParty){displayInvitation(currentParty);}else{success.hidden=true;lookupForm.hidden=false;}});
const inviteParam=new URLSearchParams(window.location.search).get('invite');
if(inviteParam && rsvpAPIBase){history.replaceState({},'',window.location.pathname+window.location.hash);codeInput.value=inviteParam;lookup(inviteParam);}