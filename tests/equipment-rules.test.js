const test=require("node:test");
const assert=require("node:assert/strict");

const weapon=(uid,power=1)=>({uid,equipType:"weapon",stats:{Force:power}});
const ring=(uid,power=1)=>({uid,equipType:"ring",stats:{Esprit:power}});

test("les armes et les bagues remplissent leurs deux emplacements avant de remplacer",async()=>{
  const {equipItem}=await import("../src/equipment/equipment-rules.mjs");
  let equipment={};
  equipment=equipItem(equipment,weapon("sword",4),{scoreItem:item=>item?.stats?.Force||0}).equipment;
  equipment=equipItem(equipment,weapon("dagger",2),{scoreItem:item=>item?.stats?.Force||0}).equipment;
  equipment=equipItem(equipment,ring("ember",3)).equipment;
  equipment=equipItem(equipment,ring("soot",5)).equipment;
  assert.equal(equipment.mainHand.uid,"sword");
  assert.equal(equipment.offHand.uid,"dagger");
  assert.equal(equipment.ring1.uid,"ember");
  assert.equal(equipment.ring2.uid,"soot");
});

test("un troisième objet remplace l'objet compatible le plus faible",async()=>{
  const {equipItem}=await import("../src/equipment/equipment-rules.mjs");
  const scoreItem=item=>item?.stats?.Force||0;
  let equipment=equipItem({},weapon("weak",2),{scoreItem}).equipment;
  equipment=equipItem(equipment,weapon("strong",8),{scoreItem}).equipment;
  const result=equipItem(equipment,weapon("upgrade",5),{scoreItem});
  assert.equal(result.slotId,"mainHand");
  assert.equal(result.replaced.uid,"weak");
  assert.equal(result.equipment.mainHand.uid,"upgrade");
  assert.equal(result.equipment.offHand.uid,"strong");
});

test("une destination incompatible est refusée sans perte d'équipement",async()=>{
  const {equipItem}=await import("../src/equipment/equipment-rules.mjs");
  const equipped=equipItem({},ring("ring"),{requestedSlot:"ring1"}).equipment;
  const result=equipItem(equipped,weapon("sword"),{requestedSlot:"amulet"});
  assert.equal(result.changed,false);
  assert.equal(result.slotId,null);
  assert.equal(result.equipment.ring1.uid,"ring");
});

test("déplacer une instance ne peut jamais la dupliquer",async()=>{
  const {equipItem,equippedItems}=await import("../src/equipment/equipment-rules.mjs");
  const sword=weapon("unique",7);
  let equipment=equipItem({},sword,{requestedSlot:"mainHand"}).equipment;
  equipment=equipItem(equipment,sword,{requestedSlot:"offHand"}).equipment;
  assert.equal(equipment.mainHand,null);
  assert.equal(equipment.offHand.uid,"unique");
  assert.equal(equippedItems(equipment).length,1);
});

test("le calcul de statistiques ignore les références dupliquées",async()=>{
  const {sumEquipmentStats}=await import("../src/equipment/equipment-rules.mjs");
  const sword=weapon("same",4);
  const totals=sumEquipmentStats({mainHand:sword,offHand:sword,ring1:ring("ring",3)});
  assert.deepEqual(totals,{Force:4,Esprit:3});
});

test("le budget de puissance est réparti entre les emplacements d'un groupe",async()=>{
  const {scaleEquipmentStatsForSlot,sumEquipmentStats}=await import("../src/equipment/equipment-rules.mjs");
  const armor={uid:"armor",equipType:"head",stats:{Vitalité:20}};
  const equipment={
    head:armor,
    chest:{uid:"chest",equipType:"chest",stats:{Vitalité:20}},
    legs:{uid:"legs",equipType:"legs",stats:{Vitalité:20}},
    mainHand:weapon("right",20),
    offHand:weapon("left",20),
  };
  const totals=sumEquipmentStats(equipment,(item,slotId)=>scaleEquipmentStatsForSlot(item.stats,slotId));
  assert.equal(totals.Vitalité,20);
  assert.equal(totals.Force,20);
  assert.deepEqual(scaleEquipmentStatsForSlot({Esprit:10},"amulet"),{Esprit:4});
});

test("une présélection ne conserve que les objets possédés, compatibles et uniques",async()=>{
  const {sanitizePresetEquipment}=await import("../src/equipment/equipment-rules.mjs");
  const inventory=[weapon("sword"),ring("ring")];
  const sanitized=sanitizePresetEquipment({
    head:"ring",
    mainHand:"sword",
    offHand:"sword",
    ring2:"ring",
    amulet:"missing",
  },inventory);
  assert.equal(sanitized.mainHand,"sword");
  assert.equal(sanitized.offHand,null);
  assert.equal(sanitized.head,null);
  assert.equal(sanitized.ring2,"ring");
  assert.equal(sanitized.amulet,null);
});

test("la normalisation retire les objets incompatibles et les doublons",async()=>{
  const {normalizeEquipment}=await import("../src/equipment/equipment-rules.mjs");
  const sword=weapon("same");
  const normalized=normalizeEquipment({
    head:sword,
    mainHand:sword,
    offHand:sword,
    ring1:ring("valid"),
  });
  assert.equal(normalized.head,null);
  assert.equal(normalized.mainHand.uid,"same");
  assert.equal(normalized.offHand,null);
  assert.equal(normalized.ring1.uid,"valid");
});
