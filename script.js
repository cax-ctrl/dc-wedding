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
    const pageControls=document.getElementById('page-jump-controls');
    if(pageControls) pageControls.hidden=false;
    const musicControl=document.getElementById('wedding-audio-toggle');
    if(musicControl && (window.AudioContext||window.webkitAudioContext)) musicControl.hidden=false;
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


// Discreet page-by-page controls. A click skips an internally scrolling section
// such as the gift registry, without making guests scroll through every gift.
(function setupPageNavigation(){
  const pages=document.getElementById('pages');
  const controls=document.getElementById('page-jump-controls');
  const up=document.getElementById('page-jump-up');
  const down=document.getElementById('page-jump-down');
  if(!pages || !controls || !up || !down) return;

  const panels=Array.from(pages.children).filter(node=>node.classList.contains('page'));
  if(panels.length < 2) return;
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function activeIndex(){
    const top=pages.getBoundingClientRect().top;
    let best=0, distance=Infinity;
    panels.forEach(function(panel,index){
      const gap=Math.abs(panel.getBoundingClientRect().top-top);
      if(gap < distance){distance=gap;best=index;}
    });
    return best;
  }
  function titleOf(panel){
    return (panel?.querySelector('h1,h2')?.textContent || 'page').replace(/\s+/g,' ').trim();
  }
  function update(){
    const current=activeIndex();
    up.disabled=current===0;
    down.disabled=current===panels.length-1;
    if(current>0) up.setAttribute('aria-label','Previous page: '+titleOf(panels[current-1]));
    else up.setAttribute('aria-label','Beginning of invitation');
    if(current<panels.length-1) down.setAttribute('aria-label','Next page: '+titleOf(panels[current+1]));
    else down.setAttribute('aria-label','End of invitation');
  }
  function move(direction){
    if(controls.hidden || document.querySelector('dialog[open]')) return;
    const next=panels[activeIndex()+direction];
    if(!next) return;
    const top=pages.scrollTop+
      next.getBoundingClientRect().top-pages.getBoundingClientRect().top;
    pages.scrollTo({top,behavior:reduceMotion.matches?'auto':'smooth'});
  }
  up.addEventListener('click',()=>move(-1));
  down.addEventListener('click',()=>move(1));
  pages.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update,{passive:true});
  update();
})();
