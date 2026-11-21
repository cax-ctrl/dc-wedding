'use strict';

// On-page gallery for the two original illustrated photographs.
// Native <dialog> provides Escape-key dismissal and restores focus on close.
(function setupStoryGallery(){
  const dialog=document.getElementById('story-lightbox');
  const image=document.getElementById('story-lightbox-photo');
  const close=document.getElementById('story-lightbox-close');
  const buttons=Array.from(document.querySelectorAll('[data-story-photo]'));
  if(!dialog||!image||!close||!buttons.length)return;
  const photos={
    '1':{src:'./assets/story-moment-1.svg',alt:'Deborah and Caleb making playful expressions together'},
    '2':{src:'./assets/story-moment-2.svg',alt:'Deborah and Caleb smiling together'}
  };
  let previousFocus=null;
  buttons.forEach(function(button){
    button.addEventListener('click',function(){
      const item=photos[button.dataset.storyPhoto];
      if(!item)return;
      image.src=item.src;
      image.alt=item.alt;
      previousFocus=button;
      dialog.showModal();
      close.focus();
    });
  });
  close.addEventListener('click',function(){dialog.close();});
  dialog.addEventListener('click',function(event){
    if(event.target===dialog)dialog.close();
  });
  dialog.addEventListener('close',function(){
    image.removeAttribute('src');
    if(previousFocus && previousFocus.isConnected)previousFocus.focus({preventScroll:true});
    previousFocus=null;
  });
})();
