import { classes } from "./src/content/classes.mjs";
import { regionOneNodes, regionTwoNodes, regionThreeNodes, regionFourNodes } from "./src/content/maps.mjs";
import { nodeEvents, guideBook, prologueSlides, regionTwoSlides, regionThreeSlides, regionFourSlides } from "./src/content/narrative.mjs";
import { SAVE_KEY, ACTIVE_SLOT_KEY, IMPORT_BACKUP_KEY, META_KEY, META_BACKUP_KEY, SETTINGS_KEY, difficulties, modifiers, sanctuaryUpgrades } from "./src/config/game-options.mjs";
import { createPlayerStorage } from "./src/services/player-storage.mjs";
import { createAudioService } from "./src/services/audio-service.mjs";
import { createSaveSlotService } from "./src/services/save-slots.mjs";
import { createWorldNavigation } from "./src/maps/world-navigation.mjs";
import { formatStats, rarityInfo, itemDisplayName, nodeIcon, renderStatusBadges } from "./src/ui/presenters.mjs";
import { resolveMutationProfiles, tuneCombatEnemies as tuneEnemyGroup, livingEnemies as findLivingEnemies, targetEnemy as selectCombatTarget } from "./src/combat/combat-helpers.mjs";
import { assertSaveState, assertSaveBundle, validateGameContent, validateMapCatalog } from "./src/validation/game-schemas.mjs";
import { migrateCatalogItem, migrateEquipmentSave, syncEquipmentProjection } from "./src/equipment/equipment-migration.mjs";
import DOMPurify from "dompurify";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

SAVE_SYSTEM.setValidators({save:assertSaveState,bundle:assertSaveBundle});
SAVE_SYSTEM.setIntegrity({digest:value=>bytesToHex(sha256(new TextEncoder().encode(value)))});
SAVE_SYSTEM.setMigrationHandlers({equipment:migrateEquipmentSave});
VALIDATION_SYSTEM.setSchemaValidator(validateGameContent);
const worldNavigation=createWorldNavigation({mapSystem:MAP_SYSTEM,maps:{1:regionOneNodes,2:regionTwoNodes,3:regionThreeNodes,4:regionFourNodes}});
const activeMapNodes=()=>worldNavigation.nodesFor(state?.currentRegion||1);
const regionMeta=()=>worldNavigation.detailsFor(state?.currentRegion||1);
const validateWorld=()=>worldNavigation.validate();
const itemCatalog=Object.fromEntries(GAME_DATA.items.map(item=>[item.id,migrateCatalogItem(item)]));
const enemyCatalog=Object.fromEntries(GAME_DATA.enemies.map(enemy=>[enemy.id,enemy]));
const abilityCatalog=Object.fromEntries(Object.values(GAME_DATA.abilities).flat().map(ability=>[ability.id,ability]));
const passiveCatalog=Object.fromEntries(Object.values(GAME_DATA.passives).flat().map(passive=>[passive.id,passive]));
const statusCatalog=GAME_DATA.combat.statuses,abilityEffects=GAME_DATA.combat.abilityEffects,combatHazards=GAME_DATA.combat.hazards||[],combatMutations=GAME_DATA.combat.mutations||[];
const buildData=GAME_DATA.builds;
const makeItem=id=>{const item=clone(itemCatalog[id]),info=rarityInfo(item.rarity),chance={commun:.15,rare:.45,épique:.75,légendaire:1}[item.rarity]||0,affix=random()<chance?clone(rand(buildData.affixes)):null,setId=Object.entries(buildData.sets).find(([,set])=>set.items.includes(id))?.[0],baseStats=clone(item.stats);item.stats=GAME_RULES.applyAffix(baseStats,affix);return {...item,uid:`${id}-${Math.floor(random()*1e9).toString(36)}`,level:1,baseStats,affix,rune:null,setId,type:`${item.slot} · ${info.label}`,detail:formatStats(item.stats),rare:item.rarity!=="commun",color:info.color}};
const lootTable=GAME_DATA.items.filter(item=>["commun","rare"].includes(item.rarity)).map(item=>item.id);
const eliteLoot=GAME_DATA.items.filter(item=>item.rarity==="épique").map(item=>item.id);
const artifactLoot=GAME_DATA.items.filter(item=>item.rarity==="légendaire").map(item=>item.id);
const enemyBook={
  scout:enemyCatalog.ash_scout,hound:enemyCatalog.char_hound,cultist:enemyCatalog.veiled_cultist,brute:enemyCatalog.ruin_brute,
  widow:enemyCatalog.pale_widow,singer:enemyCatalog.grave_singer,remnant:enemyCatalog.iron_remnant,thief:enemyCatalog.cinder_thief,
  faceless:enemyCatalog.faceless,warden:enemyCatalog.profane_warden,knight:enemyCatalog.abyss_knight,oracle:enemyCatalog.ash_oracle,giant:enemyCatalog.chain_giant,echo:enemyCatalog.nameless_echo,wanderBoss:enemyCatalog.cinder_colossus,ashLord:enemyCatalog.vharos,banneret:enemyCatalog.ash_banneret,vharosUnbound:enemyCatalog.vharos_unbound,
  root:enemyCatalog.root_stalker,mirror:enemyCatalog.mirror_wraith,leech:enemyCatalog.star_leech,pilgrim:enemyCatalog.hollow_pilgrim,glass:enemyCatalog.glass_sentinel,shadowless:enemyCatalog.shadowless,veilKeeper:enemyCatalog.veil_keeper,
  moth:enemyCatalog.archive_moth,inverted:enemyCatalog.inverted_guard,mimic:enemyCatalog.moon_mimic,harvester:enemyCatalog.vein_harvester,astronomer:enemyCatalog.starved_astronomer,magistrate:enemyCatalog.white_magistrate,
  nameEater:enemyCatalog.name_eater,skyGrave:enemyCatalog.sky_grave,voidBeast:enemyCatalog.void_beast,starSmith:enemyCatalog.star_smith,worldEye:enemyCatalog.world_eye,lunarMonk:enemyCatalog.lunar_monk,asterionEclipsed:enemyCatalog.asterion_eclipsed,
  legionary:enemyCatalog.buried_legionary,wisp:enemyCatalog.crown_wisp,gaoler:enemyCatalog.memory_gaoler,seraph:enemyCatalog.soot_seraph,hollowKing:enemyCatalog.hollow_king,flameBeast:enemyCatalog.first_flame_beast,archon:enemyCatalog.mask_archon,ashPrince:enemyCatalog.ash_prince,masterManifestation:enemyCatalog.ash_master_manifestation,royalMemory:enemyCatalog.royal_memory,crownedManifestation:enemyCatalog.crowned_manifestation,
  cycleHound:enemyCatalog.cycle_hound,ashScribe:enemyCatalog.ash_scribe,oathKeeper:enemyCatalog.oath_keeper,namelessTwin:enemyCatalog.nameless_twin,firstWitness:enemyCatalog.first_witness,crownEater:enemyCatalog.crown_eater,trueMaster:enemyCatalog.ash_master_true
};
let selectedIndex=0,state=null,combat=null,pendingEvent=null,pendingCompanionEvent=null,rewardDraft=[],currentScreen="main-menu",slideIndex=0,slideDeck=prologueSlides,endingMode=false,selectedDifficulty="normal",selectedModifier="none",selectedAscension=0,dailyMode=false,sanctuaryView="village";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const safeHtml=(strings,...values)=>DOMPurify.sanitize(Array.isArray(strings)&&Object.hasOwn(strings,"raw")?String.raw({raw:strings},...values):String(strings??""),{
  USE_PROFILES:{html:true},
  FORBID_TAGS:["script","iframe","object","embed","form"],
  FORBID_ATTR:["srcdoc"],
});
const clone=o=>JSON.parse(JSON.stringify(o));
const seedValue=()=>Math.floor(Math.random()*0xffffffff)>>>0;
const seededStep=GAME_RULES.seededStep;
function random(){if(!state)return Math.random();const [next,value]=seededStep(state.rngState);state.rngState=next;return value}
const rand=a=>a[Math.floor(random()*a.length)];
const playerStorage=createPlayerStorage({storage:localStorage,gameData:GAME_DATA,rules:GAME_RULES,keys:{meta:META_KEY,metaBackup:META_BACKUP_KEY,settings:SETTINGS_KEY}});
const saveSlots=createSaveSlotService({storage:localStorage,saveSystem:SAVE_SYSTEM,clamp:GAME_RULES.clamp,saveKey:SAVE_KEY,activeSlotKey:ACTIVE_SLOT_KEY});
const normalizeMetaValue=playerStorage.normalizeMeta;
const loadMeta=playerStorage.loadMeta;
const loadSettings=playerStorage.loadSettings;
function saveMeta(meta){playerStorage.saveMeta(meta);renderLegacyLabel()}
function saveSettings(settings){playerStorage.saveSettings(settings);applySettings()}
const audioService=createAudioService({getSettings:()=>loadSettings(),onCue:showAudioCue});
function applySettings(){
  const settings=loadSettings();document.documentElement.style.setProperty("--text-scale",settings.textScale);document.body.classList.toggle("reduced-motion",settings.reducedMotion);document.body.classList.toggle("high-contrast",settings.highContrast);document.body.classList.toggle("no-screen-shake",!settings.screenShake);audioService.applySettings(settings);
}
function currentAudioScene(){if(currentScreen==="combat")return combat?.boss?"boss":"combat";if(currentScreen==="exploration")return `exploration${state?.currentRegion||1}`;if(currentScreen==="prologue")return "prologue";return "menu"}
function setAudioScene(scene=currentAudioScene()){audioService.setScene(scene)}
function startAmbience(){audioService.start()}
function showAudioCue(kind){
  const cue=$("#audio-caption"),labels={ui:"Interface",attack:"Lame tranchante",ability:"Pouvoir libéré",hit:"Impact",critical:"Coup critique",break:"Posture brisée",reward:"Récompense obtenue",danger:"Menace ennemie",bossPhase:"Le boss change de phase"};if(!cue||!labels[kind])return;cue.textContent=`♪ ${labels[kind]}`;cue.classList.add("show");clearTimeout(showAudioCue.timer);showAudioCue.timer=setTimeout(()=>cue.classList.remove("show"),1100);
}
function playSound(kind="ui"){audioService.play(kind)}
function combatDelay(milliseconds){return Math.max(40,Math.round(milliseconds/(loadSettings().combatPace||1)))}
function combatFeedback(kind){
  const field=$(".battlefield");if(!field)return;const settings=loadSettings(),classes=["feedback-hit","feedback-hero","feedback-break","feedback-boss","feedback-victory","screen-shake"];classes.forEach(name=>field.classList.remove(name));void field.offsetWidth;
  const mapped={hit:"feedback-hit",hero:"feedback-hero",break:"feedback-break",boss:"feedback-boss",victory:"feedback-victory"}[kind];if(mapped)field.classList.add(mapped);if(settings.screenShake&&!settings.reducedMotion&&["hero","break","boss"].includes(kind))field.classList.add("screen-shake");setTimeout(()=>classes.forEach(name=>field.classList.remove(name)),settings.reducedMotion?20:650);
}
function renderLegacyLabel(){const meta=loadMeta(),label=$("#legacy-label");if(label)label.textContent=`${meta.embers} braises · ${meta.wins} victoire${meta.wins>1?"s":""}`}
function generateRoute(seed,nodes=regionOneNodes){
  return MAP_SYSTEM.generateRoute(seed,nodes,seededStep);
}
function nemesisPick(entries,seed,salt){return GAME_RULES.deterministicStock(entries,(seed^salt)>>>0,1)[0]}
function buildNemesis(seed,region=1){
  const data=GAME_DATA.nemesis,name=nemesisPick(data.names,seed,0xA51),title=nemesisPick(data.titles,seed,0xB72),baseKey=nemesisPick(data.bases[region],seed,0xC93),trait=nemesisPick(data.traits.map(entry=>entry.id),seed,0xDB4);
  return {name:`${name}, ${title}`,baseKey,rank:1,region,traits:[trait],encounters:0,victories:0,alive:true,defeated:false,lastResult:"Sa trace vient d'apparaître sur la Route."};
}
function applySanctuaryPreparation(next,meta){
  const preparation=GAME_DATA.sanctuary.preparations.find(entry=>entry.id===meta.preparation);if(!preparation)return;
  const level=meta.buildings[preparation.building]||0;next.run.sanctuaryPreparation=preparation.id;
  if(preparation.id==="forge_kit")next.resources.iron+=level>=3?8:5;
  if(preparation.id==="memory_seal")next.xp+=level>=3?90:60;
  if(preparation.id==="distilled_flask")next.potions+=level>=3?2:1;
  if(preparation.id==="merchant_route")next.gold+=level>=3?70:40;
}
function newState(h){
  const inputSeed=Number.parseInt($("#run-seed")?.value,10),seed=Number.isFinite(inputSeed)?inputSeed>>>0:seedValue(),active=GAME_DATA.abilities[h.id][0].id,passive=GAME_DATA.passives[h.id][0].id,meta=loadMeta(),baseRules=GAME_RULES.difficultyRules(selectedDifficulty),ascension=selectedAscension,rules={...baseRules,enemyHp:baseRules.enemyHp*(1+ascension*.045),enemyDamage:baseRules.enemyDamage*(1+ascension*.035),rewards:baseRules.rewards*(1+ascension*.025)},fragile=selectedModifier==="fragile";
  const run={startedAt:Date.now(),difficulty:selectedDifficulty,modifier:selectedModifier,ascension,daily:dailyMode,damageDealt:0,damageTaken:0,bossesDefeated:0,bossTrophies:[],optionalCleared:0,postureBreaks:0,guards:0,wavesCleared:0,hazardsTriggered:0};
  const next={version:SAVE_SYSTEM.CURRENT_VERSION,seed,rngState:seed,currentRegion:1,classId:h.id,level:1,xp:0,xpNext:xpForLevel(1),maxHp:Math.round(h.hp*(fragile?0.8:1)),hp:Math.round(h.hp*(fragile?0.8:1)),maxEnergy:h.energy,energy:h.energy,gold:0,potions:1+(meta.unlocks.includes("flask")?1:0),resources:Object.fromEntries(GAME_DATA.resources.map(r=>[r.id,0])),mapIndex:0,run,rules,
    route:generateRoute(seed),cleared:[0],statBonuses:{Force:0,Agilité:0,Vitalité:0,Esprit:0},inventory:[],equipped:{Arme:null,Armure:null,Bijou:null},recipes:[],merchantStock:null,discoveries:{items:[],enemies:[],lore:["prologue"]},narrative:{reputation:{veilleurs:0,archivistes:0,sansOmbre:0},flags:[],questItems:[],decisions:[]},companions:{unlocked:["ilyra"],active:"ilyra",trust:{ilyra:0},equipment:{},milestones:{},relation:{},quests:{},dialogues:{},departed:[]},contracts:{offers:{},active:null,progress:0,completed:[],claimed:[]},nemesis:buildNemesis(seed),camp:{visits:0,buff:null,conversations:[],history:[]},campaign:{finalChoice:null,ending:null,completed:false,mapsExpanded:true},tutorial:{seen:[],enabled:true},learnedAbilities:[active],equippedAbilities:[active],abilityRanks:{[active]:1},abilityVariants:{},learnedPassives:[passive],equippedPassives:[passive],specializations:[],masteryNodes:[],buildPresets:[null,null,null],battlesWon:0};
  if(meta.unlocks.includes("scavenger")){next.resources.iron=4;next.resources.ember=2}
  if(meta.unlocks.includes("heirloom")){const starter={bastion:"iron_sword",traqueuse:"mist_dagger",arcaniste:"ember_staff",penitent:"soot_ring"}[h.id];const item=makeItem(starter);next.inventory.push(item);next.equipped[item.slot]=item}
  applySanctuaryPreparation(next,meta);
  return next;
}
function normalizeState(){
  if(!state)return;
  if(state.version!==SAVE_SYSTEM.CURRENT_VERSION){state.version=SAVE_SYSTEM.CURRENT_VERSION;state.seed||=seedValue();state.rngState||=state.seed;state.currentRegion||=1;state.route=generateRoute(state.seed,state.currentRegion===4?regionFourNodes:state.currentRegion===3?regionThreeNodes:state.currentRegion===2?regionTwoNodes:regionOneNodes)}
  state.seed ||= seedValue();state.rngState ||= state.seed;
  const firstActive=GAME_DATA.abilities[state.classId]?.[0]?.id,firstPassive=GAME_DATA.passives[state.classId]?.[0]?.id;
  state.learnedAbilities ||= [firstActive];state.equippedAbilities ||= [firstActive];state.learnedPassives ||= [firstPassive];state.equippedPassives ||= state.learnedPassives.slice(0,6);state.specializations ||= [];state.abilityVariants ||= {};state.masteryNodes||=[];state.buildPresets||=[null,null,null];
  state.abilityRanks ||= Object.fromEntries(state.learnedAbilities.map(id=>[id,1]));
  state.resources ||= {};GAME_DATA.resources.forEach(resource=>state.resources[resource.id]??=0);
  state.level=Math.min(GAME_DATA.progression.maxLevel,state.level||1);state.xpNext=state.level>=GAME_DATA.progression.maxLevel?0:xpForLevel(state.level);
  state.route ||= generateRoute(state.seed); state.cleared ||= [0]; state.statBonuses ||= {Force:0,Agilité:0,Vitalité:0,Esprit:0};
  state.inventory ||= []; state.equipped ||= {Arme:null,Armure:null,Bijou:null};state.recipes||=[];state.merchantStock??=null;state.discoveries||={};state.discoveries.items||=[];state.discoveries.enemies||=[];state.discoveries.lore||=["prologue"]; state.battlesWon ||= 0;
  state.narrative||={};state.narrative.reputation||={veilleurs:0,archivistes:0,sansOmbre:0};state.narrative.flags||=[];state.narrative.questItems||=[];state.narrative.decisions||=[];
  state.companions||={unlocked:["ilyra"],active:"ilyra",trust:{ilyra:0},equipment:{}};state.companions.unlocked||=["ilyra"];state.companions.trust||={};state.companions.equipment||={};state.companions.milestones||={};state.companions.relation||={};state.companions.quests||={};state.companions.dialogues||={};state.companions.departed||=[];
  state.contracts||={offers:{},active:null,progress:0,completed:[],claimed:[]};state.contracts.offers||={};state.contracts.completed||=[];state.contracts.claimed||=[];state.contracts.progress||=0;
  state.nemesis||=buildNemesis(state.seed,state.currentRegion);state.nemesis.traits||=[];state.nemesis.encounters||=0;state.nemesis.victories||=0;state.nemesis.alive??=true;state.nemesis.defeated??=false;
  state.camp||={visits:0,buff:null,conversations:[],history:[]};state.camp.visits||=0;state.camp.buff??=null;state.camp.conversations||=[];state.camp.history||=[];
  state.campaign||={finalChoice:null,ending:null,completed:false,mapsExpanded:true};state.campaign.finalChoice??=null;state.campaign.ending??=null;state.campaign.completed??=false;state.campaign.mapsExpanded=true;
  state.tutorial||={seen:[],enabled:true};state.tutorial.seen||=[];state.tutorial.enabled??=true;
  state.run ||= {startedAt:Date.now(),difficulty:"normal",modifier:"none",damageDealt:0,damageTaken:0,bossesDefeated:0,optionalCleared:0};state.run.bossTrophies||=[];state.run.wavesCleared??=0;state.run.hazardsTriggered??=0;state.rules ||= GAME_RULES.difficultyRules(state.run.difficulty);
  state.inventory.forEach((item,index)=>{item.uid||=`legacy-${item.id||item.name}-${index}`;item.level||=1;item.color||=rarityInfo(item.rarity)?.color||"blanc";item.baseStats||=clone(itemCatalog[item.id]?.stats||item.stats||{});item.rune??=null;item.setId||=Object.entries(buildData.sets).find(([,set])=>set.items.includes(item.id))?.[0]});
  Object.entries(state.equipped).forEach(([slot,item])=>{if(item&&!item.uid){const match=state.inventory.find(candidate=>candidate.id===item.id||candidate.name===item.name);state.equipped[slot]=match||item}});
  state.mapIndex=Math.min(state.mapIndex||0,activeMapNodes().length-1); delete state.battleWon;
  syncLevelUnlocks(state.level);
}
const xpForLevel=GAME_RULES.xpForLevel;
function syncLevelUnlocks(level,gain=null){
  const abilities=GAME_DATA.abilities[state.classId]||[],passives=GAME_DATA.passives[state.classId]||[];
  abilities.forEach((ability,index)=>{if(GAME_DATA.progression.abilityLevels[index]<=level&&!state.learnedAbilities.includes(ability.id)){state.learnedAbilities.push(ability.id);state.abilityRanks[ability.id]=1;if(state.equippedAbilities.length<4)state.equippedAbilities.push(ability.id);gain?.abilities.push(ability.name)}});
  passives.forEach((passive,index)=>{if(GAME_DATA.progression.passiveLevels[index]<=level&&!state.learnedPassives.includes(passive.id)){state.learnedPassives.push(passive.id);if(state.equippedPassives.length<6)state.equippedPassives.push(passive.id);gain?.passives.push(passive.name)}});
}
function hero(){return classes.find(c=>c.id===state?.classId)||classes[0];}
function learnedPassiveObjects(){return (state.equippedPassives||[]).map(id=>passiveCatalog[id]).filter(Boolean)}
function specializationObjects(){return (state.specializations||[]).map(id=>Object.values(buildData.specializations[state.classId]||{}).flat().find(spec=>spec.id===id)).filter(Boolean)}
function masteryObjects(){return (state.masteryNodes||[]).map(id=>(buildData.masteries[state.classId]||[]).find(node=>node.id===id)).filter(Boolean)}
function artifactEffect(item){return item&&item.rarity==="légendaire"?buildData.artifactEffects?.[item.id]:null}
function equippedArtifactEffects(){return Object.values(state.equipped||{}).map(artifactEffect).filter(Boolean)}
function buildSources(){return [...specializationObjects(),...masteryObjects(),...equippedArtifactEffects()]}
function abilityEvolution(ability){const variant=state.abilityVariants[ability?.id];return buildData.abilityEvolutions?.[state.classId]?.[variant]||null}
function activeSetBonuses(){return GAME_RULES.resolveSetBonuses(Object.values(state.equipped).filter(Boolean).map(item=>item.setId).filter(Boolean),buildData.sets)}
function buildStats(){const total={Force:0,Agilité:0,Vitalité:0,Esprit:0};[...buildSources(),...activeSetBonuses()].forEach(source=>Object.entries(source.stats||{}).forEach(([key,value])=>total[key]+=value));return total}
function passiveStats(){
  const total={Force:0,Agilité:0,Vitalité:0,Esprit:0};
  learnedPassiveObjects().forEach(passive=>Object.entries(passive.stats||{}).forEach(([key,value])=>total[key]+=value));return total;
}
function gearStats(){
  const total={Force:0,Agilité:0,Vitalité:0,Esprit:0};
  Object.values(state.equipped).filter(Boolean).forEach(item=>Object.entries(item.stats||{}).forEach(([k,v])=>total[k]+=Math.ceil(v*(1+((item.level||1)-1)*.25))));
  return total;
}
function effectiveStats(){
  const gear=gearStats(),passives=passiveStats(),build=buildStats(),h=hero(),result={};
  Object.keys(h.stats).forEach(k=>result[k]=(h.stats[k]||0)+(state.statBonuses[k]||0)+(gear[k]||0)+(passives[k]||0)+(build[k]||0));
  return result;
}
function buildBonus(key){return buildSources().reduce((sum,source)=>sum+(source[key]||0),0)}
function maxPlayerHp(){return state.maxHp+gearStats().Vitalité*5+learnedPassiveObjects().reduce((sum,p)=>sum+(p.maxHp||0),0)+buildBonus("maxHp")+activeSetBonuses().reduce((sum,s)=>sum+(s.maxHp||0),0)}
function maxPlayerEnergy(){return state.maxEnergy+Math.floor(gearStats().Esprit/3)+learnedPassiveObjects().reduce((sum,p)=>sum+(p.maxEnergy||0),0)+buildBonus("maxEnergy")+activeSetBonuses().reduce((sum,s)=>sum+(s.maxEnergy||0),0)}
function healingMultiplier(){return state.run?.modifier==="scarcity"?0.65:1}
function fullRest(){state.hp=Math.min(maxPlayerHp(),state.hp+Math.ceil((maxPlayerHp()-state.hp)*healingMultiplier()));state.energy=maxPlayerEnergy()}
function playerDamage(){const s=effectiveStats(),desperate=hero().id==="penitent"&&state.hp/maxPlayerHp()<.4?1.25+buildBonus("lowHpDamage"):1;return Math.floor((hero().damage+Math.floor(s.Force*.6)+Math.floor((state.level-1)*1.5))*(desperate+buildBonus("damageBonus")));}
function critChance(){const combo=combat?.classResource?.id==="combo"?combat.classResource.value*.025:0;return Math.min(.6,.05+effectiveStats().Agilité*.012+buildBonus("critBonus")+combo)}
function abilityCost(ability,rank=1){return Math.max(1,ability.cost-(rank>=3?1:0)-(abilityEvolution(ability)?.costReduction||0)-buildBonus("costReduction"))}
function abilityVariantMultiplier(ability){return abilityEvolution(ability)?.damage||1}
function abilityDamageBreakdown(ability,rank=1){
  const stats=effectiveStats(),profile=abilityEvolution(ability),evolution=abilityVariantMultiplier(ability),build=1+buildBonus("abilityDamage")+(ability?.hpCost?buildBonus("sacrificeBonus")+(profile?.sacrificeBonus||0):0),resource=combat?classResourceMultiplier(true):1;
  return GAME_RULES.damageBreakdown({power:ability.power,stat:stats[ability.scaling],ratio:ability.ratio,level:state.level,rank,evolution,build,resource});
}
function rollPlayerDamage(base){const critical=random()<critChance();return {damage:critical?Math.floor(base*1.6):base,critical}}
const activeSlot=saveSlots.activeSlot;
const slotKey=saveSlots.slotKey;
const backupSlotKey=saveSlots.backupKey;
function save(){
  if(state){syncEquipmentProjection(state);saveSlots.persist(state)}updateContinue();
}
function load(){
  const restored=saveSlots.restore();state=restored.state;if(restored.recovered)toast("Sauvegarde principale réparée depuis la copie de secours.");
  if(!state)return false;normalizeState();return true;
}
function showScreen(id){currentScreen=id;$$(".screen").forEach(s=>s.classList.toggle("active",s.id===id));closeOverlay();if(id==="exploration"){renderMap();updateHud()}if(id==="class-select")renderExpeditionSetup();if(id==="main-menu")renderLegacyLabel();setAudioScene(currentAudioScene());window.scrollTo(0,0)}
function updateContinue(){const raw=localStorage.getItem(slotKey());$("#continue-button").disabled=!raw;if(!raw){$("#save-label").textContent=`Emplacement ${activeSlot()} · vide`;return}const saved=SAVE_SYSTEM.safeParse(raw);$("#save-label").textContent=saved?`Emplacement ${activeSlot()} · Niv. ${saved.level||1} · Région ${saved.currentRegion||1}`:"Sauvegarde à réparer"}

function renderCards(){
  $("#class-cards").innerHTML=classes.map((h,i)=>`<button class="class-card ${i===selectedIndex?"selected":""}" data-index="${i}" style="--art:${h.art};--tilt:${h.tilt};color:${h.color}"><div class="class-art"></div><div class="class-info"><span class="roman">0${i+1}</span><h3>${h.name}</h3><p>${h.subtitle}</p></div></button>`).join("");
  $$(".class-card").forEach(c=>c.onclick=()=>selectClass(+c.dataset.index));
}
function renderDetails(){
  const h=classes[selectedIndex];$("#class-details").innerHTML=safeHtml`<span class="role">${h.role}</span><h3>${h.name}</h3><div class="lore">« ${h.lore} »</div><div class="playstyle"><strong>Style de jeu</strong><span>${h.playstyle}</span></div><div class="talent"><strong>Talent — ${h.talent}</strong><span>${h.talentText}</span></div><div class="stats">${Object.entries(h.stats).map(([n,v])=>`<div class="stat"><span>${n.slice(0,3)}</span><i style="--value:${v*10}%"></i><b>${v}</b></div>`).join("")}</div>`;
}
function selectClass(i){selectedIndex=(i+classes.length)%classes.length;renderCards();renderDetails()}
function startGame(){state=newState(classes[selectedIndex]);save();endingMode=false;slideDeck=prologueSlides;slideIndex=0;showScreen("prologue");renderSlide()}
function renderExpeditionSetup(){
  const seedInput=$("#run-seed");if(seedInput&&!seedInput.value)seedInput.value=seedValue();
  $("#difficulty-options").innerHTML=safeHtml`<small>DIFFICULTÉ</small>${Object.entries(difficulties).map(([id,d])=>`<button data-difficulty="${id}" class="${id===selectedDifficulty?"selected":""}"><b>${d.name}</b><span>${d.description}</span></button>`).join("")}`;
  $("#modifier-options").innerHTML=safeHtml`<small>SERMENT D'EXPÉDITION</small>${Object.entries(modifiers).map(([id,m])=>`<button data-modifier="${id}" class="${id===selectedModifier?"selected":""}"><b>${m.name}</b><span>${m.description}</span></button>`).join("")}`;
  const maxAscension=loadMeta().ascensionUnlocked;$("#ascension-options").innerHTML=safeHtml`<small>ASCENSION</small>${Array.from({length:maxAscension+1},(_,level)=>`<button data-ascension="${level}" class="${level===selectedAscension?"selected":""}"><b>${level===0?"Standard":`Ascension ${level}`}</b><span>${level===0?"Règles normales":`Ennemis +${level*4}% · récompenses +${Math.round(level*2.5)}%`}</span></button>`).join("")}`;
}
function renderSlide(){
  const slide=slideDeck[slideIndex];$("#prologue-number").textContent=slide.roman;$("#prologue-kicker").textContent=slide.kicker;$("#prologue-title").textContent=slide.title;$("#prologue-copy").textContent=slide.copy;
  $("#prologue-art").className=`prologue-art ${slide.art}`;$("#prologue-dots").innerHTML=slideDeck.map((_,i)=>`<i class="${i===slideIndex?"active":i<slideIndex?"read":""}"></i>`).join("");
  $("#prologue-next").textContent=slideIndex===slideDeck.length-1?(endingMode?"Achever le voyage":slideDeck===regionFourSlides?"Entrer dans le Brasier":slideDeck===regionThreeSlides?"Descendre sous la Cendre":slideDeck===regionTwoSlides?"Franchir le Voile":"Prendre la route"):"Continuer";
  $(".prologue-skip").textContent=endingMode?"Passer l'épilogue":"Passer le prologue";
}
function nextSlide(){
  if(slideIndex<slideDeck.length-1){slideIndex++;renderSlide()}else finishPrologue();
}
function finishPrologue(){
  if(endingMode){endingMode=false;endExpedition(true);return}
  if(slideDeck===regionFourSlides){state.regionThree={route:state.route,cleared:state.cleared,mapIndex:state.mapIndex};state.currentRegion=4;state.route=generateRoute((state.seed^0xF1A57E)>>>0,regionFourNodes);state.cleared=[0];state.mapIndex=0;state.regionFourStarted=true;if(state.nemesis?.alive)state.nemesis.region=4;state.hp=maxPlayerHp();state.energy=maxPlayerEnergy();save();showScreen("exploration");toast("Le Brasier Originel reconnaît votre présence.");return}
  if(slideDeck===regionThreeSlides){state.regionTwo={route:state.route,cleared:state.cleared,mapIndex:state.mapIndex};state.currentRegion=3;state.route=generateRoute((state.seed^0xC1A0F3)>>>0,regionThreeNodes);state.cleared=[0];state.mapIndex=0;state.regionThreeStarted=true;if(!state.companions.unlocked.includes("nox"))state.companions.unlocked.push("nox");state.companions.trust.nox??=0;if(state.nemesis?.alive)state.nemesis.region=3;state.hp=maxPlayerHp();state.energy=maxPlayerEnergy();save();showScreen("exploration");toast("Nox, le Masque brisé, rejoint votre route.");return}
  if(slideDeck===regionTwoSlides){state.regionOne={route:state.route,cleared:state.cleared,mapIndex:state.mapIndex};state.currentRegion=2;state.route=generateRoute((state.seed^0xA57E2A)>>>0,regionTwoNodes);state.cleared=[0];state.mapIndex=0;state.regionTwoStarted=true;if(!state.companions.unlocked.includes("orven"))state.companions.unlocked.push("orven");state.companions.trust.orven??=0;if(state.nemesis?.alive)state.nemesis.region=2;state.hp=maxPlayerHp();state.energy=maxPlayerEnergy();save();showScreen("exploration");toast("Orven sans Ombre rejoint votre route.");return}
  state.prologueSeen=true;save();showScreen("exploration");toast("La Route des Cendres s'ouvre devant vous.");setTimeout(()=>showGuide("exploration"),250);
}
function startRegionTwo(){endingMode=false;slideDeck=regionTwoSlides;slideIndex=0;showScreen("prologue");renderSlide()}
function startRegionThree(){endingMode=false;slideDeck=regionThreeSlides;slideIndex=0;showScreen("prologue");renderSlide()}
function startRegionFour(){endingMode=false;slideDeck=regionFourSlides;slideIndex=0;showScreen("prologue");renderSlide()}
function showGuide(id){
  if(!state?.tutorial?.enabled||state.tutorial.seen.includes(id)||!guideBook[id])return false;const guide=guideBook[id];state.tutorial.seen.push(id);save();$("#guide-step").textContent=`APPRENTISSAGE · ${state.tutorial.seen.length}/${Object.keys(guideBook).length}`;$("#guide-icon").textContent=guide.icon;$("#guide-title").textContent=guide.title;$("#guide-copy").textContent=guide.copy;openPanel("guide");return true;
}

function nodeType(i){return state.route[i]||activeMapNodes()[i].type}
function nodeLabel(node,i){
  if(state.cleared.includes(i)||i<=state.mapIndex+1)return nodeEvents[nodeType(i)]?.name||node.label;
  return "Destination inconnue";
}
function recommendedLevel(index){
  const node=activeMapNodes()[index];
  return GAME_RULES.recommendedLevel(state.currentRegion,index,!!node.optional,node.tier||0);
}
function renderMap(){
  const nodes=activeMapNodes(),meta=regionMeta(),mainTotal=nodes.filter(node=>!node.optional).length-1,mainCleared=Math.max(0,state.cleared.filter(i=>!nodes[i]?.optional).length-1),optionalCleared=state.cleared.filter(i=>nodes[i]?.optional).length;
  const cartographer=loadMeta().unlocks.includes("cartographer");
  const visibleNode=i=>cartographer||state.cleared.includes(i)||i===state.mapIndex||nodes[state.mapIndex].edges.includes(i);
  const connectors=nodes.flatMap((n,i)=>n.edges.filter(j=>j>i).map(j=>{const target=nodes[j],dx=target.x-n.x,dy=target.y-n.y,length=Math.sqrt(dx*dx+dy*dy),angle=Math.atan2(dy,dx)*180/Math.PI,traveled=state.cleared.includes(i)&&state.cleared.includes(j),hidden=!visibleNode(i)&&!visibleNode(j);return `<i class="map-link ${n.optional||target.optional?"optional-link":""} ${traveled?"traveled":""} ${hidden?"distant":""}" style="left:${n.x}%;top:${n.y}%;width:${length}%;transform:rotate(${angle}deg)"></i>`})).join("");
  const map=$("#map"),expanded=state.currentRegion<=3,pan=expanded?GAME_RULES.clamp(48/1.55-nodes[state.mapIndex].x,-35.48,0):0;
  map.classList.toggle("expanded",expanded);map.style.setProperty("--map-pan",`${pan}%`);
  map.innerHTML=safeHtml`${connectors}${nodes.map((n,i)=>{const type=nodeType(i),known=visibleNode(i),label=known?nodeLabel(n,i):"Destination inconnue";return `<button class="map-node ${type} ${known?"":"unknown"} ${n.optional?"optional":""} ${n.depth===2?"depth-two":""} ${state.cleared.includes(i)?"done":""} ${i===state.mapIndex?"current":""} ${nodes[state.mapIndex].edges.includes(i)?"available":""}" data-node="${i}" style="left:${n.x}%;top:${n.y}%" aria-label="${label}" title="${label}"><i>${known?nodeIcon(type):"?"}</i>${known?`<span>${label}<small>NIV. CONSEILLÉ ${recommendedLevel(i)}${n.depth===2?" · ABÎME":n.optional?" · OPTIONNEL":""}</small></span>`:""}</button>`}).join("")}<div class="player-token" style="left:${nodes[state.mapIndex].x}%;top:${nodes[state.mapIndex].y}%"><b>♙</b></div>`;
  $$(".map-node").forEach(n=>n.onclick=()=>movePlayerTo(+n.dataset.node));
  $("#quest-progress").style.width=`${mainCleared/mainTotal*100}%`;$("#quest-count").textContent=`${mainCleared} / ${mainTotal} étapes · ${optionalCleared}/${meta.optionalCount} détours`;
  $(".quest-panel h3").textContent=state.currentRegion===4?"Le Premier Serment":state.currentRegion===3?"La Couronne ensevelie":state.currentRegion===2?"Les étoiles sous le monde":"Les ruines silencieuses";$("#map").setAttribute("aria-label",`Carte de ${meta.name}`);
  $("#quest-text").textContent=state.currentRegion===4?(mainCleared>=8?"Le Maître attend devant le feu où votre serment fut prononcé.":mainCleared>=5?"Le Cycle conserve les traces de chacune de vos anciennes défaites.":"Cette route n'existe que dans les souvenirs que le monde a perdus."):state.currentRegion===3?(mainCleared>=18?"La véritable Couronne parle enfin avec la voix du Revenant.":mainCleared>=14?"La première manifestation n'était qu'un reflet dressé devant le royaume.":mainCleared>=8?"Votre ancienne chambre se trouve au-dessus du palais.":"Les habitants du royaume attendaient votre retour."):state.currentRegion===2?(mainCleared>=18?"Au cœur du Puits, Asterion n'a plus de reflet derrière lequel se cacher.":mainCleared>=14?"Le Gardien vaincu protégeait une descente plus ancienne encore.":mainCleared>=9?"Le Premier Ciel protège la dernière descente.":"Les reflets de cette terre semblent vous reconnaître."):(mainCleared>=20?"Vharos s'est délié du trône. La véritable bataille commence.":mainCleared>=16?"Le trône n'était qu'un sceau posé sur une présence plus vaste.":"Cendrebourg permet d'améliorer et de vendre votre équipement.");
  $("#map-message strong").textContent=state.currentRegion===4?(mainCleared>=8?"Affrontez le Maître des Cendres":mainCleared>=5?"Traversez le Cœur du Cycle":"Suivez la dernière route"):state.currentRegion===3?(mainCleared>=18?"Brisez la Manifestation couronnée":mainCleared>=14?"Poursuivez au-delà de la Couronne":"Explorez la capitale ensevelie"):state.currentRegion===2?(mainCleared>=18?"Descendez dans le Noyau du Puits":mainCleared>=14?"Traversez le ciel englouti":"Traversez les terres au-delà du Voile"):(mainCleared>=20?"Affrontez Vharos délié":mainCleared>=16?"Poursuivez au-delà du trône":"Choisissez votre route");
  $(".location small").textContent=meta.chapter;$(".location strong").textContent=meta.name;
  const canTransition=(state.currentRegion===1&&state.completedRegion1)||(state.currentRegion===2&&state.completedRegion2)||(state.currentRegion===3&&state.completedRegion3);$("#region-transition").classList.toggle("visible",canTransition);$("#region-transition b").textContent=state.currentRegion===3?"Suivre le Premier Souvenir":state.currentRegion===2?"Descendre sous la Cendre":"Franchir le Voile";$("#region-transition small").textContent=state.currentRegion===3?"Entrer dans le chapitre final":state.currentRegion===2?"Continuer vers la troisième région":"Continuer vers la deuxième région";
  $("#exploration").classList.toggle("region-two",state.currentRegion===2);
  $("#exploration").classList.toggle("region-three",state.currentRegion===3);
  $("#exploration").classList.toggle("region-four",state.currentRegion===4);
}
function movePlayerTo(index){
  if(index===state.mapIndex){const type=nodeType(index);if(!state.cleared.includes(index))resolveNode(index);else if(type==="town")openForge();else if(["camp","rest","r1refuge","r2moonrest","r3refuge","r3lastrefuge","r4refuge"].includes(type))openCamp();else toast("Vous êtes déjà à cet endroit.");return}
  if(!activeMapNodes()[state.mapIndex].edges.includes(index)){if(index!==state.mapIndex)toast("Cette destination n'est pas reliée à votre position.");return}
  if(!state.cleared.includes(state.mapIndex)){toast("Vous devez terminer cet événement.");return}
  state.mapIndex=index;save();renderMap();setTimeout(()=>resolveNode(index),450);
}
function resolveNode(index){
  const type=nodeType(index);
  if(type==="town"){clearCurrentNode();save();openForge();return}
  if(state.cleared.includes(index)){resolveRevisit(index);return}
  if(type==="tutorial")startCombat(["scout"],{tutorial:true,xp:70,gold:15});
  else if(type==="duo")startCombat(["hound","cultist"],{title:"La Meute des Cendres",xp:120,gold:30});
  else if(type==="encounter"){const pool=state.currentRegion===2?["root","mirror","leech","pilgrim","shadowless","moth","inverted","mimic","nameEater","skyGrave"]:["scout","hound","cultist","brute","widow","singer","remnant","thief","faceless"];startCombat([rand(pool)],{title:"Rencontre sauvage",difficulty:state.currentRegion===2?1:0})}
  else if(type==="elite"){const tier=activeMapNodes()[index].tier;startCombat(tier>=3?[rand(["warden","knight"]),rand(["cultist","widow","singer"])]:[rand(["warden","knight"])],{title:`Défi optionnel · Rang ${tier}`,elite:true,xp:110+tier*35,gold:25+tier*12,rewardItem:makeItem(eliteLoot[(tier-1)%eliteLoot.length])})}
  else if(type==="abyss"){const tier=activeMapNodes()[index].tier,groups={5:["knight","oracle","faceless"],6:["giant","singer","remnant"],7:["echo","knight","oracle"]};startCombat(groups[tier],{title:`Épreuve abyssale · Rang ${tier}`,elite:true,abyss:true,difficulty:tier-4,xp:230+(tier-5)*65,gold:70+(tier-5)*25,rewardItem:makeItem(artifactLoot[(tier-5)%artifactLoot.length])})}
  else if(type==="story")openEvent("story");
  else if(type==="gauntlet")startCombat(["warden"],{title:"La Sentinelle du seuil",waves:[["hound","cultist"]],difficulty:2,xp:210,gold:58});
  else if(type==="gate")openEvent("gate");
  else if(type==="mine")openEvent("mine");
  else if(type==="arsenal")startCombat(["knight","remnant"],{title:"Les Gardiens de l'Arsenal",elite:true,xp:190,gold:48,rewardItem:makeItem("sunken_bulwark")});
  else if(type==="loot")openEvent("loot");
  else if(type==="shrine")openEvent("shrine");
  else if(type==="rest")openCamp();
  else if(type==="boss")startCombat(["ashLord"],{title:"Vharos · Émissaire du Trône",boss:true,difficulty:2,xp:300,gold:95,rewardItem:makeItem("forgotten_mail")});
  else if(type==="r1march")startCombat(["banneret","scout"],{title:"La Marche des Bannières",difficulty:2,xp:260,gold:68});
  else if(type==="r1refuge")openCamp();
  else if(type==="r1memory")openEvent("r1memory");
  else if(type==="r1siege")startCombat(["banneret","warden"],{title:"Le Siège de la Brèche",waves:[["oracle","giant"]],elite:true,difficulty:3,xp:520,gold:145,rewardItem:makeItem("first_flame")});
  else if(type==="r1detour"){const tier=activeMapNodes()[index].tier,groups={8:["banneret","knight","widow"],9:["giant","banneret","oracle"],10:["echo","giant","oracle"]},rewards={8:"exile_blade",9:"silent_bell",10:"road_end"};startCombat(groups[tier],{title:`Vestige de la Brèche · Rang ${tier}`,elite:true,abyss:tier===10,difficulty:4,xp:420+(tier-8)*90,gold:110+(tier-8)*35,rewardItem:makeItem(rewards[tier])})}
  else if(type==="r1finalboss")startCombat(["vharosUnbound"],{title:"Vharos · Délié du Trône",boss:true,regionEnd:1,difficulty:4,xp:520,gold:165,rewardItem:makeItem("ash_crown")});
  else if(type==="r2entry")openEvent("r2entry");
  else if(type==="r2story")openEvent("r2story");
  else if(type==="r2battle")startCombat(["root","mirror"],{title:"Les Reflets affamés",difficulty:1,xp:220,gold:55});
  else if(type==="r2village")openEvent("r2village");
  else if(type==="r2gauntlet")startCombat(["glass","pilgrim"],{title:"La Tour de la Veille",waves:[["leech","shadowless"]],elite:true,difficulty:2,xp:420,gold:112,rewardItem:makeItem("star_rod")});
  else if(type==="r2library")openEvent("r2library");
  else if(type==="r2bridge")startCombat(["inverted","moth"],{title:"Le Pont des constellations",difficulty:2,xp:370,gold:92,rewardItem:makeItem("archive_key")});
  else if(type==="r2city")openEvent("r2city");
  else if(type==="r2heart")startCombat(["magistrate","astronomer","mimic"],{title:"Le Cœur du Miroir",elite:true,difficulty:3,xp:540,gold:145,rewardItem:makeItem("first_map")});
  else if(type==="r2sanctum")openEvent("r2sanctum");
  else if(type==="r2rift")startCombat(["nameEater","skyGrave"],{title:"La Faille ascendante",elite:true,difficulty:3,xp:590,gold:155,rewardItem:makeItem("ascendant_mail")});
  else if(type==="r2forge")openEvent("r2forge");
  else if(type==="r2threshold")startCombat(["starSmith","worldEye"],{title:"Les Gardiens du Premier Ciel",elite:true,difficulty:4,xp:720,gold:190,rewardItem:makeItem("first_sky_robe")});
  else if(type==="r2elite"){const tier=activeMapNodes()[index].tier,groups={8:["root","glass","mirror"],9:["shadowless","leech","pilgrim"],10:["moth","harvester","inverted"],11:["magistrate","astronomer","mimic"],12:["skyGrave","nameEater","astronomer"],13:["voidBeast","mimic","leech"],14:["worldEye","starSmith","voidBeast"]},rewards={8:"astral_shell",9:"moonless_edge",10:"keeper_hide",11:"broken_halo",12:"name_cleaver",13:"void_menagerie_hide",14:"comet_bow"};startCombat(groups[tier],{title:`Épreuve interdite · Rang ${tier}`,elite:true,abyss:true,difficulty:Math.min(4,tier-6),xp:390+(tier-8)*90,gold:105+(tier-8)*32,rewardItem:makeItem(rewards[tier])})}
  else if(type==="r2boss")startCombat(["veilKeeper"],{title:"Asterion · Reflet du Gardien",boss:true,bossMechanic:"asterion",difficulty:4,xp:720,gold:235,rewardItem:makeItem("veil_fragment")});
  else if(type==="r2shore")startCombat(["lunarMonk","worldEye"],{title:"Le Rivage au-dessus du ciel",difficulty:4,xp:690,gold:180});
  else if(type==="r2monastery")openEvent("r2monastery");
  else if(type==="r2aqueduct")startCombat(["lunarMonk","nameEater"],{title:"L'Aqueduc stellaire",waves:[["starSmith","worldEye"]],elite:true,difficulty:4,xp:960,gold:285,rewardItem:makeItem("dead_star_anvil")});
  else if(type==="r2moonrest")openCamp();
  else if(type==="r2detour"){const tier=activeMapNodes()[index].tier,groups={15:["lunarMonk","voidBeast","mimic"],16:["worldEye","skyGrave","lunarMonk"],17:["asterionEclipsed","lunarMonk"]},rewards={15:"upward_drop",16:"comet_bow",17:"well_scepter"};startCombat(groups[tier],{title:`Épreuve de l'Éclipse · Rang ${tier}`,elite:true,abyss:tier===17,difficulty:4,xp:760+(tier-15)*110,gold:220+(tier-15)*40,rewardItem:makeItem(rewards[tier])})}
  else if(type==="r2finalboss")startCombat(["asterionEclipsed"],{title:"Asterion · Cœur de l'Éclipse",boss:true,bossMechanic:"asterion",regionEnd:2,difficulty:4,xp:980,gold:330,rewardItem:makeItem("asterion_eye")});
  else if(type==="r3entry")openEvent("r3entry");
  else if(type==="r3refuge"){openCamp()}
  else if(type==="r3story")openEvent("r3story");
  else if(type==="r3battle"){const groups=[["legionary","wisp"],["gaoler","seraph"],["legionary","gaoler","wisp"]];startCombat(rand(groups),{title:"Les gardiens du Royaume",difficulty:4,xp:620,gold:145})}
  else if(type==="r3elite"){const groups=[["hollowKing","wisp"],["flameBeast","gaoler"],["archon","seraph","legionary"]];startCombat(rand(groups),{title:"Gardien de la Couronne",elite:true,difficulty:4,xp:820,gold:210})}
  else if(type==="r3threshold")startCombat(["ashPrince","archon"],{title:"Le Prince sous la Cendre",boss:true,difficulty:4,xp:950,gold:280});
  else if(type==="r3detour"){const tier=activeMapNodes()[index].tier,pool=[["hollowKing","gaoler","wisp"],["flameBeast","seraph"],["archon","legionary","seraph"]];startCombat(rand(pool),{title:`Secret royal · Rang ${tier}`,elite:true,abyss:true,difficulty:4,xp:760+(tier-15)*55,gold:190+(tier-15)*22})}
  else if(type==="r3boss")startCombat(["masterManifestation"],{title:"Le Reflet de la Couronne",boss:true,bossMechanic:"master",difficulty:4,xp:1160,gold:380});
  else if(type==="r3crownroad")startCombat(["royalMemory","hollowKing"],{title:"La Couronne fracturée",difficulty:4,xp:920,gold:255});
  else if(type==="r3council")openEvent("r3council");
  else if(type==="r3innerstairs")startCombat(["royalMemory","seraph"],{title:"L'Escalier du Dedans",waves:[["archon","royalMemory","hollowKing"]],elite:true,difficulty:4,xp:1320,gold:390,rewardItem:makeItem("road_end")});
  else if(type==="r3lastrefuge")openCamp();
  else if(type==="r3legacy"){const tier=activeMapNodes()[index].tier,groups={23:["royalMemory","flameBeast","wisp"],24:["hollowKing","royalMemory","archon"],25:["crownedManifestation","royalMemory"]};startCombat(groups[tier],{title:`Héritage du Revenant · Rang ${tier}`,elite:true,abyss:tier===25,difficulty:4,xp:1050+(tier-23)*140,gold:300+(tier-23)*55,rewardItem:makeItem(artifactLoot[(tier-23)%artifactLoot.length])})}
  else if(type==="r3finalboss")startCombat(["crownedManifestation"],{title:"La Manifestation couronnée",boss:true,bossMechanic:"master",regionEnd:3,difficulty:4,xp:1500,gold:500,rewardItem:makeItem("road_end")});
  else if(type==="r4entry")openEvent("r4entry");
  else if(type==="r4refuge")openCamp();
  else if(type==="r4story")openEvent("r4story");
  else if(type==="r4battle"){const groups=[["cycleHound","ashScribe"],["oathKeeper","namelessTwin"],["cycleHound","ashScribe","namelessTwin"]];startCombat(rand(groups),{title:"Les souvenirs qui refusent de mourir",difficulty:4,xp:880,gold:210})}
  else if(type==="r4elite"){startCombat(["firstWitness","oathKeeper"],{title:"Le Premier Témoin",elite:true,difficulty:4,xp:1180,gold:310,rewardItem:makeItem("last_guardian_mail")})}
  else if(type==="r4threshold")startCombat(["crownEater","ashScribe"],{title:"Le Témoin immobile",boss:true,difficulty:4,xp:1350,gold:370,rewardItem:makeItem("true_name_seal")});
  else if(type==="r4detour"){const tier=activeMapNodes()[index].tier,groups={23:["cycleHound","namelessTwin","ashScribe"],24:["oathKeeper","firstWitness"],25:["crownEater","namelessTwin"],26:["firstWitness","crownEater","ashScribe"]},rewards={23:"cycle_blade",24:"oath_armor",25:"memory_knot",26:"unwritten_weapon"};startCombat(groups[tier],{title:`Fin oubliée · Fragment ${tier-22}`,elite:true,abyss:true,difficulty:4,xp:980+(tier-23)*120,gold:250+(tier-23)*45,rewardItem:makeItem(rewards[tier])})}
  else if(type==="r4boss")startCombat(["trueMaster"],{title:"Le Maître des Cendres · Serment final",boss:true,bossMechanic:"trueMaster",regionEnd:4,difficulty:4,xp:1800,gold:600,rewardItem:makeItem("true_name_seal")});
}
function startRevisitCombat(difficult=false){
  if(random()<.05){startCombat(["wanderBoss"],{title:"Boss errant · Colosse des Cendres",elite:true,xp:185,gold:58,rewardItem:makeItem(rand(eliteLoot))});return}
  const pool=state.currentRegion===4?["cycleHound","ashScribe","oathKeeper","namelessTwin"]:state.currentRegion===3?["legionary","wisp","gaoler","seraph"]:state.currentRegion===2?["root","mirror","leech","pilgrim","shadowless","glass"]:["scout","hound","cultist","brute","widow","singer","remnant","thief","faceless"];
  startCombat(difficult?[rand(pool),rand(pool)]:[rand(pool)],{title:difficult?"Embuscade renforcée":"Nouvelle embuscade",elite:difficult});
}
function resolveRevisit(index){
  if(nodeType(index)==="town"){openForge();return}
  if(state.nemesis?.alive&&state.nemesis.region===state.currentRegion&&random()<.15){startNemesisHunt(true);return}
  const optional=!!activeMapNodes()[index].optional,roll=random();
  if(!optional){
    if(roll<.25)startRevisitCombat(false);
    else if(roll<.5)openEvent("resource");
    else if(roll<.75)openCamp();
    else toast("Le chemin reste silencieux. Vous ne croisez rien.");
    return;
  }
  if(roll<.1)startRevisitCombat(false);
  else if(roll<.2)openEvent("resource");
  else if(roll<.3)openCamp();
  else if(roll<.4)toast("Le détour paraît étrangement calme.");
  else if(roll<.7)startRevisitCombat(true);
  else openEvent(random()<.55?"loot":"salvage");
}
function keyboardMove(key){
  if(currentScreen!=="exploration"||$("#overlay").classList.contains("open"))return;
  const nodes=activeMapNodes(),links=nodes[state.mapIndex].edges;
  if(["ArrowRight","ArrowUp","d","D","z","Z"].includes(key))movePlayerTo(links.find(i=>i>state.mapIndex&&!nodes[i].optional)??links[0]);
  if(["ArrowLeft","ArrowDown","q","Q","s","S"].includes(key))movePlayerTo(links.find(i=>i<state.mapIndex)??links[0]);
}

function campConversationKey(){const companion=activeCompanion();return companion?`${companion.id}:r${state.currentRegion}`:null}
function renderCamp(){
  const companion=activeCompanion(),conversationKey=campConversationKey(),alreadyTalked=conversationKey&&state.camp.conversations.includes(conversationKey),activeBuff=GAME_DATA.camp.buffs[state.camp.buff];
  $("#camp-content").innerHTML=safeHtml`${activeBuff?`<div class="camp-preparation"><span>${activeBuff.icon}</span><div><small>PRÉPARATION DÉJÀ ACTIVE</small><b>${activeBuff.name}</b><p>${activeBuff.description}</p></div></div>`:""}<div class="camp-choice-grid">${GAME_DATA.camp.choices.map(choice=>{const affordable=!choice.cost||canAfford(choice.cost),blockedBuff=!!choice.buff&&!!state.camp.buff,blockedCompanion=choice.id==="companion"&&(!companion||alreadyTalked),disabled=!affordable||blockedBuff||blockedCompanion;let detail=choice.effect;if(choice.id==="companion")detail=!companion?"Aucun compagnon actif":alreadyTalked?"Conversation déjà partagée ici":`Avec ${companion.name}`;if(blockedBuff)detail="Utilisez d'abord votre préparation actuelle";return `<button data-camp-choice="${choice.id}" ${disabled?"disabled":""}><span>${choice.icon}</span><div><b>${choice.name}</b><p>${choice.description}</p><small>${detail}</small></div></button>`}).join("")}</div><small class="camp-rule">Une seule action sera réalisée avant de reprendre la Route.</small>`;
}
function openCamp(){pendingEvent={type:"camp"};renderCamp();openPanel("camp")}
function chooseCampAction(id){
  if(pendingEvent?.type!=="camp")return;const choice=GAME_DATA.camp.choices.find(entry=>entry.id===id),companion=activeCompanion(),conversationKey=campConversationKey();if(!choice||choice.cost&&!canAfford(choice.cost)||choice.buff&&state.camp.buff)return;
  if(id==="companion"&&(!companion||state.camp.conversations.includes(conversationKey)))return;
  for(const [resource,amount] of Object.entries(choice.cost||{}))state.resources[resource]-=amount;
  if(id==="rest"){state.hp=maxPlayerHp();state.energy=maxPlayerEnergy()}
  if(id==="brew")state.potions+=2;
  if(choice.buff)state.camp.buff=choice.buff;
  if(id==="companion"){state.companions.trust[companion.id]=Math.min(25,(state.companions.trust[companion.id]||0)+2);state.companions.relation[companion.id]=(state.companions.relation[companion.id]||0)+1;state.companions.dialogues[companion.id]="Le feu ne révèle rien. Pourtant, pour cette nuit, le silence suffit.";state.camp.conversations.push(conversationKey)}
  state.camp.visits++;state.camp.history.push({region:state.currentRegion,choice:id});clearCurrentNode();pendingEvent=null;save();closeOverlay();showScreen("exploration");toast(id==="rest"?"Vous repartez entièrement restauré.":id==="brew"?"Deux potions ont été distillées.":id==="companion"?`${companion.name} se rapproche du héros.`:`Préparation active : ${GAME_DATA.camp.buffs[choice.buff].name}.`);
}

function openEvent(type){
  pendingEvent={type};
  const narrativeEvent=GAME_DATA.narrative?.events?.[type];
  $("#event-choices").classList.add("hidden");$("#event-choices").innerHTML="";$('[data-action="event-claim"]').classList.remove("hidden");
  if(narrativeEvent){openNarrativeEvent(type,narrativeEvent);return}
  const data=nodeEvents[type]||{icon:"✦",name:"L'Ancien Autel",copy:"Le prologue s'achève ici. La suite de l'aventure sera bientôt révélée."};
  $("#event-eyebrow").textContent=type==="boss"?"Fin du prologue":"Découverte";$("#event-icon").textContent=data.icon;$("#event-title").textContent=data.name;$("#event-copy").textContent=data.copy;
  if(type==="loot"){const pool=GAME_DATA.items.filter(item=>["commun","rare"].includes(item.rarity)&&(state.currentRegion===2?item.region===2:!item.region)).map(item=>item.id);pendingEvent.item=makeItem(smartItemId(pool.length?pool:lootTable));$("#event-reward").innerHTML=safeHtml`<b>${itemDisplayName(pendingEvent.item)}</b><span>${pendingEvent.item.type} · ${pendingEvent.item.detail}</span>`}
  if(type==="shrine")$("#event-reward").innerHTML="<b>Vitalité +1</b><span>PV maximum +8</span>";
  if(type==="rest")$("#event-reward").innerHTML="<b>Repos réparateur</b><span>Restaure 40 % des PV et toute l'énergie</span>";
  if(type==="story")$("#event-reward").innerHTML="<b>Écho impossible</b><span>Vous gagnez 35 XP, mais aucune réponse.</span>";
  if(type==="gate")$("#event-reward").innerHTML="<b>Dernière préparation</b><span>Vos ressources sont restaurées avant le combat final.</span>";
  if(type==="mine"){pendingEvent.materials={iron:8,ember:3,essence:0};$("#event-reward").innerHTML="<b>Premiers matériaux</b><span>+8 Fer ancien · +3 Braises stables</span>"}
  if(type==="resource"){const material=rand(GAME_DATA.resources),amount=material.id==="iron"?3+Math.floor(random()*4):["ember","pale_fiber"].includes(material.id)?1+Math.floor(random()*3):1+Math.floor(random()*2);pendingEvent.material=material.id;pendingEvent.amount=amount;$("#event-icon").textContent=material.icon;$("#event-title").textContent=material.name;$("#event-reward").innerHTML=safeHtml`<b>Ressource de forge</b><span>+${amount} ${material.name}</span>`}
  if(type==="salvage"){pendingEvent.sellValue=20+Math.floor(random()*26);$("#event-reward").innerHTML=safeHtml`<b>Objet revendable</b><span>Valeur estimée : ${pendingEvent.sellValue} éclats</span>`}
  if(type==="r2entry")$("#event-reward").innerHTML="<b>Nouvelle région découverte</b><span>Les ennemis et équipements de cette terre rejoignent les tirages.</span>";
  if(type==="r2story")$("#event-reward").innerHTML="<b>Carte stellaire</b><span>+50 XP · un fragment de vérité supplémentaire</span>";
  if(type==="r2village")$("#event-reward").innerHTML="<b>Hospitalité sans ombre</b><span>Restauration complète · +2 Braises stables</span>";
  if(type==="r2library")$("#event-reward").innerHTML="<b>Savoir noyé</b><span>+90 XP · +2 Verres de lune · +1 Fibre pâle</span>";
  if(type==="r2city")$("#event-reward").innerHTML="<b>Marché de la cité renversée</b><span>Restauration complète · +80 éclats · +1 Fragment stellaire</span>";
  if(type==="r2sanctum")$("#event-reward").innerHTML="<b>Mémoire rendue</b><span>+140 XP · +1 dans votre attribut principal</span>";
  if(type==="r2forge"){const candidates=Object.values(state.equipped).filter(Boolean).sort((a,b)=>(a.level||1)-(b.level||1));pendingEvent.item=candidates[0]||null;$("#event-reward").innerHTML=pendingEvent.item?`<b>${pendingEvent.item.name}</b><span>Amélioration gratuite d'un niveau</span>`:"<b>Scories stellaires</b><span>+3 Verres de lune · +1 Fragment stellaire</span>"}
  if(type==="r3entry")$("#event-reward").innerHTML="<b>La capitale vous reconnaît</b><span>Restauration complète · le dernier royaume est consigné</span>";
  if(type==="r3story")$("#event-reward").innerHTML="<b>Souvenir royal</b><span>+180 XP · un fragment de votre passé</span>";
  if(type==="r1memory")$("#event-reward").innerHTML="<b>Serment des Veilleurs</b><span>+120 XP · +2 Braises stables</span>";
  if(type==="r2monastery")$("#event-reward").innerHTML="<b>Méditation lunaire</b><span>+220 XP · +2 Verres lunaires · énergie restaurée</span>";
  if(type==="r3council")$("#event-reward").innerHTML="<b>Verdict des Masques</b><span>+320 XP · +1 Essence du Néant</span>";
  if(type==="r4entry")$("#event-reward").innerHTML="<b>La dernière route</b><span>Restauration complète · +2 Fragments stellaires</span>";
  if(type==="r4story")$("#event-reward").innerHTML="<b>Vérité du Cycle</b><span>+240 XP · le choix final se rapproche</span>";
  if(type==="defeat")$("#event-reward").innerHTML="<b>La route vous rejette</b><span>Repli au dernier lieu sûr · perte de 10 % des éclats</span>";
  if(type==="boss")$("#event-reward").innerHTML="<b>Route accomplie</b><span>La prochaine région sera disponible bientôt</span>";
  openPanel("event");
}
function narrativeConditionMet(condition){
  if(!condition)return true;
  if(condition.anyOf)return condition.anyOf.some(narrativeConditionMet);
  if(condition.classId&&state.classId!==condition.classId)return false;
  if(condition.flag&&!state.narrative.flags.includes(condition.flag))return false;
  if(condition.questItem&&!state.narrative.questItems.includes(condition.questItem))return false;
  if(condition.stat&&(effectiveStats()[condition.stat]||0)<condition.min)return false;
  return true;
}
function narrativeConditionLabel(condition){
  if(!condition)return "";
  if(condition.anyOf)return "Nécessite un objet ou une décision antérieure";
  if(condition.classId)return `Réservé à la classe ${classes.find(entry=>entry.id===condition.classId)?.name||condition.classId}`;
  if(condition.stat)return `${condition.stat} ${condition.min} requis`;
  if(condition.questItem)return `${GAME_DATA.narrative.questItems[condition.questItem]?.name||"Objet de quête"} requis`;
  return "Décision antérieure requise";
}
function openNarrativeEvent(type,event){
  pendingEvent={type,narrative:true};
  $("#event-eyebrow").textContent=event.eyebrow;$("#event-icon").textContent=event.icon;$("#event-title").textContent=event.title;$("#event-copy").textContent=event.copy;$("#event-reward").innerHTML="<b>Votre choix laissera une trace</b><span>Les personnages, factions et rencontres futures pourront s'en souvenir.</span>";
  $("#event-choices").innerHTML=event.choices.map(choice=>{const available=narrativeConditionMet(choice.condition);return `<button data-narrative-choice="${choice.id}" ${available?"":"disabled"}><b>${choice.label}</b><span>${choice.description}</span>${available?"":`<em>${narrativeConditionLabel(choice.condition)}</em>`}</button>`}).join("");
  $("#event-choices").classList.remove("hidden");$('[data-action="event-claim"]').classList.add("hidden");openPanel("event");
}
function chooseNarrativeChoice(choiceId){
  if(!pendingEvent?.narrative)return;
  const event=GAME_DATA.narrative.events[pendingEvent.type],choice=event?.choices.find(entry=>entry.id===choiceId);
  if(!choice||!narrativeConditionMet(choice.condition))return;
  const effects=choice.effects||{};
  Object.entries(effects.reputation||{}).forEach(([id,value])=>state.narrative.reputation[id]=(state.narrative.reputation[id]||0)+value);
  Object.entries(effects.resource||{}).forEach(([id,value])=>state.resources[id]=(state.resources[id]||0)+value);
  Object.entries(effects.stat||{}).forEach(([id,value])=>state.statBonuses[id]=(state.statBonuses[id]||0)+value);
  (effects.flags||[]).forEach(flag=>{if(!state.narrative.flags.includes(flag))state.narrative.flags.push(flag)});
  if(effects.gold)state.gold=Math.max(0,state.gold+effects.gold);
  if(effects.xp>0)grantExperience(effects.xp);else if(effects.xp<0)state.xp=Math.max(0,state.xp+effects.xp);
  if(effects.hpPercent)state.hp=Math.max(1,state.hp+Math.floor(maxPlayerHp()*effects.hpPercent));
  if(choice.questItem&&!state.narrative.questItems.includes(choice.questItem))state.narrative.questItems.push(choice.questItem);
  if(choice.consumeQuestItem)state.narrative.questItems=state.narrative.questItems.filter(id=>id!==choice.consumeQuestItem);
  state.narrative.decisions.push({event:pendingEvent.type,choice:choice.id,label:choice.label,result:choice.result,region:state.currentRegion});
  if(!state.discoveries.lore.includes(`decision_${choice.id}`))state.discoveries.lore.push(`decision_${choice.id}`);
  $("#event-copy").textContent=choice.result;$("#event-reward").innerHTML=safeHtml`<b>${choice.label}</b><span>Décision enregistrée dans le journal du monde.</span>`;$("#event-choices").classList.add("hidden");$('[data-action="event-claim"]').classList.remove("hidden");
  pendingEvent={type:pendingEvent.type,narrativeResolved:true};playSound("reward");save();updateHud();
}
function claimEvent(){
  if(!pendingEvent)return;
  if(pendingEvent.narrative&&!pendingEvent.narrativeResolved)return;
  if(["story","r1memory","r2story","r2library","r2sanctum","r2monastery","r3entry","r3story","r3council","r4entry","r4story"].includes(pendingEvent.type)&&!state.discoveries.lore.includes(pendingEvent.type))state.discoveries.lore.push(pendingEvent.type);
  if(pendingEvent.type==="loot"){addItem(pendingEvent.item);toast(`${pendingEvent.item.name} ajouté à l'inventaire.`)}
  if(pendingEvent.type==="shrine"){state.statBonuses.Vitalité++;state.maxHp+=8;state.hp=Math.min(maxPlayerHp(),state.hp+8);toast("Votre Vitalité augmente définitivement.")}
  if(pendingEvent.type==="rest"){state.hp=Math.min(maxPlayerHp(),state.hp+Math.ceil(maxPlayerHp()*.4*healingMultiplier()));state.energy=maxPlayerEnergy();toast("Vous vous sentez reposé.")}
  if(pendingEvent.type==="story"&&!pendingEvent.narrativeResolved){grantExperience(35);toast("Un souvenir qui n'est pas le vôtre vous traverse.")}
  if(pendingEvent.type==="gate"){fullRest();state.potions++;toast("La Porte vous rend vos forces — sans raison apparente.")}
  if(pendingEvent.type==="mine"){Object.entries(pendingEvent.materials).forEach(([id,amount])=>state.resources[id]+=amount);toast("Les matériaux sont rangés dans votre sac.")}
  if(pendingEvent.type==="resource"){state.resources[pendingEvent.material]+=pendingEvent.amount;toast("Ressources récupérées.")}
  if(pendingEvent.type==="salvage"){state.gold+=pendingEvent.sellValue;toast(`Débris échangés contre ${pendingEvent.sellValue} éclats.`)}
  if(pendingEvent.type==="r2story"&&!pendingEvent.narrativeResolved){grantExperience(50);toast("Les étoiles dessinées vous semblent familières.")}
  if(pendingEvent.type==="r2village"){fullRest();state.resources.ember+=2;toast("Les habitants vous regardent repartir en silence.")}
  if(pendingEvent.type==="r2library"&&!pendingEvent.narrativeResolved){grantExperience(90);state.resources.moon_glass+=2;state.resources.pale_fiber++;toast("Les Archives cèdent une parcelle de leur savoir.")}
  if(pendingEvent.type==="r2city"){fullRest();state.gold+=80;state.resources.star_fragment++;toast("La cité accepte votre monnaie — et votre silence.")}
  if(pendingEvent.type==="r2sanctum"&&!pendingEvent.narrativeResolved){grantExperience(140);const primary=Object.entries(hero().growth).sort((a,b)=>b[1]-a[1])[0][0];state.statBonuses[primary]++;toast(`Le Sanctuaire vous rend un fragment de ${primary}.`)}
  if(pendingEvent.type==="r2forge"){if(pendingEvent.item&&(pendingEvent.item.level||1)<5)pendingEvent.item.level=(pendingEvent.item.level||1)+1;else{state.resources.moon_glass+=3;state.resources.star_fragment++}toast("La Forge de l'Étoile morte accepte votre offrande.")}
  if(pendingEvent.type==="r3entry"){fullRest();toast("Le Royaume sous la Cendre rejoint votre journal.")}
  if(pendingEvent.type==="r3story"){grantExperience(180);toast("Une vie ancienne traverse votre mémoire.")}
  if(pendingEvent.type==="r1memory"){grantExperience(120);state.resources.ember+=2;toast("Le serment des Veilleurs ravive vos braises.")}
  if(pendingEvent.type==="r2monastery"){grantExperience(220);state.resources.moon_glass+=2;state.energy=maxPlayerEnergy();toast("Votre reflet vous rend une force qu'il gardait pour lui.")}
  if(pendingEvent.type==="r3council"){grantExperience(320);state.resources.essence++;toast("Les Masques prononcent un verdict qu'ils refusent d'expliquer.")}
  if(pendingEvent.type==="r4entry"){fullRest();state.resources.star_fragment+=2;toast("Le Premier Souvenir restaure vos forces.")}
  if(pendingEvent.type==="r4story"){grantExperience(240);toast("Vous vous souvenez enfin du serment partagé.")}
  if(pendingEvent.type==="defeat"){state.gold=Math.floor(state.gold*.9);state.hp=Math.ceil(maxPlayerHp()*.5);state.energy=maxPlayerEnergy();const fallback=activeMapNodes()[state.mapIndex].edges.find(index=>state.cleared.includes(index));state.mapIndex=fallback??0;toast("Vous reprenez conscience au dernier lieu sûr.")}
  clearCurrentNode();pendingEvent=null;closeOverlay();renderMap();updateHud();save();
}
function itemPower(item){return Object.values(item?.stats||{}).reduce((a,b)=>a+Math.ceil(b*(1+((item?.level||1)-1)*.25)),0)}
function addItem(item){
  if(!state.discoveries.items.includes(item.id))state.discoveries.items.push(item.id);
  state.inventory.push(item);const current=state.equipped[item.slot];
  if(!current||itemPower(item)>itemPower(current)){state.equipped[item.slot]=item;toast(`${item.name} équipé automatiquement.`)}
}
function clearCurrentNode(){
  if(state.cleared.includes(state.mapIndex))return;
  state.cleared.push(state.mapIndex);
  if(!activeMapNodes()[state.mapIndex]?.optional)return;
  state.run.optionalCleared++;
  advanceContract("optional");
  const locked=buildData.recipes.filter(recipe=>!state.recipes.includes(recipe.id));
  if(locked.length&&random()<.35){const recipe=rand(locked);state.recipes.push(recipe.id);toast(`Recette découverte : ${recipe.name}.`)}
  const companion=activeCompanion();
  if(companion&&state.companions.quests[companion.id]==="active"){
    state.companions.quests[companion.id]="completed";
    state.companions.trust[companion.id]=Math.min(25,(state.companions.trust[companion.id]||0)+3);
    state.companions.relation[companion.id]=(state.companions.relation[companion.id]||0)+1;
    state.companions.dialogues[companion.id]=`${companion.quest.name} est accomplie. Une part de son passé ne lui appartient plus tout à fait.`;
    toast(`Quête de compagnon accomplie : ${companion.quest.name}.`);
  }
}
function smartItemId(ids){const owned=new Set(state.inventory.map(item=>item.id)),unique=ids.filter(id=>!owned.has(id)),pool=unique.length?unique:ids;if(!pool.length)return null;const weakest=["Arme","Armure","Bijou"].sort((a,b)=>itemPower(state.equipped[a])-itemPower(state.equipped[b]))[0],focused=pool.filter(id=>itemCatalog[id].slot===weakest);return random()<.7&&focused.length?rand(focused):rand(pool)}

function updateHud(){
  const h=hero();$("#hud-portrait").style.background=h.art;$("#hud-class").textContent=h.name;$("#hud-level").textContent=`Niv. ${state.level}`;
  const capped=state.level>=GAME_DATA.progression.maxLevel;$("#hud-xp").style.width=`${capped?100:state.xp/state.xpNext*100}%`;$("#hud-xp-label").textContent=capped?"NIVEAU MAX":`${state.xp} / ${state.xpNext} XP`;
  $("#hud-hp").style.width=`${state.hp/maxPlayerHp()*100}%`;$("#hud-hp-label").textContent=`${state.hp} / ${maxPlayerHp()}`;
  $("#hud-energy").style.width=`${state.energy/maxPlayerEnergy()*100}%`;$("#hud-energy-label").textContent=`${state.energy} / ${maxPlayerEnergy()}`;
  $("#hud-materials").innerHTML=GAME_DATA.resources.map(resource=>`<span title="${resource.name}">${resource.icon}<b>${state.resources[resource.id]||0}</b></span>`).join("");
  $("#hud-power").textContent=powerScore();
  updateContractNotice();
  updateNemesisBadge();
  const campBuff=GAME_DATA.camp.buffs[state.camp.buff],campBadge=$("#camp-buff");campBadge.classList.toggle("hidden",!campBuff);campBadge.innerHTML=campBuff?`<span>${campBuff.icon}</span><div><small>PROCHAINE BATAILLE</small><b>${campBuff.name}</b></div>`:"";
}
function powerScore(){return state.level*10+Object.values(effectiveStats()).reduce((a,b)=>a+b,0)*3+Object.values(state.equipped).filter(Boolean).reduce((sum,item)=>sum+itemPower(item),0)+state.equippedAbilities.reduce((sum,id)=>sum+(state.abilityRanks[id]||1)*5,0)}
function nemesisTraits(){return state.nemesis.traits.map(id=>GAME_DATA.nemesis.traits.find(trait=>trait.id===id)).filter(Boolean)}
function empowerNemesis(enemy){
  const nemesis=state.nemesis,traits=nemesisTraits(),hpBonus=(nemesis.rank-1)*.22+traits.reduce((sum,trait)=>sum+(trait.hp||0),0),damageBonus=(nemesis.rank-1)*.14+traits.reduce((sum,trait)=>sum+(trait.damage||0),0);
  enemy.name=nemesis.name;enemy.nemesis=true;enemy.tags=[...new Set([...(enemy.tags||[]),"némésis",`rang ${nemesis.rank}`])];enemy.maxHp=Math.round(enemy.maxHp*(1+hpBonus));enemy.hp=enemy.maxHp;enemy.damage=Math.round(enemy.damage*(1+damageBonus));enemy.postureMax+=nemesis.rank*20;enemy.posture=enemy.postureMax;
  enemy.resistances.physical=GAME_RULES.clamp((enemy.resistances.physical||0)+traits.reduce((sum,trait)=>sum+(trait.physical||0),0),-.5,.8);
  enemy.resistances.fire=GAME_RULES.clamp((enemy.resistances.fire||0)+traits.reduce((sum,trait)=>sum+(trait.fire||0),0),-.5,.8);
  enemy.resistances.bleed=GAME_RULES.clamp((enemy.resistances.bleed||0)+traits.reduce((sum,trait)=>sum+(trait.bleed||0),0),-.5,.8);
  const barrier=traits.reduce((sum,trait)=>sum+(trait.barrier||0),0);if(barrier)applyStatus(enemy,{type:"barrier",turns:3,potency:Math.round(enemy.maxHp*barrier),enemy:true});
}
function nemesisRewardItem(){
  const rarity=state.currentRegion===3?"légendaire":state.currentRegion===2?"épique":"rare",pool=GAME_DATA.items.filter(item=>item.rarity===rarity&&(!item.region||item.region<=state.currentRegion)).map(item=>item.id),id=smartItemId(pool);
  return id?makeItem(id):null;
}
function startNemesisHunt(fromRevisit=false){
  const nemesis=state.nemesis;if(!nemesis?.alive||!state.cleared.includes(state.mapIndex)||currentScreen!=="exploration")return false;
  nemesis.region=state.currentRegion;nemesis.encounters++;nemesis.lastResult=fromRevisit?"Elle vous a retrouvé avant que vous ne puissiez quitter la route.":"Vous avez suivi sa trace jusqu'à son repaire.";save();closeOverlay();
  startCombat([nemesis.baseKey],{title:`NÉMÉSIS · ${nemesis.name}`,elite:true,nemesis:true,difficulty:Math.min(4,nemesis.rank+1),xp:190+nemesis.rank*85,gold:70+nemesis.rank*35,rewardItem:nemesisRewardItem()});return true;
}
function promoteNemesis(){
  const nemesis=state.nemesis;nemesis.victories++;nemesis.rank=Math.min(4,nemesis.rank+1);const available=GAME_DATA.nemesis.traits.map(trait=>trait.id).filter(id=>!nemesis.traits.includes(id));
  if(available.length&&nemesis.traits.length<4)nemesis.traits.push(nemesisPick(available,state.seed,0xF20+nemesis.victories*97));
  nemesis.lastResult=`Elle vous a terrassé et atteint désormais le rang ${nemesis.rank}.`;
}
function updateNemesisBadge(){
  const badge=$("#nemesis-rank");if(!badge||!state)return;badge.textContent=state.nemesis.alive?state.nemesis.rank:"✓";badge.classList.toggle("defeated",!state.nemesis.alive);
}
function combatMutationProfiles(ids=[]){return resolveMutationProfiles(ids,combatMutations)}
function buildCombatEnemies(keys,enemyLevel,difficulty,rules,mutationIds=[]){
  return keys.map((key,i)=>{
    const base=clone(enemyBook[key]),scaled=GAME_RULES.scaleEnemy(base,enemyLevel,difficulty);scaled.hp=Math.round(scaled.hp*rules.enemyHp);scaled.damage=Math.round(scaled.damage*rules.enemyDamage);
    const armored=base.tags?.includes("armure"),astral=base.tags?.includes("astral"),beast=base.tags?.includes("bête"),vegetal=base.tags?.includes("végétal"),mystic=base.tags?.includes("mystique")||astral,profiles=base.boss?[]:combatMutationProfiles(mutationIds),effects=profiles.reduce((all,profile)=>({...all,...Object.fromEntries(Object.entries(profile.effects||{}).map(([id,value])=>[id,(all[id]||0)+value]))}),{}),postureMax=(armored?130:base.boss?180:100)+(effects.posture||0);
    const enemy={...base,...scaled,catalogId:base.id,id:i,level:enemyLevel,maxHp:Math.round(scaled.hp*(1+(effects.hp||0))),statuses:{},intent:null,position:mystic&&!armored?"arrière":"avant",posture:postureMax,postureMax,resistances:{physical:GAME_RULES.clamp((armored?0.28:0)+(effects.physical||0),-.5,.8),fire:GAME_RULES.clamp((astral?0.25:vegetal?-0.25:0)+(effects.fire||0),-.5,.8),bleed:GAME_RULES.clamp((beast?0.2:armored?0.45:0)+(effects.bleed||0),-.5,.8)},mutations:profiles.map(profile=>profile.id),mutationEffects:effects};
    enemy.hp=enemy.maxHp;enemy.damage=Math.round(scaled.damage*(1+(effects.damage||0)));if(effects.barrier)enemy.statuses.barrier={turns:99,potency:Math.round(enemy.maxHp*effects.barrier)};if(effects.fury)enemy.statuses.fury={turns:99,potency:effects.fury};return enemy;
  });
}
const tuneCombatEnemies=tuneEnemyGroup;
function discoverCombatEnemies(enemies){enemies.forEach(enemy=>{if(enemy.catalogId&&!state.discoveries.enemies.includes(enemy.catalogId))state.discoveries.enemies.push(enemy.catalogId)})}
function renderCombatContext(){
  const difficulty=combat.difficulty,hazard=combat.hazard,mutations=combatMutationProfiles(combat.mutationIds),wave=`VAGUE ${combat.waveIndex+1}/${combat.waveKeys.length}`,details=[`Adversaires niveau ${combat.enemyLevel}${difficulty?` · +${difficulty*25}% PV · +${difficulty*15}% dégâts`:""}`,hazard?`${hazard.icon} ${hazard.name} · ${hazard.description}`:"",mutations.length?`MUTATIONS · ${mutations.map(mutation=>`${mutation.icon} ${mutation.name}`).join(" · ")}`:""].filter(Boolean);
  $("#combat-modifier").classList.toggle("active",difficulty>0||!!hazard||mutations.length>0||combat.waveKeys.length>1);$("#combat-modifier").innerHTML=safeHtml`<b>${difficulty?`DANGER ${["","I","II","III","IV"][difficulty]} · ${wave}`:`MENACE ADAPTATIVE · ${wave}`}</b>${details.map(detail=>`<span>${detail}</span>`).join("")}`;
}
function startCombat(keys,options={}){
  const difficulty=options.difficulty||0;
  const rules=state.rules||GAME_RULES.difficultyRules("normal"),enemyLevel=GAME_RULES.enemyLevel(state.level,state.currentRegion,difficulty+(state.run?.modifier==="hunters"?1:0),random()<.3);
  const waveKeys=[keys,...(options.waves||[])],allKeys=waveKeys.flat(),mutationCount=options.boss||options.nemesis?0:options.abyss?2:options.elite?1:0,mutationIds=GAME_RULES.selectEliteMutations(combatMutations,state.seed,state.currentRegion,state.mapIndex,mutationCount),hazard=options.tutorial||options.hazard===false||options.training&&!options.trainingHazard?null:(difficulty>=2||options.elite||options.boss||waveKeys.length>1?GAME_RULES.selectCombatHazard(combatHazards,state.seed,state.currentRegion,state.mapIndex):null),waveMultiplier=GAME_RULES.waveRewardMultiplier(waveKeys.length),baseXp=options.xp||allKeys.reduce((sum,key)=>sum+(enemyBook[key]?.xp||0),0),baseGold=options.gold||allKeys.reduce((sum,key)=>sum+(enemyBook[key]?.gold||0),0),enemyTuning={hp:options.enemyHpScale||1,damage:options.enemyDamageScale||1},enemies=tuneCombatEnemies(buildCombatEnemies(keys,enemyLevel,difficulty,rules,mutationIds),enemyTuning);
  discoverCombatEnemies(enemies);
  combat={enemies,waveKeys,waveIndex:0,enemyLevel,enemyTuning,rules,hazard,mutationIds,target:0,step:0,turn:1,guard:false,lastAction:null,playerStatuses:{},busy:false,abilityUses:0,potionsUsed:0,postureBreaks:0,bossAwakened:false,bossPhasesSeen:options.bossMechanic==="trueMaster"?[1]:[],history:[],logOpen:false,tutorial:!!options.tutorial,training:!!options.training,trainingSnapshot:options.training?{hp:state.hp,energy:state.energy,potions:state.potions,run:clone(state.run)}:null,campBuff:options.training?null:state.camp.buff,elite:!!options.elite,abyss:!!options.abyss,nemesis:!!options.nemesis,difficulty,boss:!!options.boss,bossMechanic:options.bossMechanic||null,regionEnd:options.regionEnd||0,rewardItem:options.rewardItem||null,rewardXp:Math.round(baseXp*rules.rewards*waveMultiplier),rewardGold:Math.round(baseGold*rules.rewards*waveMultiplier)};
  if(combat.nemesis)empowerNemesis(combat.enemies[0]);
  combat.classResource=createClassResource();
  if(combat.campBuff==="edge")applyStatus(playerHolder(),{type:"fury",turns:99,potency:15});
  if(combat.campBuff==="ward")applyStatus(playerHolder(),{type:"barrier",turns:99,potency:Math.round(maxPlayerHp()*.2)});
  if(combat.campBuff){state.camp.buff=null;save()}
  prepareEnemyIntents();
  const h=hero();$("#battle-hero").style.background=h.art;$("#battle-hero-name").textContent=h.name;
  $("#combat .location small").textContent=options.training
    ?"ENTRAÎNEMENT"
    :options.boss
      ?"AFFRONTEMENT MAJEUR"
      :options.elite
        ?"COMBAT D'ÉLITE"
        :"COMBAT";
  $("#combat .location strong").textContent=options.title|| (enemies.length>1?"Combat de groupe":"Rencontre hostile");state.energy=Math.max(0,maxPlayerEnergy()-difficulty);
  renderCombatContext();
  showScreen("combat");renderCombatActions();renderEnemies();updateBattle();updateTutorial();log(options.training?"Entraînement : aucune ressource ne sera consommée définitivement.":combat.bossMechanic==="trueMaster"?"« Tu m'as demandé de tenir la couronne. Montre-moi pourquoi je devrais la rendre. »":combat.campBuff?`${GAME_DATA.camp.buffs[combat.campBuff].name} est active. La préparation est consommée.`:enemies.length>1?"Cliquez sur un adversaire pour choisir votre cible.":"Un ennemi vous barre la route.");if(!options.training)setTimeout(()=>showGuide("combat"),180);
}
function triggerCombatHazard(){
  const hazard=combat.hazard;if(!hazard||!GAME_RULES.shouldTriggerHazard(combat.turn,hazard.cadence))return "";
  state.run.hazardsTriggered=(state.run.hazardsTriggered||0)+1;
  const enemies=livingEnemies(),player=playerHolder();
  if(hazard.id==="ember_wind"){applyStatus(player,{type:"burn",turns:2,potency:Math.max(3,Math.round(maxPlayerHp()*.025)),enemy:true});enemies.forEach(enemy=>applyStatus(enemy,{type:"burn",turns:2,potency:Math.max(4,Math.round(enemy.maxHp*.025)),enemy:true}))}
  if(hazard.id==="broken_ground"){state.energy=Math.max(0,state.energy-1);enemies.forEach(enemy=>enemy.posture=Math.max(0,enemy.posture-25))}
  if(hazard.id==="upward_tide"){state.energy=Math.min(maxPlayerEnergy(),state.energy+1);enemies.forEach(enemy=>applyStatus(enemy,{type:"barrier",turns:2,potency:Math.round(enemy.maxHp*.06),enemy:true}))}
  if(hazard.id==="mirror_static"){const target=targetEnemy();if(target)applyStatus(target,{type:"marked",turns:2,potency:20,enemy:true});applyStatus(player,{type:"weakness",turns:1,potency:20,enemy:true})}
  if(hazard.id==="royal_edict")enemies.forEach(enemy=>applyStatus(enemy,{type:enemy.position==="avant"?"barrier":"fury",turns:2,potency:enemy.position==="avant"?Math.round(enemy.maxHp*.08):18,enemy:true}));
  if(hazard.id==="memory_rain"){applyStatus(player,{type:"regeneration",turns:2,potency:Math.max(5,Math.round(maxPlayerHp()*.04)),enemy:true});enemies.forEach(enemy=>applyStatus(enemy,{type:"weakness",turns:2,potency:20,enemy:true}))}
  if(hazard.id==="cycle_spark"){state.energy=Math.min(maxPlayerEnergy(),state.energy+1);applyStatus(player,{type:"fury",turns:2,potency:15,enemy:true});enemies.forEach(enemy=>applyStatus(enemy,{type:"fury",turns:2,potency:15,enemy:true}))}
  if(hazard.id==="oath_pressure"){state.energy=Math.max(0,state.energy-1);enemies.forEach(enemy=>enemy.posture=Math.max(0,enemy.posture-30))}
  return ` ${hazard.icon} ${hazard.name} se déclenche.`;
}
function advanceCombatWave(){
  if(combat.waveIndex>=combat.waveKeys.length-1)return false;
  combat.waveIndex++;combat.turn++;combat.enemies=tuneCombatEnemies(buildCombatEnemies(combat.waveKeys[combat.waveIndex],combat.enemyLevel,combat.difficulty,combat.rules,combat.mutationIds),combat.enemyTuning);discoverCombatEnemies(combat.enemies);combat.target=0;combat.guard=false;state.hp=Math.min(maxPlayerHp(),state.hp+Math.ceil(maxPlayerHp()*.06));state.energy=Math.min(maxPlayerEnergy(),state.energy+2);prepareEnemyIntents();renderCombatContext();updateBattle();$("#enemy-group").classList.add("wave-enter");$("#turn-label").textContent=`RENFORTS · VAGUE ${combat.waveIndex+1}/${combat.waveKeys.length}`;playSound("danger");log(`Une nouvelle vague approche. Souffle de transition : +${Math.ceil(maxPlayerHp()*.06)} PV et +2 énergie.`);if(!combat.training)save();setTimeout(()=>{combat.busy=false;$("#turn-label").textContent=`À VOTRE TOUR · VAGUE ${combat.waveIndex+1}/${combat.waveKeys.length}`;renderEnemies()},combatDelay(850));return true;
}
function finishCombatWaveOrVictory(delay=650){state.run.wavesCleared=(state.run.wavesCleared||0)+1;setTimeout(()=>{if(!advanceCombatWave())victory()},combatDelay(delay))}
function triggerEnemyDefeatEffect(enemy){
  if(enemy.hp>0||enemy.deathTriggered||!enemy.mutationEffects?.deathDamage)return "";
  enemy.deathTriggered=true;const blast=Math.max(1,Math.round(maxPlayerHp()*enemy.mutationEffects.deathDamage));state.hp=Math.max(0,state.hp-blast);state.run.damageTaken+=blast;floatDamage(blast,"hero");toast(`${enemy.name} explose : ${blast} dégâts.`);return ` ${enemy.name} explose et inflige ${blast} dégâts.`;
}
function renderCombatActions(){
  $("#ability-actions").innerHTML=Array.from({length:4},(_,index)=>{const id=state.equippedAbilities[index],ability=abilityCatalog[id],profile=abilityEffects[id],rank=state.abilityRanks[id]||1,cost=ability?combatAbilityCost(ability,rank):0,damage=ability?abilityDamageBreakdown(ability,rank).total:0,effectLabel=profile?.effects?.map(effect=>statusCatalog[effect.type]?.name).filter(Boolean).join(" + ")||profile?.synergy?.label,evolution=abilityEvolution(ability);return ability?`<button data-combat="ability:${id}" title="${ability.description}${evolution?` · ${evolution.name} : ${evolution.description}`:""}" ${state.energy<cost?"data-insufficient=true":""}><span class="action-icon">✦</span><b>${ability.name} <em>R${rank}</em></b><small>${cost} ✦ · ≈ ${damage} dégâts${ability.targets==="all"?" de zone":""}${evolution?` · ${evolution.name}`:""}${effectLabel?` · ${effectLabel}`:""}</small></button>`:`<button class="empty-ability" disabled><span class="action-icon">·</span><b>Emplacement vide</b><small>Équipez une attaque</small></button>`}).join("");
  const attackButton=$('[data-combat="attack"]'),guardButton=$('[data-combat="guard"]');
  attackButton.querySelector("small").textContent=`0 énergie · ≈ ${Math.floor(playerDamage()*classResourceMultiplier(false))} dégâts`;
  guardButton.querySelector("small").textContent=`Réduit d'environ ${Math.round((1-Math.max(.2,.5-learnedPassiveObjects().reduce((sum,p)=>sum+(p.guardBonus||0),0)-buildBonus("guardBonus")))*100)} %`;
}
function livingEnemies(){return findLivingEnemies(combat)}
function targetEnemy(){return selectCombatTarget(combat)}
function prepareEnemyIntents(){combat.enemies.filter(enemy=>enemy.hp>0).forEach(enemy=>{if(enemy.posture<=0&&!enemy.statuses.armorBreak)enemy.posture=enemy.postureMax;enemy.intent=GAME_RULES.enemyIntent(enemy.tags||[],combat.turn,enemy.boss?GAME_RULES.bossPhase(enemy.hp,enemy.maxHp):0)})}
function triggerFinalBossPhase(enemy){
  if(combat.bossMechanic!=="trueMaster"||!enemy?.boss)return "";
  const phase=GAME_RULES.bossPhase(enemy.hp,enemy.maxHp);if(combat.bossPhasesSeen.includes(phase))return "";combat.bossPhasesSeen.push(phase);
  playSound("bossPhase");combatFeedback("boss");
  if(phase===2){state.energy=Math.max(0,state.energy-2);applyStatus(enemy,{type:"barrier",turns:3,potency:Math.ceil(enemy.maxHp*.1),enemy:true});return " Le Maître rappelle le Premier Serment : 2 énergies sont effacées et une Barrière se referme autour de lui."}
  if(phase===3){applyStatus(enemy,{type:"fury",turns:4,potency:30,enemy:true});applyStatus(playerHolder(),{type:"weakness",turns:2,potency:20,enemy:true});return " La couronne se brise. Le Maître entre dans sa forme originelle et votre nom vacille."}
  return "";
}
function statusBadges(statuses={}){return renderStatusBadges(statuses,statusCatalog)}
function applyStatus(holder,effect){const current=holder.statuses[effect.type],dot=["burn","bleed"].includes(effect.type),barrier=effect.type==="barrier",boost=effect.enemy?1:dot?1+buildBonus("dotBonus"):barrier?1+buildBonus("barrierBonus"):1,potency=Math.round((effect.potency||0)*boost);holder.statuses[effect.type]={turns:Math.max(current?.turns||0,effect.turns||1),potency:barrier?(current?.potency||0)+potency:Math.max(current?.potency||0,potency)}}
function playerHolder(){return {get statuses(){return combat.playerStatuses},set statuses(value){combat.playerStatuses=value}}}
function activeCompanion(){return GAME_DATA.companions.find(companion=>companion.id===state.companions?.active)}
function createClassResource(){
  const profile=GAME_RULES.classResourceProfile(state.classId),details={bastion:{name:"RÉSOLUTION",description:"Gagnée avec Garde. Renforce la prochaine attaque."},traqueuse:{name:"COMBO",description:"Chaque frappe accélère la suivante. Un pouvoir consomme le combo."},arcaniste:{name:"SURCHARGE",description:"Le troisième pouvoir devient gratuit et plus puissant."},penitent:{name:"DETTE DE SANG",description:"Les sacrifices accumulent une dette qui renforce les dégâts."}}[state.classId];return {...profile,...details,value:0};
}
function classResourceMultiplier(ability=false){
  const resource=combat?.classResource;if(!resource)return 1;
  const base=GAME_RULES.classResourceDamage(state.classId,resource.value,ability);
  return 1+(base-1)*(1+buildBonus("resourceBonus"));
}
function combatAbilityCost(ability,rank){return combat?.classResource?.id==="overload"&&combat.classResource.value>=combat.classResource.max-1?0:abilityCost(ability,rank)}
function advanceClassResource(action,ability=null){
  const resource=combat.classResource,evolution=abilityEvolution(ability),extra=evolution?.resourceGain||0;if(!resource)return;
  if(resource.id==="resolve"){if(action==="guard")resource.value=Math.min(resource.max,resource.value+2);else if(action==="attack"||ability)resource.value=0}
  if(resource.id==="combo"){if(ability)resource.value=Math.min(resource.max,extra);else if(action==="attack")resource.value=Math.min(resource.max,resource.value+1)}
  if(resource.id==="overload"&&ability)resource.value=resource.value>=resource.max-1?0:Math.min(resource.max-1,resource.value+1+extra);
  if(resource.id==="debt"&&ability?.hpCost)resource.value=Math.min(resource.max,resource.value+Math.max(1,Math.round(ability.hpCost*20)));
}
function triggerCompanionAction(){
  const companion=activeCompanion();if(!companion||combat.turn%2===0)return "";
  const trust=Math.min(25,state.companions.trust[companion.id]||0),relation=state.companions.relation[companion.id]||0,questBonus=state.companions.quests[companion.id]==="completed"?0.2:0,equipped=state.companions.equipment[companion.id],gear=state.inventory.find(item=>item.uid===equipped),power=Math.round((companion.ability.power+(gear?itemPower(gear)*.4:0))*(1+trust*.02+Math.max(-.15,relation*.03)+questBonus)),abilityName=questBonus?companion.ability.evolvedName:companion.ability.name;let result="";
  if(companion.ability.type==="damage"&&targetEnemy()){let amount=power;if(state.classId==="bastion"&&combat.lastAction==="guard")amount=Math.round(amount*1.4);if(state.classId==="penitent"&&state.hp/maxPlayerHp()<.4)amount=Math.round(amount*1.35);const dealt=dealEnemy(amount,state.classId==="arcaniste"?"fire":"physical");result=`${companion.name} utilise ${abilityName} : ${dealt} dégâts.`}
  if(companion.ability.type==="heal"){let healing=power;if(state.classId==="penitent"&&String(combat.lastAction).startsWith("ability:p_"))healing*=2;state.hp=Math.min(maxPlayerHp(),state.hp+healing);if(state.classId==="arcaniste")state.energy=Math.min(maxPlayerEnergy(),state.energy+2);if(state.classId==="traqueuse")applyStatus(playerHolder(),{type:"fury",turns:1,potency:15});result=`${companion.name} restaure ${healing} PV.`}
  if(companion.ability.type==="barrier"){let barrier=power*(state.classId==="bastion"?1.4:1);if(state.classId==="penitent"&&state.hp/maxPlayerHp()<.4)barrier*=1.35;applyStatus(playerHolder(),{type:"barrier",turns:2,potency:Math.round(barrier)});if(state.classId==="arcaniste"&&combat.turn%3===0)state.energy=Math.min(maxPlayerEnergy(),state.energy+1);result=`${companion.name} accorde ${Math.round(barrier)} points de Barrière.`}
  return result;
}
function applyAbilityEffects(ability,targets){
  const profile=abilityEffects[ability.id];if(!profile?.effects)return "";
  const evolution=abilityEvolution(ability),labels=[];profile.effects.forEach(effect=>{const holders=effect.target==="player"?[playerHolder()]:targets,adjusted=evolution?.statusPotency?{...effect,potency:Math.round((effect.potency||0)*(1+evolution.statusPotency))}:effect;holders.forEach(holder=>applyStatus(holder,adjusted));labels.push(statusCatalog[effect.type]?.name)});return [...new Set(labels)].filter(Boolean).join(", ");
}
function outgoingMultiplier(target,ability){
  let multiplier=1;if(combat.playerStatuses.fury)multiplier*=1+(combat.playerStatuses.fury.potency||20)/100;
  if(target.statuses.armorBreak)multiplier*=1+(target.statuses.armorBreak.potency||25)/100;
  if(target.statuses.marked)multiplier*=1+(target.statuses.marked.potency||20)/100+buildBonus("markedBonus");
  if(target.statuses.weakness||target.statuses.armorBreak)multiplier*=1+buildBonus("debuffDamage");
  const synergy=ability&&abilityEffects[ability.id]?.synergy;if(synergy?.condition==="guard"&&combat.lastAction==="guard")multiplier*=synergy.multiplier;
  if(synergy?.status&&target.statuses[synergy.status]){multiplier*=synergy.multiplier;if(synergy.consume)delete target.statuses[synergy.status]}
  const evolution=abilityEvolution(ability);if(evolution?.executeBonus&&target.hp/target.maxHp<=.35)multiplier*=1+evolution.executeBonus;
  return multiplier;
}
function renderEnemies(){
  $("#enemy-group").className=`enemy-group count-${combat.enemies.length}`;
  $("#enemy-group").innerHTML=combat.enemies.map(e=>{const phase=e.boss?GAME_RULES.bossPhase(e.hp,e.maxHp):0,phaseNames=combat.bossMechanic==="trueMaster"?["","Le Gardien","Le Serment","L'Origine"]:["","Veille silencieuse","Ciel fracturé","Extinction stellaire"],phaseText=phaseNames[phase],mutations=combatMutationProfiles(e.mutations);return `<button class="fighter enemy-fighter position-${e.position} ${e.id===combat.target?"targeted":""} ${e.hp<=0?"defeated":""} ${e.boss?"boss-fighter phase-"+phase:""}" data-target="${e.id}"><small class="enemy-position">${e.position==="arrière"?"ARRIÈRE":"AVANT"}</small><div class="fighter-art enemy-art">${e.icon}</div><strong>${e.name} <em>Niv. ${e.level}</em></strong>${mutations.length?`<small class="enemy-mutations">${mutations.map(mutation=>`<i title="${mutation.description}">${mutation.icon}</i>`).join("")}</small>`:""}<span>${e.hp<=0?"Vaincu":e.boss?`Phase ${phase} · ${phaseText}`:`Intention : ${e.intent?.label||"Attaque"}`}</span><div class="posture-bar" title="Brisez la posture pour exposer la cible"><i style="width:${Math.max(0,e.posture/e.postureMax*100)}%"></i></div><div class="fighter-statuses">${statusBadges(e.statuses)}</div></button>`}).join("");
  $$("[data-target]").forEach(b=>b.onclick=()=>{if(!combat.busy&&combat.enemies[+b.dataset.target].hp>0){combat.target=+b.dataset.target;renderEnemies();toast(`${combat.enemies[combat.target].name} ciblé.`)}});
  $("#enemy-bars").innerHTML=combat.enemies.map(e=>`<button class="enemy-bar-button ${e.id===combat.target?"selected":""}" data-bar-target="${e.id}" ${e.hp<=0?"disabled":""}><label><b>${e.name} · Niv. ${e.level} · ${Math.max(0,e.hp)} / ${e.maxHp} PV</b></label><div class="bar enemy-hp"><i style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></i></div></button>`).join("");
  $$("[data-bar-target]").forEach(b=>b.onclick=()=>{combat.target=+b.dataset.barTarget;renderEnemies()});
  const target=targetEnemy(),phase=target?.boss?GAME_RULES.bossPhase(target.hp,target.maxHp):0;
  const targetMutations=combatMutationProfiles(target?.mutations);$("#target-card").innerHTML=target?`<small>CIBLE ACTIVE · LIGNE ${target.position.toUpperCase()}</small><b>${target.name}</b><span>Niv. ${target.level} · ${target.tags?.join(" · ")||"hostile"}</span>${targetMutations.length?`<div class="target-mutations">${targetMutations.map(mutation=>`<i title="${mutation.description}">${mutation.icon} ${mutation.name}</i>`).join("")}</div>`:""}<em>${target.boss?`Boss · Phase ${phase}${combat.bossAwakened?" · Rituel brisé":""}`:`${target.intent?.label||"Attaque"} · ≈ ${Math.round((target.damage+Math.floor(combat.turn/2))*(target.intent?.multiplier||1))} dégâts`}</em><div class="affinity-line"><i>Posture ${target.posture}/${target.postureMax}</i><i>Phys. ${Math.round((target.resistances.physical||0)*100)}%</i><i>Feu ${Math.round((target.resistances.fire||0)*100)}%</i><i>Saign. ${Math.round((target.resistances.bleed||0)*100)}%</i></div><div class="target-statuses">${statusBadges(target.statuses)}</div>`:"";
}
function updateBattle(){
  $("#battle-hp").style.width=`${state.hp/maxPlayerHp()*100}%`;$("#battle-hp-label").textContent=`${state.hp} / ${maxPlayerHp()} PV`;
  $("#battle-energy").style.width=`${state.energy/maxPlayerEnergy()*100}%`;$("#battle-energy-label").textContent=`${state.energy} / ${maxPlayerEnergy()}`;
  $("#battle-turn").textContent=combat.waveKeys.length>1?`${combat.turn} · ${combat.waveIndex+1}/${combat.waveKeys.length}`:combat.turn;$("#battle-power").textContent=powerScore();$("#battle-crit").textContent=`${Math.round(critChance()*100)} %`;$("#battle-armor").textContent=Math.floor(effectiveStats().Vitalité*.3);
  $("#class-resource-name").textContent=combat.classResource.name;$("#class-resource-value").textContent=`${combat.classResource.value} / ${combat.classResource.max}`;$("#class-resource-card").title=combat.classResource.description;$("#class-resource-card").className=`resource-${combat.classResource.id}`;$("#class-resource-card").style.setProperty("--resource-fill",`${combat.classResource.value/combat.classResource.max*100}%`);
  $("#hero-status").innerHTML=safeHtml`${combat.guard?"Garde active":state.hp/maxPlayerHp()<=.3?"État critique":"Prêt au combat"}<span class="hero-statuses">${statusBadges(combat.playerStatuses)}</span>`;
  $(".battlefield").classList.toggle("low-health",state.hp/maxPlayerHp()<=.3);$("#potion-count").textContent=`x${state.potions} · +35 PV`;renderCombatActions();renderEnemies();updateHud();
}
function updateTutorial(){
  if(!combat.tutorial){$("#tutorial-box").classList.add("hidden");return}
  const firstAbility=abilityCatalog[state.equippedAbilities[0]],firstRank=state.abilityRanks[firstAbility.id]||1,firstCost=abilityCost(firstAbility,firstRank),steps=[["Frappez l'ennemi","Utilisez une attaque de base. Elle ne coûte aucune énergie.","attack"],["Préparez votre garde","La garde divise les dégâts de toutes les attaques du prochain tour.","guard"],["Libérez votre compétence",`Utilisez ${firstAbility.name}. Elle coûte ${firstCost} points d'énergie.`,"ability"],["Restaurez-vous","Utilisez une potion. Conservez-les ensuite pour les situations dangereuses.","potion"]];
  if(combat.step<4){$("#tutorial-box").classList.remove("hidden");const[t,c,a]=steps[combat.step];$("#tutorial-step").textContent=`${combat.step+1} / 4`;$("#tutorial-title").textContent=t;$("#tutorial-copy").textContent=c;$$("[data-combat]").forEach(b=>b.classList.toggle("suggested",a==="ability"?b.dataset.combat.startsWith("ability:"):b.dataset.combat===a))}
  else{$("#tutorial-box").classList.add("hidden");$$("[data-combat]").forEach(b=>b.classList.remove("suggested"))}
}
function combatAction(type){
  if(combat.busy||!livingEnemies().length)return;
  const category=type.startsWith("ability:")?"ability":type,required=["attack","guard","ability","potion"][combat.step];
  if(combat.tutorial&&combat.step<4&&category!==required){toast(`Tutoriel : utilisez ${required==="attack"?"Attaque":required==="guard"?"Garde":required==="potion"?"une Potion":"votre Compétence"}.`);return}
  const ability=category==="ability"?abilityCatalog[type.split(":")[1]]:null;
  const abilityRank=ability?(state.abilityRanks[ability.id]||1):1,actionCost=ability?combatAbilityCost(ability,abilityRank):0;
  if(ability&&state.energy<actionCost){toast("Pas assez d'énergie.");return}
  if(type==="potion"&&(!state.potions||(state.hp===maxPlayerHp()&&!(combat.tutorial&&combat.step===3)))){toast(state.potions?"Vos PV sont déjà au maximum.":"Vous n'avez plus de potion.");return}
  combat.busy=true;
  if(type==="attack"){animateCombat("#battle-hero","strike");playSound("attack");const target=targetEnemy(),weak=combat.playerStatuses.weakness?.potency||0,roll=rollPlayerDamage(Math.floor(playerDamage()*classResourceMultiplier(false)*outgoingMultiplier(target,null)*(1-weak/100))),targetName=target?.name||"l'ennemi";if(roll.critical)playSound("critical");const dealt=dealEnemy(roll.damage,"physical",1+buildBonus("postureBonus"));combat.lastAction="attack";advanceClassResource("attack");log(`${roll.critical?"Coup critique ! ":""}Vous infligez ${dealt} dégâts à ${targetName}.`)}
  if(type==="guard"){animateCombat("#battle-hero","guard-flash");playSound("ui");combat.guard=true;combat.lastAction="guard";state.run.guards=(state.run.guards||0)+1;advanceClassResource("guard");log("Vous vous protégez contre toutes les attaques du prochain tour. Rétribution sera renforcée.")}
  if(ability){
    animateCombat("#battle-hero","cast");playSound("ability");state.energy-=actionCost;const s=effectiveStats(),evolution=abilityEvolution(ability),hpCostMultiplier=evolution?.hpCostMultiplier??1,sacrifice=ability.hpCost?Math.max(1,Math.floor(maxPlayerHp()*ability.hpCost*hpCostMultiplier)):0,rankMultiplier=(1+(abilityRank-1)*.25)*abilityVariantMultiplier(ability)*(1+buildBonus("abilityDamage")+(ability.hpCost?buildBonus("sacrificeBonus")+(evolution?.sacrificeBonus||0):0))*classResourceMultiplier(true),baseDamage=Math.floor((ability.power+s[ability.scaling]*ability.ratio+state.level*1.5+sacrifice)*rankMultiplier),targets=ability.targets==="all"?[...livingEnemies()]:[targetEnemy()],weak=combat.playerStatuses.weakness?.potency||0,postureMultiplier=1+buildBonus("postureBonus")+(evolution?.postureBonus||0);let critical=false,totalDamage=0;
    const damageType=abilityEffects[ability.id]?.effects?.some(effect=>effect.type==="burn")?"fire":abilityEffects[ability.id]?.effects?.some(effect=>effect.type==="bleed")?"bleed":ability.scaling==="Esprit"?"fire":"physical";combat.abilityUses++;state.hp=Math.max(1,state.hp-sacrifice);targets.forEach(enemy=>{combat.target=enemy.id;const roll=rollPlayerDamage(Math.floor(baseDamage*outgoingMultiplier(enemy,ability)*(1-weak/100)));critical||=roll.critical;totalDamage+=dealEnemy(roll.damage,damageType,postureMultiplier)});
    if(combat.boss&&!combat.bossAwakened&&combat.abilityUses>=3){combat.bossAwakened=true;livingEnemies().filter(enemy=>enemy.boss).forEach(enemy=>{applyStatus(enemy,{type:"fury",turns:3,potency:25,enemy:true});applyStatus(enemy,{type:"barrier",turns:2,potency:Math.ceil(enemy.maxHp*.08),enemy:true})});log("Le rituel réagit à vos pouvoirs : le boss change de règle et s'éveille.")}
    if(critical)playSound("critical");const applied=applyAbilityEffects(ability,targets);if(evolution?.barrierOnCast)applyStatus(playerHolder(),{type:"barrier",turns:2,potency:Math.max(1,Math.round(maxPlayerHp()*evolution.barrierOnCast))});combat.lastAction=`ability:${ability.id}`;advanceClassResource("ability",ability);log(`${critical?"Coup critique ! ":""}${ability.name} inflige ${totalDamage} dégâts${targets.length>1?" au total":""}${applied?` · ${applied} appliqué`:""}${evolution?.barrierOnCast?" · Égide activée":""}${sacrifice?` · ${sacrifice} PV sacrifiés`:""}.`);
  }
  if(type==="potion"){animateCombat("#battle-hero","heal-flash");playSound("reward");const healing=Math.ceil(35*healingMultiplier());combat.potionsUsed++;state.potions--;state.hp=Math.min(maxPlayerHp(),state.hp+healing);log(`La potion restaure ${healing} PV.`)}
  const companionLog=triggerCompanionAction();if(companionLog)log(companionLog);if(combat.tutorial&&combat.step<4)combat.step++;updateTutorial();updateBattle();
  if(state.hp<=0){setTimeout(defeat,500);return}
  if(!livingEnemies().length){finishCombatWaveOrVictory();return}
  setTimeout(enemyTurn,combatDelay(650));
}
function dealEnemy(amount,damageType="physical",postureMultiplier=1){
  const enemy=targetEnemy();let dealt=Math.max(1,Math.round(amount*GAME_RULES.damageAffinity(damageType,enemy.resistances)));if(enemy.statuses.barrier){const absorbed=Math.min(dealt,enemy.statuses.barrier.potency);enemy.statuses.barrier.potency-=absorbed;dealt-=absorbed;if(enemy.statuses.barrier.potency<=0)delete enemy.statuses.barrier}enemy.hp-=dealt;enemy.posture=Math.max(0,enemy.posture-Math.round(GAME_RULES.postureDamage(dealt,enemy.maxHp)*postureMultiplier));if(enemy.posture===0&&!enemy.statuses.armorBreak){applyStatus(enemy,{type:"armorBreak",turns:2,potency:35});combat.postureBreaks++;state.run.postureBreaks=(state.run.postureBreaks||0)+1;playSound("break");combatFeedback("break");toast(`Posture de ${enemy.name} brisée !`)}triggerEnemyDefeatEffect(enemy);state.run.damageDealt+=dealt;playSound("hit");combatFeedback("hit");floatDamage(dealt,enemy.id);setTimeout(()=>{targetEnemy();renderEnemies()},combatDelay(300));return dealt;
}
function animateCombat(selector,className){const element=$(selector);if(!element)return;element.classList.remove(className);void element.offsetWidth;element.classList.add(className);setTimeout(()=>element.classList.remove(className),combatDelay(500))}
function summonCombatEcho(summoner){
  if(livingEnemies().length>=4)return false;
  const base=clone(enemyBook.echo),maxHp=Math.round(summoner.maxHp*.28),id=Math.max(...combat.enemies.map(enemy=>enemy.id))+1;
  combat.enemies.push({...base,id,level:summoner.level,hp:maxHp,maxHp,damage:Math.max(5,Math.round(summoner.damage*.55)),statuses:{},intent:null,position:"arrière",posture:70,postureMax:70,resistances:{physical:0,fire:.15,bleed:.25}});
  return true;
}
function enemyTurn(){
  $("#turn-label").textContent="TOUR ENNEMI";playSound("danger");animateCombat("#battle-hero","hero-hit");const attackers=livingEnemies();let total=0;
  const guardBonus=learnedPassiveObjects().reduce((sum,p)=>sum+(p.guardBonus||0),0)+buildBonus("guardBonus");
  const armor=Math.floor(effectiveStats().Vitalité*.3);
  let dotDealt=0;attackers.forEach(enemy=>{const dot=GAME_RULES.statusDamage(enemy.statuses);if(dot){enemy.hp-=dot;dotDealt+=dot;state.run.damageDealt+=dot;floatDamage(dot,enemy.id);triggerEnemyDefeatEffect(enemy)}});const dotHealing=Math.floor(dotDealt*buildBonus("dotHealing"));if(dotHealing)state.hp=Math.min(maxPlayerHp(),state.hp+dotHealing);const playerDot=GAME_RULES.statusDamage(combat.playerStatuses);if(playerDot)state.hp=Math.max(0,state.hp-playerDot);
  if(state.hp<=0){setTimeout(defeat,combatDelay(450));return}if(!livingEnemies().length){finishCombatWaveOrVictory(450);return}
  let bossMessage=livingEnemies().filter(enemy=>enemy.boss).map(triggerFinalBossPhase).join("");
  livingEnemies().forEach((enemy,i)=>{const intent=enemy.intent||GAME_RULES.enemyIntent(enemy.tags||[],combat.turn,0);
    if(intent.type==="guard"){applyStatus(enemy,{type:"barrier",turns:2,potency:Math.ceil(enemy.maxHp*.12),enemy:true});bossMessage+=" Une Barrière ennemie apparaît.";return}
    if(intent.type==="protect"){const ally=livingEnemies().filter(target=>target.id!==enemy.id).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]||enemy;applyStatus(ally,{type:"barrier",turns:2,potency:Math.ceil(ally.maxHp*.18),enemy:true});bossMessage+=` ${enemy.name} protège ${ally.name}.`;return}
    if(intent.type==="heal"){const ally=livingEnemies().sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0],healing=Math.ceil(ally.maxHp*.16);ally.hp=Math.min(ally.maxHp,ally.hp+healing);bossMessage+=` ${enemy.name} rend ${healing} PV à ${ally.name}.`;return}
    if(intent.type==="rally"){livingEnemies().forEach(ally=>applyStatus(ally,{type:"fury",turns:2,potency:20,enemy:true}));bossMessage+=` ${enemy.name} renforce tout le groupe.`;return}
    if(intent.type==="summon"){bossMessage+=summonCombatEcho(enemy)?` ${enemy.name} invoque un Écho sans nom.`:` L'invocation de ${enemy.name} échoue.`;return}
    let raw=(enemy.damage+Math.floor(combat.turn/2))*intent.multiplier,effectiveArmor=armor;if(enemy.statuses.fury)raw*=1+(enemy.statuses.fury.potency||20)/100;if(enemy.statuses.weakness)raw*=1-(enemy.statuses.weakness.potency||25)/100;if(intent.status==="bleed")applyStatus(playerHolder(),{type:"bleed",turns:3,potency:Math.max(3,Math.round(enemy.damage*.18)),enemy:true});if(intent.status==="weakness")applyStatus(playerHolder(),{type:"weakness",turns:2,potency:25,enemy:true});if(enemy.boss&&combat.bossMechanic==="asterion"&&intent.type==="drain"){state.energy=Math.max(0,state.energy-1);bossMessage+=" Asterion consume 1 énergie."}if(intent.type==="ultimate"){effectiveArmor=Math.floor(armor*.5);bossMessage+=" L'Extinction traverse une partie de l'armure."}const guarded=combat.guard?Math.ceil(raw*Math.max(.2,.5-guardBonus)):raw,damage=Math.max(1,Math.round(guarded)-effectiveArmor);total+=damage;if(enemy.mutationEffects?.lifesteal&&damage){const healing=Math.round(damage*enemy.mutationEffects.lifesteal);enemy.hp=Math.min(enemy.maxHp,enemy.hp+healing);bossMessage+=` ${enemy.name} absorbe ${healing} PV.`}setTimeout(()=>floatDamage(damage,"hero"),i*220)});
  const barrier=combat.playerStatuses.barrier;if(barrier&&total){const absorbed=Math.min(total,barrier.potency);barrier.potency-=absorbed;total-=absorbed;bossMessage+=` Barrière : ${absorbed} dégâts absorbés.`;if(barrier.potency<=0)delete combat.playerStatuses.barrier}
  combat.guard=false;state.hp=Math.max(0,state.hp-total);state.run.damageTaken+=total+playerDot;if(total||playerDot)combatFeedback("hero");const regen=Math.round((combat.playerStatuses.regeneration?.potency||0)*(1+buildBonus("healingBonus")));if(regen)state.hp=Math.min(maxPlayerHp(),state.hp+regen);
  combat.enemies.forEach(enemy=>enemy.statuses=GAME_RULES.tickStatuses(enemy.statuses));combat.playerStatuses=GAME_RULES.tickStatuses(combat.playerStatuses);const hazardMessage=triggerCombatHazard();
  log(`${attackers.length>1?"Les adversaires":"L'ennemi"} vous inflige${attackers.length>1?"nt":""} ${total} dégâts.${playerDot?` Vous subissez ${playerDot} dégâts persistants.`:""}${regen?` Régénération : +${regen} PV.`:""}${dotHealing?` Piste écarlate : +${dotHealing} PV.`:""}${bossMessage}${hazardMessage}`);combat.turn++;prepareEnemyIntents();updateBattle();if(!combat.training)save();
  if(state.hp<=0){setTimeout(defeat,combatDelay(700));return}
  setTimeout(()=>{$("#turn-label").textContent=`À VOTRE TOUR${combat.waveKeys.length>1?` · VAGUE ${combat.waveIndex+1}/${combat.waveKeys.length}`:""}`;combat.busy=false},combatDelay(500+attackers.length*180));
}
function defeat(){if(combat?.training){const snapshot=combat.trainingSnapshot;state.hp=snapshot.hp;state.energy=snapshot.energy;state.potions=snapshot.potions;state.run=snapshot.run;combat=null;save();showScreen("exploration");toast("Fin de l'entraînement. Aucun progrès n'a été perdu.");return}if(combat?.nemesis)promoteNemesis();pendingEvent={type:"defeat",nemesis:!!combat?.nemesis};$("#event-eyebrow").textContent=combat?.nemesis?"LA NÉMÉSIS TRIOMPHE":"Expédition brisée";$("#event-icon").textContent="☠";$("#event-title").textContent=combat?.nemesis?`${state.nemesis.name} évolue`:"Vous êtes tombé";$("#event-copy").textContent=combat?.nemesis?`Votre adversaire grave cette victoire dans sa chair. Elle atteint le rang ${state.nemesis.rank} et reviendra avec de nouvelles forces.`:"La mort refuse encore votre nom. Quelque chose vous ramène en arrière, mais réclame son tribut.";$("#event-reward").innerHTML=safeHtml`<b>Repli forcé</b><span>50 % des PV restaurés · perte de 10 % des éclats${combat?.nemesis?" · Némésis renforcée":""}</span>`;save();openPanel("event")}
function floatDamage(amount,target){const el=document.createElement("b");el.className=`float-damage ${target==="hero"?"hero":"enemy enemy-"+target}`;el.textContent=`-${amount}`;$("#damage-layer").append(el);setTimeout(()=>el.remove(),combatDelay(900))}
function renderCombatHistory(){
  const history=$("#combat-history"),toggle=$(".combat-log-toggle");if(!history||!combat)return;history.classList.toggle("open",combat.logOpen);toggle?.setAttribute("aria-expanded",String(combat.logOpen));if(toggle)toggle.querySelector("span").textContent=combat.logOpen?"▾":"▴";
  history.innerHTML=safeHtml([...combat.history].reverse().slice(0,10).map(entry=>`<div class="${entry.tone}"><small>TOUR ${entry.turn}</small><span>${entry.text}</span></div>`).join(""));
}
function log(text){
  const current=$("#combat-log");if(current)current.textContent=text;if(!combat)return;const tone=/boss|Maître|couronne|rituel|phase/i.test(text)?"major":/dégâts|explose|Brûlure|Saignement/i.test(text)?"danger":/restaure|Barrière|protég/i.test(text)?"positive":"neutral";combat.history||=[];combat.history.push({turn:combat.turn,text,tone});if(combat.history.length>30)combat.history.shift();renderCombatHistory();
}
function toggleCombatHistory(){if(!combat)return;combat.logOpen=!combat.logOpen;renderCombatHistory()}
function grantExperience(amount){
  const gains=[];if(state.level>=GAME_DATA.progression.maxLevel)return gains;state.xp+=amount;
  while(state.level<GAME_DATA.progression.maxLevel&&state.xp>=state.xpNext){
    state.xp-=state.xpNext;state.level++;
    const growth=hero().growth;Object.entries(growth).forEach(([k,v])=>state.statBonuses[k]+=v);
    const hpGain=10+growth.Vitalité*3,energyGain=1+(growth.Esprit>=3?1:0);state.maxHp+=hpGain;state.maxEnergy+=energyGain;state.hp=maxPlayerHp();state.energy=maxPlayerEnergy();
    const gain={level:state.level,hp:hpGain,energy:energyGain,growth,abilities:[],passives:[]};syncLevelUnlocks(state.level,gain);gains.push(gain);
    state.xpNext=state.level>=GAME_DATA.progression.maxLevel?0:xpForLevel(state.level);
  }
  if(state.level>=GAME_DATA.progression.maxLevel){state.xp=0;state.xpNext=0}
  return gains;
}
function victory(){
  if(combat.training){const snapshot=combat.trainingSnapshot;state.hp=snapshot.hp;state.energy=snapshot.energy;state.potions=snapshot.potions;state.run=snapshot.run;combat=null;save();showScreen("exploration");toast("Entraînement terminé. Vos ressources ont été restaurées.");return}
  const mastery=combat.boss&&combat.potionsUsed===0&&combat.postureBreaks>0,masteryGold=mastery?75:0;playSound("reward");combatFeedback("victory");clearCurrentNode();state.battlesWon++;state.gold+=combat.rewardGold+masteryGold;if(mastery)state.resources.star_fragment=(state.resources.star_fragment||0)+1;const levelGains=grantExperience(combat.rewardXp);
  advanceContract("battle");if(combat.elite||combat.abyss)advanceContract("elite");if(combat.potionsUsed===0)advanceContract("potionless");if(combat.boss)advanceContract("boss");
  if(combat.nemesis){state.nemesis.alive=false;state.nemesis.defeated=true;state.nemesis.lastResult="Sa marque se dissout enfin dans la cendre.";state.run.nemesesDefeated=(state.run.nemesesDefeated||0)+1;state.resources.star_fragment=(state.resources.star_fragment||0)+1}
  if(combat.boss){state.run.bossesDefeated++;state.run.bossTrophies||=[];combat.enemies.filter(enemy=>enemy.boss&&enemy.catalogId).forEach(enemy=>{if(!state.run.bossTrophies.includes(enemy.catalogId))state.run.bossTrophies.push(enemy.catalogId)})}
  const challengeFlags={bossNoPotion:combat.boss&&combat.potionsUsed===0,classMastery:combat.boss&&((state.classId==="bastion"&&(state.run.guards||0)>=5)||(state.classId==="traqueuse"&&combat.potionsUsed===0)||(state.classId==="arcaniste"&&combat.abilityUses>=8)||(state.classId==="penitent"&&state.hp/maxPlayerHp()<.4))};evaluateChallenges(challengeFlags);
  const companion=activeCompanion();if(companion){const narrativeBonus=companion.id==="ilyra"&&state.narrative.flags.includes("watcher_saved")||companion.id==="orven"&&state.narrative.flags.includes("oath_shadowless")?1:0;state.companions.trust[companion.id]=Math.min(25,(state.companions.trust[companion.id]||0)+1+narrativeBonus+(combat.boss?2:0))}
  if(combat.regionEnd===1)state.completedRegion1=true;if(combat.regionEnd===2)state.completedRegion2=true;if(combat.regionEnd===3)state.completedRegion3=true;if(combat.regionEnd===4)state.completedRegion4=true;
  pendingEvent={type:"victory",levelGains,boss:combat.boss,elite:combat.elite,abyss:combat.abyss,nemesis:combat.nemesis,mastery,regionEnd:combat.regionEnd,featuredItem:combat.rewardItem};$("#victory-panel .eyebrow").textContent=combat.regionEnd===4?"LE SERMENT EST ROMPU":combat.nemesis?"NÉMÉSIS ABATTUE":mastery?"MAÎTRISE DU BOSS":combat.boss?"Boss vaincu":combat.abyss?"Abîme surmonté":combat.elite?"Défi accompli":"Victoire";$("#victory-panel h2").textContent=combat.regionEnd===4?"Le Maître dépose la couronne":combat.nemesis?`${state.nemesis.name} tombe`:combat.regionEnd===2?"Le Gardien ferme les yeux":combat.boss?"Le Seigneur est tombé":combat.abyss?"L'impossible a cédé":"La cendre retombe";
  $("#victory-panel .rewards").innerHTML=safeHtml`<div><span>✦</span><b>+${combat.rewardXp} XP</b><small>Expérience</small></div><div><span>◆</span><b>+${combat.rewardGold+masteryGold}</b><small>Éclats${mastery?" · bonus":""}</small></div><div><span>${mastery?"✥":"◇"}</span><b>${mastery?"+1 fragment":"1 choix"}</b><small>${mastery?"Boss sans potion":"Récompense"}</small></div>`;
  $("#level-up").textContent=levelGains.length?`NIVEAU SUPÉRIEUR — NIVEAU ${state.level}`:"EXPÉRIENCE ACQUISE";save();openPanel("victory");
}
function claimVictory(){
  beginRewardDraft();
}
function abilityRarity(ability){const index=GAME_DATA.abilities[state.classId].findIndex(a=>a.id===ability.id);return index>=7?"légendaire":index>=5?"épique":index>=3?"rare":"commun"}
function rewardFromItem(item){const worn=state.equipped[item.slot],delta=itemPower(item)-itemPower(worn);return {kind:"item",id:item.id,rarity:item.rarity,title:item.name,kicker:`${item.slot} · ${item.rarity}`,description:item.description,detail:`${formatStats(item.stats)} · ${delta>0?`+${delta} puissance`:delta<0?`${delta} puissance`:"puissance équivalente"}`}}
function beginRewardDraft(){
  const allowedRarities=pendingEvent.boss||pendingEvent.abyss?["épique","légendaire"]:pendingEvent.elite?["rare","épique"]:["commun","rare"];
  const classAbilities=GAME_DATA.abilities[state.classId],classPassives=GAME_DATA.passives[state.classId],skillPool=[];
  classAbilities.filter((a,index)=>GAME_DATA.progression.abilityLevels[index]<=state.level&&(!a.region||state.currentRegion>=a.region)&&!state.learnedAbilities.includes(a.id)&&allowedRarities.includes(abilityRarity(a))).forEach(a=>skillPool.push({kind:"ability",id:a.id,rarity:abilityRarity(a),title:a.name,kicker:"Nouvelle attaque",description:a.description,detail:`${a.cost} énergie · ${a.power} puissance · ${a.scaling}`}));
  classPassives.map((p,i)=>({p,i,rarity:i>=8?"légendaire":i>=5?"épique":i>=2?"rare":"commun"})).filter(({p,i,rarity})=>GAME_DATA.progression.passiveLevels[i]<=state.level&&(!p.region||state.currentRegion>=p.region)&&!state.learnedPassives.includes(p.id)&&allowedRarities.includes(rarity)).forEach(({p,rarity})=>skillPool.push({kind:"passive",id:p.id,rarity,title:p.name,kicker:"Nouveau passif",description:p.description,detail:"Toujours actif après apprentissage"}));
  state.learnedAbilities.filter(id=>(state.abilityRanks[id]||1)<3).forEach(id=>{const a=abilityCatalog[id],rank=state.abilityRanks[id]||1,rarity=rank===2?"épique":"rare";if(allowedRarities.includes(rarity))skillPool.push({kind:"upgrade",id,rarity,title:a.name,kicker:`Amélioration · Rang ${rank+1}`,description:`Puissance augmentée de 25 %${rank===2?" et coût réduit de 1":""}.`,detail:`Rang ${rank} → Rang ${rank+1}`})});
  const itemPool=GAME_DATA.items.filter(item=>allowedRarities.includes(item.rarity)&&(!item.region||item.region<=state.currentRegion));
  const resourcePool=[
    {kind:"resource",id:"potions",rarity:"commun",title:"Réserve d'alchimiste",kicker:"Ressource",description:"Ajoute deux potions mineures à l'inventaire.",detail:"+2 potions"},
    {kind:"resource",id:"shards",rarity:"commun",title:"Bourse de braises",kicker:"Ressource",description:"Des éclats utilisables lors d'une future étape.",detail:`+${pendingEvent.elite?55:35} éclats`},
    {kind:"resource",id:"renewal",rarity:"rare",title:"Souffle de renouveau",kicker:"Restauration",description:"Restaure tous les PV et augmente les PV maximum.",detail:"Soin complet · +8 PV max"},
    {kind:"resource",id:"materials",rarity:"rare",title:"Caisse du forgeron",kicker:"Matériaux",description:"Des composants nécessaires aux améliorations d'équipement.",detail:"+5 fer · +2 braises"}
  ];
  rewardDraft=[];
  if(pendingEvent.featuredItem)rewardDraft.push(rewardFromItem(pendingEvent.featuredItem));
  if(skillPool.length)rewardDraft.push(clone(rand(skillPool)));
  if(itemPool.length&&rewardDraft.length<3)rewardDraft.push(rewardFromItem(makeItem(smartItemId(itemPool.map(i=>i.id)))));
  while(rewardDraft.length<3){const source=skillPool.length&&random()>.45?skillPool:resourcePool;const candidate=clone(rand(source));if(!rewardDraft.some(r=>r.kind===candidate.kind&&r.id===candidate.id))rewardDraft.push(candidate)}
  rewardDraft=rewardDraft.slice(0,3);renderRewardDraft();openPanel("reward");
}
function renderRewardDraft(){
  const icons={ability:"✦",passive:"◈",upgrade:"▲",item:"◆",resource:"⚗"};
  $("#reward-choices").innerHTML=rewardDraft.map((reward,index)=>{const rarity=rarityInfo(reward.rarity);return `<button class="reward-card rarity-${rarity.color}" data-reward="${index}"><small>${reward.kicker}</small><span>${icons[reward.kind]}</span><h3>${reward.title}</h3><p>${reward.description}</p><b>${reward.detail}</b><em>${rarity.label}</em></button>`}).join("");
  $("#skip-value").textContent=`+${pendingEvent.boss?60:pendingEvent.abyss?50:pendingEvent.elite?35:20}`;
  $$("[data-reward]").forEach(button=>button.onclick=()=>chooseReward(+button.dataset.reward));
}
function chooseReward(index){
  const reward=rewardDraft[index];
  if(reward.kind==="ability"){state.learnedAbilities.push(reward.id);state.abilityRanks[reward.id]=1;if(state.equippedAbilities.length<4)state.equippedAbilities.push(reward.id)}
  if(reward.kind==="passive")state.learnedPassives.push(reward.id);
  if(reward.kind==="upgrade")state.abilityRanks[reward.id]=(state.abilityRanks[reward.id]||1)+1;
  if(reward.kind==="item")addItem(makeItem(reward.id));
  if(reward.kind==="resource"&&reward.id==="potions")state.potions+=2;
  if(reward.kind==="resource"&&reward.id==="shards")state.gold+=pendingEvent.elite?55:35;
  if(reward.kind==="resource"&&reward.id==="renewal"){state.maxHp+=8;state.hp=maxPlayerHp()}
  if(reward.kind==="resource"&&reward.id==="materials"){state.resources.iron+=5;state.resources.ember+=2}
  toast(`${reward.title} obtenu.`);finishReward();
}
function skipReward(){state.gold+=pendingEvent.boss?60:pendingEvent.abyss?50:pendingEvent.elite?35:20;toast("Récompenses converties en éclats.");finishReward()}
function endingProgress(){
  const present=state.companions.unlocked.filter(id=>!state.companions.departed.includes(id)),trust=present.reduce((sum,id)=>sum+(state.companions.trust[id]||0),0),quests=present.filter(id=>state.companions.quests[id]==="completed").length;
  return {present,trust,quests,decisions:state.narrative.decisions.length};
}
function endingAvailable(id){
  const progress=endingProgress();if(id==="wanderer")return progress.decisions>=3;if(id==="remembered")return progress.trust>=30&&progress.quests>=2;return true;
}
function openFinalChoice(){
  const progress=endingProgress();state.campaign.finalChoice="pending";save();
  $("#ending-context").innerHTML=safeHtml`<span><b>${progress.decisions}</b><small>Décisions</small></span><span><b>${progress.trust}</b><small>Confiance</small></span><span><b>${progress.quests}/3</b><small>Quêtes alliées</small></span>`;
  $("#ending-choices").innerHTML=GAME_DATA.endings.map(ending=>{const available=endingAvailable(ending.id);return `<button data-ending="${ending.id}" class="ending-choice ${ending.tone} ${available?"":"locked"}" ${available?"":"disabled"}><span>${available?ending.icon:"?"}</span><div><small>${ending.secret?"ISSUE SECRÈTE":"DESTIN DU MONDE"}</small><b>${available?ending.choice:"Choix encore voilé"}</b><p>${available?ending.description:"Les souvenirs nécessaires n'ont pas tous été rassemblés."}</p><em>${available?ending.name:ending.requirement}</em></div></button>`}).join("");
  openPanel("ending");
}
function companionEndingSlide(id,endingId,index){
  const companion=GAME_DATA.companions.find(entry=>entry.id===id),trust=state.companions.trust[id]||0,questDone=state.companions.quests[id]==="completed",roman=["I","II","III","IV","V","VI","VII","VIII","IX","X"][index]||String(index+1),destinies={
    guardian:`${companion.name} garde l'entrée du Brasier. ${questDone?"Sa propre quête achevée,":"Toujours poursuivi par son passé,"} ${trust>=15?"nul ne veille plus fidèlement sur votre silence.":"il continue pourtant d'attendre une parole qui ne viendra plus."}`,
    sovereign:`${companion.name} quitte la nouvelle cour avant que ses bannières ne portent votre symbole. ${trust>=15?"Votre amitié demeure, mais aucune couronne ne suffit à la commander.":"Dans les récits futurs, son nom devient celui du premier opposant."}`,
    wanderer:`${companion.name} reprend la route dans un monde sans frontière. ${questDone?"Libéré de son ancienne dette,":"Avec sa quête encore inachevée,"} ${trust>=15?"il raconte qu'un héros sans nom lui rendit le choix de partir.":"il ne parle jamais de votre dernier adieu."}`,
    remembered:`${companion.name} prononce votre nom sans que le monde tremble. Le souvenir partagé devient une preuve : vous avez été plus qu'une arme, et votre route ne fut jamais solitaire.`
  };
  return {roman,kicker:`Épilogue · ${companion.role}`,title:companion.name,copy:destinies[endingId],art:id==="ilyra"?"oath":id==="orven"?"memory":"mask"};
}
function buildEndingSlides(ending){
  const cores={
    guardian:[
      ["Le sceau refermé","Vous replacez la couronne sur un trône qui n'attendait que vous. Le Maître sourit pour la première fois, puis devient une poignée de cendre libre.","oath"],
      ["Un monde préservé","Les routes cessent de trembler. Au loin, les foyers se rallument. Personne ne saura qu'une sentinelle sans nom porte désormais seule le poids du Brasier.","world"]
    ],
    sovereign:[
      ["Le pouvoir accepté","Vous prenez la couronne. Elle ne brûle pas : elle reconnaît la main qui l'avait créée. Le Maître s'incline, non devant un vainqueur, mais devant son successeur.","throne"],
      ["Un nouvel ordre","La cendre cesse de tomber là où vous le décidez. Des cités renaissent et d'autres disparaissent des cartes. Le monde est sauvé, mais il apprend à craindre votre silence.","ash"]
    ],
    wanderer:[
      ["La couronne brisée","Vous fracassez la couronne contre le bord du monde. Le Brasier hurle, puis s'éteint comme une étoile arrivée au terme de son nom.","fracture"],
      ["Le monde sans gardien","Les routes deviennent imprévisibles et libres. Aucun maître ne les protège désormais. Pour la première fois, l'avenir n'a pas déjà eu lieu.","lastroad"]
    ],
    remembered:[
      ["Le nom prononcé","Les voix de vos compagnons rejoignent la vôtre. Le nom oublié traverse le Brasier sans être consumé. Le Maître baisse les yeux : il se souvient enfin de son ami.","memory"],
      ["Le serment transformé","Vous ne détruisez ni le sceau ni celui qui le gardait. Vous partagez son fardeau, afin qu'aucun héros ne doive plus revenir seul et sans visage.","origin"]
    ]
  };
  const roman=["I","II","III","IV","V","VI","VII","VIII","IX","X"],slides=cores[ending.id].map((entry,index)=>({roman:roman[index],kicker:index?"Après la dernière bataille":"Le choix du héros",title:entry[0],copy:entry[1],art:entry[2]})),present=endingProgress().present;
  present.forEach(id=>slides.push(companionEndingSlide(id,ending.id,slides.length)));
  slides.push({roman:roman[slides.length],kicker:"Les Cendres d'Astréa",title:ending.name,copy:ending.id==="remembered"?"Lorsque la route vous demande enfin qui vous êtes, la réponse ne disparaît plus. Quelque part, une nouvelle histoire commence par votre nom.":"Lorsque les conteurs chercheront le nom du héros, ils ne trouveront qu'une route, une arme posée dans la poussière et le souvenir d'un monde qui aurait pu finir.",art:"dawn"});
  return slides;
}
function chooseFinalEnding(id){
  const ending=GAME_DATA.endings.find(entry=>entry.id===id);if(!ending||!endingAvailable(id))return;
  state.campaign.finalChoice=id;state.campaign.ending=id;state.campaign.completed=true;if(!state.discoveries.lore.includes("final_truth"))state.discoveries.lore.push("final_truth");if(!state.discoveries.lore.includes(`ending_${id}`))state.discoveries.lore.push(`ending_${id}`);state.narrative.decisions.push({event:"final_choice",choice:id,label:ending.choice,result:ending.description,region:4});save();
  endingMode=true;slideDeck=buildEndingSlides(ending);slideIndex=0;closeOverlay(true);showScreen("prologue");renderSlide();
}
function finishReward(){
  const gains=pendingEvent?.levelGains||[],boss=pendingEvent?.boss;pendingEvent=null;rewardDraft=[];save();closeOverlay();showScreen("exploration");
  if(state.completedRegion4){setTimeout(openFinalChoice,350);return}
  if(gains.length)setTimeout(()=>showLevelGains(gains[gains.length-1]),250);
  else if(!showCompanionMilestone())toast(boss?"Le Gardien est vaincu. La route se souvient.":"Votre choix façonne cette expédition.");
}
function forgeCost(item){
  const next=(item.level||1)+1,rank=rarityInfo(item.rarity).rank;
  const cost={iron:next*(2+rank),ember:rank>=2?Math.ceil(next*(rank-1)/2):0,essence:rank>=3?Math.ceil((next-1)*(rank-2)/2):0};
  if(item.region>=2){cost.pale_fiber=Math.ceil(next/2);if(rank>=2)cost.moon_glass=Math.ceil(next*rank/3);if(rank>=4)cost.star_fragment=Math.ceil((next-1)/2)}
  return cost;
}
function canAfford(cost){return Object.entries(cost).every(([id,amount])=>(state.resources[id]||0)>=amount)}
function formatResourceCost(cost){return Object.entries(cost).filter(([,amount])=>amount>0).map(([id,amount])=>{const resource=GAME_DATA.resources.find(r=>r.id===id);return `${resource?.icon||"◆"} ${amount} ${resource?.name||id}`}).join(" · ")}
function scaledItemStats(item,level=item.level||1){return Object.fromEntries(Object.entries(item.stats||{}).map(([key,value])=>[key,Math.ceil(value*(1+(level-1)*.25))]))}
function itemMaxLevel(item){return GAME_RULES.maxItemLevel(rarityInfo(item.rarity).rank)}
function rebuildItemStats(item){item.stats=GAME_RULES.applyAffix(item.baseStats||itemCatalog[item.id].stats,item.affix);if(item.rune)item.stats=GAME_RULES.applyAffix(item.stats,item.rune)}
function merchantStock(){if(state.merchantStock)return state.merchantStock;const available=GAME_DATA.items.filter(item=>!item.region||item.region<=state.currentRegion),ids=GAME_RULES.deterministicStock(available.map(item=>item.id),state.seed,5);state.merchantStock=ids.map((id,index)=>({id,price:rarityInfo(itemCatalog[id].rarity).rank*45+10+index*4}));return state.merchantStock}
function openForge(){if(showGuide("forge"))return;openPanel("forge")}
function renderForge(){
  $("#forge-resources").innerHTML=GAME_DATA.resources.map(resource=>`<div><span>${resource.icon}</span><b>${state.resources[resource.id]||0}</b><small>${resource.name}</small></div>`).join("");
  $("#forge-items").innerHTML=state.inventory.length?state.inventory.map((item,index)=>{item.level||=1;const info=rarityInfo(item.rarity),cost=forgeCost(item),limit=itemMaxLevel(item),max=item.level>=limit,sell=info.rank*15+item.level*8,salvage={iron:info.rank*2+item.level,ember:Math.max(0,info.rank-1),essence:info.rank>=3?1:0},next=max?null:scaledItemStats(item,item.level+1),enchantCost={ember:2+info.rank,essence:info.rank>=3?1:0};return `<article class="forge-item rarity-${info.color}"><div class="forge-item-head"><span>${item.slot==="Arme"?"⚔":item.slot==="Armure"?"♜":"◉"}</span><div><small>${info.label} · Niveau ${item.level}/${limit}${item.affix?` · ${item.affix.name}`:""}${item.rune?` · ${item.rune.icon} ${item.rune.name}`:""}</small><h3>${itemDisplayName(item)}</h3><p>${formatStats(scaledItemStats(item))}${next?` → <b>${formatStats(next)}</b>`:""}</p></div></div><div class="forge-cost">${max?"NIVEAU MAXIMUM":`Amélioration : ${formatResourceCost(cost)}`}</div><div class="forge-actions"><button data-forge-upgrade="${index}" ${max||!canAfford(cost)?"disabled":""}>${max?"Maximum":"Améliorer"}</button><button data-enchant="${index}" ${!canAfford(enchantCost)?"disabled":""}>Enchanter · ${formatResourceCost(enchantCost)}</button><button data-socket="${index}" ${item.rune?"disabled":""}>${item.rune?"Rune sertie":"Sertir une rune"}</button><button data-forge-sell="${index}">Vendre · ${sell} ◆</button><button data-forge-salvage="${index}">Démanteler · ${formatResourceCost(salvage)}</button></div></article>`}).join(""):`<div class="forge-empty">Votre inventaire ne contient aucun équipement à travailler.</div>`;
  $("#crafting-items").innerHTML=buildData.recipes.map(recipe=>{const known=state.recipes.includes(recipe.id),item=itemCatalog[recipe.item];return `<article class="craft-card ${known?"":"locked"}"><span>⚒</span><div><small>${known?"RECETTE APPRISE":"RECETTE INCONNUE"}</small><h3>${known?item.name:"Plan non découvert"}</h3><p>${known?`${formatStats(item.stats)} · ${formatResourceCost(recipe.cost)}`:"Explorez les détours les plus dangereux."}</p></div><button data-craft="${recipe.id}" ${!known||!canAfford(recipe.cost)?"disabled":""}>Fabriquer</button></article>`}).join("");
  $("#merchant-items").innerHTML=merchantStock().length?merchantStock().map((entry,index)=>{const item=itemCatalog[entry.id],info=rarityInfo(item.rarity);return `<article class="merchant-card rarity-${info.color}"><span>${item.slot==="Arme"?"⚔":item.slot==="Armure"?"♜":"◉"}</span><div><small>${info.label} · ${item.slot}</small><h3>${item.name}</h3><p>${formatStats(item.stats)}</p></div><button data-buy="${index}" ${state.gold<entry.price?"disabled":""}>${entry.price} ◆</button></article>`}).join(""):`<div class="forge-empty">Le marchand a vendu tout son stock.</div>`;
  $$("[data-forge-upgrade]").forEach(button=>button.onclick=()=>upgradeItem(+button.dataset.forgeUpgrade));
  $$("[data-forge-sell]").forEach(button=>button.onclick=()=>sellItem(+button.dataset.forgeSell));
  $$("[data-forge-salvage]").forEach(button=>button.onclick=()=>salvageItem(+button.dataset.forgeSalvage));
  $$("[data-enchant]").forEach(button=>button.onclick=()=>enchantItem(+button.dataset.enchant));
  $$("[data-socket]").forEach(button=>button.onclick=()=>socketItem(+button.dataset.socket));
  $$("[data-craft]").forEach(button=>button.onclick=()=>craftRecipe(button.dataset.craft));
  $$("[data-buy]").forEach(button=>button.onclick=()=>buyMerchantItem(+button.dataset.buy));
}
function upgradeItem(index){
  const item=state.inventory[index],cost=forgeCost(item);if(item.level>=itemMaxLevel(item)||!canAfford(cost))return;
  Object.entries(cost).forEach(([id,amount])=>state.resources[id]-=amount);item.level++;if(state.equipped[item.slot]?.uid===item.uid)state.equipped[item.slot]=item;
  save();renderForge();toast(`${item.name} atteint le niveau ${item.level}.`);
}
function sellItem(index){
  const item=state.inventory[index],info=rarityInfo(item.rarity),value=info.rank*15+(item.level||1)*8;
  if(state.equipped[item.slot]?.uid===item.uid)state.equipped[item.slot]=null;
  state.inventory.splice(index,1);state.gold+=value;state.hp=Math.min(state.hp,maxPlayerHp());state.energy=Math.min(state.energy,maxPlayerEnergy());save();renderForge();toast(`${item.name} vendu pour ${value} éclats.`);
}
function salvageItem(index){const item=state.inventory[index],rank=rarityInfo(item.rarity).rank,gains={iron:rank*2+(item.level||1),ember:Math.max(0,rank-1),essence:rank>=3?1:0};if(state.equipped[item.slot]?.uid===item.uid)state.equipped[item.slot]=null;state.inventory.splice(index,1);Object.entries(gains).forEach(([id,amount])=>state.resources[id]+=amount);state.hp=Math.min(state.hp,maxPlayerHp());state.energy=Math.min(state.energy,maxPlayerEnergy());save();renderForge();toast(`${itemDisplayName(item)} démantelé en matériaux.`)}
function enchantItem(index){const item=state.inventory[index],rank=rarityInfo(item.rarity).rank,cost={ember:2+rank,essence:rank>=3?1:0};if(!canAfford(cost))return;Object.entries(cost).forEach(([id,amount])=>state.resources[id]-=amount);let affix=rand(buildData.affixes);if(item.affix&&buildData.affixes.length>1)while(affix.id===item.affix.id)affix=rand(buildData.affixes);item.affix=clone(affix);rebuildItemStats(item);save();renderForge();toast(`${item.name} reçoit l'affixe ${affix.name}.`)}
function socketItem(index){const item=state.inventory[index];if(item.rune)return;const rune=buildData.runes.find(candidate=>canAfford(candidate.cost));if(!rune){toast("Aucune rune ne peut être sertie avec vos ressources.");return}Object.entries(rune.cost).forEach(([id,amount])=>state.resources[id]-=amount);item.rune=clone(rune);rebuildItemStats(item);save();renderForge();toast(`${rune.name} sertie sur ${item.name}.`)}
function craftRecipe(id){const recipe=buildData.recipes.find(entry=>entry.id===id);if(!recipe||!state.recipes.includes(id)||!canAfford(recipe.cost))return;Object.entries(recipe.cost).forEach(([resource,amount])=>state.resources[resource]-=amount);addItem(makeItem(recipe.item));save();renderForge();toast(`${itemCatalog[recipe.item].name} fabriqué.`)}
function buyMerchantItem(index){const stock=merchantStock(),entry=stock[index];if(!entry||state.gold<entry.price)return;state.gold-=entry.price;addItem(makeItem(entry.id));stock.splice(index,1);save();renderForge();toast("Achat ajouté à l'inventaire.")}
function showLevelGains(g){
  $("#level-title").textContent=`Niveau ${g.level} atteint`;
  $("#level-gains").innerHTML=safeHtml`${Object.entries(g.growth).filter(([,v])=>v).map(([k,v])=>`<div><span>${k}</span><b>+${v}</b></div>`).join("")}<div><span>PV maximum</span><b>+${g.hp}</b></div><div><span>Énergie maximum</span><b>+${g.energy}</b></div><div><span>Dégâts de base</span><b>augmentés</b></div>${g.abilities.map(name=>`<div class="unlock"><span>Nouvelle attaque</span><b>${name}</b></div>`).join("")}${g.passives.map(name=>`<div class="unlock"><span>Nouveau passif</span><b>${name}</b></div>`).join("")}`;
  openPanel("level");
}
function pendingSpecializationLevel(){if(state.level>=10&&!state.specializations.some(id=>(buildData.specializations[state.classId][10]||[]).some(spec=>spec.id===id)))return 10;if(state.level>=20&&!state.specializations.some(id=>(buildData.specializations[state.classId][20]||[]).some(spec=>spec.id===id)))return 20;return 0}
function showSpecializationChoice(){
  const tier=pendingSpecializationLevel();if(!tier)return false;const chosen=state.specializations[0],options=(buildData.specializations[state.classId][tier]||[]).filter(spec=>!spec.requires||spec.requires===chosen);
  $("#specialization-panel h2").textContent=tier===10?"Choisissez votre discipline":"Accomplissez votre voie";
  $("#specialization-choices").innerHTML=options.map(spec=>`<button data-specialization="${spec.id}"><span>${tier===10?"I":"II"}</span><div><b>${spec.name}</b><p>${spec.description}</p><small>${formatStats(spec.stats||{})||"Pouvoir de spécialisation"}</small></div></button>`).join("");openPanel("specialization");return true;
}
function chooseSpecialization(id){const tier=pendingSpecializationLevel(),spec=(buildData.specializations[state.classId][tier]||[]).find(entry=>entry.id===id);if(!spec)return;state.specializations.push(id);state.hp=Math.min(maxPlayerHp(),state.hp+(spec.maxHp||0));state.energy=Math.min(maxPlayerEnergy(),state.energy+(spec.maxEnergy||0));save();closeOverlay();toast(`Voie choisie : ${spec.name}.`);if(pendingSpecializationLevel())setTimeout(showSpecializationChoice,250);else setTimeout(showCompanionMilestone,250)}

function openPanel(name){const guide={inventory:"equipment",skills:"powers",companions:"companion"}[name];if(guide&&showGuide(guide))return;$("#overlay").classList.add("open");$("#overlay").setAttribute("aria-hidden","false");$$(".side-panel,.modal-panel").forEach(p=>p.classList.remove("active"));$(`#${name}-panel`).classList.add("active");if(name==="profile")renderProfile();if(name==="inventory")renderInventory();if(name==="skills")renderSkills();if(name==="companions")renderCompanions();if(name==="contracts")renderContracts();if(name==="nemesis")renderNemesis();if(name==="challenges")renderChallenges();if(name==="saves")renderSaveSlots();if(name==="glossary")renderGlossary();if(name==="forge")renderForge();if(name==="sanctuary"){renderSanctuary();setAudioScene("sanctuary")}if(name==="codex")renderCodex();if(name==="settings")renderSettings()}
function closeOverlay(force=false){if(!force&&$("#ending-panel")?.classList.contains("active"))return;$("#overlay").classList.remove("open");$("#overlay").setAttribute("aria-hidden","true");$$(".side-panel,.modal-panel").forEach(p=>p.classList.remove("active"));setAudioScene(currentAudioScene())}
function panelNav(active){return `<nav class="panel-nav" aria-label="Menu du personnage"><button data-panel="profile" class="${active==="profile"?"active":""}">♙<span>Héros</span></button><button data-panel="inventory" class="${active==="inventory"?"active":""}">◇<span>Inventaire</span></button><button data-panel="skills" class="${active==="skills"?"active":""}">✦<span>Pouvoirs</span></button></nav>`}
function renderProfile(){
  const h=hero(),stats=effectiveStats(),gear=gearStats(),passives=passiveStats(),xpPercent=state.xpNext?Math.round(state.xp/state.xpNext*100):100,explanations={Force:"Dégâts physiques et puissance des techniques de Force.",Agilité:"Chance de critique et techniques rapides.",Vitalité:"Réduction des dégâts et réserve de PV.",Esprit:"Puissance occulte et réserve d'énergie."},specs=specializationObjects(),masteries=masteryObjects(),artifacts=equippedArtifactEffects(),sets=activeSetBonuses();$("#profile-content").innerHTML=safeHtml`${panelNav("profile")}<section class="hero-identity"><div class="profile-portrait" style="background:${h.art}">♙</div><div><small>${h.role}</small><h3>${h.name}</h3><span>Niveau ${state.level} · Puissance ${powerScore()}</span></div></section><div class="hero-xp"><label><span>PROGRESSION</span><b>${state.level>=30?"NIVEAU MAX":`${state.xp} / ${state.xpNext} XP`}</b></label><div class="bar"><i style="width:${xpPercent}%"></i></div></div><div class="profile-resources"><span><i>♥</i><b>${state.hp} / ${maxPlayerHp()}</b><small>Points de vie</small></span><span><i>✦</i><b>${state.energy} / ${maxPlayerEnergy()}</b><small>Énergie</small></span><span><i>⚔</i><b>${playerDamage()}</b><small>Dégâts de base</small></span><span><i>◆</i><b>${state.gold}</b><small>Éclats</small></span></div><div class="derived-stats"><span><b>${Math.round(critChance()*100)} %</b> critique</span><span><b>${Math.floor(stats.Vitalité*.3)}</b> armure</span><span><b>${masteries.length}/${masteryPointCap()}</b> maîtrises</span><span><b>${state.equippedAbilities.length}/4</b> arsenal</span></div>${specs.length?`<div class="build-path">${specs.map(spec=>`<span><small>SPÉCIALISATION</small><b>${spec.name}</b><em>${spec.description}</em></span>`).join("")}</div>`:""}${masteries.length?`<div class="set-bonuses">${masteries.map(node=>`<span>✦ <b>${node.name}</b> · ${node.branch}</span>`).join("")}</div>`:""}${artifacts.length?`<div class="set-bonuses artifact-list">${artifacts.map(effect=>`<span>☗ <b>${effect.name}</b> · ${effect.description}</span>`).join("")}</div>`:""}${sets.length?`<div class="set-bonuses">${sets.map(set=>`<span>◆ <b>${set.name}</b> · bonus ${set.required} pièces actif</span>`).join("")}</div>`:""}<div class="section-heading"><h4>Attributs</h4><small>Base + équipement + passifs + build</small></div>${Object.entries(stats).map(([n,v])=>`<div class="profile-stat detailed"><span><b>${n}</b><small>${explanations[n]}</small><em>${h.stats[n]+(state.statBonuses[n]||0)} base · +${gear[n]||0} équipement · +${passives[n]||0} passifs</em></span><strong>${v}</strong></div>`).join("")}<div class="talent"><strong>Talent · ${h.talent}</strong><span>${h.talentText}</span></div>`;
}
function renderInventory(){
  const slots=["Arme","Armure","Bijou"];$("#inventory-content").innerHTML=safeHtml`${panelNav("inventory")}<div class="inventory-summary"><span><small>ÉCLATS</small><b>◆ ${state.gold}</b></span><span><small>OBJETS</small><b>${state.inventory.length}</b></span><span><small>POTIONS</small><b>⚗ ${state.potions}</b></span></div><div class="material-mini">${GAME_DATA.resources.map(r=>`<span title="${r.name}">${r.icon} <b>${state.resources[r.id]||0}</b><small>${r.name}</small></span>`).join("")}</div><div class="section-heading"><h4>Équipement porté</h4><small>Bonus appliqués immédiatement</small></div><div class="equipped-row">${slots.map(s=>{const item=state.equipped[s],effect=artifactEffect(item);return `<div class="${item?`rarity-${item.color}`:""}"><small>${s}</small><span>${s==="Arme"?"⚔":s==="Armure"?"♜":"◉"}</span><b>${item?itemDisplayName(item):"Emplacement vide"}</b><em>${item?`${formatStats(scaledItemStats(item))} · Niv. ${item.level}${item.setId?` · ${buildData.sets[item.setId].name}`:""}`:"Aucun bonus"}</em>${effect?`<p class="artifact-power">☗ ${effect.name} · ${effect.description}</p>`:""}</div>`}).join("")}</div><div class="section-heading"><h4>Sac</h4><small>Cliquez sur un objet pour l'équiper</small></div><div class="inventory-grid">${state.inventory.map((item,i)=>{item.level||=1;const worn=state.equipped[item.slot],delta=itemPower(item)-itemPower(worn),info=rarityInfo(item.rarity),color=item.color||info?.color||"blanc",effect=artifactEffect(item);return `<button class="item-slot ${worn?.uid===item.uid?"equipped":""} rarity-${color}" data-equip="${i}"><span>${item.type.includes("Arme")?"⚔":item.type.includes("Armure")?"♜":"◉"}</span><div><small class="item-rarity">${info.label} · ${item.slot} · NIV. ${item.level}${item.setId?` · ENSEMBLE`:""}</small><b>${itemDisplayName(item)}</b><em>${formatStats(scaledItemStats(item))}</em><p>${item.setId?`${buildData.sets[item.setId].name} · `:""}${item.description||""}</p>${effect?`<p class="artifact-power">☗ <b>${effect.name}</b> · ${effect.description}</p>`:""}</div><strong>${worn?.uid===item.uid?"✓ ÉQUIPÉ":delta>0?`▲ +${delta} PUISSANCE`:delta<0?`▼ ${delta} PUISSANCE`:"= ÉQUIVALENT"}</strong></button>`}).join("")}<div class="item-slot consumable"><span>⚗</span><div><small>CONSOMMABLE</small><b>Potion mineure</b><em>x${state.potions} · Restaure 35 PV</em></div></div>${Array.from({length:Math.max(0,6-state.inventory.length-1)},()=>`<div class="item-slot empty">+</div>`).join("")}</div>`;
  $$("[data-equip]").forEach(b=>b.onclick=()=>{const item=state.inventory[+b.dataset.equip];state.equipped[item.slot]=item;state.hp=Math.min(state.hp,maxPlayerHp());state.energy=Math.min(state.energy,maxPlayerEnergy());save();renderInventory();toast(`${item.name} équipé · statistiques mises à jour.`)});
}
function masteryPointCap(){return GAME_RULES.masteryPointsForLevel(state.level)}
function renderMasteryTree(){
  const nodes=buildData.masteries[state.classId]||[],selected=state.masteryNodes||[],spent=selected.length,branches=[...new Set(nodes.map(node=>node.branch))];
  return `<div class="mastery-header"><div><small>POINTS DE MAÎTRISE</small><b>${Math.max(0,masteryPointCap()-spent)} disponibles · ${spent}/${masteryPointCap()} investis</b></div><button data-respec-build ${state.resources.star_fragment<1||(!selected.length&&!state.specializations.length&&!Object.keys(state.abilityVariants).length)?"disabled":""}>↺ Réinitialiser · 1 ✧</button></div><div class="mastery-tree">${branches.map(branch=>`<section><header><small>VOIE</small><b>${branch}</b></header>${nodes.filter(node=>node.branch===branch).map(node=>{const active=selected.includes(node.id),available=GAME_RULES.canUnlockMastery(node,selected,state.level,spent),requirement=node.requires?nodes.find(entry=>entry.id===node.requires)?.name:null;return `<button class="${active?"active":available?"available":"locked"}" data-mastery="${node.id}" ${active||!available?"disabled":""}><span>${active?"✓":node.tier}</span><div><small>PALIER ${node.tier} · NIV. ${node.level}</small><b>${node.name}</b><p>${node.description}</p>${!active&&!available&&requirement?`<em>Requiert ${requirement}</em>`:""}</div></button>`}).join("")}</section>`).join("")}</div>`;
}
function renderBuildSynergies(){
  const companion=activeCompanion(),cards=[
    ...specializationObjects().map(source=>({icon:"◆",name:source.name,copy:source.description})),
    ...masteryObjects().slice(-2).map(source=>({icon:"✦",name:source.name,copy:source.description})),
    ...equippedArtifactEffects().map(source=>({icon:"☗",name:source.name,copy:source.description})),
    ...(companion?[{icon:companion.icon,name:companion.name,copy:companion.synergies[state.classId]}]:[])
  ];
  return cards.length?`<div class="build-synergies">${cards.map(card=>`<article><span>${card.icon}</span><div><b>${card.name}</b><small>${card.copy}</small></div></article>`).join("")}</div>`:`<p class="empty-build-synergy">Équipez un artéfact, choisissez une maîtrise ou voyagez avec un compagnon pour créer des synergies.</p>`;
}
function renderBuildPresets(){
  return `<div class="build-presets">${state.buildPresets.map((preset,index)=>`<article class="${preset?"saved":""}"><span>0${index+1}</span><div><small>PRÉSÉLECTION</small><b>${preset?.name||"Emplacement libre"}</b><em>${preset?`${preset.abilities.length} techniques · ${preset.passives.length} passifs`:"Sauvegarde équipement et pouvoirs"}</em></div><button data-preset-save="${index}">${preset?"Écraser":"Enregistrer"}</button>${preset?`<button data-preset-load="${index}">Activer</button>`:""}</article>`).join("")}</div>`;
}
function renderSkills(){
  const activeList=GAME_DATA.abilities[state.classId],passiveList=GAME_DATA.passives[state.classId],evolutions=buildData.abilityEvolutions[state.classId];
  const nextAbility=activeList.find((ability,index)=>GAME_DATA.progression.abilityLevels[index]>state.level),loadout=Array.from({length:4},(_,index)=>abilityCatalog[state.equippedAbilities[index]]);
  const attacks=activeList.map((ability,index)=>{const unlock=GAME_DATA.progression.abilityLevels[index],learned=state.learnedAbilities.includes(ability.id),equipped=state.equippedAbilities.includes(ability.id),rank=state.abilityRanks[ability.id]||1,cost=abilityCost(ability,rank),breakdown=abilityDamageBreakdown(ability,rank),variant=state.abilityVariants[ability.id],evolution=abilityEvolution(ability);return `<div class="skill-block"><button class="skill-entry ${equipped?"equipped":""} ${learned?"":"locked"}" data-skill="${ability.id}" ${learned?"":"disabled"}><span>✦</span><div><b><i class="unlock-level">NIV. ${unlock}</i>${ability.name}</b><small>${ability.description}</small><em><i>${cost} ✦</i><i>≈ ${breakdown.total} dégâts</i><i>${ability.scaling}</i>${ability.targets==="all"?"<i>Zone</i>":""}${evolution?`<i>${evolution.name}</i>`:""}</em></div><strong>${equipped?"✓ ACTIVE":learned?"+ ÉQUIPER":`NIV. ${unlock}`}</strong></button>${learned?`<details class="damage-breakdown"><summary>Pourquoi ≈ ${breakdown.total} dégâts ?</summary><div><span>Puissance <b>${breakdown.power}</b></span><span>${ability.scaling} × ${ability.ratio} <b>+${breakdown.stat}</b></span><span>Niveau <b>+${breakdown.level}</b></span><span>Rang ${rank} <b>×${breakdown.rankMultiplier.toFixed(2)}</b></span><span>Évolution <b>×${breakdown.evolutionMultiplier.toFixed(2)}</b></span><span>Build et artéfacts <b>×${breakdown.buildMultiplier.toFixed(2)}</b></span></div></details>`:""}${learned&&rank>=2?`<div class="variant-choice"><small>TRANSFORMATION</small><button data-variant="power" data-ability="${ability.id}" class="${variant==="power"?"selected":""}">${evolutions.power.name}<em>${evolutions.power.description}</em></button><button data-variant="mastery" data-ability="${ability.id}" class="${variant==="mastery"?"selected":""}">${evolutions.mastery.name}<em>${evolutions.mastery.description}</em></button></div>`:""}</div>`}).join("");
  const passives=passiveList.map((passive,index)=>{const unlock=GAME_DATA.progression.passiveLevels[index],learned=state.learnedPassives.includes(passive.id),equipped=state.equippedPassives.includes(passive.id);return `<button class="passive-entry ${equipped?"learned":"locked"}" data-passive="${passive.id}" ${learned?"":"disabled"}><span>◈</span><div><b><i class="unlock-level">NIV. ${unlock}</i>${passive.name}</b><small>${passive.description}</small></div><em>${equipped?"✓ ACTIF":learned?"+ ACTIVER":`NIV. ${unlock}`}</em></button>`}).join("");
  $("#skills-content").innerHTML=safeHtml`${panelNav("skills")}<div class="skill-summary"><div><small>BUILD ACTUEL</small><b>${state.equippedAbilities.length}/4 techniques · ${state.equippedPassives.length}/6 passifs · ${state.masteryNodes.length}/${masteryPointCap()} maîtrises</b></div><span>${nextAbility?`Prochaine technique au niveau ${GAME_DATA.progression.abilityLevels[activeList.indexOf(nextAbility)]} : ${nextAbility.name}`:"Toutes les techniques sont maîtrisées"}</span></div><div class="section-heading"><h4>Synergies actives</h4><small>Spécialisations · maîtrises · artéfacts · compagnon</small></div>${renderBuildSynergies()}<div class="section-heading"><h4>Présélections</h4><small>Équipement et arsenal en un clic</small></div>${renderBuildPresets()}<div class="section-heading"><h4>Arsenal actif</h4><small>Quatre techniques au maximum</small></div><div class="loadout-row">${loadout.map((ability,index)=>`<div class="${ability?"filled":""}"><small>EMPLACEMENT ${index+1}</small><b>${ability?.name||"Libre"}</b><span>${ability?`${abilityCost(ability,state.abilityRanks[ability.id]||1)} énergie · ${abilityEvolution(ability)?.name||ability.scaling}`:"Sélectionnez une technique"}</span></div>`).join("")}</div><div class="section-heading"><h4>Arbre de maîtrise</h4><small>1 point tous les 5 niveaux · 6 points maximum</small></div>${renderMasteryTree()}<div class="section-heading"><h4>Techniques</h4><small>Équipez, transformez et contrôlez le calcul</small></div><div class="skill-list">${attacks}</div><div class="section-heading"><h4>Passifs</h4><small>${state.equippedPassives.length}/6 actifs</small></div><div class="passive-list">${passives}</div>`;
  $$("[data-skill]").forEach(button=>button.onclick=()=>toggleSkill(button.dataset.skill));
}
function toggleSkill(id){
  const index=state.equippedAbilities.indexOf(id);
  if(index>=0){if(state.equippedAbilities.length===1){toast("Vous devez conserver au moins une attaque.");return}state.equippedAbilities.splice(index,1);toast("Attaque retirée de l'arsenal.")}
  else{if(state.equippedAbilities.length>=4){toast("Quatre attaques sont déjà équipées. Retirez-en une d'abord.");return}state.equippedAbilities.push(id);toast(`${abilityCatalog[id].name} équipée.`)}
  save();renderSkills();
}
function togglePassive(id){const index=state.equippedPassives.indexOf(id);if(index>=0){if(state.equippedPassives.length===1){toast("Vous devez conserver au moins un passif.");return}state.equippedPassives.splice(index,1);toast("Passif retiré de votre mémoire active.")}else{if(state.equippedPassives.length>=6){toast("Six passifs sont déjà actifs.");return}state.equippedPassives.push(id);toast(`${passiveCatalog[id].name} activé.`)}state.hp=Math.min(state.hp,maxPlayerHp());state.energy=Math.min(state.energy,maxPlayerEnergy());save();renderSkills()}
function chooseAbilityVariant(id,variant){if((state.abilityRanks[id]||1)<2)return;state.abilityVariants[id]=variant;save();renderSkills();toast(`${buildData.abilityEvolutions[state.classId][variant].name} sélectionnée pour ${abilityCatalog[id].name}.`)}
function chooseMastery(id){
  const node=(buildData.masteries[state.classId]||[]).find(entry=>entry.id===id),selected=state.masteryNodes||[];
  if(!GAME_RULES.canUnlockMastery(node,selected,state.level,selected.length)){toast("Cette maîtrise n'est pas encore accessible.");return}
  state.masteryNodes.push(id);state.hp=Math.min(state.hp,maxPlayerHp());state.energy=Math.min(state.energy,maxPlayerEnergy());save();renderSkills();toast(`Maîtrise acquise : ${node.name}.`);
}
function saveBuildPreset(index){
  const slots=Object.fromEntries(Object.entries(state.equipped).map(([slot,item])=>[slot,item?.uid||null]));
  state.buildPresets[index]={name:`Profil ${index+1} · ${hero().name.replace(/^(Le |La |L')/,"")}`,abilities:[...state.equippedAbilities],passives:[...state.equippedPassives],variants:{...state.abilityVariants},equipment:slots};
  save();renderSkills();toast(`Présélection ${index+1} enregistrée.`);
}
function activateBuildPreset(index){
  const preset=state.buildPresets[index];if(!preset)return;
  const valid=GAME_RULES.validateBuildPreset(preset,state.learnedAbilities,state.learnedPassives,state.inventory.map(item=>item.uid));
  if(valid.abilities.length)state.equippedAbilities=valid.abilities;if(valid.passives.length)state.equippedPassives=valid.passives;state.abilityVariants=valid.variants;
  Object.entries(valid.equipment).forEach(([slot,uid])=>{state.equipped[slot]=uid?state.inventory.find(item=>item.uid===uid)||state.equipped[slot]:null});
  state.hp=Math.min(state.hp,maxPlayerHp());state.energy=Math.min(state.energy,maxPlayerEnergy());save();renderSkills();toast(`${preset.name} activé.`);
}
function resetBuild(){
  if((state.resources.star_fragment||0)<1){toast("Il faut un Fragment stellaire pour réinitialiser le build.");return}
  if(!state.masteryNodes.length&&!state.specializations.length&&!Object.keys(state.abilityVariants).length){toast("Aucun choix de build à réinitialiser.");return}
  state.resources.star_fragment--;state.masteryNodes=[];state.specializations=[];state.abilityVariants={};state.hp=Math.min(state.hp,maxPlayerHp());state.energy=Math.min(state.energy,maxPlayerEnergy());save();renderSkills();toast("Le build a été réinitialisé. Vos spécialisations doivent être choisies à nouveau.");if(pendingSpecializationLevel())setTimeout(showSpecializationChoice,300);
}
function renderSanctuary(){
  const meta=loadMeta(),data=GAME_DATA.sanctuary,tabs=[["village","⌂","Hameau"],["preparations","⚑","Départ"],["collections","◆","Collections"],["gallery","☾","Galerie"]];
  const village=`<div class="sanctuary-section-heading"><div><small>HAMEAU PERSISTANT</small><h3>Restaurer ce que la Route a pris</h3></div><span>${Object.values(meta.buildings).reduce((sum,level)=>sum+level,0)} / ${data.buildings.length*3} niveaux</span></div><div class="sanctuary-buildings">${data.buildings.map(building=>{
    const level=meta.buildings[building.id]||0,current=level?building.stages[level-1]:null,next=building.stages[level],cost=building.costs[level],dialogueIndex=meta.runs%building.dialogues.length,affordable=meta.embers>=cost;
    return `<article class="sanctuary-building ${level?"restored":"ruined"}"><header><span>${building.icon}</span><div><small>${level?`NIVEAU ${level} · ${current.name}`:"RUINES À RESTAURER"}</small><b>${building.name}</b></div><em>${level}/3</em></header><div class="building-levels">${[1,2,3].map(step=>`<i class="${step<=level?"active":""}"></i>`).join("")}</div>${level?`<div class="sanctuary-npc"><b>${building.npc}</b><small>${building.role}</small><blockquote>« ${building.dialogues[dialogueIndex]} »</blockquote></div>`:`<p>${building.stages[0].description}</p>`}${next?`<div class="building-next"><small>PROCHAINE RESTAURATION</small><b>${next.name}</b><span>${next.unlock}</span></div><button data-restore-building="${building.id}" ${affordable?"":"disabled"}>Restaurer · ${cost} ♨</button>`:`<div class="building-complete">✦ BÂTIMENT ACHEVÉ</div>`}</article>`;
  }).join("")}</div><div class="sanctuary-section-heading compact"><div><small>RELIQUES FONDATRICES</small><h3>Héritages des premières expéditions</h3></div></div><div class="sanctuary-grid">${sanctuaryUpgrades.map(upgrade=>{const unlocked=meta.unlocks.includes(upgrade.id),affordable=meta.embers>=upgrade.cost;return `<button data-unlock="${upgrade.id}" class="${unlocked?"unlocked":""}" ${unlocked||!affordable?"disabled":""}><span>${upgrade.icon}</span><div><b>${upgrade.name}</b><small>${upgrade.description}</small></div><em>${unlocked?"DÉBLOQUÉ":`${upgrade.cost} ♨`}</em></button>`}).join("")}</div>`;
  const preparations=`<div class="sanctuary-section-heading"><div><small>UNE SEULE INTENTION</small><h3>Préparer la prochaine expédition</h3></div><span>Bonus mesuré, jamais obligatoire</span></div><p class="sanctuary-note">Le préparatif sélectionné s'applique à chaque nouveau départ. Les bâtiments de niveau III en renforcent légèrement l'effet.</p><div class="preparation-grid">${data.preparations.map(preparation=>{const building=data.buildings.find(entry=>entry.id===preparation.building),level=meta.buildings[preparation.building]||0,available=level>=preparation.level,selected=meta.preparation===preparation.id;return `<button data-sanctuary-preparation="${preparation.id}" class="${selected?"selected":available?"":"locked"}" ${available?"":"disabled"}><span>${available?preparation.icon:"?"}</span><div><small>${available?`${building.name} · niveau ${level}`:`NÉCESSITE ${building.name} NIV. II`}</small><b>${available?preparation.name:"Préparatif verrouillé"}</b><p>${available?preparation.description:"Restaurez ce bâtiment pour révéler cette préparation."}</p></div><em>${selected?"✓ SÉLECTIONNÉ":available?"CHOISIR":"VERROUILLÉ"}</em></button>`}).join("")}</div>${meta.preparation?`<button class="clear-preparation" data-sanctuary-preparation="none">Partir sans préparatif</button>`:""}`;
  const collections=`<div class="sanctuary-section-heading"><div><small>MISSIONS PERMANENTES</small><h3>Collections du Sanctuaire</h3></div><span>${meta.claimedCollections.length} / ${data.collections.length} achevées</span></div><div class="sanctuary-collections">${data.collections.map(collection=>{const progress=sanctuaryCollectionProgress(collection,meta),done=progress>=collection.target,claimed=meta.claimedCollections.includes(collection.id),percent=Math.min(100,progress/collection.target*100);return `<article class="${claimed?"claimed":done?"complete":""}"><span>${collection.icon}</span><div><small>${collection.description}</small><b>${collection.name}</b><div class="collection-progress"><i style="width:${percent}%"></i></div><em>${Math.min(progress,collection.target)} / ${collection.target}</em></div><button data-claim-collection="${collection.id}" ${!done||claimed?"disabled":""}>${claimed?"ACCOMPLI":`+${collection.reward} ♨`}</button></article>`}).join("")}</div>`;
  const archiveLevel=meta.buildings.archives||0,bosses=GAME_DATA.enemies.filter(enemy=>enemy.boss),knownTrophies=new Set(meta.trophies),knownMemories=new Set(meta.discoveries.lore);
  const gallery=`<div class="sanctuary-section-heading"><div><small>TRACE DES EXPÉDITIONS</small><h3>Galerie des trophées et des fins</h3></div><span>${meta.trophies.length} trophées · ${meta.endings.length} fins</span></div><div class="gallery-block"><h4>Boss vaincus</h4><div class="trophy-gallery">${bosses.map(enemy=>{const known=knownTrophies.has(enemy.id);return `<article class="${known?"known":"unknown"}"><span>${known?enemy.icon:"?"}</span><b>${known?enemy.name:"Silhouette inconnue"}</b><small>${known?`Marque de la région ${enemy.region||1}`:"La Route garde encore ce secret."}</small></article>`}).join("")}</div></div>${archiveLevel?`<div class="gallery-block"><h4>Fins du monde</h4><div class="ending-gallery">${GAME_DATA.endings.map(ending=>{const known=meta.endings.includes(ending.id);return `<article class="${known?ending.tone:"unknown"}"><span>${known?ending.icon:"?"}</span><div><b>${known?ending.name:"Conclusion voilée"}</b><small>${known?ending.description:"Une autre décision attend au bout du Brasier."}</small></div></article>`}).join("")}</div></div><div class="gallery-block"><h4>Fragments de mémoire</h4><div class="memory-gallery">${data.memories.map(memory=>{const known=knownMemories.has(memory.id);return `<span class="${known?"known":""}" title="${known?memory.name:"Souvenir manquant"}">${known?memory.icon:"·"} <b>${known?memory.name:"Fragment effacé"}</b></span>`}).join("")}</div></div>`:`<div class="gallery-locked"><span>▤</span><b>Les archives sont encore silencieuses</b><p>Restaurez les Archives des Noms pour exposer les fins et les souvenirs rapportés.</p></div>`}`;
  const views={village,preparations,collections,gallery};$("#sanctuary-content").innerHTML=safeHtml`<div class="legacy-balance"><span>♨</span><div><small>BRAISES D'HÉRITAGE</small><b>${meta.embers}</b></div><em>${meta.runs} expéditions · ${meta.wins} victoires · record niv. ${meta.bestLevel}</em></div><nav class="sanctuary-tabs">${tabs.map(([id,icon,label])=>`<button data-sanctuary-tab="${id}" class="${sanctuaryView===id?"active":""}"><span>${icon}</span>${label}</button>`).join("")}</nav><div class="sanctuary-view">${views[sanctuaryView]||village}</div>`;
}
function buySanctuaryUpgrade(id){
  const upgrade=sanctuaryUpgrades.find(entry=>entry.id===id),meta=loadMeta();if(!upgrade||meta.unlocks.includes(id)||meta.embers<upgrade.cost)return;
  meta.embers-=upgrade.cost;meta.unlocks.push(id);saveMeta(meta);renderSanctuary();toast(`${upgrade.name} débloqué pour toutes les futures expéditions.`);
}
function restoreSanctuaryBuilding(id){
  const building=GAME_DATA.sanctuary.buildings.find(entry=>entry.id===id),meta=loadMeta(),level=meta.buildings[id]||0,cost=building?.costs[level];if(!building||level>=3||meta.embers<cost)return;
  meta.embers-=cost;meta.buildings[id]=level+1;saveMeta(meta);renderSanctuary();playSound("reward");toast(`${building.name} atteint le niveau ${level+1}. ${building.stages[level].unlock}`);
}
function chooseSanctuaryPreparation(id){
  const meta=loadMeta();if(id==="none"){meta.preparation=null;saveMeta(meta);renderSanctuary();toast("Vous partirez sans préparatif.");return}
  const preparation=GAME_DATA.sanctuary.preparations.find(entry=>entry.id===id);if(!preparation||(meta.buildings[preparation.building]||0)<preparation.level)return;
  meta.preparation=id;saveMeta(meta);renderSanctuary();toast(`${preparation.name} sera préparé pour votre prochain départ.`);
}
function sanctuaryCollectionProgress(collection,meta){
  if(collection.metric==="runs")return meta.runs||0;if(collection.metric==="trophies")return meta.trophies.length;if(collection.metric==="endings")return meta.endings.length;return meta.discoveries[collection.metric]?.length||0;
}
function claimSanctuaryCollection(id){
  const collection=GAME_DATA.sanctuary.collections.find(entry=>entry.id===id),meta=loadMeta();if(!collection||meta.claimedCollections.includes(id)||sanctuaryCollectionProgress(collection,meta)<collection.target)return;
  meta.claimedCollections.push(id);meta.embers+=collection.reward;saveMeta(meta);renderSanctuary();playSound("reward");toast(`${collection.name} achevée · +${collection.reward} braises d'héritage.`);
}
function renderCompanions(){
  const entries=GAME_DATA.companions.filter(companion=>state.companions.unlocked.includes(companion.id));
  const departed=GAME_DATA.companions.filter(companion=>state.companions.departed.includes(companion.id));
  $("#companions-content").innerHTML=safeHtml`<p class="companion-rule">Un seul compagnon voyage à vos côtés. Vos réponses façonnent sa loyauté ; sa quête personnelle évolue à partir de 15 points de confiance.</p><div class="companion-grid">${entries.map(companion=>{
    const active=state.companions.active===companion.id,trust=state.companions.trust[companion.id]||0,relation=state.companions.relation[companion.id]||0,quest=state.companions.quests[companion.id],equipped=state.inventory.find(item=>item.uid===state.companions.equipment[companion.id]),abilityName=quest==="completed"?companion.ability.evolvedName:companion.ability.name,lastDialogue=state.companions.dialogues[companion.id];
    const relationLabel=relation>=3?"Indéfectible":relation>=1?"Proche":relation<=-2?"Hostile":relation<0?"Méfiant":"Prudent";
    return `<article class="${active?"active":""}"><header><span>${companion.icon}</span><div><b>${companion.name}</b><small>${companion.role} · Confiance ${trust}/25 · ${relationLabel}</small></div></header><div class="trust-bar"><i style="width:${trust/25*100}%"></i></div><p>${companion.description}</p><strong>${abilityName}</strong><small>${companion.synergies[state.classId]}${quest==="completed"?" · Puissance évoluée +20 %":""}</small>${quest?`<div class="companion-quest ${quest}"><small>${quest==="completed"?"QUÊTE ACCOMPLIE":"QUÊTE PERSONNELLE"}</small><b>${companion.quest.name}</b><span>${companion.quest.description}</span></div>`:""}${lastDialogue?`<blockquote>« ${lastDialogue} »</blockquote>`:""}<div class="companion-gear"><b>${equipped?itemDisplayName(equipped):"Aucun objet confié"}</b><span>${equipped?`+${Math.round(itemPower(equipped)*.4)} puissance de compagnon`:"Un équipement augmente sa capacité."}</span></div><div class="companion-actions">${active?"<em>COMPAGNON ACTIF</em>":`<button data-companion="${companion.id}">Voyager ensemble</button>`}<button data-companion-gear="${companion.id}">Changer l'objet</button></div></article>`;
  }).join("")}</div>${departed.length?`<div class="departed-companions"><small>ONT QUITTÉ LA ROUTE</small><b>${departed.map(companion=>companion.name).join(" · ")}</b></div>`:""}<div id="companion-equipment-list" class="companion-equipment-list hidden"></div>`;
}
function chooseCompanion(id){if(!state.companions.unlocked.includes(id))return;state.companions.active=id;save();renderCompanions();toast(`${activeCompanion().name} rejoint le héros.`)}
function nextCompanionMilestone(){
  const companion=activeCompanion();if(!companion)return null;
  const trust=state.companions.trust[companion.id]||0,seen=state.companions.milestones[companion.id]||[];
  return [5,10,15,20,25].find(level=>trust>=level&&!seen.includes(level))||null;
}
function showCompanionMilestone(){
  const companion=activeCompanion(),level=nextCompanionMilestone();if(!companion||!level)return false;
  const [title,copy]=companion.scenes[level];pendingCompanionEvent={id:companion.id,level};
  $("#companion-event-step").textContent=`CONFIANCE ${level} / 25`;
  $("#companion-event-icon").textContent=companion.icon;
  $("#companion-event-title").textContent=title;
  $("#companion-event-copy").textContent=copy;
  $("#companion-event-choices").innerHTML=safeHtml`<button data-companion-choice="support"><b>Écouter sans détour</b><span>Vous choisissez la confiance, même si la vérité demeure incomplète.</span><em>+ loyauté · + confiance</em></button><button data-companion-choice="challenge"><b>Exiger une réponse</b><span>Vous refusez de laisser les non-dits guider la route.</span><em>+ 30 éclats · loyauté en baisse</em></button>`;
  openPanel("companion-event");return true;
}
function resolveCompanionMilestone(choice){
  if(!pendingCompanionEvent)return;
  const {id,level}=pendingCompanionEvent,companion=GAME_DATA.companions.find(entry=>entry.id===id);if(!companion)return;
  state.companions.milestones[id]||=[];state.companions.milestones[id].push(level);
  const supportive=choice==="support";
  state.companions.relation[id]=(state.companions.relation[id]||0)+(supportive?1:level===20?-2:-1);
  if(supportive)state.companions.trust[id]=Math.min(25,(state.companions.trust[id]||0)+1);else state.gold+=30;
  if(level===15)state.companions.quests[id]="active";
  state.companions.dialogues[id]=supportive?"Je ne promets pas la vérité. Seulement de ne plus marcher seul.":"Vous avez votre réponse. Ne prétendez pas qu'elle nous rapproche.";
  if(state.companions.relation[id]<=-3){
    if(!state.companions.departed.includes(id))state.companions.departed.push(id);
    state.companions.unlocked=state.companions.unlocked.filter(companionId=>companionId!==id);
    state.companions.active=state.companions.unlocked[0]||null;
    toast(`${companion.name} quitte la route. Vos choix ont brisé sa loyauté.`);
  }else toast(supportive?`${companion.name} vous accorde un peu plus de confiance.`:`${companion.name} se referme, mais abandonne 30 éclats.`);
  pendingCompanionEvent=null;save();closeOverlay();showScreen("exploration");setTimeout(showCompanionMilestone,250);
}
function showCompanionEquipment(id){
  const list=$("#companion-equipment-list"),items=state.inventory.filter(item=>!Object.entries(state.companions.equipment).some(([companionId,uid])=>companionId!==id&&uid===item.uid));
  list.innerHTML=safeHtml`<div class="section-heading"><h4>Objet confié</h4><small>Un seul emplacement</small></div><button data-equip-companion="${id}" data-item-uid="">Retirer l'objet</button>${items.map(item=>`<button data-equip-companion="${id}" data-item-uid="${item.uid}"><b>${itemDisplayName(item)}</b><span>${item.slot} · +${Math.round(itemPower(item)*.4)} puissance</span></button>`).join("")}`;list.classList.remove("hidden");
}
function equipCompanionItem(id,uid){state.companions.equipment[id]=uid||null;save();renderCompanions();toast(uid?"Objet confié au compagnon.":"Objet retiré.")}
function contractById(id){return GAME_DATA.contracts.find(contract=>contract.id===id)}
function ensureContractOffers(region=state.currentRegion){
  const key=String(region);if(state.contracts.offers[key]?.length)return state.contracts.offers[key];
  const ids=GAME_DATA.contracts.filter(contract=>contract.region===region).map(contract=>contract.id);
  state.contracts.offers[key]=GAME_RULES.deterministicStock(ids,(state.seed^(region*0x51A7))>>>0,3);save();return state.contracts.offers[key];
}
function contractRewardText(reward){
  const parts=[];if(reward.gold)parts.push(`${reward.gold} éclats`);if(reward.xp)parts.push(`${reward.xp} XP`);if(reward.potions)parts.push(`${reward.potions} potion${reward.potions>1?"s":""}`);
  if(reward.itemRarity)parts.push(`équipement ${rarityInfo(reward.itemRarity).label.toLowerCase()}`);
  for(const [id,amount] of Object.entries(reward.resources||{})){const resource=GAME_DATA.resources.find(entry=>entry.id===id);parts.push(`${resource?.icon||"◆"} ${amount} ${resource?.name||id}`)}
  return parts.join(" · ");
}
function updateContractNotice(){
  const notice=$("#contract-notice");if(!notice||!state)return;const contract=contractById(state.contracts.active),ready=contract&&state.contracts.progress>=contract.objective.target;
  notice.textContent=ready?"!":contract?"•":"";notice.classList.toggle("ready",!!ready);notice.classList.toggle("active",!!contract);
}
function advanceContract(type,amount=1){
  const contract=contractById(state.contracts.active);if(!contract||contract.region!==state.currentRegion||contract.objective.type!==type||state.contracts.completed.includes(contract.id))return;
  state.contracts.progress=Math.min(contract.objective.target,state.contracts.progress+amount);
  if(state.contracts.progress>=contract.objective.target){state.contracts.completed.push(contract.id);toast(`Contrat accompli : ${contract.name}. Récompense à réclamer.`)}
  save();updateContractNotice();
}
function acceptContract(id){
  const contract=contractById(id);if(!contract||contract.region!==state.currentRegion||!ensureContractOffers().includes(id)||state.contracts.claimed.includes(id)||state.contracts.active){toast("Terminez ou abandonnez votre contrat actuel.");return}
  state.contracts.active=id;state.contracts.progress=0;save();renderContracts();updateContractNotice();toast(`Contrat accepté : ${contract.name}.`);
}
function abandonContract(){
  const contract=contractById(state.contracts.active);if(!contract)return;
  state.contracts.active=null;state.contracts.progress=0;save();renderContracts();updateContractNotice();toast(`Contrat abandonné : ${contract.name}.`);
}
function claimContract(){
  const contract=contractById(state.contracts.active);if(!contract||state.contracts.progress<contract.objective.target)return;
  const reward=contract.reward,gains=reward.xp?grantExperience(reward.xp):[];
  if(reward.gold)state.gold+=reward.gold;if(reward.potions)state.potions+=reward.potions;
  for(const [id,amount] of Object.entries(reward.resources||{}))state.resources[id]=(state.resources[id]||0)+amount;
  if(reward.itemRarity){const pool=GAME_DATA.items.filter(item=>item.rarity===reward.itemRarity&&(!item.region||item.region<=state.currentRegion)),id=smartItemId(pool.map(item=>item.id));if(id)addItem(makeItem(id))}
  state.contracts.claimed.push(contract.id);state.contracts.active=null;state.contracts.progress=0;save();updateHud();renderContracts();toast(`Récompense obtenue : ${contractRewardText(reward)}.`);
  if(gains.length){closeOverlay();setTimeout(()=>showLevelGains(gains[gains.length-1]),180)}
}
function renderContracts(){
  const offerIds=ensureContractOffers(),active=contractById(state.contracts.active),offers=offerIds.map(contractById).filter(Boolean),completedCount=state.contracts.claimed.length;
  const card=contract=>{const isActive=active?.id===contract.id,done=isActive&&state.contracts.progress>=contract.objective.target,progress=isActive?state.contracts.progress:0,locked=!!active&&!isActive;return `<article class="contract-card ${isActive?"active":""} ${done?"complete":""}"><span>${contract.icon}</span><div class="contract-copy"><small>${contract.faction} · RÉGION ${contract.region}</small><h3>${contract.name}</h3><p>${contract.description}</p><div class="contract-objective"><label><b>${contract.objective.label}</b><em>${progress} / ${contract.objective.target}</em></label><i><span style="width:${Math.min(100,progress/contract.objective.target*100)}%"></span></i></div><strong>${contractRewardText(contract.reward)}</strong></div><div class="contract-action">${done?`<button data-contract-claim>Réclamer</button>`:isActive?`<button data-contract-abandon>Abandonner</button>`:`<button data-contract-accept="${contract.id}" ${locked?"disabled":""}>${locked?"Contrat actif":"Accepter"}</button>`}</div></article>`};
  $("#contracts-content").innerHTML=safeHtml`<div class="contract-summary"><span><b>${completedCount}</b><small>Contrats accomplis</small></span><span><b>${active?`${state.contracts.progress}/${active.objective.target}`:"—"}</b><small>Mission active</small></span><span><b>${state.currentRegion}/3</b><small>Région actuelle</small></span></div>${active?`<div class="section-heading"><h4>Contrat suivi</h4><small>Un seul objectif actif</small></div>${card(active)}`:""}<div class="section-heading"><h4>Avis disponibles</h4><small>Offres déterminées par la graine</small></div><div class="contract-list">${offers.filter(contract=>contract.id!==active?.id&&!state.contracts.claimed.includes(contract.id)).map(card).join("")||"<p class='codex-empty'>Tous les contrats proposés dans cette région ont été accomplis.</p>"}</div>`;
}
function renderNemesis(){
  const nemesis=state.nemesis,base=enemyBook[nemesis.baseKey],traits=nemesisTraits(),rewardLabel=state.currentRegion>=3?"un artéfact garanti":state.currentRegion===2?"un équipement légendaire garanti":"un équipement rare garanti",huntable=nemesis.alive&&state.cleared.includes(state.mapIndex);
  $("#nemesis-content").innerHTML=safeHtml`<section class="nemesis-identity ${nemesis.alive?"alive":"defeated"}"><div class="nemesis-mark">${base?.icon||"☠"}</div><div><small>${nemesis.alive?`MENACE ACTIVE · RANG ${nemesis.rank}`:"MENACE ÉLIMINÉE"}</small><h3>${nemesis.name}</h3><p>${base?.name||"Créature inconnue"} · aperçue dans la région ${nemesis.region}</p></div></section><div class="nemesis-record"><span><b>${nemesis.encounters}</b><small>Rencontres</small></span><span><b>${nemesis.victories}</b><small>Victoires contre vous</small></span><span><b>${traits.length}</b><small>Mutations</small></span></div><blockquote>« ${nemesis.lastResult} »</blockquote><div class="section-heading"><h4>Mutations connues</h4><small>Chaque victoire la renforce</small></div><div class="nemesis-traits">${traits.map(trait=>`<article><span>${trait.icon}</span><div><b>${trait.name}</b><small>${trait.description}</small></div></article>`).join("")}</div><div class="nemesis-bounty"><span>♛</span><div><small>PRIME DE VENGEANCE</small><b>${rewardLabel}</b><p>Éclats, expérience et un Fragment stellaire supplémentaires.</p></div></div>${nemesis.alive?`<button class="primary-button nemesis-hunt" data-action="nemesis-hunt" ${huntable?"":"disabled"}>Pister ${nemesis.name}</button><small class="nemesis-help">${huntable?"Le combat commencera immédiatement.":"Terminez d'abord l'événement de cette case."}</small>`:`<div class="nemesis-slain">✓ La Route ne porte plus sa marque pour cette expédition.</div>`}`;
}
function challengeCompleted(challenge,flags={}){
  if(challenge.classId&&state?.classId!==challenge.classId)return false;
  if(challenge.condition.flag)return !!flags[challenge.condition.flag];
  const stats=state?{...state.run,battlesWon:state.battlesWon}:{};return (stats[challenge.condition.stat]||0)>=challenge.condition.min;
}
function evaluateChallenges(flags={}){
  if(!state)return;const meta=loadMeta(),unlocked=[];
  GAME_DATA.challenges.forEach(challenge=>{if(!meta.achievements.includes(challenge.id)&&challengeCompleted(challenge,flags)){meta.achievements.push(challenge.id);meta.embers+=challenge.reward;unlocked.push(challenge.name)}});
  if(unlocked.length){saveMeta(meta);toast(`Succès débloqué : ${unlocked.join(", ")}.`)}
}
function renderChallenges(){
  const meta=loadMeta(),scores=meta.scores.slice(0,5);
  $("#challenges-content").innerHTML=safeHtml`<div class="challenge-summary"><span><b>${meta.achievements.length}/${GAME_DATA.challenges.length}</b><small>Succès</small></span><span><b>${meta.ascensionUnlocked}</b><small>Ascension max.</small></span><span><b>${meta.classWins?Object.values(meta.classWins).reduce((a,b)=>a+b,0):0}</b><small>Actes terminés</small></span></div><div class="section-heading"><h4>Objectifs</h4><small>Récompenses permanentes</small></div><div class="challenge-list">${GAME_DATA.challenges.map(challenge=>{const done=meta.achievements.includes(challenge.id),locked=challenge.classId&&state&&state.classId!==challenge.classId;return `<article class="${done?"done":locked?"locked":""}"><span>${challenge.icon}</span><div><small>${challenge.category}</small><b>${challenge.name}</b><p>${challenge.description}</p></div><strong>${done?"✓":`+${challenge.reward} ♨`}</strong></article>`}).join("")}</div><div class="section-heading"><h4>Meilleures expéditions</h4><small>Classement local</small></div><div class="score-list">${scores.map((score,index)=>`<article><b>#${index+1} · ${score.className}</b><span>${score.score} points</span><small>Ascension ${score.ascension} · ${score.duration} min${score.daily?" · QUOTIDIEN":""}</small></article>`).join("")||"<p class='codex-empty'>Aucune expédition terminée.</p>"}</div>`;
}
function currentSaveArchive(){
  if(state)save();return SAVE_SYSTEM.createBundle({slots:[1,2,3].map(slot=>localStorage.getItem(slotKey(slot))),backups:[1,2,3].map(slot=>localStorage.getItem(backupSlotKey(slot))),meta:loadMeta(),settings:loadSettings(),activeSlot:activeSlot()});
}
function exportSaveArchive(){
  const blob=new Blob([currentSaveArchive()],{type:"application/json"}),link=document.createElement("a"),date=new Date().toISOString().slice(0,10),url=URL.createObjectURL(blob);link.href=url;link.download=`cendres-astrea-sauvegardes-${date}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("Archive de sauvegarde exportée.");
}
function applySaveArchiveBundle(bundle){
  [1,2,3].forEach((slot,index)=>{const value=bundle.slots[index],backup=bundle.backups[index],key=slotKey(slot),backupKey=backupSlotKey(slot);if(value)localStorage.setItem(key,value);else localStorage.removeItem(key);if(backup)localStorage.setItem(backupKey,backup);else localStorage.removeItem(backupKey)});localStorage.setItem(META_KEY,JSON.stringify(normalizeMetaValue(bundle.meta)));localStorage.setItem(SETTINGS_KEY,JSON.stringify(bundle.settings));saveSlots.select(bundle.activeSlot);state=null;applySettings();updateContinue();renderSaveSlots();renderLegacyLabel();
}
async function importSaveArchive(file){
  if(!file)return;let bundle;try{bundle=SAVE_SYSTEM.parseBundle(await file.text())}catch(error){toast(error.message||"Archive de sauvegarde invalide.");return}
  if(!window.confirm("Importer cette archive remplacera les trois emplacements et la progression du Sanctuaire. Continuer ?"))return;
  localStorage.setItem(IMPORT_BACKUP_KEY,currentSaveArchive());applySaveArchiveBundle(bundle);toast("Archive importée et migrée avec succès.");
}
function restorePreImportArchive(){
  const raw=localStorage.getItem(IMPORT_BACKUP_KEY);if(!raw)return;let bundle;try{bundle=SAVE_SYSTEM.parseBundle(raw)}catch{localStorage.removeItem(IMPORT_BACKUP_KEY);renderSaveSlots();toast("La copie précédant l'importation est invalide.");return}
  if(!window.confirm("Revenir à l'état précédant la dernière importation ?"))return;const current=currentSaveArchive();applySaveArchiveBundle(bundle);localStorage.setItem(IMPORT_BACKUP_KEY,current);toast("Importation annulée. L'état remplacé reste disponible.");
}
function restoreSlotBackup(slot){
  const backup=localStorage.getItem(backupSlotKey(slot)),restored=SAVE_SYSTEM.safeParse(backup);if(!restored||!window.confirm(`Restaurer la copie de secours de l'emplacement ${slot} ?`))return;
  const current=localStorage.getItem(slotKey(slot));localStorage.setItem(slotKey(slot),SAVE_SYSTEM.serialize(restored));if(SAVE_SYSTEM.safeParse(current))localStorage.setItem(backupSlotKey(slot),current);if(slot===activeSlot())state=null;updateContinue();renderSaveSlots();toast(`Emplacement ${slot} restauré. L'ancienne version reste disponible comme copie de secours.`);
}
function renderSaveSlots(){
  $("#saves-content").innerHTML=safeHtml`<p class="save-help">Les sauvegardes sont automatiques. Chaque emplacement conserve aussi sa dernière version valide avant écrasement.</p><div class="save-slots">${[1,2,3].map(slot=>{const raw=localStorage.getItem(slotKey(slot)),backup=SAVE_SYSTEM.safeParse(localStorage.getItem(backupSlotKey(slot)));let detail="Emplacement vide";if(raw){const saved=SAVE_SYSTEM.safeParse(raw);detail=saved?`${classes.find(entry=>entry.id===saved.classId)?.name||"Héros"} · Niveau ${saved.level||1} · Région ${saved.currentRegion||1}`:"Données principales endommagées"}return `<article class="save-slot-card ${slot===activeSlot()?"active":""}"><button data-save-slot="${slot}" class="save-slot-main"><span>${slot}</span><div><b>Sauvegarde ${slot}</b><small>${detail}</small></div><strong>${slot===activeSlot()?"ACTIVE":"CHOISIR"}</strong></button>${backup?`<button class="save-restore" data-restore-slot="${slot}">↶ Restaurer la copie de secours</button>`:`<small class="save-backup-state">Aucune copie de secours pour le moment</small>`}</article>`}).join("")}</div><div class="save-transfer"><div><b>Archive externe</b><small>Regroupe les trois emplacements, le Sanctuaire et vos options dans un fichier JSON portable.</small></div><button data-action="export-saves">Exporter</button><button data-action="import-saves">Importer</button>${localStorage.getItem(IMPORT_BACKUP_KEY)?`<button class="undo-import" data-action="undo-import">Annuler la dernière importation</button>`:""}<input id="save-import-file" class="hidden" type="file" accept="application/json,.json"></div>`;
}
function chooseSaveSlot(slot){saveSlots.select(slot);state=null;updateContinue();renderSaveSlots();toast(`Emplacement ${slot} sélectionné.`)}
function renderGlossary(){
  const enabled=state?.tutorial?.enabled!==false;$("#glossary-content").innerHTML=safeHtml`<div class="glossary-list">${Object.entries(guideBook).map(([id,entry])=>`<article><span>${entry.icon}</span><div><b>${entry.title}</b><p>${entry.copy}</p></div>${state?.tutorial?.seen.includes(id)?"<small>VU</small>":""}</article>`).join("")}</div>${state?`<button class="text-button" data-action="toggle-guides">${enabled?"Désactiver":"Activer"} les conseils contextuels</button><button class="primary-button" data-action="training">Entraînement simple</button><button class="text-button" data-action="advanced-training">Simulation tactique avancée</button>`:""}`;
}
function renderCodex(){
  const discoveredEnemies=GAME_DATA.enemies.filter(enemy=>state.discoveries.enemies.includes(enemy.id)),discoveredItems=GAME_DATA.items.filter(item=>state.discoveries.items.includes(item.id)),loreEntries={prologue:["Le Porteur de flamme","Un héros sans nom marche vers le Maître des Cendres."],story:["La Chapelle muette","Votre écriture annonce que cette route a déjà été parcourue."],r1memory:["Le Mémorial du Fanal","Les Veilleurs avaient réservé une place au héros avant son arrivée."],r2story:["L'Observatoire noyé","Les astronomes regardaient les étoiles sous le monde."],r2library:["Les Archives submergées","Une page ancienne semble avoir été écrite de votre main."],r2sanctum:["Le Sanctuaire des Noms","Votre nom a été retiré de la pierre avec une précision impossible."],r2monastery:["Le Monastère des Reflets","Votre reflet connaît la suite de la route et la redoute."],r3entry:["Le Royaume sous la Cendre","La capitale ensevelie attendait le retour du Revenant."],r3story:["Le souvenir royal","Vous aviez autrefois confié une couronne au Maître."],r3council:["Le Conseil des Masques","Les anciens juges nomment le héros « Revenant »."],r4entry:["Le Premier Souvenir","La dernière route existe avant toutes les autres."],r4story:["La vérité du Cycle","Le Maître contenait le Brasier à votre demande."],final_truth:["Le Serment partagé","Le héros et le Maître furent les deux gardiens d'une même faute."]};
  const factions=Object.entries(GAME_DATA.narrative.factions),questItems=state.narrative.questItems.map(id=>GAME_DATA.narrative.questItems[id]).filter(Boolean),decisions=[...state.narrative.decisions].reverse();
  $("#codex-content").innerHTML=safeHtml`<div class="codex-progress"><span><b>${discoveredEnemies.length}/${GAME_DATA.enemies.length}</b><small>Créatures</small></span><span><b>${discoveredItems.length}/${GAME_DATA.items.length}</b><small>Objets</small></span><span><b>${state.discoveries.lore.length}</b><small>Fragments</small></span></div><div class="section-heading"><h4>Factions</h4><small>Vos actes façonnent leur confiance</small></div><div class="reputation-grid">${factions.map(([id,faction])=>{const value=state.narrative.reputation[id]||0,tone=value>0?"positive":value<0?"negative":"neutral";return `<article class="${tone}"><span>${faction.icon}</span><div><b>${faction.name}</b><small>${faction.description}</small></div><strong>${value>0?"+":""}${value}</strong></article>`}).join("")}</div><div class="section-heading"><h4>Objets de quête</h4><small>Séparés de l'inventaire</small></div><div class="quest-item-grid">${questItems.map(item=>`<article><span>${item.icon}</span><div><b>${item.name}</b><p>${item.description}</p></div></article>`).join("")||"<p class='codex-empty'>Aucun objet de quête en votre possession.</p>"}</div><div class="section-heading"><h4>Décisions</h4><small>${decisions.length} choix persistants</small></div><div class="decision-log">${decisions.map(decision=>`<article><small>CHAPITRE ${decision.region}</small><b>${decision.label}</b><p>${decision.result}</p></article>`).join("")||"<p class='codex-empty'>La route n'a pas encore exigé de décision.</p>"}</div><div class="section-heading"><h4>Fragments de mémoire</h4></div><div class="lore-list">${state.discoveries.lore.map(id=>loreEntries[id]).filter(Boolean).map(([title,copy])=>`<article><span>☾</span><div><b>${title}</b><p>${copy}</p></div></article>`).join("")}</div><div class="section-heading"><h4>Bestiaire</h4><small>${discoveredEnemies.length} observées</small></div><div class="codex-grid">${discoveredEnemies.map(enemy=>`<article><span>${enemy.icon}</span><div><b>${enemy.name}</b><small>${enemy.tags.join(" · ")}</small><p>${enemy.boss?"Une présence majeure liée au mystère d'Astréa.":`PV de base ${enemy.hp} · Dégâts ${enemy.damage}`}</p></div></article>`).join("")||"<p class='codex-empty'>Aucune créature consignée.</p>"}</div><div class="section-heading"><h4>Collection</h4><small>${discoveredItems.length} objets</small></div><div class="codex-grid compact">${discoveredItems.map(item=>`<article><span>${item.slot==="Arme"?"⚔":item.slot==="Armure"?"♜":"◉"}</span><div><b>${item.name}</b><small>${item.rarity} · ${item.slot}</small></div></article>`).join("")||"<p class='codex-empty'>Aucun objet consigné.</p>"}</div>`;
}
function renderSettings(){
  const settings=loadSettings();$("#settings-content").innerHTML=safeHtml`<div class="settings-group-title"><span>♫</span><div><b>Mixage audio</b><small>Chaque canal peut être réglé indépendamment.</small></div></div><div class="setting-row"><div><b>Volume général</b><small>Niveau de sortie principal</small></div><input id="setting-volume" aria-label="Volume général" type="range" min="0" max="1" step="0.05" value="${settings.volume}"></div><div class="setting-row"><div><b>Musique et ambiance</b><small>Thème dynamique des régions et des boss</small></div><input id="setting-music" aria-label="Volume de la musique" type="range" min="0" max="1" step="0.05" value="${settings.musicVolume}"></div><div class="setting-row"><div><b>Effets sonores</b><small>Attaques, impacts et récompenses</small></div><input id="setting-sfx" aria-label="Volume des effets" type="range" min="0" max="1" step="0.05" value="${settings.sfxVolume}"></div><label class="setting-row"><div><b>Couper tout le son</b><small>Conserve vos niveaux de mixage</small></div><input id="setting-mute" type="checkbox" ${settings.mute?"checked":""}></label><label class="setting-row"><div><b>Indications sonores visuelles</b><small>Affiche les événements audio importants</small></div><input id="setting-cues" type="checkbox" ${settings.audioCues?"checked":""}></label><div class="settings-group-title"><span>◇</span><div><b>Confort visuel</b><small>Adaptez les retours de combat à votre sensibilité.</small></div></div><label class="setting-row"><div><b>Réduire les animations</b><small>Supprime mouvements, flashes et pulsations</small></div><input id="setting-motion" type="checkbox" ${settings.reducedMotion?"checked":""}></label><label class="setting-row"><div><b>Secousses d'écran</b><small>Renforce les impacts lourds et les changements de phase</small></div><input id="setting-shake" type="checkbox" ${settings.screenShake?"checked":""}></label><label class="setting-row"><div><b>Contraste renforcé</b><small>Améliore la séparation des éléments</small></div><input id="setting-contrast" type="checkbox" ${settings.highContrast?"checked":""}></label><div class="setting-row"><div><b>Vitesse des combats</b><small>Accélère uniquement les transitions de tours</small></div><select id="setting-pace"><option value=".85">Posée</option><option value="1">Normale</option><option value="1.35">Rapide</option></select></div><div class="setting-row"><div><b>Taille du texte</b><small>Ajuste l'ensemble de l'interface</small></div><select id="setting-text"><option value=".9">Compacte</option><option value="1">Normale</option><option value="1.12">Grande</option><option value="1.25">Très grande</option></select></div><div class="setting-row"><div><b>Déplacements</b><small>Les flèches restent toujours disponibles</small></div><select id="setting-controls"><option value="zqsd">ZQSD</option><option value="wasd">WASD</option></select></div><button class="text-button" data-action="fullscreen">Basculer en plein écran</button><div class="controls-help"><b>Raccourcis</b><span>Échap · pause/fermer</span><span>Entrée · confirmer</span><span>Journal · bouton dédié en combat</span><span>Manette · croix directionnelle et bouton principal</span></div>`;$("#setting-text").value=String(settings.textScale);$("#setting-controls").value=settings.controls;$("#setting-pace").value=String(settings.combatPace||1);
  const update=()=>saveSettings({...settings,volume:+$("#setting-volume").value,musicVolume:+$("#setting-music").value,sfxVolume:+$("#setting-sfx").value,mute:$("#setting-mute").checked,audioCues:$("#setting-cues").checked,reducedMotion:$("#setting-motion").checked,screenShake:$("#setting-shake").checked,highContrast:$("#setting-contrast").checked,combatPace:+$("#setting-pace").value,textScale:+$("#setting-text").value,controls:$("#setting-controls").value});["setting-volume","setting-music","setting-sfx"].forEach(id=>$(`#${id}`).oninput=update);["setting-mute","setting-cues","setting-motion","setting-shake","setting-contrast","setting-pace","setting-text","setting-controls"].forEach(id=>$(`#${id}`).onchange=update);
}
function endExpedition(victory=false,abandoned=false){
  if(!state||state.run.ended)return;state.run.ended=true;const chosenEnding=GAME_DATA.endings.find(entry=>entry.id===state.campaign?.ending);if(victory)evaluateChallenges({actComplete:true,secretEnding:chosenEnding?.id==="remembered"});const meta=loadMeta(),earned=GAME_RULES.legacyReward({...state.run,battlesWon:state.battlesWon},state.run.difficulty,state.run.modifier,victory),duration=Math.max(1,Math.floor((Date.now()-state.run.startedAt)/60000));
  meta.embers+=earned;meta.runs++;meta.trophies=[...new Set([...meta.trophies,...(state.run.bossTrophies||[])])];for(const key of ["items","enemies","lore"])meta.discoveries[key]=[...new Set([...meta.discoveries[key],...(state.discoveries[key]||[])])];if(victory){meta.wins++;meta.classWins[state.classId]=(meta.classWins[state.classId]||0)+1;if(chosenEnding&&!meta.endings.includes(chosenEnding.id))meta.endings.push(chosenEnding.id);meta.ascensionUnlocked=Math.max(meta.ascensionUnlocked,Math.min(10,(state.run.ascension||0)+1))}meta.bestLevel=Math.max(meta.bestLevel,state.level);const score=Math.round(state.battlesWon*100+state.run.bossesDefeated*500+(state.run.nemesesDefeated||0)*350+state.run.optionalCleared*175+state.level*40+(state.run.ascension||0)*600);meta.scores.push({score,className:hero().name,ending:chosenEnding?.id||null,ascension:state.run.ascension||0,duration,daily:!!state.run.daily,date:new Date().toISOString().slice(0,10)});meta.scores.sort((a,b)=>b.score-a.score);meta.scores=meta.scores.slice(0,10);saveMeta(meta);saveSlots.clear();updateContinue();
  $("#summary-title").textContent=chosenEnding?.name||(victory?"Le voyage est accompli":abandoned?"L'expédition est abandonnée":"La route vous a brisé");
  $("#summary-content").innerHTML=safeHtml`${chosenEnding?`<div class="summary-ending ${chosenEnding.tone}"><span>${chosenEnding.icon}</span><div><small>FIN DÉCOUVERTE · ${meta.endings.length}/${GAME_DATA.endings.length}</small><b>${chosenEnding.name}</b><p>${chosenEnding.description}</p></div></div>`:""}<div class="summary-hero"><b>${hero().name}</b><span>Niveau ${state.level} · ${difficulties[state.run.difficulty]?.name}</span><code>GRAINE ${state.seed}</code></div><div class="summary-stats"><span><b>${state.battlesWon}</b><small>Combats gagnés</small></span><span><b>${state.run.wavesCleared||0}</b><small>Vagues surmontées</small></span><span><b>${state.run.bossesDefeated}</b><small>Boss vaincus</small></span><span><b>${state.run.optionalCleared}</b><small>Détours terminés</small></span><span><b>${state.run.hazardsTriggered||0}</b><small>Dangers traversés</small></span><span><b>${state.run.nemesesDefeated||0}</b><small>Némésis vaincues</small></span><span><b>${duration} min</b><small>Durée</small></span><span><b>${state.run.damageDealt}</b><small>Dégâts infligés</small></span><span><b>${state.run.damageTaken}</b><small>Dégâts subis</small></span></div><div class="legacy-earned"><span>♨</span><div><small>HÉRITAGE RAPPORTÉ</small><b>+${earned} braises</b></div></div>`;
  openPanel("summary");
}
function toast(text){$("#toast").textContent=text;$("#toast").classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("#toast").classList.remove("show"),2200)}

document.addEventListener("click",e=>{
  const action=e.target.closest("[data-action]")?.dataset.action,panel=e.target.closest("[data-panel]")?.dataset.panel,combatType=e.target.closest("[data-combat]")?.dataset.combat,clickedButton=e.target.closest("button");if(clickedButton&&!clickedButton.disabled&&!combatType)playSound("ui");if(panel)openPanel(panel);if(combatType)combatAction(combatType);
  const saveSlot=e.target.closest("[data-save-slot]")?.dataset.saveSlot,restoreSlot=e.target.closest("[data-restore-slot]")?.dataset.restoreSlot;if(saveSlot)chooseSaveSlot(+saveSlot);if(restoreSlot)restoreSlotBackup(+restoreSlot);
  const companionId=e.target.closest("[data-companion]")?.dataset.companion,gearCompanion=e.target.closest("[data-companion-gear]")?.dataset.companionGear,equipButton=e.target.closest("[data-equip-companion]");if(companionId)chooseCompanion(companionId);if(gearCompanion)showCompanionEquipment(gearCompanion);if(equipButton)equipCompanionItem(equipButton.dataset.equipCompanion,equipButton.dataset.itemUid);
  const companionChoice=e.target.closest("[data-companion-choice]")?.dataset.companionChoice;if(companionChoice)resolveCompanionMilestone(companionChoice);
  const contractId=e.target.closest("[data-contract-accept]")?.dataset.contractAccept;if(contractId)acceptContract(contractId);if(e.target.closest("[data-contract-abandon]"))abandonContract();if(e.target.closest("[data-contract-claim]"))claimContract();
  const campChoice=e.target.closest("[data-camp-choice]")?.dataset.campChoice;if(campChoice)chooseCampAction(campChoice);
  const narrativeChoice=e.target.closest("[data-narrative-choice]")?.dataset.narrativeChoice;if(narrativeChoice)chooseNarrativeChoice(narrativeChoice);
  const endingChoice=e.target.closest("[data-ending]")?.dataset.ending;if(endingChoice)chooseFinalEnding(endingChoice);
  if(action==="new-game")showScreen("class-select");if(action==="continue"&&load()){if(state.completedRegion4&&state.campaign.ending){endingMode=true;slideDeck=buildEndingSlides(GAME_DATA.endings.find(entry=>entry.id===state.campaign.ending));slideIndex=0;showScreen("prologue");renderSlide()}else{showScreen("exploration");if(state.completedRegion4)setTimeout(openFinalChoice,250)}}if(action==="menu")showScreen("main-menu");if(action==="pause")openPanel("pause");
  if(action==="random-seed"){dailyMode=false;$("#run-seed").value=seedValue()}if(action==="daily-seed"){dailyMode=true;$("#run-seed").value=Number(new Date().toISOString().slice(0,10).replaceAll("-",""));toast("Graine quotidienne sélectionnée.")}
  if(action==="next-slide")nextSlide();if(action==="skip-prologue")finishPrologue();
  if(action==="next-region"&&state.currentRegion===1&&state.completedRegion1)startRegionTwo();if(action==="next-region"&&state.currentRegion===2&&state.completedRegion2)startRegionThree();if(action==="next-region"&&state.currentRegion===3&&state.completedRegion3)startRegionFour();
  if(action==="resume"||action==="close-panel")closeOverlay();if(action==="save-menu"){save();showScreen("main-menu");toast("Partie sauvegardée")}
  if(action==="abandon")endExpedition(false,true);
  if(action==="summary-menu"){localStorage.removeItem(slotKey());state=null;updateContinue();showScreen("main-menu")}
  if(action==="claim")claimVictory();if(action==="event-claim")claimEvent();if(action==="level-close"){closeOverlay();updateHud();renderMap();setTimeout(()=>{if(!showSpecializationChoice())showCompanionMilestone()},180)}
  if(action==="skip-reward")skipReward();
  if(action==="close-forge"){closeOverlay();save();renderMap();updateHud()}
  if(action==="quit")alert("Votre voyage est sauvegardé. Vous pouvez fermer cet onglet.");
  if(action==="fullscreen"){if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.()}
  if(action==="export-saves")exportSaveArchive();if(action==="import-saves")$("#save-import-file")?.click();if(action==="undo-import")restorePreImportArchive();
  if(action==="guide-close")closeOverlay();if(action==="toggle-guides"&&state){state.tutorial.enabled=!state.tutorial.enabled;save();renderGlossary();toast(state.tutorial.enabled?"Conseils contextuels activés.":"Conseils contextuels désactivés.")}
  if(action==="training"&&state&&currentScreen==="exploration"){closeOverlay();startCombat(["scout"],{title:"Terrain d'entraînement",training:true,difficulty:0})}
  if(action==="advanced-training"&&state&&currentScreen==="exploration"){closeOverlay();startCombat(["scout"],{title:"Simulation tactique",training:true,trainingHazard:true,elite:true,difficulty:2,enemyHpScale:.45,enemyDamageScale:.55,waves:[["hound","cultist"]]})}
  if(action==="toggle-combat-log")toggleCombatHistory();
  if(action==="nemesis-hunt"&&state&&currentScreen==="exploration")startNemesisHunt(false);
  const difficulty=e.target.closest("[data-difficulty]")?.dataset.difficulty,modifier=e.target.closest("[data-modifier]")?.dataset.modifier,ascension=e.target.closest("[data-ascension]")?.dataset.ascension,unlock=e.target.closest("[data-unlock]")?.dataset.unlock;
  if(difficulty){selectedDifficulty=difficulty;renderExpeditionSetup()}if(modifier){selectedModifier=modifier;renderExpeditionSetup()}if(ascension!==undefined){selectedAscension=+ascension;renderExpeditionSetup()}if(unlock)buySanctuaryUpgrade(unlock);
  const sanctuaryTab=e.target.closest("[data-sanctuary-tab]")?.dataset.sanctuaryTab,building=e.target.closest("[data-restore-building]")?.dataset.restoreBuilding,preparation=e.target.closest("[data-sanctuary-preparation]")?.dataset.sanctuaryPreparation,collection=e.target.closest("[data-claim-collection]")?.dataset.claimCollection;
  if(sanctuaryTab){sanctuaryView=sanctuaryTab;renderSanctuary()}if(building)restoreSanctuaryBuilding(building);if(preparation)chooseSanctuaryPreparation(preparation);if(collection)claimSanctuaryCollection(collection);
  const specialization=e.target.closest("[data-specialization]")?.dataset.specialization,passive=e.target.closest("[data-passive]")?.dataset.passive,variantButton=e.target.closest("[data-variant]"),mastery=e.target.closest("[data-mastery]")?.dataset.mastery,presetSave=e.target.closest("[data-preset-save]")?.dataset.presetSave,presetLoad=e.target.closest("[data-preset-load]")?.dataset.presetLoad;
  if(specialization)chooseSpecialization(specialization);if(passive)togglePassive(passive);if(variantButton)chooseAbilityVariant(variantButton.dataset.ability,variantButton.dataset.variant);if(mastery)chooseMastery(mastery);if(presetSave!==undefined)saveBuildPreset(+presetSave);if(presetLoad!==undefined)activateBuildPreset(+presetLoad);if(e.target.closest("[data-respec-build]"))resetBuild();
  const forgeTab=e.target.closest("[data-forge-tab]")?.dataset.forgeTab;if(forgeTab){$$("[data-forge-tab]").forEach(button=>button.classList.toggle("active",button.dataset.forgeTab===forgeTab));$("#forge-items").classList.toggle("hidden",forgeTab!=="upgrade");$("#crafting-items").classList.toggle("hidden",forgeTab!=="craft");$("#merchant-items").classList.toggle("hidden",forgeTab!=="merchant")}
});
document.addEventListener("change",e=>{if(e.target.id==="save-import-file"){importSaveArchive(e.target.files?.[0]);e.target.value=""}});
$("#confirm-class").onclick=startGame;
document.addEventListener("keydown",e=>{if(currentScreen==="class-select"){if(e.key==="ArrowLeft")selectClass(selectedIndex-1);if(e.key==="ArrowRight")selectClass(selectedIndex+1);if(e.key==="Enter")startGame()}else if(currentScreen==="prologue"&&(e.key==="Enter"||e.key==="ArrowRight"))nextSlide();let key=e.key;if(loadSettings().controls==="wasd")key={w:"z",W:"Z",a:"q",A:"Q"}[key]||key;keyboardMove(key);if(e.key==="Escape"){if(currentScreen==="prologue")finishPrologue();else if($("#overlay").classList.contains("open"))closeOverlay();else if(["exploration","combat"].includes(currentScreen))openPanel("pause")}});
document.addEventListener("pointerdown",startAmbience,{once:true});
let gamepadLatch=false;function pollGamepad(){const pad=navigator.getGamepads?.()[0];if(pad){const pressed=pad.buttons.some(button=>button.pressed)||Math.abs(pad.axes[0]||0)>.55||Math.abs(pad.axes[1]||0)>.55;if(pressed&&!gamepadLatch){if(currentScreen==="prologue")nextSlide();else if(currentScreen==="exploration"){const horizontal=pad.axes[0]||0,vertical=pad.axes[1]||0;keyboardMove(horizontal<-.55||vertical>.55?"ArrowLeft":"ArrowRight")}else if(currentScreen==="combat"){const action=$('[data-combat="attack"]');if(action&&!combat?.busy)action.click()}}gamepadLatch=pressed}requestAnimationFrame(pollGamepad)}requestAnimationFrame(pollGamepad);
const mapSchemas=validateMapCatalog({1:regionOneNodes,2:regionTwoNodes,3:regionThreeNodes,4:regionFourNodes}),worldErrors=validateWorld(),contentErrors=VALIDATION_SYSTEM.validateContent(GAME_DATA);if(mapSchemas.length||worldErrors.length||contentErrors.length)console.error("Validation du jeu :",[...mapSchemas,...worldErrors,...contentErrors]);
if(localStorage.getItem(SAVE_KEY)&&!localStorage.getItem(slotKey(1))){localStorage.setItem(slotKey(1),localStorage.getItem(SAVE_KEY));localStorage.removeItem(SAVE_KEY)}
window.addEventListener("error",event=>{const banner=$("#error-banner");banner.textContent="Une erreur a été interceptée. Votre dernière sauvegarde automatique reste disponible.";banner.classList.remove("hidden");console.error("Erreur de jeu :",event.error||event.message)});
applySettings();renderCards();renderDetails();updateContinue();renderLegacyLabel();
