(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.BALANCE_SYSTEM=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  function classSnapshot(hero,abilities,level){
    const stats={};for(const key of Object.keys(hero.stats))stats[key]=hero.stats[key]+(hero.growth[key]||0)*(level-1);
    const learned=abilities.filter((_,index)=>[1,3,5,8,12,16,20,25,30][index]<=level);
    const averageAbility=learned.reduce((sum,ability)=>sum+ability.power+stats[ability.scaling]*(ability.ratio||1),0)/Math.max(1,learned.length);
    return {classId:hero.id,level,hp:hero.hp+(level-1)*(10+(hero.growth.Vitalité||0)*3),damage:hero.damage+stats.Force*.6+(level-1)*1.5,abilityPower:averageAbility,energy:hero.energy+(level-1)*(1+(hero.growth.Esprit>=3?1:0))};
  }
  function audit(classes,abilities,levels=[1,10,20,30]){
    return levels.flatMap(level=>classes.map(hero=>classSnapshot(hero,abilities[hero.id],level)));
  }
  function spread(snapshots,key,level){const values=snapshots.filter(row=>row.level===level).map(row=>row[key]),min=Math.min(...values),max=Math.max(...values);return max/min}
  function offenseScore(snapshot){return snapshot.damage*.55+snapshot.abilityPower*.45}
  function offenseSpread(snapshots,level){const values=snapshots.filter(row=>row.level===level).map(offenseScore),min=Math.min(...values),max=Math.max(...values);return max/min}
  function equipmentCurve(items,rarities=["commun","rare","épique","légendaire"]){
    return rarities.map(rarity=>{const entries=items.filter(item=>item.rarity===rarity),powers=entries.map(item=>Object.values(item.stats||{}).reduce((sum,value)=>sum+(Number(value)||0),0));return {rarity,count:entries.length,average:powers.length?powers.reduce((a,b)=>a+b,0)/powers.length:0,min:powers.length?Math.min(...powers):0,max:powers.length?Math.max(...powers):0}});
  }
  function enemyCurve(enemies,scaleEnemy,checkpoints={1:10,2:18,3:25,4:30}){
    return Object.entries(checkpoints).map(([region,level])=>{const entries=enemies.filter(enemy=>(enemy.region||1)===Number(region)),regular=entries.filter(enemy=>!enemy.boss),bosses=entries.filter(enemy=>enemy.boss),average=(list,key)=>list.length?list.reduce((sum,enemy)=>sum+scaleEnemy(enemy,level,0)[key],0)/list.length:0;return {region:Number(region),level,regularCount:regular.length,bossCount:bosses.length,regularHp:average(regular,"hp"),regularDamage:average(regular,"damage"),bossHp:average(bosses,"hp"),bossDamage:average(bosses,"damage")}})
  }
  function progressionBudget(xpForLevel,maxLevel=30){const steps=Array.from({length:Math.max(0,maxLevel-1)},(_,index)=>xpForLevel(index+1));return {maxLevel,totalXp:steps.reduce((sum,value)=>sum+value,0),first:steps[0]||0,last:steps.at(-1)||0,monotonic:steps.every((value,index)=>index===0||value>steps[index-1])}}
  return {classSnapshot,audit,spread,offenseScore,offenseSpread,equipmentCurve,enemyCurve,progressionBudget};
});
