export const resolveMutationProfiles=(ids=[],mutations=[])=>ids.map(id=>mutations.find(mutation=>mutation.id===id)).filter(Boolean);

export function tuneCombatEnemies(enemies,tuning={hp:1,damage:1}){
  enemies.forEach(enemy=>{
    enemy.maxHp=Math.max(1,Math.round(enemy.maxHp*(tuning.hp||1)));
    enemy.hp=enemy.maxHp;
    enemy.damage=Math.max(1,Math.round(enemy.damage*(tuning.damage||1)));
    if(enemy.statuses.barrier)enemy.statuses.barrier.potency=Math.round(enemy.maxHp*.15);
  });
  return enemies;
}

export const livingEnemies=combat=>combat.enemies.filter(enemy=>enemy.hp>0);

export function targetEnemy(combat){
  if(combat.enemies[combat.target]?.hp>0)return combat.enemies[combat.target];
  const next=combat.enemies.find(enemy=>enemy.hp>0);
  combat.target=next?.id||0;
  return next;
}
