const test=require("node:test");
const assert=require("node:assert/strict");
const saveSystem=require("../state-system.js");
require("../data.js");

function item(id,uid,slot){
  const catalog=globalThis.GAME_DATA.items.find(entry=>entry.id===id);
  return {...catalog,uid,slot:slot||catalog.slot,level:1};
}

test("une sauvegarde version 28 reçoit la projection des huit emplacements",async()=>{
  const {migrateEquipmentSave}=await import("../src/equipment/equipment-migration.mjs");
  saveSystem.setMigrationHandlers({equipment:migrateEquipmentSave});
  const weapon=item("iron_sword","weapon-1");
  const armor=item("split_armor","armor-1");
  const jewel=item("soot_ring","ring-1");
  const raw=JSON.stringify({
    version:28,
    classId:"bastion",
    inventory:[weapon,armor,jewel],
    equipped:{Arme:weapon,Armure:armor,Bijou:jewel},
    buildPresets:[{
      equipment:{Arme:"weapon-1",Armure:"armor-1",Bijou:"ring-1"},
      abilities:[],
      passives:[],
      variants:{},
    },null,null],
  });
  const migrated=saveSystem.safeParse(raw);
  assert.equal(migrated.version,29);
  assert.equal(migrated.equipmentModelVersion,1);
  assert.deepEqual(Object.keys(migrated.equipment),[
    "head","chest","legs","mainHand","offHand","amulet","ring1","ring2",
  ]);
  assert.equal(migrated.equipment.mainHand.uid,"weapon-1");
  assert.equal(migrated.equipment.chest.uid,"armor-1");
  assert.equal(migrated.equipment.ring1.uid,"ring-1");
  assert.equal(migrated.equipment.offHand,null);
  assert.deepEqual(migrated.inventory.map(entry=>entry.equipType),["weapon","chest","ring"]);
  assert.deepEqual(migrated.buildPresets[0].equipmentV2,{
    head:null,
    chest:"armor-1",
    legs:null,
    mainHand:"weapon-1",
    offHand:null,
    amulet:null,
    ring1:"ring-1",
    ring2:null,
  });
  saveSystem.setMigrationHandlers();
});

test("les anciens bijoux visuels retrouvent leur emplacement réel",async()=>{
  const {migrateEquipmentSave}=await import("../src/equipment/equipment-migration.mjs");
  const crown=item("ash_crown","crown-1");
  const amulet=item("red_compass","amulet-1");
  const crownSave=migrateEquipmentSave({inventory:[crown],equipped:{Bijou:crown}});
  const amuletSave=migrateEquipmentSave({inventory:[amulet],equipped:{Bijou:amulet}});
  assert.equal(crownSave.equipment.head.uid,"crown-1");
  assert.equal(crownSave.equipment.ring1,null);
  assert.equal(amuletSave.equipment.amulet.uid,"amulet-1");
  assert.equal(amuletSave.equipment.ring1,null);
});

test("la migration est idempotente et refuse le double équipement d'une instance",async()=>{
  const {migrateEquipmentSave}=await import("../src/equipment/equipment-migration.mjs");
  const weapon=item("mist_dagger","same-weapon");
  const save={
    inventory:[weapon],
    equipped:{Arme:weapon},
    equipment:{
      head:null,
      chest:null,
      legs:null,
      mainHand:weapon,
      offHand:weapon,
      amulet:null,
      ring1:null,
      ring2:null,
    },
  };
  migrateEquipmentSave(save);
  const first=JSON.stringify(save.equipment);
  migrateEquipmentSave(save);
  assert.equal(JSON.stringify(save.equipment),first);
  assert.equal(Object.values(save.equipment).filter(entry=>entry?.uid==="same-weapon").length,1);
});

test("le filet de migration autonome fonctionne sans le catalogue du jeu",()=>{
  saveSystem.setMigrationHandlers();
  const migrated=saveSystem.migrate({
    version:28,
    classId:"bastion",
    inventory:[{id:"objet_externe",uid:"legacy",slot:"Armure"}],
    equipped:{Armure:{id:"objet_externe",uid:"legacy",slot:"Armure"}},
  });
  assert.equal(migrated.version,29);
  assert.equal(migrated.inventory[0].equipType,"chest");
  assert.equal(migrated.equipment.chest.uid,"legacy");
});

test("une sauvegarde SHA-256 version 28 est vérifiée avant sa migration",async()=>{
  const {sha256}=await import("@noble/hashes/sha2.js");
  const {bytesToHex}=await import("@noble/hashes/utils.js");
  const {migrateEquipmentSave}=await import("../src/equipment/equipment-migration.mjs");
  const digest=value=>bytesToHex(sha256(new TextEncoder().encode(value)));
  const weapon=item("iron_sword","signed-weapon");
  const payload={version:28,classId:"bastion",inventory:[weapon],equipped:{Arme:weapon}};
  const envelope={
    integrityVersion:1,
    kind:"save",
    algorithm:"SHA-256",
    checksum:digest(saveSystem.canonicalStringify(payload)),
    payload,
  };
  saveSystem.setIntegrity({digest});
  saveSystem.setMigrationHandlers({equipment:migrateEquipmentSave});
  const migrated=saveSystem.safeParse(JSON.stringify(envelope));
  assert.equal(migrated.version,29);
  assert.equal(migrated.equipment.mainHand.uid,"signed-weapon");
  const tampered=structuredClone(envelope);
  tampered.payload.level=30;
  assert.equal(saveSystem.safeParse(JSON.stringify(tampered)),null);
  saveSystem.setIntegrity();
  saveSystem.setMigrationHandlers();
});
