// Moteur Web Audio autonome, piloté par injection de dépendances.
export const audioScenes={
  menu:{frequencies:[55,82.4,110],filter:170,noise:140,intensity:.018},
  prologue:{frequencies:[46.2,69.3,92.5],filter:145,noise:110,intensity:.021},
  exploration1:{frequencies:[55,73.4,110],filter:185,noise:165,intensity:.018},
  exploration2:{frequencies:[65.4,98,130.8],filter:230,noise:220,intensity:.017},
  exploration3:{frequencies:[43.7,65.4,87.3],filter:155,noise:130,intensity:.021},
  exploration4:{frequencies:[36.7,55,73.4],filter:130,noise:105,intensity:.024},
  combat:{frequencies:[49,73.4,98],filter:280,noise:250,intensity:.026},
  boss:{frequencies:[36.7,55,73.4],filter:340,noise:310,intensity:.034},
  sanctuary:{frequencies:[65.4,82.4,98],filter:155,noise:125,intensity:.015},
};

const soundProfiles={
  ui:{notes:[280],duration:.045,type:"triangle"},
  attack:{notes:[145,92],duration:.1,type:"sawtooth"},
  ability:{notes:[330,495,660],duration:.16,type:"sine"},
  hit:{notes:[82,58],duration:.085,type:"square"},
  critical:{notes:[260,520,780],duration:.18,type:"triangle"},
  break:{notes:[175,110,72],duration:.2,type:"square"},
  reward:{notes:[440,554,659],duration:.28,type:"sine"},
  danger:{notes:[110,82],duration:.24,type:"sawtooth"},
  bossPhase:{notes:[73.4,110,146.8],duration:.45,type:"sawtooth"},
};

export function createAudioService({getSettings,onCue,audioWindow=window}){
  let context=null,master=null,music=null,sfx=null,ambient=null,ambientFilter=null,ambientNoiseFilter=null,ambientVoices=[],scene="menu";

  function applySettings(settings=getSettings()){
    if(!context||!master)return;
    const now=context.currentTime;
    master.gain.setTargetAtTime(settings.mute?0:settings.volume,now,.08);
    music.gain.setTargetAtTime(settings.musicVolume,now,.08);
    sfx.gain.setTargetAtTime(settings.sfxVolume,now,.05);
  }

  function setScene(next="menu"){
    scene=audioScenes[next]?next:"menu";
    if(!context||!ambient)return;
    const profile=audioScenes[scene],now=context.currentTime;
    ambientVoices.forEach((voice,index)=>voice.frequency.exponentialRampToValueAtTime(profile.frequencies[index]||profile.frequencies[0],now+.8));
    ambientFilter.frequency.setTargetAtTime(profile.filter,now,.35);
    ambientNoiseFilter.frequency.setTargetAtTime(profile.noise,now,.35);
    ambient.gain.setTargetAtTime(profile.intensity,now,.45);
  }

  function start(){
    if(ambient){context.resume?.();return}
    try{
      context=new audioWindow.AudioContext();
      master=context.createGain();
      music=context.createGain();
      sfx=context.createGain();
      ambient=context.createGain();
      ambientFilter=context.createBiquadFilter();
      ambientNoiseFilter=context.createBiquadFilter();
      master.connect(context.destination);
      music.connect(master);
      sfx.connect(master);
      ambient.connect(music);
      ambientFilter.type="lowpass";
      ambientNoiseFilter.type="lowpass";
      [55,82.4,110].forEach((frequency,index)=>{
        const oscillator=context.createOscillator(),voiceGain=context.createGain();
        oscillator.type=index===0?"triangle":"sine";
        oscillator.frequency.value=frequency;
        voiceGain.gain.value=index===0?.48:index===1?.25:.12;
        oscillator.connect(voiceGain).connect(ambientFilter);
        oscillator.start();
        ambientVoices.push(oscillator);
      });
      ambientFilter.connect(ambient);
      const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),channel=buffer.getChannelData(0);
      for(let index=0;index<channel.length;index++)channel[index]=(Math.random()*2-1)*.08;
      const noise=context.createBufferSource(),noiseGain=context.createGain();
      noise.buffer=buffer;
      noise.loop=true;
      noiseGain.gain.value=.18;
      noise.connect(noiseGain).connect(ambientNoiseFilter).connect(ambient);
      noise.start();
      ambient.gain.value=0;
      applySettings();
      setScene(scene);
      context.resume?.();
    }catch{}
  }

  function play(kind="ui"){
    const settings=getSettings();
    if(settings.audioCues)onCue(kind);
    if(settings.mute||settings.volume<=0||settings.sfxVolume<=0)return;
    try{
      start();
      const profile=soundProfiles[kind]||soundProfiles.ui,now=context.currentTime;
      profile.notes.forEach((frequency,index)=>{
        const oscillator=context.createOscillator(),gain=context.createGain(),noteStart=now+index*.035;
        oscillator.type=profile.type;
        oscillator.frequency.setValueAtTime(frequency,noteStart);
        gain.gain.setValueAtTime(.0001,noteStart);
        gain.gain.exponentialRampToValueAtTime(.11/(index+1),noteStart+.012);
        gain.gain.exponentialRampToValueAtTime(.0001,noteStart+profile.duration);
        oscillator.connect(gain).connect(sfx);
        oscillator.start(noteStart);
        oscillator.stop(noteStart+profile.duration+.02);
      });
    }catch{}
  }

  return {applySettings,setScene,start,play};
}
