(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.VALIDATION_SYSTEM=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  let schemaValidator=null;
  function setSchemaValidator(validator){schemaValidator=typeof validator==="function"?validator:null}
  function validateContent(data){
    const schemaErrors=schemaValidator?schemaValidator(data):[];
    const errors=[],unique=(entries,label)=>{const ids=entries.map(entry=>entry.id);if(new Set(ids).size!==ids.length)errors.push(`Identifiants dupliqués : ${label}`)};
    unique(data.items,"objets");unique(data.enemies,"ennemis");unique(data.resources,"ressources");unique(data.contracts||[],"contrats");unique(data.nemesis?.traits||[],"mutations de Némésis");unique(data.combat?.hazards||[],"dangers de combat");unique(data.combat?.mutations||[],"mutations d'élite");unique(data.camp?.choices||[],"choix de campement");unique(data.sanctuary?.buildings||[],"bâtiments du Sanctuaire");unique(data.sanctuary?.preparations||[],"préparatifs du Sanctuaire");unique(data.sanctuary?.collections||[],"collections du Sanctuaire");unique(data.endings||[],"fins");
    const itemIds=new Set(data.items.map(item=>item.id)),resourceIds=new Set(data.resources.map(resource=>resource.id)),abilityIds=new Set(Object.values(data.abilities).flat().map(ability=>ability.id));
    for(const [abilityId,profile] of Object.entries(data.combat.abilityEffects)){if(!abilityIds.has(abilityId))errors.push(`Profil d'attaque orphelin : ${abilityId}`);for(const effect of profile.effects||[])if(!data.combat.statuses[effect.type])errors.push(`Effet inconnu : ${effect.type}`)}
    for(const hazard of data.combat.hazards||[]){if(![1,2,3,4].includes(hazard.region))errors.push(`Région de danger invalide : ${hazard.id}`);if(!hazard.cadence||hazard.cadence<2)errors.push(`Cadence de danger invalide : ${hazard.id}`)}
    for(const mutation of data.combat.mutations||[])if(!mutation.effects||!Object.keys(mutation.effects).length)errors.push(`Mutation sans effet : ${mutation.id}`);
    for(const recipe of data.builds.recipes){if(!itemIds.has(recipe.item))errors.push(`Objet de recette inconnu : ${recipe.item}`);for(const id of Object.keys(recipe.cost))if(!resourceIds.has(id))errors.push(`Ressource inconnue : ${id}`)}
    for(const rune of data.builds.runes)for(const id of Object.keys(rune.cost))if(!resourceIds.has(id))errors.push(`Coût de rune inconnu : ${id}`);
    for(const set of Object.values(data.builds.sets))for(const id of set.items)if(!itemIds.has(id))errors.push(`Objet d'ensemble inconnu : ${id}`);
    for(const [classId,nodes] of Object.entries(data.builds.masteries||{})){unique(nodes,`maîtrises ${classId}`);const nodeIds=new Set(nodes.map(node=>node.id));for(const node of nodes){if(node.requires&&!nodeIds.has(node.requires))errors.push(`Prérequis de maîtrise inconnu : ${node.id}`);if(![1,2,3].includes(node.tier))errors.push(`Palier de maîtrise invalide : ${node.id}`)}if(!data.builds.abilityEvolutions?.[classId])errors.push(`Évolutions manquantes : ${classId}`)}
    for(const id of Object.keys(data.builds.artifactEffects||{})){const item=data.items.find(entry=>entry.id===id);if(!item)errors.push(`Artéfact inconnu : ${id}`);else if(item.rarity!=="légendaire")errors.push(`Effet d'artéfact porté par une rareté invalide : ${id}`)}
    for(const contract of data.contracts||[]){if(!["battle","optional","elite","potionless","boss"].includes(contract.objective?.type))errors.push(`Objectif de contrat inconnu : ${contract.id}`);if(!contract.objective?.target||contract.objective.target<1)errors.push(`Cible de contrat invalide : ${contract.id}`);for(const id of Object.keys(contract.reward?.resources||{}))if(!resourceIds.has(id))errors.push(`Ressource de contrat inconnue : ${id}`)}
    if(data.nemesis){for(const region of [1,2,3,4])if(!data.nemesis.bases[region]?.length)errors.push(`Aucune base de Némésis en région ${region}`);if(!data.nemesis.names.length||!data.nemesis.titles.length)errors.push("Noms de Némésis incomplets")}
    for(const choice of data.camp?.choices||[]){for(const id of Object.keys(choice.cost||{}))if(!resourceIds.has(id))errors.push(`Ressource de campement inconnue : ${id}`);if(choice.buff&&!data.camp.buffs[choice.buff])errors.push(`Préparation de campement inconnue : ${choice.buff}`)}
    if(data.sanctuary){const buildingIds=new Set(data.sanctuary.buildings.map(building=>building.id));for(const building of data.sanctuary.buildings){if(building.costs.length!==3||building.stages.length!==3)errors.push(`Progression de bâtiment incomplète : ${building.id}`);if(building.costs.some(cost=>cost<=0))errors.push(`Coût de bâtiment invalide : ${building.id}`)}for(const preparation of data.sanctuary.preparations){if(!buildingIds.has(preparation.building))errors.push(`Bâtiment de préparatif inconnu : ${preparation.id}`);if(preparation.level<1||preparation.level>3)errors.push(`Niveau de préparatif invalide : ${preparation.id}`)}for(const collection of data.sanctuary.collections)if(!["runs","trophies","items","lore","endings"].includes(collection.metric)||collection.target<1||collection.reward<1)errors.push(`Collection invalide : ${collection.id}`)}
    for(const ending of data.endings||[])if(!ending.name||!ending.choice||!ending.description)errors.push(`Fin incomplète : ${ending.id}`);
    return [...schemaErrors,...errors];
  }
  return {setSchemaValidator,validateContent};
});
