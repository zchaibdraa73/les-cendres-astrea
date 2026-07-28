// Frontière unique entre le moteur et la persistance navigateur.
import { assertPlayerMeta, assertPlayerSettings } from "../validation/game-schemas.mjs";

const defaultSettings={
  volume:.5,
  musicVolume:.55,
  sfxVolume:.8,
  mute:false,
  reducedMotion:false,
  highContrast:false,
  screenShake:true,
  audioCues:false,
  combatPace:1,
  textScale:1,
  controls:"zqsd",
};

export function createPlayerStorage({storage,gameData,rules,keys}){
  const nonNegativeInteger=(value,fallback=0)=>Math.max(0,Math.floor(Number(value)||fallback));
  function normalizeMeta(raw={}){
    const buildingDefaults=Object.fromEntries(gameData.sanctuary.buildings.map(building=>[building.id,0]));
    const base={version:4,embers:0,runs:0,wins:0,bestLevel:1,unlocks:[],achievements:[],endings:[],ascensionUnlocked:0,scores:[],classWins:{},buildings:buildingDefaults,preparation:null,trophies:[],claimedCollections:[],discoveries:{items:[],enemies:[],lore:[]}};
    const meta={...base,...(raw&&typeof raw==="object"?raw:{})};
    meta.version=4;
    meta.embers=nonNegativeInteger(meta.embers);
    meta.runs=nonNegativeInteger(meta.runs);
    meta.wins=nonNegativeInteger(meta.wins);
    meta.bestLevel=rules.clamp(nonNegativeInteger(meta.bestLevel,1),1,30);
    meta.ascensionUnlocked=nonNegativeInteger(meta.ascensionUnlocked);
    meta.unlocks=Array.isArray(meta.unlocks)?meta.unlocks:[];
    meta.achievements=Array.isArray(meta.achievements)?meta.achievements:[];
    meta.endings=Array.isArray(meta.endings)?meta.endings:[];
    meta.scores=Array.isArray(meta.scores)?meta.scores:[];
    meta.classWins=meta.classWins&&typeof meta.classWins==="object"?meta.classWins:{};
    Object.keys(meta.classWins).forEach(key=>meta.classWins[key]=nonNegativeInteger(meta.classWins[key]));
    meta.buildings={...buildingDefaults,...(meta.buildings||{})};
    gameData.sanctuary.buildings.forEach(building=>meta.buildings[building.id]=rules.clamp(Math.floor(Number(meta.buildings[building.id])||0),0,3));
    meta.trophies=Array.isArray(meta.trophies)?meta.trophies:[];
    meta.claimedCollections=Array.isArray(meta.claimedCollections)?meta.claimedCollections:[];
    meta.discoveries={items:[],enemies:[],lore:[],...(meta.discoveries||{})};
    Object.keys(meta.discoveries).forEach(key=>meta.discoveries[key]=Array.isArray(meta.discoveries[key])?meta.discoveries[key]:[]);
    const preparation=gameData.sanctuary.preparations.find(entry=>entry.id===meta.preparation);
    if(!preparation||(meta.buildings[preparation.building]||0)<preparation.level)meta.preparation=null;
    return assertPlayerMeta(meta);
  }

  function loadMeta(){
    try{return normalizeMeta(JSON.parse(storage.getItem(keys.meta)||"{}"))}
    catch{
      try{
        const recovered=normalizeMeta(JSON.parse(storage.getItem(keys.metaBackup)||"{}"));
        storage.setItem(keys.meta,JSON.stringify(recovered));
        return recovered;
      }catch{return normalizeMeta()}
    }
  }

  function saveMeta(meta){
    const current=storage.getItem(keys.meta);
    if(current)try{
      normalizeMeta(JSON.parse(current));
      storage.setItem(keys.metaBackup,current);
    }catch{}
    storage.setItem(keys.meta,JSON.stringify(normalizeMeta(meta)));
  }

  function loadSettings(){
    try{
      const value={...defaultSettings,...JSON.parse(storage.getItem(keys.settings)||"{}")};
      value.volume=rules.clamp(Number(value.volume)||0,0,1);
      value.musicVolume=rules.clamp(Number(value.musicVolume)||0,0,1);
      value.sfxVolume=rules.clamp(Number(value.sfxVolume)||0,0,1);
      value.combatPace=rules.clamp(Number(value.combatPace)||1,.75,1.5);
      value.textScale=rules.clamp(Number(value.textScale)||1,.9,1.25);
      for(const key of ["mute","reducedMotion","highContrast","screenShake","audioCues"])value[key]=typeof value[key]==="boolean"?value[key]:defaultSettings[key];
      value.controls=["zqsd","wasd"].includes(value.controls)?value.controls:defaultSettings.controls;
      return assertPlayerSettings(value);
    }catch{return {...defaultSettings}}
  }

  function saveSettings(settings){
    const value={...defaultSettings,...settings};
    storage.setItem(keys.settings,JSON.stringify(assertPlayerSettings(value)));
  }

  return {normalizeMeta,loadMeta,saveMeta,loadSettings,saveSettings};
}

export {defaultSettings};
