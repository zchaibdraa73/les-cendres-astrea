const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const saveSystem=require("../state-system.js");
const mapSystem=require("../map-system.js");
const balanceSystem=require("../balance-system.js");
const validationSystem=require("../validation-system.js");
const rules=require("../engine.js");
require("../data.js");

const source=fs.readFileSync(path.join(__dirname,"..","game.js"),"utf8");
const classSource=fs.readFileSync(path.join(__dirname,"..","src","content","classes.mjs"),"utf8");
const mapSource=fs.readFileSync(path.join(__dirname,"..","src","content","maps.mjs"),"utf8");
const narrativeSource=fs.readFileSync(path.join(__dirname,"..","src","content","narrative.mjs"),"utf8");
const audioSource=fs.readFileSync(path.join(__dirname,"..","src","services","audio-service.mjs"),"utf8");
const storageSource=fs.readFileSync(path.join(__dirname,"..","src","services","player-storage.mjs"),"utf8");
const saveSlotSource=fs.readFileSync(path.join(__dirname,"..","src","services","save-slots.mjs"),"utf8");
function extract(expression){
  return vm.runInNewContext(`(${expression})`);
}
const classMatch=classSource.match(/export const classes = (\[[\s\S]*?\]);/);
const mapMatch=mapSource.match(/export const regionOneNodes = (\[[\s\S]*?\]);\r?\nexport const regionTwoNodes = (\[[\s\S]*?\]);\r?\nexport const regionThreeNodes = (\[[\s\S]*?\]);\r?\nexport const regionFourNodes = (\[[\s\S]*?\]);/);

test("les anciennes sauvegardes migrent successivement vers la version courante",()=>{
  const migrated=saveSystem.migrate({version:11,learnedPassives:["p1","p2"],classId:"bastion"});
  assert.equal(migrated.version,saveSystem.CURRENT_VERSION);
  assert.deepEqual(migrated.equippedPassives,["p1","p2"]);
  assert.deepEqual(migrated.specializations,[]);
  assert.deepEqual(migrated.recipes,[]);
  assert.ok(migrated.run);
  assert.deepEqual(migrated.discoveries,{items:[],enemies:[],lore:["prologue"]});
  assert.deepEqual(migrated.narrative,{reputation:{veilleurs:0,archivistes:0,sansOmbre:0},flags:[],questItems:[],decisions:[]});
  assert.deepEqual(migrated.companions,{unlocked:["ilyra"],active:"ilyra",trust:{ilyra:0},equipment:{},milestones:{},relation:{},quests:{},dialogues:{},departed:[]});
  assert.deepEqual(migrated.contracts,{offers:{},active:null,progress:0,completed:[],claimed:[]});
  assert.equal(migrated.nemesis,null);
  assert.deepEqual(migrated.camp,{visits:0,buff:null,conversations:[],history:[]});
  assert.deepEqual(migrated.campaign,{finalChoice:null,ending:null,completed:false,mapsExpanded:true});
  assert.equal(migrated.run.wavesCleared,0);
  assert.equal(migrated.run.hazardsTriggered,0);
  assert.deepEqual(migrated.run.bossTrophies,[]);
  assert.deepEqual(migrated.tutorial,{seen:[],enabled:true});
  assert.deepEqual(migrated.masteryNodes,[]);
  assert.deepEqual(migrated.buildPresets,[null,null,null]);
});

test("une sauvegarde corrompue est rejetée proprement",()=>{
  assert.equal(saveSystem.safeParse("{incorrect"),null);
  assert.throws(()=>saveSystem.migrate(null));
});

test("les archives de sauvegarde sont portables, migrées et strictement validées",()=>{
  const legacy=JSON.stringify({version:26,classId:"bastion",level:12,run:{}}),raw=saveSystem.createBundle({slots:[legacy,null,null],backups:[null,legacy,null],meta:{embers:42},settings:{volume:.4},activeSlot:1}),bundle=saveSystem.parseBundle(raw);
  assert.equal(bundle.bundleVersion,1);
  assert.equal(JSON.parse(bundle.slots[0]).version,saveSystem.CURRENT_VERSION);
  assert.equal(JSON.parse(bundle.backups[1]).version,saveSystem.CURRENT_VERSION);
  assert.equal(bundle.meta.embers,42);
  assert.throws(()=>saveSystem.parseBundle('{"bundleVersion":2,"slots":[]}'));
  assert.throws(()=>saveSystem.parseBundle({bundleVersion:1,slots:["corrompu",null,null],meta:{},settings:{}}));
});

test("les quatre cartes sont entièrement connectées et réciproques",()=>{
  assert.ok(mapMatch,"cartes introuvables dans le moteur");
  const regionOne=extract(mapMatch[1]),regionTwo=extract(mapMatch[2]),regionThree=extract(mapMatch[3]),regionFour=extract(mapMatch[4]);
  assert.deepEqual(mapSystem.validateMap(regionOne,{mainLast:28}),[]);
  assert.deepEqual(mapSystem.validateMap(regionTwo,{mainLast:26}),[]);
  assert.deepEqual(mapSystem.validateMap(regionThree,{mainLast:27}),[]);
  assert.deepEqual(mapSystem.validateMap(regionFour,{mainLast:9}),[]);
  assert.equal(regionOne.filter(node=>!node.optional).length,22);
  assert.equal(regionOne.filter(node=>node.optional).length,10);
  assert.equal(regionTwo.filter(node=>!node.optional).length,20);
  assert.equal(regionTwo.filter(node=>node.optional).length,10);
  assert.equal(regionThree.filter(node=>!node.optional).length,20);
  assert.equal(regionThree.filter(node=>node.optional).length,11);
  assert.equal(regionFour.filter(node=>node.optional).length,4);
});

test("les trois premières régions possèdent désormais une seconde séquence et un boss final",()=>{
  const [regionOne,regionTwo,regionThree]=mapMatch.slice(1,4).map(extract);
  assert.equal(regionOne[28].type,"r1finalboss");
  assert.equal(regionTwo[26].type,"r2finalboss");
  assert.equal(regionThree[27].type,"r3finalboss");
  assert.ok(source.includes('type==="r1finalboss"'));
  assert.ok(source.includes('type==="r2finalboss"'));
  assert.ok(source.includes('type==="r3finalboss"'));
  assert.ok(source.includes('map.classList.toggle("expanded",expanded)'));
});

test("les routes aléatoires sont reproductibles avec une graine",()=>{
  const regionOne=extract(mapMatch[1]);
  assert.deepEqual(mapSystem.generateRoute(42,regionOne,rules.seededStep),mapSystem.generateRoute(42,regionOne,rules.seededStep));
});

test("toutes les références croisées du catalogue sont valides",()=>{
  assert.deepEqual(validationSystem.validateContent(globalThis.GAME_DATA),[]);
});

test("les quatre classes produisent des simulations valides aux niveaux clés",()=>{
  assert.ok(classMatch,"classes introuvables dans le moteur");
  const classes=extract(classMatch[1]),snapshots=balanceSystem.audit(classes,globalThis.GAME_DATA.abilities);
  assert.equal(snapshots.length,16);
  snapshots.forEach(row=>{assert.ok(row.hp>0);assert.ok(row.damage>0);assert.ok(row.abilityPower>0);assert.ok(Number.isFinite(row.energy))});
  assert.ok(balanceSystem.spread(snapshots,"damage",30)<2);
  assert.ok(balanceSystem.spread(snapshots,"abilityPower",30)<2.5);
});

test("les interfaces de journal et d'accessibilité sont présentes",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const entry=fs.readFileSync(path.join(__dirname,"..","main.js"),"utf8");
  for(const id of ["codex-panel","codex-content","settings-panel","settings-content","saves-panel","credits-panel","error-banner","glossary-panel","guide-panel","companion-event-panel","contracts-panel","contracts-content","nemesis-panel","nemesis-content","camp-panel","camp-content","camp-buff","ending-panel","ending-context","ending-choices"])assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('type="module" src="./main.js"'));
  assert.ok(entry.indexOf('import "./validation-system.js"')<entry.indexOf('import "./game.js"'));
});

test("la démo publique expose sauvegardes multiples, plein écran et manette",()=>{
  assert.ok(saveSlotSource.includes("const slotKey="));
  assert.ok(source.includes("requestFullscreen"));
  assert.ok(source.includes("navigator.getGamepads"));
  assert.ok(source.includes('window.addEventListener("error"'));
});

test("le tutoriel progressif possède un glossaire et un entraînement sans récompense",()=>{
  assert.ok(narrativeSource.includes("export const guideBook="));
  assert.ok(source.includes("function showGuide("));
  assert.ok(source.includes("trainingSnapshot"));
  assert.ok(source.includes("Entraînement terminé"));
});

test("les événements narratifs possèdent des choix et des références valides",()=>{
  const narrative=globalThis.GAME_DATA.narrative;
  assert.ok(narrative);
  assert.ok(Object.keys(narrative.events).length>=4);
  for(const event of Object.values(narrative.events)){
    assert.ok(event.choices.length>=3);
    assert.equal(new Set(event.choices.map(choice=>choice.id)).size,event.choices.length);
    for(const choice of event.choices){
      if(choice.questItem)assert.ok(narrative.questItems[choice.questItem]);
      if(choice.consumeQuestItem)assert.ok(narrative.questItems[choice.consumeQuestItem]);
      for(const faction of Object.keys(choice.effects?.reputation||{}))assert.ok(narrative.factions[faction]);
    }
  }
});

test("les trois compagnons possèdent une progression relationnelle complète",()=>{
  assert.equal(globalThis.GAME_DATA.companions.length,3);
  for(const companion of globalThis.GAME_DATA.companions){
    assert.ok(companion.ability?.type);
    assert.ok(companion.ability.evolvedName);
    assert.ok(companion.quest?.name);
    assert.deepEqual(Object.keys(companion.scenes).map(Number),[5,10,15,20,25]);
    assert.deepEqual(Object.keys(companion.synergies).sort(),["arcaniste","bastion","penitent","traqueuse"]);
  }
  assert.ok(source.includes("function nextCompanionMilestone("));
  assert.ok(source.includes('state.companions.quests[id]="active"'));
  assert.ok(source.includes('state.companions.quests[companion.id]="completed"'));
});

test("les contrats couvrent les trois régions avec des objectifs et récompenses valides",()=>{
  const contracts=globalThis.GAME_DATA.contracts;
  assert.equal(contracts.length,12);
  assert.equal(new Set(contracts.map(contract=>contract.id)).size,contracts.length);
  assert.deepEqual([...new Set(contracts.map(contract=>contract.region))],[1,2,3]);
  for(const region of [1,2,3])assert.equal(contracts.filter(contract=>contract.region===region).length,4);
  contracts.forEach(contract=>{assert.ok(contract.objective.target>0);assert.ok(contract.reward.gold||contract.reward.xp||contract.reward.potions||contract.reward.itemRarity||contract.reward.resources)});
  assert.ok(source.includes("function advanceContract("));
  assert.ok(source.includes('advanceContract("potionless")'));
});

test("la Némésis possède des identités, bases régionales et mutations uniques",()=>{
  const nemesis=globalThis.GAME_DATA.nemesis;
  assert.ok(nemesis.names.length>=6);
  assert.ok(nemesis.titles.length>=6);
  for(const region of [1,2,3,4])assert.ok(nemesis.bases[region].length>=4);
  assert.equal(new Set(nemesis.traits.map(trait=>trait.id)).size,nemesis.traits.length);
  assert.ok(source.includes("function buildNemesis("));
  assert.ok(source.includes("function promoteNemesis("));
  assert.ok(source.includes("function startNemesisHunt("));
  assert.ok(source.includes("combat.nemesis"));
});

test("le campement propose cinq choix et deux préparations de combat",()=>{
  const camp=globalThis.GAME_DATA.camp;
  assert.equal(camp.choices.length,5);
  assert.deepEqual(Object.keys(camp.buffs).sort(),["edge","ward"]);
  assert.equal(new Set(camp.choices.map(choice=>choice.id)).size,camp.choices.length);
  assert.ok(source.includes("function openCamp("));
  assert.ok(source.includes("function chooseCampAction("));
  assert.ok(source.includes('combat.campBuff==="edge"'));
  assert.ok(source.includes('combat.campBuff==="ward"'));
});

test("la campagne possède un chapitre final et quatre conclusions",()=>{
  const endings=globalThis.GAME_DATA.endings;
  assert.equal(endings.length,4);
  assert.equal(new Set(endings.map(ending=>ending.id)).size,endings.length);
  assert.ok(endings.some(ending=>ending.secret));
  assert.ok(narrativeSource.includes("export const regionFourSlides"));
  assert.ok(source.includes("function openFinalChoice("));
  assert.ok(source.includes("function buildEndingSlides("));
  assert.ok(source.includes('bossMechanic:"trueMaster"'));
  assert.ok(source.includes("function triggerFinalBossPhase("));
});

test("les combats avancés couvrent vagues, dangers régionaux et mutations",()=>{
  const combatData=globalThis.GAME_DATA.combat;
  assert.equal(combatData.hazards.length,8);
  assert.equal(combatData.mutations.length,6);
  for(const region of [1,2,3,4])assert.equal(combatData.hazards.filter(hazard=>hazard.region===region).length,2);
  assert.ok(source.includes("function advanceCombatWave("));
  assert.ok(source.includes("function triggerCombatHazard("));
  assert.ok(source.includes('waves:[["'));
  assert.ok(source.includes('action==="advanced-training"'));
});

test("les builds avancés couvrent maîtrises, transformations et présélections",()=>{
  const builds=globalThis.GAME_DATA.builds;
  for(const classId of Object.keys(globalThis.GAME_DATA.abilities)){
    assert.equal(builds.masteries[classId].length,9);
    assert.ok(builds.abilityEvolutions[classId].power);
    assert.ok(builds.abilityEvolutions[classId].mastery);
  }
  assert.ok(Object.keys(builds.artifactEffects).length>=18);
  assert.ok(source.includes("function chooseMastery("));
  assert.ok(source.includes("function saveBuildPreset("));
  assert.ok(source.includes("function activateBuildPreset("));
  assert.ok(source.includes("function resetBuild("));
  assert.ok(source.includes("function abilityDamageBreakdown("));
});

test("le Sanctuaire possède quatre bâtiments évolutifs et une méta-progression horizontale",()=>{
  const sanctuary=globalThis.GAME_DATA.sanctuary;
  assert.equal(sanctuary.buildings.length,4);
  assert.equal(sanctuary.preparations.length,4);
  assert.ok(sanctuary.collections.length>=5);
  assert.ok(sanctuary.memories.length>=12);
  for(const building of sanctuary.buildings){
    assert.equal(building.costs.length,3);
    assert.equal(building.stages.length,3);
    assert.ok(building.dialogues.length>=4);
  }
  assert.ok(source.includes("function restoreSanctuaryBuilding("));
  assert.ok(source.includes("function chooseSanctuaryPreparation("));
  assert.ok(source.includes("function claimSanctuaryCollection("));
  assert.ok(source.includes("state.run.bossTrophies"));
  assert.ok(source.includes("meta.discoveries"));
});

test("l'axe audiovisuel possède des scènes dynamiques et des options de confort séparées",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  for(const id of ["combat-history","audio-caption"])assert.ok(html.includes(`id="${id}"`));
  for(const scene of ["menu","prologue","exploration1","exploration2","exploration3","exploration4","combat","boss","sanctuary"])assert.ok(audioSource.includes(`${scene}:`));
  assert.ok(source.includes("function setAudioScene("));
  assert.ok(source.includes("function combatFeedback("));
  assert.ok(source.includes("function renderCombatHistory("));
  assert.ok(storageSource.includes("musicVolume"));
  assert.ok(storageSource.includes("sfxVolume"));
  assert.ok(source.includes("combatPace"));
  assert.ok(storageSource.includes("audioCues"));
});

test("la release candidate protège et transporte les sauvegardes",()=>{
  const packageJson=JSON.parse(fs.readFileSync(path.join(__dirname,"..","package.json"),"utf8"));
  assert.equal(packageJson.version,"3.0.0-rc.1");
  assert.ok(packageJson.scripts.audit.includes("release-audit.js"));
  assert.ok(packageJson.scripts.check.includes("npm run audit"));
  assert.ok(saveSlotSource.includes("const backupKey="));
  assert.ok(source.includes("function exportSaveArchive("));
  assert.ok(source.includes("function importSaveArchive("));
  assert.ok(source.includes("function restoreSlotBackup("));
  assert.ok(source.includes("function restorePreImportArchive("));
});

test("le socle de développement est verrouillé et contrôlé",()=>{
  const packageJson=JSON.parse(fs.readFileSync(path.join(__dirname,"..","package.json"),"utf8"));
  const lock=JSON.parse(fs.readFileSync(path.join(__dirname,"..","package-lock.json"),"utf8"));
  for(const script of ["dev","build","lint","typecheck","check"])assert.ok(packageJson.scripts[script],`script npm manquant : ${script}`);
  for(const dependency of ["vite","typescript","eslint","@eslint/js","globals","@types/node","@playwright/test","yaml"]){
    assert.match(packageJson.devDependencies[dependency],/^\d+\.\d+\.\d+$/);
    assert.equal(lock.packages[`node_modules/${dependency}`].version,packageJson.devDependencies[dependency]);
  }
  for(const dependency of ["zod","@fontsource/cinzel","@fontsource/inter"]){
    assert.match(packageJson.dependencies[dependency],/^\d+\.\d+\.\d+$/);
    assert.equal(lock.packages[`node_modules/${dependency}`].version,packageJson.dependencies[dependency]);
  }
  for(const file of ["main.js","vite.config.mjs","eslint.config.mjs","playwright.config.mjs","tsconfig.json","tests/e2e/game-smoke.spec.mjs","src/content/classes.mjs","src/content/maps.mjs","src/content/narrative.mjs","src/config/game-options.mjs","src/services/player-storage.mjs","src/services/save-slots.mjs","src/services/audio-service.mjs","src/maps/world-navigation.mjs","src/ui/presenters.mjs","src/combat/combat-helpers.mjs","src/validation/game-schemas.mjs"])assert.ok(fs.existsSync(path.join(__dirname,"..",file)),`configuration manquante : ${file}`);
});

test("game.js orchestre les sous-systèmes sans réembarquer leurs catalogues",()=>{
  assert.ok(source.split(/\r?\n/).length<1250);
  for(const modulePath of ["content/classes.mjs","content/maps.mjs","content/narrative.mjs","services/player-storage.mjs","services/save-slots.mjs","services/audio-service.mjs","maps/world-navigation.mjs","ui/presenters.mjs","combat/combat-helpers.mjs","validation/game-schemas.mjs"])assert.ok(source.includes(modulePath),`import absent : ${modulePath}`);
  assert.ok(!source.includes("const audioScenes="));
  assert.ok(!source.includes("function normalizeMetaValue("));
  assert.ok(!source.includes("function nodeIcon("));
});

test("les défis ont des identifiants uniques et couvrent les quatre classes",()=>{
  const challenges=globalThis.GAME_DATA.challenges;
  assert.equal(new Set(challenges.map(challenge=>challenge.id)).size,challenges.length);
  assert.deepEqual(challenges.filter(challenge=>challenge.classId).map(challenge=>challenge.classId).sort(),["arcaniste","bastion","penitent","traqueuse"]);
  challenges.forEach(challenge=>{assert.ok(challenge.reward>0);assert.ok(challenge.condition)});
});
