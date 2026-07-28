import "../data.js";
import { auditEquipmentCatalog } from "../src/equipment/equipment-audit.mjs";

const {errors,report}=auditEquipmentCatalog(globalThis.GAME_DATA);

console.log("AUDIT ÉQUIPEMENT · HUIT EMPLACEMENTS");
console.log(`${report.itemCount} objets · ${report.slotCount} emplacements · ${report.recipeCount} recettes · ${report.setCount} ensembles · ${report.artifactCount} artéfacts`);
console.table(report.regions.map(summary=>({
  région:summary.region,
  objets:summary.total,
  armure:summary.groups.armor.average.toFixed(1),
  armes:summary.groups.weapons.average.toFixed(1),
  bijoux:summary.groups.jewelry.average.toFixed(1),
})));
console.table(report.rarityCurve.map(tier=>({
  rareté:tier.rarity,
  objets:tier.count,
  puissance_moyenne:tier.average.toFixed(1),
})));

if(errors.length){
  console.error(`AUDIT ÉQUIPEMENT REFUSÉ · ${errors.length} problème(s)`);
  errors.forEach(error=>console.error(`- ${error}`));
  process.exitCode=1;
}else console.log("AUDIT ÉQUIPEMENT VALIDÉ · couverture, forge, ensembles et courbes conformes");
