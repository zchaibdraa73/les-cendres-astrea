const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const rules=require("../engine.js");
const balance=require("../balance-system.js");
require("../data.js");

test("la courbe d'expérience est croissante du niveau 1 au niveau 30",()=>{
  const values=Array.from({length:30},(_,index)=>rules.xpForLevel(index+1));
  assert.equal(values[0],100);
  values.slice(1).forEach((value,index)=>assert.ok(value>values[index]));
});

test("l'audit d'équilibrage vérifie progression, raretés et pression régionale",()=>{
  const data=globalThis.GAME_DATA,progression=balance.progressionBudget(rules.xpForLevel,data.progression.maxLevel),equipment=balance.equipmentCurve(data.items),enemies=balance.enemyCurve(data.enemies,rules.scaleEnemy);
  assert.equal(progression.totalXp,35170);
  assert.equal(progression.monotonic,true);
  equipment.slice(1).forEach((tier,index)=>assert.ok(tier.average>equipment[index].average));
  assert.deepEqual(enemies.map(row=>row.region),[1,2,3,4]);
  enemies.forEach(row=>{assert.ok(row.regularCount>=4);assert.ok(row.bossCount>=1);assert.ok(row.bossHp>row.regularHp*2)});
});

test("le générateur à graine est déterministe et borné",()=>{
  const first=rules.seededStep(123456);
  const second=rules.seededStep(123456);
  assert.deepEqual(first,second);
  assert.ok(first[1]>=0&&first[1]<1);
});

test("le niveau ennemi respecte la région, la difficulté et le plafond",()=>{
  assert.equal(rules.enemyLevel(3,1,0,false),3);
  assert.equal(rules.enemyLevel(3,2,0,false),14);
  assert.equal(rules.enemyLevel(20,4,0,false),27);
  assert.equal(rules.enemyLevel(29,2,4,true),30);
  assert.equal(rules.recommendedLevel(4,0,false,0),27);
  assert.equal(rules.recommendedLevel(4,13,true,26),30);
});

test("la mise à l'échelle augmente les valeurs sans modifier la base",()=>{
  const base={hp:100,damage:20,xp:50,gold:10};
  const scaled=rules.scaleEnemy(base,20,2);
  assert.ok(scaled.hp>base.hp);
  assert.ok(scaled.damage>base.damage);
  assert.ok(scaled.xp>base.xp);
  assert.deepEqual(base,{hp:100,damage:20,xp:50,gold:10});
});

test("les trois phases de boss utilisent les bons seuils",()=>{
  assert.equal(rules.bossPhase(100,100),1);
  assert.equal(rules.bossPhase(66,100),2);
  assert.equal(rules.bossPhase(33,100),3);
});

test("les catalogues de contenu ont des identifiants uniques et complets",()=>{
  const data=globalThis.GAME_DATA;
  for(const collection of [data.items,data.resources,data.enemies]){
    assert.equal(new Set(collection.map(entry=>entry.id)).size,collection.length);
  }
  for(const classId of Object.keys(data.abilities)){
    assert.equal(data.abilities[classId].length,9);
    assert.equal(data.passives[classId].length,9);
  }
  assert.equal(data.progression.maxLevel,30);
});

test("tous les équipements référencés par le moteur existent",()=>{
  const source=fs.readFileSync(path.join(__dirname,"..","game.js"),"utf8");
  const referenced=[...source.matchAll(/makeItem\("([^"]+)"\)/g)].map(match=>match[1]);
  const itemIds=new Set(globalThis.GAME_DATA.items.map(item=>item.id));
  assert.ok(referenced.length>0);
  referenced.forEach(id=>assert.ok(itemIds.has(id),`équipement introuvable : ${id}`));
});

test("les scripts sont chargés dans l'ordre contenu, règles, moteur",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const entry=fs.readFileSync(path.join(__dirname,"..","main.js"),"utf8");
  assert.ok(html.includes('type="module" src="./main.js"'));
  const dataIndex=entry.indexOf('import "./data.js"');
  const rulesIndex=entry.indexOf('import "./engine.js"');
  const gameIndex=entry.indexOf('import "./game.js"');
  assert.ok(dataIndex>=0&&dataIndex<rulesIndex&&rulesIndex<gameIndex);
});

test("les intentions ennemies dépendent du rôle et du tour",()=>{
  assert.equal(rules.enemyIntent(["bête"],2).type,"bleed");
  assert.equal(rules.enemyIntent(["mystique"],3).type,"hex");
  assert.equal(rules.enemyIntent(["armure"],3).type,"guard");
  assert.equal(rules.enemyIntent(["élite"],3).type,"heavy");
  assert.equal(rules.enemyIntent(["boss"],3,3).type,"ultimate");
  assert.equal(rules.enemyIntent(["soigneur"],3).type,"heal");
  assert.equal(rules.enemyIntent(["protecteur"],3).type,"protect");
  assert.equal(rules.enemyIntent(["invocateur"],4).type,"summon");
});

test("résistances et rupture de posture sont bornées",()=>{
  assert.equal(rules.damageAffinity("fire",{fire:.25}),.75);
  assert.equal(rules.damageAffinity("fire",{fire:-.25}),1.25);
  assert.equal(rules.damageAffinity("physical",{physical:.9}),.35);
  assert.ok(rules.postureDamage(25,100)>rules.postureDamage(10,100));
});

test("les ressources de classe ont des plafonds et bonus distincts",()=>{
  assert.deepEqual(rules.classResourceProfile("bastion"),{id:"resolve",max:5});
  assert.deepEqual(rules.classResourceProfile("traqueuse"),{id:"combo",max:5});
  assert.deepEqual(rules.classResourceProfile("arcaniste"),{id:"overload",max:3});
  assert.deepEqual(rules.classResourceProfile("penitent"),{id:"debt",max:10});
  assert.equal(rules.classResourceDamage("arcaniste",2,true),1.35);
  assert.ok(rules.classResourceDamage("bastion",5,true)>rules.classResourceDamage("traqueuse",5,true));
  assert.ok(rules.classResourceDamage("penitent",10,true)>1);
});

test("les dégâts persistants et les durées d'effets sont calculés correctement",()=>{
  const statuses={burn:{turns:3,potency:6},bleed:{turns:2,potency:4},marked:{turns:1,potency:20}};
  assert.equal(rules.statusDamage(statuses),10);
  assert.deepEqual(rules.tickStatuses(statuses),{burn:{turns:2,potency:6},bleed:{turns:1,potency:4}});
});

test("tous les effets de compétences utilisent une altération déclarée",()=>{
  const data=globalThis.GAME_DATA;
  const abilityIds=new Set(Object.values(data.abilities).flat().map(ability=>ability.id));
  for(const [abilityId,profile] of Object.entries(data.combat.abilityEffects)){
    assert.ok(abilityIds.has(abilityId),`attaque inconnue : ${abilityId}`);
    for(const effect of profile.effects||[])assert.ok(data.combat.statuses[effect.type],`effet inconnu : ${effect.type}`);
    if(profile.synergy?.status)assert.ok(data.combat.statuses[profile.synergy.status],`synergie inconnue : ${profile.synergy.status}`);
  }
});

test("les difficultés augmentent progressivement risque et récompense",()=>{
  const normal=rules.difficultyRules("normal"),peril=rules.difficultyRules("peril"),nightmare=rules.difficultyRules("nightmare");
  assert.ok(peril.enemyHp>normal.enemyHp&&nightmare.enemyHp>peril.enemyHp);
  assert.ok(peril.rewards>normal.rewards&&nightmare.rewards>peril.rewards);
  assert.ok(nightmare.legacy>peril.legacy);
});

test("la récompense d'héritage valorise victoire, difficulté et détours",()=>{
  const stats={battlesWon:8,bossesDefeated:2,optionalCleared:3};
  const defeat=rules.legacyReward(stats,"normal","none",false);
  const victory=rules.legacyReward(stats,"normal","none",true);
  const nightmare=rules.legacyReward(stats,"nightmare","fragile",true);
  assert.ok(victory>defeat);
  assert.ok(nightmare>victory);
  assert.equal(rules.legacyReward({battlesWon:0,optionalCleared:0},"normal","none",false),0);
});

test("les affixes ajoutent leurs statistiques sans modifier l'objet source",()=>{
  const base={Force:2,Vitalité:1},affix={stats:{Force:2,Esprit:1}};
  assert.deepEqual(rules.applyAffix(base,affix),{Force:4,Vitalité:1,Esprit:1});
  assert.deepEqual(base,{Force:2,Vitalité:1});
});

test("les ensembles activent leurs paliers à deux et trois pièces",()=>{
  const sets={veil:{name:"Voile",bonuses:{2:{stats:{Esprit:3}},3:{maxEnergy:2}}}};
  assert.equal(rules.resolveSetBonuses(["veil"],sets).length,0);
  assert.deepEqual(rules.resolveSetBonuses(["veil","veil"],sets).map(b=>b.required),[2]);
  assert.deepEqual(rules.resolveSetBonuses(["veil","veil","veil"],sets).map(b=>b.required),[2,3]);
});

test("chaque classe possède deux voies cohérentes aux niveaux 10 et 20",()=>{
  const data=globalThis.GAME_DATA;
  for(const classId of Object.keys(data.abilities)){
    const tree=data.builds.specializations[classId];
    assert.equal(tree[10].length,2);
    assert.equal(tree[20].length,2);
    const roots=new Set(tree[10].map(spec=>spec.id));
    tree[20].forEach(spec=>assert.ok(roots.has(spec.requires)));
  }
});

test("le plafond d'amélioration dépend de la rareté",()=>{
  assert.deepEqual([1,2,3,4].map(rules.maxItemLevel),[3,5,7,10]);
});

test("le stock marchand est stable pour une même graine et sans doublon",()=>{
  const ids=["a","b","c","d","e","f","g"];
  const first=rules.deterministicStock(ids,98765,5),second=rules.deterministicStock(ids,98765,5);
  assert.deepEqual(first,second);
  assert.equal(new Set(first).size,5);
});

test("les dangers régionaux et mutations d'élite sont déterministes",()=>{
  const data=globalThis.GAME_DATA;
  const hazard=rules.selectCombatHazard(data.combat.hazards,424242,2,11);
  assert.equal(hazard.region,2);
  assert.equal(rules.selectCombatHazard(data.combat.hazards,424242,2,11).id,hazard.id);
  const first=rules.selectEliteMutations(data.combat.mutations,424242,3,18,2);
  const second=rules.selectEliteMutations(data.combat.mutations,424242,3,18,2);
  assert.deepEqual(first,second);
  assert.equal(first.length,2);
  assert.equal(new Set(first).size,2);
});

test("la cadence des dangers et les récompenses de vagues sont bornées",()=>{
  assert.equal(rules.shouldTriggerHazard(3,3),true);
  assert.equal(rules.shouldTriggerHazard(2,3),false);
  assert.equal(rules.shouldTriggerHazard(0,3),false);
  assert.equal(rules.waveRewardMultiplier(1),1);
  assert.equal(rules.waveRewardMultiplier(2),1.3);
  assert.equal(rules.waveRewardMultiplier(3),1.6);
});

test("les points de maîtrise suivent les paliers jusqu'au niveau 30",()=>{
  assert.equal(rules.masteryPointsForLevel(1),0);
  assert.equal(rules.masteryPointsForLevel(5),1);
  assert.equal(rules.masteryPointsForLevel(19),3);
  assert.equal(rules.masteryPointsForLevel(30),6);
  const root={id:"root",level:5},child={id:"child",level:15,requires:"root"};
  assert.equal(rules.canUnlockMastery(root,[],5,0),true);
  assert.equal(rules.canUnlockMastery(child,[],15,0),false);
  assert.equal(rules.canUnlockMastery(child,["root"],15,1),true);
  assert.equal(rules.canUnlockMastery(root,[],30,6),false);
});

test("le détail des dégâts restitue chaque multiplicateur",()=>{
  const result=rules.damageBreakdown({power:20,stat:10,ratio:1,level:10,rank:2,evolution:1.2,build:1.1,resource:1.2});
  assert.deepEqual(result,{power:20,stat:10,level:15,rankMultiplier:1.25,evolutionMultiplier:1.2,buildMultiplier:1.1,resourceMultiplier:1.2,total:89});
});

test("les présélections ignorent le contenu devenu indisponible",()=>{
  const valid=rules.validateBuildPreset({abilities:["a","missing","b","c","d","e"],passives:["p","missing"],equipment:{Arme:"u1",Armure:"lost",Bijou:null},variants:{a:"power"}},["a","b","c","d","e"],["p"],["u1"]);
  assert.deepEqual(valid.abilities,["a","b","c","d"]);
  assert.deepEqual(valid.passives,["p"]);
  assert.deepEqual(valid.equipment,{Arme:"u1",Bijou:null});
  assert.deepEqual(valid.variants,{a:"power"});
});

test("chaque classe possède trois branches de maîtrise et deux transformations",()=>{
  const data=globalThis.GAME_DATA;
  for(const classId of Object.keys(data.abilities)){
    const nodes=data.builds.masteries[classId],branches=new Set(nodes.map(node=>node.branch));
    assert.equal(nodes.length,9);
    assert.equal(branches.size,3);
    assert.deepEqual(nodes.filter(node=>node.tier===3).map(node=>node.level),[25,25,25]);
    assert.deepEqual(Object.keys(data.builds.abilityEvolutions[classId]).sort(),["mastery","power"]);
  }
  const artifacts=data.items.filter(item=>item.rarity==="légendaire");
  artifacts.forEach(item=>assert.ok(data.builds.artifactEffects[item.id],`effet d'artéfact manquant : ${item.id}`));
});

test("runes, recettes et ensembles référencent du contenu valide",()=>{
  const data=globalThis.GAME_DATA,itemIds=new Set(data.items.map(item=>item.id)),resourceIds=new Set(data.resources.map(resource=>resource.id));
  data.builds.recipes.forEach(recipe=>{assert.ok(itemIds.has(recipe.item));Object.keys(recipe.cost).forEach(id=>assert.ok(resourceIds.has(id)))});
  data.builds.runes.forEach(rune=>Object.keys(rune.cost).forEach(id=>assert.ok(resourceIds.has(id))));
  Object.values(data.builds.sets).forEach(set=>set.items.forEach(id=>assert.ok(itemIds.has(id))));
});
