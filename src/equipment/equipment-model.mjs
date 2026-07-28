export const EQUIPMENT_MODEL_VERSION=1;

function deepFreeze(value){
  if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export const equipmentSlotOrder=deepFreeze([
  "head",
  "chest",
  "legs",
  "mainHand",
  "offHand",
  "amulet",
  "ring1",
  "ring2",
]);

export const equipmentGroups=deepFreeze({
  armor:{
    id:"armor",
    label:"Armure",
    icon:"♜",
    slots:["head","chest","legs"],
  },
  weapons:{
    id:"weapons",
    label:"Armes",
    icon:"⚔",
    slots:["mainHand","offHand"],
  },
  jewelry:{
    id:"jewelry",
    label:"Bijoux",
    icon:"◈",
    slots:["amulet","ring1","ring2"],
  },
});

export const equipmentSlots=deepFreeze({
  head:{
    id:"head",
    label:"Tête",
    shortLabel:"Tête",
    group:"armor",
    icon:"♟",
    groupShare:.25,
  },
  chest:{
    id:"chest",
    label:"Torse",
    shortLabel:"Torse",
    group:"armor",
    icon:"♜",
    groupShare:.45,
  },
  legs:{
    id:"legs",
    label:"Jambes",
    shortLabel:"Jambes",
    group:"armor",
    icon:"♞",
    groupShare:.30,
  },
  mainHand:{
    id:"mainHand",
    label:"Main droite",
    shortLabel:"Droite",
    group:"weapons",
    icon:"⚔",
    groupShare:.60,
  },
  offHand:{
    id:"offHand",
    label:"Main gauche",
    shortLabel:"Gauche",
    group:"weapons",
    icon:"⛨",
    groupShare:.40,
  },
  amulet:{
    id:"amulet",
    label:"Amulette",
    shortLabel:"Amulette",
    group:"jewelry",
    icon:"◇",
    groupShare:.40,
  },
  ring1:{
    id:"ring1",
    label:"Bague 1",
    shortLabel:"Bague 1",
    group:"jewelry",
    icon:"◉",
    groupShare:.30,
  },
  ring2:{
    id:"ring2",
    label:"Bague 2",
    shortLabel:"Bague 2",
    group:"jewelry",
    icon:"◉",
    groupShare:.30,
  },
});

export const itemEquipTypes=deepFreeze({
  head:{
    id:"head",
    label:"Tête",
    group:"armor",
    compatibleSlots:["head"],
  },
  chest:{
    id:"chest",
    label:"Torse",
    group:"armor",
    compatibleSlots:["chest"],
  },
  legs:{
    id:"legs",
    label:"Jambes",
    group:"armor",
    compatibleSlots:["legs"],
  },
  weapon:{
    id:"weapon",
    label:"Arme à une main",
    group:"weapons",
    compatibleSlots:["mainHand","offHand"],
  },
  amulet:{
    id:"amulet",
    label:"Amulette",
    group:"jewelry",
    compatibleSlots:["amulet"],
  },
  ring:{
    id:"ring",
    label:"Bague",
    group:"jewelry",
    compatibleSlots:["ring1","ring2"],
  },
});

export const legacyEquipmentDefaults=deepFreeze({
  Arme:{
    equipType:"weapon",
    preferredSlot:"mainHand",
  },
  Armure:{
    equipType:"chest",
    preferredSlot:"chest",
  },
  Bijou:{
    equipType:"ring",
    preferredSlot:"ring1",
  },
});

export function resolveEquipType(itemOrType){
  if(typeof itemOrType==="string"){
    if(itemEquipTypes[itemOrType])return itemOrType;
    return legacyEquipmentDefaults[itemOrType]?.equipType||null;
  }
  if(!itemOrType||typeof itemOrType!=="object")return null;
  const declared=itemOrType.equipType||itemOrType.slotType||itemOrType.slot;
  return itemEquipTypes[declared]?declared:legacyEquipmentDefaults[declared]?.equipType||null;
}

export function compatibleEquipmentSlots(itemOrType){
  const type=resolveEquipType(itemOrType);
  return type?[...itemEquipTypes[type].compatibleSlots]:[];
}

export function isCompatibleEquipmentSlot(itemOrType,slotId){
  return compatibleEquipmentSlots(itemOrType).includes(slotId);
}

export function equipmentGroupForSlot(slotId){
  const groupId=equipmentSlots[slotId]?.group;
  return groupId?equipmentGroups[groupId]:null;
}

export function createEmptyEquipment(){
  return Object.fromEntries(equipmentSlotOrder.map(slotId=>[slotId,null]));
}

export function validateEquipmentModel(){
  const errors=[];
  const uniqueSlots=new Set(equipmentSlotOrder);
  if(uniqueSlots.size!==equipmentSlotOrder.length)errors.push("L'ordre des emplacements contient un doublon.");
  if(equipmentSlotOrder.length!==8)errors.push("Le modèle doit contenir exactement huit emplacements.");
  for(const slotId of equipmentSlotOrder){
    const slot=equipmentSlots[slotId];
    if(!slot)errors.push(`Emplacement non déclaré : ${slotId}`);
    else if(!equipmentGroups[slot.group])errors.push(`Groupe inconnu pour ${slotId} : ${slot.group}`);
  }
  for(const group of Object.values(equipmentGroups)){
    const share=group.slots.reduce((sum,slotId)=>sum+(equipmentSlots[slotId]?.groupShare||0),0);
    if(Math.abs(share-1)>.000_001)errors.push(`Budget du groupe ${group.id} différent de 100 %.`);
    for(const slotId of group.slots)if(!uniqueSlots.has(slotId))errors.push(`Le groupe ${group.id} référence ${slotId}, absent de l'ordre.`);
  }
  for(const type of Object.values(itemEquipTypes)){
    if(!type.compatibleSlots.length)errors.push(`Le type ${type.id} ne possède aucune destination.`);
    for(const slotId of type.compatibleSlots){
      if(!uniqueSlots.has(slotId))errors.push(`Le type ${type.id} cible un emplacement inconnu : ${slotId}`);
      else if(equipmentSlots[slotId].group!==type.group)errors.push(`Le type ${type.id} traverse les groupes vers ${slotId}.`);
    }
  }
  return errors;
}
