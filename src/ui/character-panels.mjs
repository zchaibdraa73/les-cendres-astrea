import {
  compatibleEquipmentSlots,
  equipmentGroups,
  equipmentSlots,
  itemEquipTypes,
} from "../equipment/equipment-model.mjs";
import { formatStats, itemDisplayName, rarityInfo } from "./presenters.mjs";

export const defaultInventoryFilters=Object.freeze({
  group:"all",
  rarity:"all",
  sort:"power",
});

export function filterAndSortInventory(inventory,filters={},scoreItem=(_item)=>0){
  const group=filters.group||"all",rarity=filters.rarity||"all",sort=filters.sort||"power";
  return inventory.map((item,index)=>({item,index})).filter(({item})=>{
    const itemGroup=itemEquipTypes[item?.equipType]?.group;
    return (group==="all"||itemGroup===group)&&(rarity==="all"||item?.rarity===rarity);
  }).sort((left,right)=>{
    if(sort==="name")return itemDisplayName(left.item).localeCompare(itemDisplayName(right.item),"fr");
    if(sort==="level")return (right.item.level||1)-(left.item.level||1)||scoreItem(right.item)-scoreItem(left.item);
    if(sort==="rarity")return (rarityInfo(right.item.rarity)?.rank||0)-(rarityInfo(left.item.rarity)?.rank||0)||scoreItem(right.item)-scoreItem(left.item);
    return scoreItem(right.item)-scoreItem(left.item)||(rarityInfo(right.item.rarity)?.rank||0)-(rarityInfo(left.item.rarity)?.rank||0);
  });
}

export function inventoryGroupOptions(inventory){
  const groups=[{id:"all",label:"Tout",icon:"▦",count:inventory.length}];
  return groups.concat(Object.values(equipmentGroups).map(group=>({
    id:group.id,
    label:group.label,
    icon:group.icon,
    count:inventory.filter(item=>itemEquipTypes[item?.equipType]?.group===group.id).length,
  })));
}

export function buildLoadoutGroups(equipment,options={}){
  const {
    inventory=[],
    scaledStats=item=>item?.stats||{},
    slotStats=(item)=>scaledStats(item),
    artifactEffect=()=>null,
    setName=()=>"",
    scoreItem=(_item,_slotId)=>0,
  }=options;
  return Object.values(equipmentGroups).map(group=>({
    ...group,
    equipped:group.slots.filter(slotId=>equipment?.[slotId]).length,
    power:group.slots.reduce((sum,slotId)=>sum+(equipment?.[slotId]?scoreItem(equipment[slotId],slotId):0),0),
    slots:group.slots.map(slotId=>{
      const slot=equipmentSlots[slotId],item=equipment?.[slotId]||null;
      return {
        ...slot,
        item,
        inventoryIndex:item?inventory.indexOf(item):-1,
        name:item?itemDisplayName(item):"Emplacement vide",
        stats:item?formatStats(slotStats(item,slotId)):"Aucun bonus actif",
        rawStats:item?formatStats(scaledStats(item)):"",
        level:item?.level||1,
        color:item?.color||rarityInfo(item?.rarity)?.color||"blanc",
        setName:item?.setId?setName(item.setId):"",
        artifact:artifactEffect(item),
      };
    }),
  }));
}

export function buildInventoryEntries(inventory,equipment,filters,options={}){
  const {
    scoreItem=(_item)=>0,
    chooseSlot=(_equipment,_item)=>null,
    findSlot=(_equipment,_item)=>null,
    scaledStats=item=>item?.stats||{},
    slotStats=(item)=>scaledStats(item),
    artifactEffect=()=>null,
    setName=()=>"",
    itemIcon=()=>"?",
    itemLabel=item=>itemEquipTypes[item?.equipType]?.label||"Équipement",
  }=options;
  return filterAndSortInventory(inventory,filters,scoreItem).map(({item,index})=>{
    const currentSlot=findSlot(equipment,item),comparisonSlot=currentSlot||chooseSlot(equipment,item);
    const worn=comparisonSlot?equipment?.[comparisonSlot]:null;
    const appliedStats=comparisonSlot?slotStats(item,comparisonSlot):scaledStats(item);
    const wornStats=worn&&comparisonSlot?slotStats(worn,comparisonSlot):{};
    const appliedPower=Object.values(appliedStats).reduce((sum,value)=>sum+value,0);
    const wornPower=Object.values(wornStats).reduce((sum,value)=>sum+value,0);
    const info=rarityInfo(item.rarity)||rarityInfo("commun");
    return {
      item,index,currentSlot,comparisonSlot,
      delta:currentSlot?0:appliedPower-wornPower,
      info,
      color:item.color||info.color,
      effect:artifactEffect(item),
      destinations:compatibleEquipmentSlots(item),
      setName:item.setId?setName(item.setId):"",
      icon:itemIcon(item),
      label:itemLabel(item),
      name:itemDisplayName(item),
      rawStats:formatStats(scaledStats(item)),
      appliedStats:formatStats(appliedStats),
      search:[itemDisplayName(item),item.description,itemLabel(item),info.label].filter(Boolean).join(" ").toLocaleLowerCase("fr"),
    };
  });
}

const buildTags=view=>{
  const tags=[];
  if(view.specs.length)tags.push(`Voie · ${view.specs.at(-1).name}`);
  if(view.sets.length)tags.push(`${view.sets.length} bonus d'ensemble`);
  if(view.artifacts.length)tags.push(`${view.artifacts.length} artéfact${view.artifacts.length>1?"s":""}`);
  if(!tags.length)tags.push("Voie encore indéfinie");
  return tags;
};

const loadoutMarkup=(groups,{interactive=false}={})=>`<div class="character-loadout">${groups.map(group=>`<section class="loadout-group loadout-${group.id}"><header><span>${group.icon}</span><div><small>${group.label.toUpperCase()}</small><b>${group.equipped}/${group.slots.length} équipé${group.equipped>1?"s":""}</b></div><em>${group.power} PUISSANCE</em></header><div>${group.slots.map(slot=>`<article class="loadout-slot ${slot.item?`filled rarity-${slot.color}`:"empty"}"><span>${slot.icon}</span><div><small>${slot.label}</small><b>${slot.name}</b><em>${slot.stats}${slot.item?` · Niv. ${slot.level}`:""}</em>${slot.setName?`<i>${slot.setName}</i>`:""}</div>${interactive&&slot.item&&slot.inventoryIndex>=0?`<button data-equip-index="${slot.inventoryIndex}" data-equip-slot="${slot.id}" aria-label="Retirer ${slot.name} de ${slot.label}" title="Retirer">×</button>`:""}</article>`).join("")}</div></section>`).join("")}</div>`;

export function renderProfilePanel(view){
  const tags=buildTags(view);
  return `${view.nav}<section class="hero-identity hero-identity-pro"><div class="profile-portrait" style="background:${view.hero.art}">♙</div><div><small>${view.hero.role}</small><h3>${view.hero.name}</h3><span>Niveau ${view.level} · Puissance ${view.power}</span><div class="build-tags">${tags.map(tag=>`<i>${tag}</i>`).join("")}</div></div></section><div class="hero-xp"><label><span>PROGRESSION</span><b>${view.level>=30?"NIVEAU MAX":`${view.xp} / ${view.xpNext} XP`}</b></label><div class="bar"><i style="width:${view.xpPercent}%"></i></div></div><div class="profile-vitals"><span class="health"><i>♥</i><div><small>POINTS DE VIE</small><b>${view.hp} / ${view.maxHp}</b></div></span><span class="energy"><i>✦</i><div><small>ÉNERGIE</small><b>${view.energy} / ${view.maxEnergy}</b></div></span></div><div class="combat-stat-grid">${view.combatStats.map(stat=>`<span><i>${stat.icon}</i><b>${stat.value}</b><small>${stat.label}</small></span>`).join("")}</div><div class="section-heading"><h4>Silhouette d'équipement</h4><small>Bonus réellement appliqués par emplacement</small></div>${loadoutMarkup(view.loadout)}${view.specs.length?`<div class="build-path">${view.specs.map(spec=>`<span><small>SPÉCIALISATION</small><b>${spec.name}</b><em>${spec.description}</em></span>`).join("")}</div>`:""}${view.masteries.length?`<div class="set-bonuses">${view.masteries.map(node=>`<span>✦ <b>${node.name}</b> · ${node.branch}</span>`).join("")}</div>`:""}${view.artifacts.length?`<div class="set-bonuses artifact-list">${view.artifacts.map(effect=>`<span>☗ <b>${effect.name}</b> · ${effect.description}</span>`).join("")}</div>`:""}${view.sets.length?`<div class="set-bonuses">${view.sets.map(set=>`<span>◆ <b>${set.name}</b> · bonus ${set.required} pièces actif</span>`).join("")}</div>`:""}<div class="section-heading"><h4>Attributs</h4><small>Survolez la progression de votre construction</small></div><div class="attribute-list">${view.attributes.map(attribute=>`<article class="profile-stat detailed"><div><span><b>${attribute.name}</b><small>${attribute.description}</small></span><strong>${attribute.value}</strong></div><div class="attribute-meter"><i style="width:${Math.min(100,attribute.value*4)}%"></i></div><em>${attribute.base} base · +${attribute.gear} équipement · +${attribute.passive} passifs · +${attribute.build} voie</em></article>`).join("")}</div><div class="talent talent-pro"><strong>Talent de classe · ${view.hero.talent}</strong><span>${view.hero.talentText}</span></div>`;
}

export function renderInventoryPanel(view){
  const filters=view.filters;
  return `${view.nav}<div class="inventory-summary"><span><small>PUISSANCE</small><b>⚔ ${view.power}</b></span><span><small>ÉCLATS</small><b>◆ ${view.gold}</b></span><span><small>OBJETS</small><b>${view.totalItems}</b></span><span><small>ÉQUIPÉS</small><b>${view.equipped}/8</b></span></div><div class="material-mini">${view.resources.map(resource=>`<span title="${resource.name}">${resource.icon} <b>${resource.amount}</b><small>${resource.name}</small></span>`).join("")}</div><div class="section-heading"><h4>Équipement porté</h4><small>Cliquez sur × pour libérer un emplacement</small></div>${loadoutMarkup(view.loadout,{interactive:true})}<div class="section-heading bag-heading"><h4>Sac d'expédition</h4><small>${view.entries.length} résultat${view.entries.length>1?"s":""}</small></div><div class="inventory-toolbar" aria-label="Filtres de l'inventaire"><label class="inventory-search"><span>⌕</span><input id="inventory-search" type="search" placeholder="Rechercher un objet…" autocomplete="off" aria-label="Rechercher un objet"></label><div class="inventory-group-filters">${view.groups.map(group=>`<button data-inventory-group="${group.id}" class="${filters.group===group.id?"active":""}" aria-pressed="${filters.group===group.id}">${group.icon} ${group.label}<b>${group.count}</b></button>`).join("")}</div><label><small>RARETÉ</small><select id="inventory-rarity" aria-label="Filtrer par rareté"><option value="all" ${filters.rarity==="all"?"selected":""}>Toutes</option><option value="commun" ${filters.rarity==="commun"?"selected":""}>Commune</option><option value="rare" ${filters.rarity==="rare"?"selected":""}>Rare</option><option value="épique" ${filters.rarity==="épique"?"selected":""}>Légendaire</option><option value="légendaire" ${filters.rarity==="légendaire"?"selected":""}>Artéfact</option></select></label><label><small>TRIER PAR</small><select id="inventory-sort" aria-label="Trier l'inventaire"><option value="power" ${filters.sort==="power"?"selected":""}>Puissance</option><option value="rarity" ${filters.sort==="rarity"?"selected":""}>Rareté</option><option value="level" ${filters.sort==="level"?"selected":""}>Niveau</option><option value="name" ${filters.sort==="name"?"selected":""}>Nom</option></select></label></div><div class="inventory-grid inventory-results">${view.entries.map(entry=>`<article class="item-slot ${entry.currentSlot?"equipped":""} rarity-${entry.color}" data-inventory-item data-search="${entry.search}"><span>${entry.icon}</span><div><small class="item-rarity">${entry.info.label} · ${entry.label} · NIV. ${entry.item.level||1}${entry.setName?" · ENSEMBLE":""}</small><b>${entry.name}</b><em>${entry.appliedStats}${entry.comparisonSlot?` · EN ${equipmentSlots[entry.comparisonSlot].shortLabel.toUpperCase()}`:""}</em><p>${entry.setName?`${entry.setName} · `:""}${entry.item.description||""}</p>${entry.effect?`<p class="artifact-power">☗ <b>${entry.effect.name}</b> · ${entry.effect.description}</p>`:""}<details class="item-details"><summary>Détails de l'objet</summary><span>Valeurs brutes : ${entry.rawStats}</span></details><div class="equipment-destinations">${entry.destinations.map(slotId=>`<button data-equip-index="${entry.index}" data-equip-slot="${slotId}">${entry.currentSlot===slotId?"Retirer":equipmentSlots[slotId].label}</button>`).join("")}</div></div><strong class="${entry.delta>0?"upgrade":entry.delta<0?"downgrade":""}">${entry.currentSlot?`✓ ${equipmentSlots[entry.currentSlot].label.toUpperCase()}`:entry.delta>0?`▲ +${entry.delta} APPLIQUÉ`:entry.delta<0?`▼ ${entry.delta} APPLIQUÉ`:"= ÉQUIVALENT"}</strong></article>`).join("")}<div id="inventory-empty-filter" class="inventory-empty-filter ${view.entries.length?"hidden":""}"><span>⌕</span><b>Aucun objet ne correspond</b><small>Modifiez les filtres pour afficher le reste du sac.</small></div><article class="item-slot consumable" data-inventory-item data-search="potion mineure consommable"><span>⚗</span><div><small>CONSOMMABLE</small><b>Potion mineure</b><em>x${view.potions} · Restaure 35 PV</em></div></article></div>`;
}
