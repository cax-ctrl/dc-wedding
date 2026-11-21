'use strict';
/* Same-page legal information; the invitation stays in place. */
(function(){
  const dialog=document.getElementById('website-legal-dialog');
  if(!dialog || typeof dialog.showModal!=='function') return;
  const triggers=Array.from(document.querySelectorAll('[data-legal-open]'));
  const tabs=Array.from(dialog.querySelectorAll('[data-legal-tab]'));
  const panels=Array.from(dialog.querySelectorAll('[data-legal-panel]'));
  function select(name){
    const valid=panels.some(panel=>panel.dataset.legalPanel===name)?name:'privacy';
    for(const tab of tabs){
      const active=tab.dataset.legalTab===valid;
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex=active?0:-1;
    }
    for(const panel of panels)panel.hidden=(panel.dataset.legalPanel!==valid);
    dialog.querySelector('.legal-panel-scroll').scrollTop=0;
  }
  triggers.forEach(trigger=>trigger.addEventListener('click',function(){
    select(trigger.dataset.legalOpen);
    dialog.showModal();
  }));
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(tab.dataset.legalTab));
    tab.addEventListener('keydown',function(event){
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      let destination=index;
      if(event.key==='ArrowRight') destination=(index+1)%tabs.length;
      if(event.key==='ArrowLeft') destination=(index+tabs.length-1)%tabs.length;
      if(event.key==='Home') destination=0;
      if(event.key==='End') destination=tabs.length-1;
      select(tabs[destination].dataset.legalTab);
      tabs[destination].focus();
    });
  });
  dialog.querySelector('.legal-dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',function(event){
    if(event.target===dialog) dialog.close();
  });
})();
