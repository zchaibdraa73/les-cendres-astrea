const test=require("node:test");
const assert=require("node:assert/strict");

const item=(uid,equipType,rarity,name,power,level=1)=>({
  uid,equipType,rarity,name,level,
  stats:{Force:power},
});

test("les filtres d'inventaire conservent les index et trient la puissance",async()=>{
  const {filterAndSortInventory}=await import("../src/ui/character-panels.mjs");
  const inventory=[
    item("helm","head","commun","Heaume",3),
    item("sword","weapon","rare","Épée",8),
    item("ring","ring","épique","Anneau",5),
  ];
  const weapons=filterAndSortInventory(inventory,{group:"weapons",rarity:"all",sort:"power"},entry=>entry.stats.Force);
  assert.deepEqual(weapons.map(entry=>entry.index),[1]);
  const rareFirst=filterAndSortInventory(inventory,{group:"all",rarity:"all",sort:"rarity"},entry=>entry.stats.Force);
  assert.deepEqual(rareFirst.map(entry=>entry.item.uid),["ring","sword","helm"]);
});

test("les compteurs couvrent l'armure, les armes et les bijoux",async()=>{
  const {inventoryGroupOptions}=await import("../src/ui/character-panels.mjs");
  const groups=inventoryGroupOptions([
    item("helm","head","commun","Heaume",3),
    item("sword","weapon","rare","Épée",8),
    item("ring","ring","épique","Anneau",5),
    item("amulet","amulet","rare","Amulette",4),
  ]);
  assert.deepEqual(Object.fromEntries(groups.map(group=>[group.id,group.count])),{all:4,armor:1,weapons:1,jewelry:2});
});

test("la silhouette expose toujours les huit emplacements et leur puissance appliquée",async()=>{
  const {buildLoadoutGroups}=await import("../src/ui/character-panels.mjs");
  const sword=item("sword","weapon","rare","Épée",8);
  const groups=buildLoadoutGroups({mainHand:sword},{inventory:[sword],scoreItem:entry=>entry.stats.Force});
  assert.equal(groups.length,3);
  assert.equal(groups.flatMap(group=>group.slots).length,8);
  assert.equal(groups.find(group=>group.id==="weapons").equipped,1);
  assert.equal(groups.find(group=>group.id==="weapons").power,8);
  assert.equal(groups.find(group=>group.id==="weapons").slots[0].inventoryIndex,0);
});

test("la comparaison tient compte du bonus réellement appliqué au slot",async()=>{
  const {buildInventoryEntries}=await import("../src/ui/character-panels.mjs");
  const worn=item("worn","weapon","commun","Lame usée",4);
  const upgrade=item("upgrade","weapon","rare","Lame neuve",10);
  const entries=buildInventoryEntries([worn,upgrade],{mainHand:worn},{group:"all",rarity:"all",sort:"power"},{
    scoreItem:entry=>entry.stats.Force,
    chooseSlot:()=> "mainHand",
    findSlot:(equipment,entry)=>equipment.mainHand===entry?"mainHand":null,
    slotStats:entry=>({Force:Math.ceil(entry.stats.Force*.6)}),
  });
  assert.equal(entries[0].item.uid,"upgrade");
  assert.equal(entries[0].delta,3);
  assert.equal(entries[1].currentSlot,"mainHand");
});
