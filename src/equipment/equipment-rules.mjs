import {
  compatibleEquipmentSlots,
  createEmptyEquipment,
  equipmentSlotOrder,
  equipmentSlots,
  isCompatibleEquipmentSlot,
} from "./equipment-model.mjs";

function sameItem(left,right){
  if(!left||!right)return false;
  if(left===right)return true;
  return Boolean(left.uid&&right.uid&&left.uid===right.uid);
}

/** @param {unknown} _item */
function defaultScoreItem(_item){
  return 0;
}

/** @param {{stats?: Record<string,number>}|null} item @param {string|null} _slotId */
function defaultScaleItem(item,_slotId){
  return item?.stats||{};
}

export function equippedEntries(equipment={}){
  return equipmentSlotOrder
    .map(slotId=>[slotId,equipment?.[slotId]||null])
    .filter(([,item])=>Boolean(item));
}

export function equippedItems(equipment={}){
  const seenUids=new Set(),seenReferences=new Set(),items=[];
  for(const [,item] of equippedEntries(equipment)){
    if(item.uid){
      if(seenUids.has(item.uid))continue;
      seenUids.add(item.uid);
    }else{
      if(seenReferences.has(item))continue;
      seenReferences.add(item);
    }
    items.push(item);
  }
  return items;
}

export function findEquippedSlot(equipment={},itemOrUid=null){
  const uid=typeof itemOrUid==="string"?itemOrUid:itemOrUid?.uid;
  return equipmentSlotOrder.find(slotId=>{
    const candidate=equipment?.[slotId];
    return uid?candidate?.uid===uid:sameItem(candidate,itemOrUid);
  })||null;
}

export function normalizeEquipment(equipment={}){
  const normalized=createEmptyEquipment(),seenUids=new Set(),seenReferences=new Set();
  for(const slotId of equipmentSlotOrder){
    const item=equipment?.[slotId];
    if(!item||!isCompatibleEquipmentSlot(item,slotId))continue;
    if(item.uid){
      if(seenUids.has(item.uid))continue;
      seenUids.add(item.uid);
    }else{
      if(seenReferences.has(item))continue;
      seenReferences.add(item);
    }
    normalized[slotId]=item;
  }
  return normalized;
}

export function chooseEquipSlot(equipment={},item,{requestedSlot=null,scoreItem=defaultScoreItem}={}){
  const compatible=compatibleEquipmentSlots(item);
  if(!compatible.length)return null;
  if(requestedSlot)return compatible.includes(requestedSlot)?requestedSlot:null;
  const current=findEquippedSlot(equipment,item);
  if(current)return current;
  const empty=compatible.find(slotId=>!equipment?.[slotId]);
  if(empty)return empty;
  return [...compatible].sort((left,right)=>
    scoreItem(equipment?.[left])-scoreItem(equipment?.[right])
    ||equipmentSlotOrder.indexOf(left)-equipmentSlotOrder.indexOf(right)
  )[0];
}

export function equipItem(equipment={},item,options={}){
  const normalized=normalizeEquipment(equipment);
  const slotId=chooseEquipSlot(normalized,item,options);
  if(!slotId)return {equipment:normalized,slotId:null,replaced:null,movedFrom:null,changed:false};
  const movedFrom=findEquippedSlot(normalized,item);
  const replaced=normalized[slotId]&&!sameItem(normalized[slotId],item)?normalized[slotId]:null;
  if(movedFrom===slotId)return {equipment:normalized,slotId,replaced:null,movedFrom,changed:false};
  if(movedFrom)normalized[movedFrom]=null;
  normalized[slotId]=item;
  return {equipment:normalized,slotId,replaced,movedFrom,changed:true};
}

export function unequipItem(equipment={},itemOrUid=null){
  const normalized=normalizeEquipment(equipment);
  const slotId=findEquippedSlot(normalized,itemOrUid);
  if(!slotId)return {equipment:normalized,slotId:null,item:null,changed:false};
  const item=normalized[slotId];
  normalized[slotId]=null;
  return {equipment:normalized,slotId,item,changed:true};
}

export function sumEquipmentStats(equipment={},scaleItem=defaultScaleItem){
  const totals={};
  for(const item of equippedItems(equipment)){
    const slotId=findEquippedSlot(equipment,item);
    for(const [stat,value] of Object.entries(scaleItem(item,slotId)||{})){
      totals[stat]=(totals[stat]||0)+(Number(value)||0);
    }
  }
  return totals;
}

export function scaleEquipmentStatsForSlot(stats={},slotId=null){
  const share=equipmentSlots[slotId]?.groupShare??1;
  return Object.fromEntries(Object.entries(stats).map(([stat,value])=>[
    stat,
    Math.ceil((Number(value)||0)*share),
  ]));
}

export function sanitizePresetEquipment(equipment={},inventory=[]){
  const target=Object.fromEntries(equipmentSlotOrder.map(slotId=>[slotId,null]));
  const itemsByUid=new Map(inventory.filter(item=>item?.uid).map(item=>[item.uid,item]));
  const used=new Set();
  for(const slotId of equipmentSlotOrder){
    const uid=equipment?.[slotId];
    const item=uid?itemsByUid.get(uid):null;
    if(!item||used.has(uid)||!isCompatibleEquipmentSlot(item,slotId))continue;
    target[slotId]=uid;
    used.add(uid);
  }
  return target;
}
