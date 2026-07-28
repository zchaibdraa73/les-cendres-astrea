import {
  EQUIPMENT_MODEL_VERSION,
  compatibleEquipmentSlots,
  createEmptyEquipment,
  equipmentSlotOrder,
  isCompatibleEquipmentSlot,
  legacyEquipmentDefaults,
} from "./equipment-model.mjs";
import { equipTypeForCatalogItem } from "./legacy-item-classification.mjs";

const legacySlotOrder=Object.freeze(["Arme","Armure","Bijou"]);

function itemIdentity(item){
  return item?.uid||null;
}

function prepareItem(item){
  if(!item||typeof item!=="object")return null;
  item.equipType=equipTypeForCatalogItem(item);
  return item;
}

function preferredSlot(item,legacySlot=null){
  const destinations=compatibleEquipmentSlots(item);
  if(!destinations.length)return null;
  const legacyPreferred=legacyEquipmentDefaults[legacySlot]?.preferredSlot;
  return destinations.includes(legacyPreferred)?legacyPreferred:destinations[0];
}

function placeItem(target,item,requestedSlot=null,legacySlot=null,seen=new Set()){
  item=prepareItem(item);
  if(!item)return;
  const identity=itemIdentity(item);
  if(identity&&seen.has(identity))return;
  const destination=requestedSlot&&isCompatibleEquipmentSlot(item,requestedSlot)
    ?requestedSlot
    :preferredSlot(item,legacySlot);
  if(!destination||target[destination])return;
  target[destination]=item;
  if(identity)seen.add(identity);
}

export function migrateCatalogItem(item){
  return {...item,equipType:equipTypeForCatalogItem(item)};
}

export function projectEquipment(equipped={}){
  const target=createEmptyEquipment(),seen=new Set();
  for(const slotId of equipmentSlotOrder)placeItem(target,equipped?.[slotId],slotId,null,seen);
  for(const legacySlot of legacySlotOrder)placeItem(target,equipped?.[legacySlot],null,legacySlot,seen);
  return target;
}

function projectPresetEquipment(equipment={},inventory=[]){
  const target=Object.fromEntries(equipmentSlotOrder.map(slotId=>[slotId,null]));
  const itemsByUid=new Map(inventory.filter(item=>item?.uid).map(item=>[item.uid,item]));
  const used=new Set();
  function place(uid,requestedSlot=null,legacySlot=null){
    if(!uid||used.has(uid))return;
    const item=itemsByUid.get(uid);
    const destinations=item?compatibleEquipmentSlots(item):[];
    const destination=requestedSlot&&(!item||destinations.includes(requestedSlot))
      ?requestedSlot
      :item?preferredSlot(item,legacySlot):legacyEquipmentDefaults[legacySlot]?.preferredSlot;
    if(!destination||target[destination])return;
    target[destination]=uid;
    used.add(uid);
  }
  for(const slotId of equipmentSlotOrder)place(equipment?.[slotId],slotId);
  for(const legacySlot of legacySlotOrder)place(equipment?.[legacySlot],null,legacySlot);
  return target;
}

export function syncEquipmentProjection(save){
  if(!save||typeof save!=="object")return save;
  save.inventory||=[];
  save.inventory.forEach(prepareItem);
  Object.values(save.equipped||{}).forEach(prepareItem);
  Object.values(save.equipment||{}).forEach(prepareItem);
  const canonical=save.equipmentModelVersion===EQUIPMENT_MODEL_VERSION&&save.equipment;
  save.equipmentModelVersion=EQUIPMENT_MODEL_VERSION;
  save.equipment=projectEquipment(canonical||save.equipped||save.equipment);
  save.buildPresets||=[null,null,null];
  save.buildPresets=save.buildPresets.map(preset=>{
    if(!preset||typeof preset!=="object")return preset;
    const canonicalPreset=preset.equipmentV2||preset.equipment;
    preset.equipment=projectPresetEquipment(canonicalPreset,save.inventory);
    preset.equipmentV2={...preset.equipment};
    return preset;
  });
  return save;
}

export function migrateEquipmentSave(save){
  return syncEquipmentProjection(save);
}
