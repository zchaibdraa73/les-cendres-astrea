const test=require("node:test");
const assert=require("node:assert/strict");

const clone=value=>structuredClone(value);

async function audited(data){
  const {auditEquipmentCatalog}=await import("../src/equipment/equipment-audit.mjs");
  return auditEquipmentCatalog(data);
}

test("le catalogue complet respecte les huit emplacements et la courbe régionale",async()=>{
  require("../data.js");
  const {errors,report}=await audited(globalThis.GAME_DATA);
  assert.deepEqual(errors,[]);
  assert.equal(report.itemCount,98);
  assert.equal(report.slotCount,8);
  assert.equal(report.recipeCount,14);
  assert.equal(report.setCount,6);
  assert.equal(report.artifactCount,29);
  assert.deepEqual(new Set(report.craftedTypes),new Set(["head","chest","legs","weapon","amulet","ring"]));
  for(const groupId of ["armor","weapons","jewelry"]){
    const curve=report.regions.map(region=>region.groups[groupId].average);
    assert.ok(curve.every((value,index)=>index===0||value>curve[index-1]),`${groupId} doit progresser à chaque région`);
  }
});

test("l'audit refuse une région qui ne couvre plus tous les types",async()=>{
  require("../data.js");
  const broken=clone(globalThis.GAME_DATA);
  broken.items=broken.items.filter(item=>!["memory_knot","true_name_seal","returning_ring"].includes(item.id));
  const {errors}=await audited(broken);
  assert.ok(errors.some(error=>error.includes("Région 4 sans équipement de type ring")));
});

test("l'audit détecte un palier d'ensemble impossible à équiper",async()=>{
  require("../data.js");
  const broken=clone(globalThis.GAME_DATA);
  broken.builds.sets.impossible={
    name:"Arsenal impossible",
    items:["iron_sword","mist_dagger","ember_staff"],
    bonuses:{3:{stats:{Force:20}}},
  };
  const {errors}=await audited(broken);
  assert.ok(errors.some(error=>error.includes("Ensemble impossible")&&error.includes("bonus 3 pièces impossible")));
});

test("l'audit impose une recette de forge pour chaque type d'équipement",async()=>{
  require("../data.js");
  const broken=clone(globalThis.GAME_DATA);
  broken.builds.recipes=broken.builds.recipes.filter(recipe=>!["recipe_silent_oath","recipe_drowned_choir"].includes(recipe.id));
  const {errors}=await audited(broken);
  assert.ok(errors.includes("Forge sans recette pour le type amulet."));
});

test("l'audit bloque une régression de puissance entre deux régions",async()=>{
  require("../data.js");
  const broken=clone(globalThis.GAME_DATA);
  broken.items.filter(item=>(item.region||1)===4&&["head","chest","legs"].includes(item.equipType)).forEach(item=>{item.stats={Vitalité:1}});
  const {errors}=await audited(broken);
  assert.ok(errors.some(error=>error.includes("Courbe armor non croissante")));
});
