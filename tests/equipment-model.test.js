const test=require("node:test");
const assert=require("node:assert/strict");

test("le modèle expose exactement les huit emplacements prévus",async()=>{
  const model=await import("../src/equipment/equipment-model.mjs");
  assert.deepEqual(model.equipmentSlotOrder,[
    "head","chest","legs","mainHand","offHand","amulet","ring1","ring2",
  ]);
  assert.deepEqual(Object.keys(model.createEmptyEquipment()),model.equipmentSlotOrder);
  assert.ok(Object.values(model.createEmptyEquipment()).every(value=>value===null));
  assert.deepEqual(model.validateEquipmentModel(),[]);
});

test("chaque groupe possède un budget complet et des emplacements exclusifs",async()=>{
  const {equipmentGroups,equipmentSlots}=await import("../src/equipment/equipment-model.mjs");
  const allSlots=Object.values(equipmentGroups).flatMap(group=>group.slots);
  assert.equal(new Set(allSlots).size,8);
  for(const group of Object.values(equipmentGroups)){
    const share=group.slots.reduce((sum,slotId)=>sum+equipmentSlots[slotId].groupShare,0);
    assert.ok(Math.abs(share-1)<.000_001);
    group.slots.forEach(slotId=>assert.equal(equipmentSlots[slotId].group,group.id));
  }
});

test("armes et bagues acceptent deux destinations sans mélanger les groupes",async()=>{
  const {compatibleEquipmentSlots,isCompatibleEquipmentSlot,equipmentGroupForSlot}=await import("../src/equipment/equipment-model.mjs");
  assert.deepEqual(compatibleEquipmentSlots("weapon"),["mainHand","offHand"]);
  assert.deepEqual(compatibleEquipmentSlots({equipType:"ring"}),["ring1","ring2"]);
  assert.deepEqual(compatibleEquipmentSlots("amulet"),["amulet"]);
  assert.deepEqual(compatibleEquipmentSlots("head"),["head"]);
  assert.equal(isCompatibleEquipmentSlot("weapon","amulet"),false);
  assert.equal(isCompatibleEquipmentSlot("ring","ring2"),true);
  assert.equal(equipmentGroupForSlot("offHand").id,"weapons");
  assert.equal(equipmentGroupForSlot("inconnu"),null);
});

test("les catégories historiques possèdent un filet de compatibilité déterministe",async()=>{
  const {compatibleEquipmentSlots,legacyEquipmentDefaults,resolveEquipType}=await import("../src/equipment/equipment-model.mjs");
  assert.deepEqual(legacyEquipmentDefaults.Arme,{equipType:"weapon",preferredSlot:"mainHand"});
  assert.equal(resolveEquipType({slot:"Arme"}),"weapon");
  assert.equal(resolveEquipType({slot:"Armure"}),"chest");
  assert.equal(resolveEquipType({slot:"Bijou"}),"ring");
  assert.deepEqual(compatibleEquipmentSlots({slot:"Arme"}),["mainHand","offHand"]);
  assert.deepEqual(compatibleEquipmentSlots({slot:"inconnu"}),[]);
});

test("les définitions du domaine sont immuables",async()=>{
  const {equipmentGroups,equipmentSlots,itemEquipTypes,equipmentSlotOrder}=await import("../src/equipment/equipment-model.mjs");
  assert.ok(Object.isFrozen(equipmentSlotOrder));
  assert.ok(Object.isFrozen(equipmentGroups.armor.slots));
  assert.ok(Object.isFrozen(equipmentSlots.mainHand));
  assert.ok(Object.isFrozen(itemEquipTypes.ring.compatibleSlots));
});

test("les 62 objets historiques possèdent une classification cible explicite",async()=>{
  require("../data.js");
  const {
    equipTypeForCatalogItem,
    legacyItemEquipTypeById,
    legacyItemIdsByEquipType,
    validateLegacyItemClassification,
  }=await import("../src/equipment/legacy-item-classification.mjs");
  const items=globalThis.GAME_DATA.items;
  assert.equal(Object.keys(legacyItemEquipTypeById).length,62);
  assert.deepEqual(validateLegacyItemClassification(items),[]);
  assert.deepEqual(Object.fromEntries(Object.entries(legacyItemIdsByEquipType).map(([type,ids])=>[type,ids.length])),{
    head:4,
    chest:18,
    legs:0,
    weapon:24,
    amulet:9,
    ring:7,
  });
  items.forEach(item=>assert.ok(equipTypeForCatalogItem(item)));
  assert.equal(equipTypeForCatalogItem(items.find(item=>item.id==="ash_crown")),"head");
  assert.equal(equipTypeForCatalogItem(items.find(item=>item.id==="soot_ring")),"ring");
});

test("le catalogue enrichi couvre les huit emplacements dans les quatre régions",async()=>{
  require("../data.js");
  const {equipTypeForCatalogItem,legacyItemEquipTypeById,validateLegacyItemClassification}=await import("../src/equipment/legacy-item-classification.mjs");
  const items=globalThis.GAME_DATA.items,types=["head","chest","legs","weapon","amulet","ring"];
  assert.equal(items.length,98);
  assert.deepEqual(validateLegacyItemClassification(items),[]);
  const additions=items.filter(item=>!legacyItemEquipTypeById[item.id]);
  assert.equal(additions.length,36);
  assert.ok(additions.every(item=>item.equipType));
  for(const region of [1,2,3,4]){
    const regionTypes=new Set(items.filter(item=>(item.region||1)===region).map(equipTypeForCatalogItem));
    types.forEach(type=>assert.ok(regionTypes.has(type),`région ${region} sans type ${type}`));
  }
  const legRarities=new Set(items.filter(item=>equipTypeForCatalogItem(item)==="legs").map(item=>item.rarity));
  assert.deepEqual([...legRarities].sort(),["commun","légendaire","rare","épique"].sort());
});
