'use strict';

// Wedding invitation opening animation. RSVP requests are handled separately in rsvp.js.
// A genuine physical opening sequence: seal lifts, flaps part, homepage appears.
(function setupEnvelope(){
  const stage=document.getElementById('opening-stage');
  const pages=document.getElementById('pages');
  const open=document.getElementById('open-seal');
  const skipLink=document.querySelector('.skip-link');
  if(!stage || !pages || !open) return;
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  pages.inert=true;
  if(skipLink) skipLink.inert=true;
  let running=false, finished=false;
  function finish(){
    if(finished) return;
    finished=true;
    pages.inert=false;
    if(skipLink) skipLink.inert=false;
    stage.hidden=true;
    document.getElementById('home').scrollIntoView({block:'start',behavior:'instant'});
  }
  open.addEventListener('click',()=>{
    if(running||finished)return;
    running=true;
    if(reduceMotion){finish();return;}
    stage.classList.add('is-unsealing');
    window.setTimeout(()=>stage.classList.add('is-lifting'),430);
    window.setTimeout(()=>stage.classList.add('is-parting'),1100);
    window.setTimeout(()=>stage.classList.add('is-revealing'),2000);
    window.setTimeout(finish,2660);
  });
})();
