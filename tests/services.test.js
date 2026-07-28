const test=require("node:test");
const assert=require("node:assert/strict");

class MemoryStorage{
  constructor(entries={}){this.values=new Map(Object.entries(entries))}
  getItem(key){return this.values.has(key)?this.values.get(key):null}
  setItem(key,value){this.values.set(key,String(value))}
  removeItem(key){this.values.delete(key)}
}

const rules={clamp:(value,min,max)=>Math.min(max,Math.max(min,value))};
const gameData={sanctuary:{buildings:[{id:"forge"}],preparations:[{id:"kit",building:"forge",level:2}]}};
const keys={meta:"meta",metaBackup:"meta-backup",settings:"settings"};

test("le service de stockage normalise et répare les métadonnées",async()=>{
  const {createPlayerStorage}=await import("../src/services/player-storage.mjs");
  const storage=new MemoryStorage({meta:"{cassé", "meta-backup":JSON.stringify({embers:9,buildings:{forge:8},preparation:"kit"})});
  const service=createPlayerStorage({storage,gameData,rules,keys});
  const meta=service.loadMeta();
  assert.equal(meta.embers,9);
  assert.equal(meta.buildings.forge,3);
  assert.equal(meta.preparation,"kit");
  assert.deepEqual(JSON.parse(storage.getItem("meta")).buildings,{forge:3});
});

test("le service conserve une copie valide avant d'écraser la méta-progression",async()=>{
  const {createPlayerStorage}=await import("../src/services/player-storage.mjs");
  const previous={embers:4,buildings:{forge:1}};
  const storage=new MemoryStorage({meta:JSON.stringify(previous)});
  const service=createPlayerStorage({storage,gameData,rules,keys});
  service.saveMeta({embers:7,buildings:{forge:2}});
  assert.equal(JSON.parse(storage.getItem("meta-backup")).embers,4);
  assert.equal(JSON.parse(storage.getItem("meta")).embers,7);
});

test("les options chargées sont complètes et bornées",async()=>{
  const {createPlayerStorage}=await import("../src/services/player-storage.mjs");
  const storage=new MemoryStorage({settings:JSON.stringify({volume:5,musicVolume:-1,sfxVolume:.4,textScale:4,combatPace:.1})});
  const service=createPlayerStorage({storage,gameData,rules,keys});
  const settings=service.loadSettings();
  assert.equal(settings.volume,1);
  assert.equal(settings.musicVolume,0);
  assert.equal(settings.sfxVolume,.4);
  assert.equal(settings.textScale,1.25);
  assert.equal(settings.combatPace,.75);
  assert.equal(settings.screenShake,true);
});

test("le service audio expose toutes les scènes attendues",async()=>{
  const {audioScenes}=await import("../src/services/audio-service.mjs");
  assert.deepEqual(Object.keys(audioScenes),["menu","prologue","exploration1","exploration2","exploration3","exploration4","combat","boss","sanctuary"]);
});

test("les emplacements créent une copie avant écrasement et la restaurent",async()=>{
  const {createSaveSlotService}=await import("../src/services/save-slots.mjs");
  const storage=new MemoryStorage({"active":"2"});
  const saveSystem={serialize:value=>JSON.stringify(value),safeParse:value=>{try{return value?JSON.parse(value):null}catch{return null}}};
  const service=createSaveSlotService({storage,saveSystem,clamp:rules.clamp,saveKey:"save",activeSlotKey:"active"});
  service.persist({level:2});
  service.persist({level:3});
  assert.equal(service.activeSlot(),2);
  assert.equal(JSON.parse(storage.getItem("save-backup-2")).level,2);
  storage.setItem("save-slot-2","{cassé");
  const restored=service.restore();
  assert.equal(restored.recovered,true);
  assert.equal(restored.state.level,2);
});

test("la navigation du monde centralise cartes, métadonnées et validation",async()=>{
  const {createWorldNavigation}=await import("../src/maps/world-navigation.mjs");
  const calls=[],maps={1:[{id:1}],2:[{id:2}],3:[{id:3}],4:[{id:4}]};
  const world=createWorldNavigation({maps,mapSystem:{validateMap:(nodes,options)=>{calls.push([nodes,options]);return []}}});
  assert.equal(world.nodesFor(3),maps[3]);
  assert.equal(world.detailsFor(4).mainLast,9);
  assert.deepEqual(world.validate(),[]);
  assert.deepEqual(calls.map(([,options])=>options.mainLast),[28,26,27,9]);
});

test("les helpers de combat règlent les ennemis sans casser le ciblage",async()=>{
  const {tuneCombatEnemies,livingEnemies,targetEnemy}=await import("../src/combat/combat-helpers.mjs");
  const enemies=[{id:0,hp:0,maxHp:20,damage:4,statuses:{}},{id:1,hp:10,maxHp:10,damage:5,statuses:{barrier:{potency:1}}}];
  tuneCombatEnemies(enemies,{hp:2,damage:1.5});
  enemies[0].hp=0;
  const combat={enemies,target:0};
  assert.deepEqual(livingEnemies(combat).map(enemy=>enemy.id),[1]);
  assert.equal(targetEnemy(combat).id,1);
  assert.equal(combat.target,1);
  assert.equal(enemies[1].statuses.barrier.potency,3);
});

test("les présentateurs partagent les conventions visuelles",async()=>{
  const {formatStats,rarityInfo,nodeIcon,renderStatusBadges}=await import("../src/ui/presenters.mjs");
  assert.equal(formatStats({Force:2}),"+2 Force");
  assert.equal(rarityInfo("légendaire").color,"rouge");
  assert.equal(nodeIcon("boss"),"♚");
  assert.match(renderStatusBadges({burn:{turns:2}},{burn:{name:"Brûlure",icon:"†",tone:"harmful"}}),/Brûlure/);
});
