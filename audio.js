'use strict';

/*
 * Wedding background music: "Wedding" by leberch (Pixabay Content Licence).
 * Track: https://pixabay.com/music/wedding-wedding-584474/
 * Music is loaded from this website's own assets.
 *
 * First playback requires the guest to tap the envelope seal. A Web Audio
 * buffer crossfades the final 2.6 seconds into the beginning of the track,
 * so the same recording repeats without an audible restart or network gap.
 * The sound continues across sections and mute/unmute changes volume only.
 */
(function setupWeddingMusic(){
  const button=document.getElementById('wedding-audio-toggle');
  const seal=document.getElementById('open-seal');
  if(!button || !seal)return;

  const asset='./assets/wedding-by-leberch.mp3';
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  const VOLUME=.47;
  const CROSSFADE_SECONDS=2.6;
  let context=null;
  let master=null;
  let started=false;
  let enabled=false;
  let loading=null;
  let failed=false;

  // Fetch while the guest looks at the opening envelope, before audio begins.
  // The source is same-origin, not streamed from a third-party music provider.
  const trackDownload=fetch(asset,{cache:'force-cache'}).then(function(response){
    if(!response.ok)throw new Error('Music file unavailable');
    return response.arrayBuffer();
  }).then(bytes=>({bytes}),error=>({error}));

  function showState(){
    button.classList.toggle('is-muted',!enabled);
    button.setAttribute('aria-pressed',String(enabled));
    const label=failed?'Music unavailable':enabled?'Mute background music':'Play background music';
    button.setAttribute('aria-label',label);
    button.title=label;
    button.disabled=failed;
  }

  function makeContext(){
    if(context)return context;
    context=new AudioContextClass();
    master=context.createGain();
    master.gain.value=0;
    master.connect(context.destination);
    return context;
  }

  function createSeamlessLoop(original){
    const channels=original.numberOfChannels;
    const length=original.length;
    const rate=original.sampleRate;
    const overlap=Math.min(Math.floor(length/8),Math.round(rate*CROSSFADE_SECONDS));
    const loopLength=length-overlap;
    const directLength=length-2*overlap;
    if(overlap<=0||directLength<1)throw new Error('Music file too short');
    const buffer=context.createBuffer(channels,loopLength,rate);

    for(let ch=0;ch<channels;ch++){
      const source=original.getChannelData(ch);
      const dest=buffer.getChannelData(ch);
      // The loop starts after the introductory phrase; the intro plays once.
      dest.set(source.subarray(overlap,length-overlap),0);
      for(let i=0;i<overlap;i++){
        const t=(i+.5)/overlap;
        const fadeOut=Math.cos(t*Math.PI/2);
        const fadeIn=Math.sin(t*Math.PI/2);
        // End of the track and its beginning overlap, blending into the
        // exact signal at the next loop's first sample.
        dest[directLength+i]=
          source[length-overlap+i]*fadeOut+source[i]*fadeIn;
      }
    }
    return {buffer,introSeconds:overlap/rate};
  }

  function scheduleTrack(original){
    if(started||!context)return;
    const prepared=createSeamlessLoop(original);
    const when=context.currentTime+.06;

    const intro=context.createBufferSource();
    intro.buffer=original;
    intro.connect(master);
    intro.start(when,0,prepared.introSeconds);

    const song=context.createBufferSource();
    song.buffer=prepared.buffer;
    song.loop=true;
    song.connect(master);
    song.start(when+prepared.introSeconds);
    started=true;
  }

  async function startMusic(){
    if(failed)return;
    try{
      // Resume happens during a real tap, before awaiting network/decode.
      makeContext();
      const resumed=context.resume();
      enabled=true;
      showState();
      if(!loading){
        loading=(async function(){
          const result=await trackDownload;
          if(result.error)throw result.error;
          const decoded=await context.decodeAudioData(result.bytes.slice(0));
          scheduleTrack(decoded);
        })();
      }
      await Promise.all([resumed,loading]);
      if(!enabled)return;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(VOLUME,context.currentTime,.34);
    }catch(_){
      enabled=false;
      failed=true;
      showState();
    }
  }

  function muteMusic(){
    enabled=false;
    showState();
    if(!context||!master)return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0,context.currentTime,.09);
    // Deliberately keep the playing buffer running while muted, so unmuting
    // resumes from the same place instead of restarting the track.
  }

  if(!AudioContextClass){
    failed=true;
    showState();
    return;
  }

  seal.addEventListener('click',function(){
    void startMusic();
  });

  button.addEventListener('click',function(){
    if(enabled)muteMusic();
    else void startMusic();
  });

  document.addEventListener('visibilitychange',function(){
    if(!context)return;
    if(document.hidden){
      context.suspend().catch(()=>{});
    }else if(enabled){
      context.resume().catch(()=>{});
    }
  });

  window.addEventListener('pagehide',function(){
    const ending=context;
    context=null;
    master=null;
    started=false;
    loading=null;
    enabled=false;
    if(ending)ending.close().catch(()=>{});
    showState();
  });
  showState();
})();