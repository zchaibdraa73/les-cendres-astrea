(function(root,factory){
  const rules=factory();
  if(typeof module==="object"&&module.exports)module.exports=rules;
  root.GAME_RULES=rules;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  function xpForLevel(level){
    const safeLevel=clamp(Math.trunc(level)||1,1,30);
    return Math.round((100+(safeLevel-1)*32+(safeLevel-1)*(safeLevel-1)*2.5)/10)*10;
  }
  function seededStep(seed){
    let t=(seed>>>0)+0x6D2B79F5;
    t=Math.imul(t^t>>>15,t|1);
    t^=t+Math.imul(t^t>>>7,t|61);
    const next=(t^t>>>14)>>>0;
    return [next,next/4294967296];
  }
  function enemyLevel(playerLevel,region,difficulty=0,eliteRoll=false){
    const floor=region===4?27:region===3?23:region===2?14:1;
    return clamp(Math.max(floor,playerLevel+difficulty+(eliteRoll?1:0)),1,30);
  }
  function scaleEnemy(base,level,difficulty=0){
    const hpMultiplier=1+difficulty*.25;
    const damageMultiplier=1+difficulty*.15;
    return {
      hp:Math.round(base.hp*hpMultiplier*(1+(level-1)*.055)),
      damage:Math.round(base.damage*damageMultiplier*(1+(level-1)*.032)),
      xp:Math.round(base.xp*(1+(level-1)*.035)),
      gold:Math.round(base.gold*(1+(level-1)*.02))
    };
  }
  function bossPhase(hp,maxHp){
    const ratio=maxHp>0?hp/maxHp:0;
    return ratio<=.33?3:ratio<=.66?2:1;
  }
  function recommendedLevel(region,index,optional=false,tier=0){
    if(region===1)return clamp(1+Math.floor(index*.85)+(optional?Math.max(1,tier-2):0),1,18);
    if(region===2)return clamp(14+Math.floor(index*1.1)+(optional?Math.max(1,tier-7):0),14,30);
    if(region===3)return clamp(23+Math.floor(index*.6)+(optional?Math.max(1,tier-18):0),23,30);
    return clamp(27+Math.floor(index*.45)+(optional?Math.max(1,tier-22):0),27,30);
  }
  function enemyIntent(tags=[],turn=1,bossPhaseValue=0){
    if(tags.includes("boss"))return bossPhaseValue===3&&turn%3===0?{type:"ultimate",label:"Extinction",multiplier:1.35}:bossPhaseValue>=2?{type:"drain",label:"Drain astral",multiplier:1.12}:{type:"attack",label:"Attaque",multiplier:1};
    if(tags.includes("invocateur")&&turn%4===0)return {type:"summon",label:"Invocation",multiplier:0};
    if(tags.includes("soigneur")&&turn%3===0)return {type:"heal",label:"Soin rituel",multiplier:0};
    if(tags.includes("soutien")&&turn%4===0)return {type:"rally",label:"Exaltation",multiplier:0};
    if(tags.includes("protecteur")&&turn%3===0)return {type:"protect",label:"Égide alliée",multiplier:0};
    if(tags.includes("mystique")&&turn%3===0)return {type:"hex",label:"Malédiction",multiplier:.75,status:"weakness"};
    if(tags.includes("armure")&&turn%3===0)return {type:"guard",label:"Fortification",multiplier:.65,status:"barrier"};
    if(tags.includes("bête")&&turn%2===0)return {type:"bleed",label:"Lacération",multiplier:.9,status:"bleed"};
    if(tags.includes("élite")&&turn%3===0)return {type:"heavy",label:"Attaque lourde",multiplier:1.4};
    return {type:"attack",label:"Attaque",multiplier:1};
  }
  function damageAffinity(type="physical",resistances={}){
    return clamp(1-(resistances[type]||0),.35,1.75);
  }
  function postureDamage(damage,maxHp){
    return Math.max(1,Math.round(damage/Math.max(1,maxHp)*100));
  }
  function classResourceProfile(classId){
    const profiles={bastion:{id:"resolve",max:5},traqueuse:{id:"combo",max:5},arcaniste:{id:"overload",max:3},penitent:{id:"debt",max:10}};
    return profiles[classId]?{...profiles[classId]}:null;
  }
  function classResourceDamage(classId,value,ability=false){
    const safe=Math.max(0,Number(value)||0);
    if(classId==="bastion")return 1+safe*(ability?.12:.08);
    if(classId==="traqueuse")return 1+safe*(ability?.08:.04);
    if(classId==="arcaniste")return safe>=2?1.35:1;
    if(classId==="penitent")return 1+safe*.035;
    return 1;
  }
  function statusDamage(statuses={}){
    return ["burn","bleed"].reduce((sum,id)=>sum+(statuses[id]?.potency||0),0);
  }
  function tickStatuses(statuses={}){
    const next={};
    for(const [id,status] of Object.entries(statuses)){
      const turns=(status.turns||1)-1;
      if(turns>0)next[id]={...status,turns};
    }
    return next;
  }
  function difficultyRules(id="normal"){
    return {
      normal:{enemyHp:1,enemyDamage:1,rewards:1,legacy:1},
      peril:{enemyHp:1.18,enemyDamage:1.12,rewards:1.25,legacy:1.35},
      nightmare:{enemyHp:1.4,enemyDamage:1.28,rewards:1.55,legacy:1.8}
    }[id]||{enemyHp:1,enemyDamage:1,rewards:1,legacy:1};
  }
  function legacyReward(stats={},difficulty="normal",modifier="none",victory=false){
    if(!victory&&!(stats.battlesWon||0)&&!(stats.optionalCleared||0))return 0;
    const base=5+(stats.battlesWon||0)*2+(stats.bossesDefeated||0)*8+(stats.optionalCleared||0)*3+(victory?25:0);
    const modifierBonus=modifier==="fragile"?1.3:modifier==="scarcity"?1.2:modifier==="hunters"?1.25:1;
    return Math.round(base*difficultyRules(difficulty).legacy*modifierBonus);
  }
  function resolveSetBonuses(setIds=[],sets={}){
    const bonuses=[];for(const [setId,set] of Object.entries(sets)){const count=setIds.filter(id=>id===setId).length;for(const [required,bonus] of Object.entries(set.bonuses||{}))if(count>=Number(required))bonuses.push({...bonus,setId,name:set.name,required:Number(required)})}return bonuses;
  }
  function applyAffix(stats={},affix=null){
    const result={...stats};for(const [key,value] of Object.entries(affix?.stats||{}))result[key]=(result[key]||0)+value;return result;
  }
  function maxItemLevel(rarityRank){return ({1:3,2:5,3:7,4:10})[rarityRank]||3}
  function deterministicStock(ids=[],seed=1,count=5){
    const result=[],used=new Set();let cursor=(seed^0xC0FFEE)>>>0;while(result.length<Math.min(count,ids.length)){const step=seededStep(cursor);cursor=step[0];const index=Math.floor(step[1]*ids.length);if(used.has(index))continue;used.add(index);result.push(ids[index])}return result;
  }
  function selectCombatHazard(hazards=[],seed=1,region=1,mapIndex=0){
    const pool=hazards.filter(hazard=>hazard.region===region);if(!pool.length)return null;
    const [,roll]=seededStep(((seed>>>0)^Math.imul(region+11,0x9E3779B1)^Math.imul(mapIndex+7,0x85EBCA6B))>>>0);
    return pool[Math.floor(roll*pool.length)];
  }
  function selectEliteMutations(mutations=[],seed=1,region=1,mapIndex=0,count=1){
    const ids=mutations.map(mutation=>mutation.id),salt=((seed>>>0)^Math.imul(region+3,0x27D4EB2D)^Math.imul(mapIndex+17,0x165667B1))>>>0;
    return deterministicStock(ids,salt,clamp(Math.trunc(count)||0,0,ids.length));
  }
  function shouldTriggerHazard(turn,cadence){return cadence>0&&turn>0&&turn%cadence===0}
  function waveRewardMultiplier(waveCount=1){return 1+Math.max(0,Math.trunc(waveCount)-1)*.3}
  function masteryPointsForLevel(level=1){return clamp(Math.floor(clamp(Math.trunc(level)||1,1,30)/5),0,6)}
  function canUnlockMastery(node,selectedIds=[],level=1,spent=0){
    if(!node||selectedIds.includes(node.id)||spent>=masteryPointsForLevel(level))return false;
    if((node.level||1)>level)return false;
    return !node.requires||selectedIds.includes(node.requires);
  }
  function damageBreakdown({power=0,stat=0,ratio=1,level=1,rank=1,evolution=1,build=1,resource=1}={}){
    const foundation=Math.max(0,Number(power)||0)+Math.max(0,Number(stat)||0)*(Number(ratio)||0)+Math.max(0,(Number(level)||1)*1.5);
    const rankMultiplier=1+Math.max(0,(Number(rank)||1)-1)*.25;
    const total=Math.floor(foundation*rankMultiplier*Math.max(0,Number(evolution)||0)*Math.max(0,Number(build)||0)*Math.max(0,Number(resource)||0));
    return {power:Math.round(Number(power)||0),stat:Math.round((Number(stat)||0)*(Number(ratio)||0)),level:Math.round(Math.max(0,(Number(level)||1)*1.5)),rankMultiplier,evolutionMultiplier:Number(evolution)||0,buildMultiplier:Number(build)||0,resourceMultiplier:Number(resource)||0,total};
  }
  function validateBuildPreset(preset={},knownAbilities=[],knownPassives=[],ownedItemUids=[]){
    const abilitySet=new Set(knownAbilities),passiveSet=new Set(knownPassives),itemSet=new Set(ownedItemUids);
    const abilities=(preset.abilities||[]).filter(id=>abilitySet.has(id)).slice(0,4);
    const passives=(preset.passives||[]).filter(id=>passiveSet.has(id)).slice(0,6);
    const equipment=Object.fromEntries(Object.entries(preset.equipment||{}).filter(([,uid])=>!uid||itemSet.has(uid)));
    const variants=Object.fromEntries(Object.entries(preset.variants||{}).filter(([id,variant])=>abilitySet.has(id)&&["power","mastery"].includes(variant)));
    return {abilities,passives,equipment,variants};
  }
  return {clamp,xpForLevel,seededStep,enemyLevel,scaleEnemy,bossPhase,recommendedLevel,enemyIntent,damageAffinity,postureDamage,classResourceProfile,classResourceDamage,statusDamage,tickStatuses,difficultyRules,legacyReward,resolveSetBonuses,applyAffix,maxItemLevel,deterministicStock,selectCombatHazard,selectEliteMutations,shouldTriggerHazard,waveRewardMultiplier,masteryPointsForLevel,canUnlockMastery,damageBreakdown,validateBuildPreset};
});
