"use strict";

const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const balance=require("./balance-system.js");
const maps=require("./map-system.js");
const rules=require("./engine.js");
const validation=require("./validation-system.js");
const saveSystem=require("./state-system.js");
require("./data.js");

const root=__dirname;
const source=fs.readFileSync(path.join(root,"game.js"),"utf8");
const classSource=fs.readFileSync(path.join(root,"src","content","classes.mjs"),"utf8");
const mapSource=fs.readFileSync(path.join(root,"src","content","maps.mjs"),"utf8");
const optionSource=fs.readFileSync(path.join(root,"src","config","game-options.mjs"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const packageJson=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const classMatch=classSource.match(/export const classes = (\[[\s\S]*?\]);/);
const mapMatch=mapSource.match(/export const regionOneNodes = (\[[\s\S]*?\]);\r?\nexport const regionTwoNodes = (\[[\s\S]*?\]);\r?\nexport const regionThreeNodes = (\[[\s\S]*?\]);\r?\nexport const regionFourNodes = (\[[\s\S]*?\]);/);
const sanctuaryMatch=optionSource.match(/export const sanctuaryUpgrades=(\[[\s\S]*?\]);/);
const failures=[];
const notes=[];
const check=(condition,message)=>{if(!condition)failures.push(message)};

check(classMatch,"Le catalogue des classes n'a pas pu être extrait.");
check(mapMatch,"Les cartes n'ont pas pu être extraites.");
check(sanctuaryMatch,"Les améliorations du Sanctuaire n'ont pas pu être extraites.");

const classes=classMatch?vm.runInNewContext(`(${classMatch[1]})`):[];
const regionMaps=mapMatch?mapMatch.slice(1,5).map(serialized=>vm.runInNewContext(`(${serialized})`)):[];
const sanctuaryUpgrades=sanctuaryMatch?vm.runInNewContext(`(${sanctuaryMatch[1]})`):[];
const data=globalThis.GAME_DATA;

for(const error of validation.validateContent(data))failures.push(`Contenu : ${error}`);
regionMaps.forEach((nodes,index)=>maps.validateMap(nodes,{mainLast:[28,26,27,9][index]}).forEach(error=>failures.push(`Carte ${index+1} : ${error}`)));

const snapshots=balance.audit(classes,data.abilities);
for(const level of [1,10,20,30]){
  const spread=balance.offenseSpread(snapshots,level);
  check(spread<=1.25,`Écart offensif trop important au niveau ${level} : ${spread.toFixed(2)}.`);
  notes.push(`Niv. ${level} · écart offensif ${spread.toFixed(2)}`);
}

const equipment=balance.equipmentCurve(data.items);
equipment.forEach((tier,index)=>{
  check(tier.count>=4,`Catalogue ${tier.rarity} trop réduit : ${tier.count} objets.`);
  if(index)check(tier.average>equipment[index-1].average,`La puissance moyenne ${tier.rarity} ne dépasse pas le palier précédent.`);
});

const enemies=balance.enemyCurve(data.enemies,rules.scaleEnemy);
enemies.forEach(row=>{
  check(row.regularCount>=4,`Région ${row.region} : seulement ${row.regularCount} ennemis standards.`);
  check(row.bossCount>=1,`Région ${row.region} : aucun boss déclaré.`);
  check(row.bossHp>row.regularHp*2,`Région ${row.region} : les boss ne durent pas assez longtemps.`);
});

const progression=balance.progressionBudget(rules.xpForLevel,data.progression.maxLevel);
check(progression.monotonic,"La courbe d'expérience n'est pas strictement croissante.");
check(progression.totalXp>=30000&&progression.totalXp<=40000,`Budget d'expérience hors cible : ${progression.totalXp}.`);

const sanctuaryCost=data.sanctuary.buildings.reduce((sum,building)=>sum+building.costs.reduce((a,b)=>a+b,0),0)+sanctuaryUpgrades.reduce((sum,upgrade)=>sum+upgrade.cost,0);
const referenceVictory=rules.legacyReward({battlesWon:25,bossesDefeated:8,optionalCleared:10},"normal","none",true);
const sanctuaryRuns=sanctuaryCost/referenceVictory;
check(sanctuaryRuns>=2.5&&sanctuaryRuns<=6,`Économie du Sanctuaire hors cible : ${sanctuaryRuns.toFixed(1)} campagnes de référence.`);

check(saveSystem.CURRENT_VERSION>=28,"La version de sauvegarde attendue n'est pas active.");
check(packageJson.version==="3.0.0-rc.1","La version du package ne correspond pas à la release candidate.");
check(html.includes("v3.0 RC1"),"La version affichée dans le menu ne correspond pas au package.");
for(const file of ["index.html","styles.css","data.js","engine.js","game.js","state-system.js","scripts/audit-equipment.mjs","src/content/classes.mjs","src/content/maps.mjs","src/content/narrative.mjs","src/config/game-options.mjs","src/equipment/equipment-audit.mjs","src/services/player-storage.mjs","src/services/save-slots.mjs","src/services/audio-service.mjs","src/maps/world-navigation.mjs","src/ui/presenters.mjs","src/ui/character-panels.mjs","src/combat/combat-helpers.mjs","README.md","docs/equipment-refactor.md"])check(fs.existsSync(path.join(root,file)),`Fichier de release manquant : ${file}`);
check(!/\b(?:TODO|FIXME)\b/.test(source),"Le moteur contient encore un TODO ou FIXME.");

console.log("AUDIT DE RELEASE · LES CENDRES D'ASTRÉA");
console.log(`Contenu : ${data.items.length} équipements · ${data.enemies.length} ennemis · ${Object.values(data.abilities).flat().length} attaques`);
console.log(`Progression : niveau ${progression.maxLevel} · ${progression.totalXp} XP cumulés`);
console.log(`Sanctuaire : ${sanctuaryCost} braises · ${sanctuaryRuns.toFixed(1)} campagnes de référence`);
console.log(notes.join(" · "));
console.table(equipment.map(row=>({rareté:row.rarity,objets:row.count,puissance_moyenne:row.average.toFixed(1)})));
console.table(enemies.map(row=>({région:row.region,niveau:row.level,ennemis:row.regularCount,boss:row.bossCount,pv_moyens:Math.round(row.regularHp),pv_boss:Math.round(row.bossHp)})));

if(failures.length){
  console.error(`RELEASE REFUSÉE · ${failures.length} problème(s)`);
  failures.forEach(failure=>console.error(`- ${failure}`));
  process.exitCode=1;
}else console.log("RELEASE VALIDÉE · aucun bloqueur détecté");
