import {
  compatibleEquipmentSlots,
  equipmentGroups,
  equipmentSlotOrder,
  equipmentSlots,
  itemEquipTypes,
  validateEquipmentModel,
} from "./equipment-model.mjs";
import { equipTypeForCatalogItem } from "./legacy-item-classification.mjs";

const rarities=["commun","rare","épique","légendaire"];
const equipTypes=Object.keys(itemEquipTypes);
const itemPower=item=>Object.values(item?.stats||{}).reduce((sum,value)=>sum+(Number.isFinite(value)?value:0),0);

function maximumSlotMatching(items){
  const occupied=new Map();
  const assign=(item,visited)=>{
    for(const slotId of compatibleEquipmentSlots(item)){
      if(visited.has(slotId))continue;
      visited.add(slotId);
      const previous=occupied.get(slotId);
      if(!previous||assign(previous,visited)){occupied.set(slotId,item);return true}
    }
    return false;
  };
  items.forEach(item=>assign(item,new Set()));
  return occupied.size;
}

function regionGroupSummary(items,region){
  const regional=items.filter(item=>(item.region||1)===region);
  const averages=Object.fromEntries(equipTypes.map(type=>{
    const matches=regional.filter(item=>equipTypeForCatalogItem(item)===type);
    return [type,matches.length?matches.reduce((sum,item)=>sum+itemPower(item),0)/matches.length:0];
  }));
  const groups=Object.fromEntries(Object.values(equipmentGroups).map(group=>{
    const average=group.slots.reduce((sum,slotId)=>{
      const accepted=equipTypes.filter(type=>compatibleEquipmentSlots(type).includes(slotId));
      const slotAverage=accepted.length?accepted.reduce((total,type)=>total+averages[type],0)/accepted.length:0;
      return sum+slotAverage*equipmentSlots[slotId].groupShare;
    },0);
    return [group.id,{average,count:regional.filter(item=>itemEquipTypes[equipTypeForCatalogItem(item)]?.group===group.id).length}];
  }));
  return {region,total:regional.length,typeCounts:Object.fromEntries(equipTypes.map(type=>[type,regional.filter(item=>equipTypeForCatalogItem(item)===type).length])),groups};
}

export function auditEquipmentCatalog(data){
  const errors=validateEquipmentModel().map(error=>`Modèle : ${error}`);
  const items=Array.isArray(data?.items)?data.items:[];
  const builds=data?.builds||{},itemById=new Map();
  for(const item of items){
    if(itemById.has(item.id))errors.push(`Identifiant d'équipement dupliqué : ${item.id}.`);
    itemById.set(item.id,item);
    const type=equipTypeForCatalogItem(item);
    if(!itemEquipTypes[type])errors.push(`Type d'équipement introuvable : ${item.id}.`);
    if(!compatibleEquipmentSlots(type).length)errors.push(`Aucun emplacement compatible : ${item.id}.`);
    const values=Object.values(item.stats||{});
    if(!values.length||values.some(value=>!Number.isFinite(value)||value<0)||itemPower(item)<=0)errors.push(`Statistiques d'équipement invalides : ${item.id}.`);
  }

  const regions=[1,2,3,4].map(region=>regionGroupSummary(items,region));
  for(const summary of regions){
    for(const type of equipTypes)if(!summary.typeCounts[type])errors.push(`Région ${summary.region} sans équipement de type ${type}.`);
    const powers=Object.values(summary.groups).map(group=>group.average).filter(Boolean);
    if(powers.length===Object.keys(equipmentGroups).length&&Math.max(...powers)/Math.min(...powers)>1.45)errors.push(`Région ${summary.region} : écart de puissance excessif entre groupes.`);
  }
  for(const groupId of Object.keys(equipmentGroups)){
    for(let index=1;index<regions.length;index++){
      if(regions[index].groups[groupId].average<=regions[index-1].groups[groupId].average)errors.push(`Courbe ${groupId} non croissante entre les régions ${index} et ${index+1}.`);
    }
  }

  const rarityCurve=rarities.map(rarity=>{
    const tier=items.filter(item=>item.rarity===rarity);
    return {rarity,count:tier.length,average:tier.length?tier.reduce((sum,item)=>sum+itemPower(item),0)/tier.length:0};
  });
  rarityCurve.forEach((tier,index)=>{
    if(!tier.count)errors.push(`Rareté sans équipement : ${tier.rarity}.`);
    if(index&&tier.average<=rarityCurve[index-1].average)errors.push(`Courbe de rareté non croissante au palier ${tier.rarity}.`);
  });

  const effects=builds.artifactEffects||{};
  for(const item of items.filter(item=>item.rarity==="légendaire"))if(!effects[item.id])errors.push(`Pouvoir d'artéfact absent : ${item.id}.`);
  for(const id of Object.keys(effects))if(itemById.get(id)?.rarity!=="légendaire")errors.push(`Pouvoir d'artéfact sans objet légendaire : ${id}.`);

  const sets=Object.entries(builds.sets||{});
  for(const [setId,set] of sets){
    const setItems=(set.items||[]).map(id=>itemById.get(id)).filter(Boolean);
    if(setItems.length!==(set.items||[]).length)errors.push(`Ensemble ${setId} : pièce inconnue.`);
    if(new Set(set.items||[]).size!==(set.items||[]).length)errors.push(`Ensemble ${setId} : pièce dupliquée.`);
    const maximum=maximumSlotMatching(setItems),highestTier=Math.max(0,...Object.keys(set.bonuses||{}).map(Number));
    if(highestTier>maximum)errors.push(`Ensemble ${setId} : bonus ${highestTier} pièces impossible avec seulement ${maximum} emplacements compatibles.`);
  }

  const recipes=Array.isArray(builds.recipes)?builds.recipes:[],recipeIds=new Set(),craftedTypes=new Set();
  for(const recipe of recipes){
    if(recipeIds.has(recipe.id))errors.push(`Recette dupliquée : ${recipe.id}.`);
    recipeIds.add(recipe.id);
    const item=itemById.get(recipe.item);
    if(!item)errors.push(`Recette ${recipe.id} : équipement inconnu.`);
    else craftedTypes.add(equipTypeForCatalogItem(item));
  }
  for(const type of equipTypes)if(!craftedTypes.has(type))errors.push(`Forge sans recette pour le type ${type}.`);

  const coveredSlots=new Set(items.flatMap(item=>compatibleEquipmentSlots(equipTypeForCatalogItem(item))));
  for(const slotId of equipmentSlotOrder)if(!coveredSlots.has(slotId))errors.push(`Catalogue sans objet compatible avec ${slotId}.`);

  return {
    errors,
    report:{
      itemCount:items.length,
      slotCount:equipmentSlotOrder.length,
      recipeCount:recipes.length,
      setCount:sets.length,
      artifactCount:Object.keys(effects).length,
      craftedTypes:[...craftedTypes],
      rarityCurve,
      regions,
    },
  };
}

export const equipmentAuditConstants=Object.freeze({rarities:[...rarities],equipTypes:[...equipTypes]});
