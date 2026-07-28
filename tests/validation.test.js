const test=require("node:test");
const assert=require("node:assert/strict");
const saveSystem=require("../state-system.js");
require("../data.js");

test("les schémas acceptent l'intégralité des catalogues et des cartes",async()=>{
  const schemas=await import("../src/validation/game-schemas.mjs");
  const maps=await import("../src/content/maps.mjs");
  assert.deepEqual(schemas.validateGameContent(globalThis.GAME_DATA),[]);
  assert.deepEqual(schemas.validateMapCatalog({
    1:maps.regionOneNodes,
    2:maps.regionTwoNodes,
    3:maps.regionThreeNodes,
    4:maps.regionFourNodes,
  }),[]);
});

test("les sauvegardes aux valeurs dangereuses sont rejetées avec leur chemin",async()=>{
  const {assertSaveState}=await import("../src/validation/game-schemas.mjs");
  assert.doesNotThrow(()=>assertSaveState({version:28,classId:"bastion",level:30,hp:1,maxHp:100}));
  assert.throws(()=>assertSaveState({version:28,classId:"inconnue"}),/classId/);
  assert.throws(()=>assertSaveState({version:28,classId:"bastion",level:31}),/level/);
  assert.throws(()=>assertSaveState({version:28,classId:"bastion",hp:-4}),/hp/);
  assert.throws(()=>assertSaveState({version:28,classId:"bastion",equippedAbilities:["1","2","3","4","5"]}),/equippedAbilities/);
  assert.throws(()=>assertSaveState({version:28,classId:"bastion",inventory:[{}]}),/inventory/);
});

test("le moteur de sauvegarde applique les schémas après chaque migration",async()=>{
  const {assertSaveState,assertSaveBundle}=await import("../src/validation/game-schemas.mjs");
  saveSystem.setValidators({save:assertSaveState,bundle:assertSaveBundle});
  assert.equal(saveSystem.safeParse(JSON.stringify({version:26,classId:"arcaniste",level:12,run:{}})).version,29);
  assert.equal(saveSystem.safeParse(JSON.stringify({version:28,classId:"bastion",level:"12"})),null);
  assert.equal(saveSystem.safeParse(JSON.stringify({version:28,classId:"intrus"})),null);
  assert.throws(()=>saveSystem.serialize({classId:"bastion",level:99}),/Sauvegarde invalide/);
  saveSystem.setValidators();
});

test("les archives externes exigent trois emplacements et des métadonnées sûres",async()=>{
  const {assertSaveBundle}=await import("../src/validation/game-schemas.mjs");
  const base={bundleVersion:1,createdAt:new Date().toISOString(),activeSlot:1,slots:[null,null,null],backups:[null,null,null],meta:{},settings:{}};
  assert.doesNotThrow(()=>assertSaveBundle(base));
  assert.throws(()=>assertSaveBundle({...base,activeSlot:4}),/activeSlot/);
  assert.throws(()=>assertSaveBundle({...base,slots:[null]}),/slots/);
  assert.throws(()=>assertSaveBundle({...base,settings:[]}),/settings/);
});

test("les schémas signalent précisément le contenu éditorial mal formé",async()=>{
  const {validateGameContent}=await import("../src/validation/game-schemas.mjs");
  const broken=structuredClone(globalThis.GAME_DATA);
  broken.enemies[0].hp=-1;
  broken.items[0].rarity="mythique";
  const errors=validateGameContent(broken);
  assert.ok(errors.some(error=>error.includes("enemies.0.hp")));
  assert.ok(errors.some(error=>error.includes("items.0.rarity")));
});
