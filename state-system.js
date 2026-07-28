(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.SAVE_SYSTEM=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const CURRENT_VERSION=28;
  const clone=value=>JSON.parse(JSON.stringify(value));
  let validators={save:null,bundle:null};
  function setValidators(next={}){
    validators={save:typeof next.save==="function"?next.save:null,bundle:typeof next.bundle==="function"?next.bundle:null};
  }
  function assertValid(kind,value){
    if(validators[kind])validators[kind](value);
    return value;
  }
  const migrations={
    12(save){save.currentRegion||=1;save.run||={startedAt:Date.now(),difficulty:"normal",modifier:"none",damageDealt:0,damageTaken:0,bossesDefeated:0,optionalCleared:0};return save},
    13(save){save.equippedPassives||=(save.learnedPassives||[]).slice(0,6);save.specializations||=[];save.abilityVariants||={};return save},
    14(save){save.recipes||=[];save.merchantStock??=null;return save},
    15(save){return save},
    16(save){save.discoveries||={items:[],enemies:[],lore:["prologue"]};return save},
    17(save){save.narrative||={reputation:{veilleurs:0,archivistes:0,sansOmbre:0},flags:[],questItems:[],decisions:[]};return save},
    18(save){save.companions||={unlocked:["ilyra"],active:"ilyra",trust:{ilyra:0},equipment:{}};return save},
    19(save){save.tutorial||={seen:[],enabled:true};return save},
    20(save){save.companions||={unlocked:["ilyra"],active:"ilyra",trust:{ilyra:0},equipment:{}};save.companions.milestones||={};save.companions.relation||={};save.companions.quests||={};save.companions.dialogues||={};save.companions.departed||=[];return save},
    21(save){save.contracts||={offers:{},active:null,progress:0,completed:[],claimed:[]};return save},
    22(save){save.nemesis??=null;return save},
    23(save){save.camp||={visits:0,buff:null,conversations:[],history:[]};return save},
    24(save){save.campaign||={finalChoice:null,ending:null,completed:false};return save},
    25(save){save.campaign||={finalChoice:null,ending:null,completed:false};save.campaign.mapsExpanded=true;return save},
    26(save){save.run||={};save.run.wavesCleared??=0;save.run.hazardsTriggered??=0;return save},
    27(save){save.masteryNodes||=[];save.buildPresets||=[null,null,null];return save},
    28(save){save.run||={};save.run.bossTrophies||=[];return save}
  };
  function migrate(raw){
    if(!raw||typeof raw!=="object")throw new TypeError("Sauvegarde invalide");
    let save=clone(raw),version=Math.max(11,Number(save.version)||11);
    while(version<CURRENT_VERSION){version++;save=migrations[version](save);save.version=version}
    save.version=CURRENT_VERSION;
    return assertValid("save",save);
  }
  function safeParse(raw){
    if(!raw)return null;
    try{return migrate(JSON.parse(raw))}catch{return null}
  }
  function serialize(save){const current={...save,version:CURRENT_VERSION};assertValid("save",current);return JSON.stringify(current)}
  function createBundle({slots=[],backups=[],meta={},settings={},activeSlot=1}={}){
    const normalizeSlots=entries=>Array.from({length:3},(_,index)=>{const save=safeParse(entries[index]);return save?serialize(save):null});
    const bundle={bundleVersion:1,createdAt:new Date().toISOString(),activeSlot:Math.min(3,Math.max(1,Math.trunc(activeSlot)||1)),slots:normalizeSlots(slots),backups:normalizeSlots(backups),meta:meta&&typeof meta==="object"?clone(meta):{},settings:settings&&typeof settings==="object"?clone(settings):{}};
    assertValid("bundle",bundle);
    return JSON.stringify(bundle,null,2);
  }
  function parseBundle(raw){
    let bundle;try{bundle=typeof raw==="string"?JSON.parse(raw):clone(raw)}catch{throw new TypeError("Archive de sauvegarde illisible")}
    if(!bundle||bundle.bundleVersion!==1||!Array.isArray(bundle.slots)||bundle.slots.length!==3)throw new TypeError("Format d'archive incompatible");
    const normalizeSlots=(entries,label)=>Array.from({length:3},(_,index)=>{const value=entries?.[index];if(value==null)return null;const save=safeParse(value);if(!save)throw new TypeError(`${label} ${index+1} invalide`);return serialize(save)});
    if(!bundle.meta||typeof bundle.meta!=="object"||Array.isArray(bundle.meta)||!bundle.settings||typeof bundle.settings!=="object"||Array.isArray(bundle.settings))throw new TypeError("Métadonnées d'archive invalides");
    const normalized={bundleVersion:1,createdAt:String(bundle.createdAt||""),activeSlot:Math.min(3,Math.max(1,Math.trunc(bundle.activeSlot)||1)),slots:normalizeSlots(bundle.slots,"Sauvegarde"),backups:normalizeSlots(bundle.backups||[],"Copie de secours"),meta:clone(bundle.meta),settings:clone(bundle.settings)};
    return assertValid("bundle",normalized);
  }
  return {CURRENT_VERSION,setValidators,migrate,safeParse,serialize,createBundle,parseBundle};
});
