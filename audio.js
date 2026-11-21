'use strict';

/*
 * Original, self-contained ambient instrumental for Deborah & Caleb.
 * No music recordings, licensed tracks, remote players or third-party audio
 * are loaded. Generated in the listener's browser with Web Audio.
 *
 * Starts only when the guest deliberately taps the wax seal, which satisfies
 * the browser's audio-gesture requirement; it can be muted at any time.
 */
(function setupWeddingMusic(){
  const button=document.getElementById('wedding-audio-toggle');
  const seal=document.getElementById('open-seal');
  if(!button || !seal)return;
  const AudioContextClass=window.AudioContext || window.webkitAudioContext;
  if(!AudioContextClass){ button.hidden=true; return; }

  const tempoSeconds=6;
  const cycleSeconds=4*tempoSeconds;
  const chords=[
    [130.81,164.81,196,293.66],  // Cmaj(add9)
    [110,130.81,164.81,196],      // Am7
    [87.31,110,130.81,164.81],   // Fmaj7
    [98,146.83,196,220]          // Gsus2(add9)
  ];
  // Original short, gently varied note pattern; not based on an existing song.
  const melody=[
    [329.63,392,440], [392,349.23,329.63],
    [349.23,329.63,293.66], [293.66,392,329.63]
  ];
  let context=null, master=null, clock=0, interval=null, playing=false;
  let openingUsed=false;

  function updateUI(){
    button.setAttribute('aria-pressed',String(playing));
    button.setAttribute('aria-label',playing?'Mute background music':'Play background music');
    button.title=playing?'Mute background music':'Play background music';
    button.querySelector('.wedding-audio-caption').textContent=playing?'Music on':'Music off';
    button.querySelector('.wedding-audio-symbol').textContent=playing?'♫':'♪';
    button.classList.toggle('is-muted',!playing);
  }

  function voice(frequency,when,length,gainValue,kind){
    const oscillator=context.createOscillator();
    const envelope=context.createGain();
    const filter=context.createBiquadFilter();
    const start=Math.max(when,context.currentTime+.015);
    const duration=Math.max(.2,length);
    const attack=kind==='pad'?.95:.065;
    const release=kind==='pad'?1.15:1.2;
    filter.type='lowpass';
    filter.frequency.value=kind==='pad'?710:1450;
    oscillator.type=kind==='pad'?'triangle':'sine';
    oscillator.frequency.value=frequency;
    envelope.gain.setValueAtTime(0,start);
    envelope.gain.linearRampToValueAtTime(gainValue,start+attack);
    if(kind==='pad'){
      envelope.gain.setValueAtTime(gainValue,start+duration-release);
    }else{
      envelope.gain.exponentialRampToValueAtTime(Math.max(.0004,gainValue*.32),start+Math.max(.15,duration-.42));
    }
    envelope.gain.linearRampToValueAtTime(0,start+duration);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(master);
    oscillator.start(start);
    oscillator.stop(start+duration+.08);
    oscillator.addEventListener('ended',function(){
      oscillator.disconnect();filter.disconnect();envelope.disconnect();
    },{once:true});
  }
  function phrase(when){
    for(let chord=0;chord<4;chord++){
      const start=when+chord*tempoSeconds;
      chords[chord].forEach((frequency,i)=>{
        voice(frequency,start,tempoSeconds+.2,i===0?.018:.012,'pad');
      });
      const [a,b,c]=melody[chord];
      voice(a,start+.65,1.85,.032,'melody');
      voice(b,start+2.3,1.7,.026,'melody');
      voice(c,start+4.0,1.9,.028,'melody');
    }
  }
  function schedule(){
    if(!context)return;
    // Schedule a complete phrase ahead of time; no network or downloaded media.
    while(clock<context.currentTime+9){
      phrase(clock);
      clock+=cycleSeconds;
    }
  }
  function initialise(){
    if(context)return;
    context=new AudioContextClass();
    master=context.createGain();
    master.gain.value=0;
    const filter=context.createBiquadFilter();
    filter.type='lowpass';
    filter.frequency.value=2600;
    master.connect(filter);
    filter.connect(context.destination);
    // Subtle room-like echo created locally, not sampled from recordings.
    const delay=context.createDelay(.9);
    delay.delayTime.value=.41;
    const feedback=context.createGain();
    feedback.gain.value=.13;
    const wet=context.createGain();
    wet.gain.value=.19;
    filter.connect(delay);
    delay.connect(wet);
    wet.connect(context.destination);
    delay.connect(feedback);
    feedback.connect(delay);
    clock=context.currentTime+.08;
    schedule();
    interval=window.setInterval(schedule,1800);
  }
  async function play(){
    try{
      initialise();
      await context.resume();
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(.52,context.currentTime,.32);
      playing=true;
      updateUI();
    }catch(_){
      playing=false;updateUI();
    }
  }
  function pause(){
    if(!context)return;
    playing=false;
    updateUI();
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0,context.currentTime,.11);
    window.setTimeout(()=>{
      if(!playing && context && context.state==='running') context.suspend().catch(()=>{});
    },380);
  }
  seal.addEventListener('click',function(){
    if(openingUsed)return;
    openingUsed=true;
    // This runs synchronously in the user-initiated envelope opening gesture.
    void play();
  });
  button.addEventListener('click',function(){
    if(playing)pause();else void play();
  });
  document.addEventListener('visibilitychange',function(){
    if(document.hidden && playing)pause();
  });
  window.addEventListener('pagehide',function(){
    if(interval)window.clearInterval(interval);
    if(context)context.close().catch(()=>{});
  });
  updateUI();
})();