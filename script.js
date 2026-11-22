'use strict';

// A single tap begins the 6.5-second ceremonial opening; the seal belongs
// to the hinged upper lid and never moves separately from its parent.
(function setupEnvelope(){
  const stage=document.getElementById('opening-stage');
  const pages=document.getElementById('pages');
  const seal=document.getElementById('open-seal');
  const skipLink=document.querySelector('.skip-link');
  if(!stage || !pages || !seal) return;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  pages.inert=true;
  if(skipLink) skipLink.inert=true;
  let started=false;
  function finish(){
    if(stage.hidden)return;
    pages.inert=false;
    if(skipLink) skipLink.inert=false;
    stage.hidden=true;
    const controls=document.getElementById('page-jump-controls');
    if(controls) controls.hidden=false;
    pages.scrollTo({top:0,behavior:'instant'});
  }
  seal.addEventListener('click',()=>{
    if(started)return;
    started=true;
    seal.disabled=true;
    if(reducedMotion.matches){finish();return;}
    stage.classList.add('is-lifting');
    window.setTimeout(()=>stage.classList.add('is-blooming'),400);
    window.setTimeout(()=>stage.classList.add('is-opening'),1650);
    window.setTimeout(()=>stage.classList.add('is-clearing'),4600);
    window.setTimeout(()=>stage.classList.add('is-revealing'),5200);
    window.setTimeout(finish,6500);
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
