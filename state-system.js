(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.SAVE_SYSTEM=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const CURRENT_VERSION=28;
  const INTEGRITY_VERSION=1;
  const clone=value=>JSON.parse(JSON.stringify(value));
  let validators={save:null,bundle:null};
  let integrity={digest:null};
  function setValidators(next={}){
    validators={save:typeof next.save==="function"?next.save:null,bundle:typeof next.bundle==="function"?next.bundle:null};
  }
  function setIntegrity(next={}){
    integrity={digest:typeof next.digest==="function"?next.digest:null};
  }
  function assertValid(kind,value){
    if(validators[kind])validators[kind](value);
    return value;
  }
  function assertSafeTree(value,{maxDepth=48,maxNodes=50_000,maxStringLength=12_000}={}){
    let nodes=0;
    function visit(entry,depth){
      if(++nodes>maxNodes)throw new TypeError("Données trop volumineuses");
      if(depth>maxDepth)throw new TypeError("Données trop imbriquées");
      if(typeof entry==="string"){
        if(entry.length>maxStringLength)throw new TypeError("Texte anormalement long");
        if(/[<>]/u.test(entry)||/javascript\s*:/iu.test(entry))throw new TypeError("Texte potentiellement dangereux");
        return;
      }
      if(entry===null||typeof entry!=="object")return;
      for(const [key,child] of Object.entries(entry)){
        if(["__proto__","prototype","constructor"].includes(key))throw new TypeError("Clé interdite");
        visit(child,depth+1);
      }
    }
    visit(value,0);
    return value;
  }
  function canonicalStringify(value){
    const normalize=entry=>{
      if(Array.isArray(entry))return entry.map(normalize);
      if(entry&&typeof entry==="object")return Object.fromEntries(Object.keys(entry).sort().map(key=>[key,normalize(entry[key])]));
      return entry;
    };
    return JSON.stringify(normalize(value));
  }
  function constantTimeEqual(left,right){
    left=String(left);right=String(right);
    let mismatch=left.length^right.length,length=Math.max(left.length,right.length);
    for(let index=0;index<length;index++)mismatch|=(left.charCodeAt(index%Math.max(1,left.length))||0)^(right.charCodeAt(index%Math.max(1,right.length))||0);
    return mismatch===0;
  }
  function protect(kind,payload){
    if(!integrity.digest)return payload;
    const checksum=integrity.digest(canonicalStringify(payload));
    if(typeof checksum!=="string"||!/^[a-f0-9]{64}$/iu.test(checksum))throw new TypeError("Empreinte SHA-256 invalide");
    return {integrityVersion:INTEGRITY_VERSION,kind,algorithm:"SHA-256",checksum,payload};
  }
  function unprotect(value,kind){
    if(!value||typeof value!=="object"||!("integrityVersion" in value))return value;
    if(value.integrityVersion!==INTEGRITY_VERSION||value.kind!==kind||value.algorithm!=="SHA-256"||!value.payload||typeof value.payload!=="object")throw new TypeError("Enveloppe d'intégrité incompatible");
    if(!integrity.digest)throw new TypeError("Vérification d'intégrité indisponible");
    const expected=integrity.digest(canonicalStringify(value.payload));
    if(!constantTimeEqual(value.checksum,expected))throw new TypeError("Contrôle d'intégrité échoué");
    return value.payload;
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
    raw=unprotect(raw,"save");
    if(!raw||typeof raw!=="object")throw new TypeError("Sauvegarde invalide");
    assertSafeTree(raw);
    let save=clone(raw),version=Math.max(11,Number(save.version)||11);
    while(version<CURRENT_VERSION){version++;save=migrations[version](save);save.version=version}
    save.version=CURRENT_VERSION;
    return assertValid("save",save);
  }
  function safeParse(raw){
    if(!raw)return null;
    try{return migrate(JSON.parse(raw))}catch{return null}
  }
  function serialize(save){
    const current={...save,version:CURRENT_VERSION};
    assertSafeTree(current);assertValid("save",current);
    return JSON.stringify(protect("save",current));
  }
  function createBundle({slots=[],backups=[],meta={},settings={},activeSlot=1}={}){
    const normalizeSlots=entries=>Array.from({length:3},(_,index)=>{const save=safeParse(entries[index]);return save?serialize(save):null});
    const bundle={bundleVersion:1,createdAt:new Date().toISOString(),activeSlot:Math.min(3,Math.max(1,Math.trunc(activeSlot)||1)),slots:normalizeSlots(slots),backups:normalizeSlots(backups),meta:meta&&typeof meta==="object"?clone(meta):{},settings:settings&&typeof settings==="object"?clone(settings):{}};
    assertSafeTree(bundle);assertValid("bundle",bundle);
    return JSON.stringify(protect("archive",bundle),null,2);
  }
  function parseBundle(raw){
    let bundle;try{bundle=typeof raw==="string"?JSON.parse(raw):clone(raw)}catch{throw new TypeError("Archive de sauvegarde illisible")}
    bundle=unprotect(bundle,"archive");assertSafeTree(bundle);
    if(!bundle||bundle.bundleVersion!==1||!Array.isArray(bundle.slots)||bundle.slots.length!==3)throw new TypeError("Format d'archive incompatible");
    const normalizeSlots=(entries,label)=>Array.from({length:3},(_,index)=>{const value=entries?.[index];if(value==null)return null;const save=safeParse(value);if(!save)throw new TypeError(`${label} ${index+1} invalide`);return serialize(save)});
    if(!bundle.meta||typeof bundle.meta!=="object"||Array.isArray(bundle.meta)||!bundle.settings||typeof bundle.settings!=="object"||Array.isArray(bundle.settings))throw new TypeError("Métadonnées d'archive invalides");
    const normalized={bundleVersion:1,createdAt:String(bundle.createdAt||""),activeSlot:Math.min(3,Math.max(1,Math.trunc(bundle.activeSlot)||1)),slots:normalizeSlots(bundle.slots,"Sauvegarde"),backups:normalizeSlots(bundle.backups||[],"Copie de secours"),meta:clone(bundle.meta),settings:clone(bundle.settings)};
    return assertValid("bundle",normalized);
  }
  return {CURRENT_VERSION,INTEGRITY_VERSION,setValidators,setIntegrity,assertSafeTree,canonicalStringify,migrate,safeParse,serialize,createBundle,parseBundle};
});
