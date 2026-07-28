export function createSaveSlotService({storage,saveSystem,clamp,saveKey,activeSlotKey}){
  const activeSlot=()=>clamp(Number(storage.getItem(activeSlotKey))||1,1,3);
  const select=slot=>storage.setItem(activeSlotKey,String(clamp(Number(slot)||1,1,3)));
  const slotKey=(slot=activeSlot())=>`${saveKey}-slot-${slot}`;
  const backupKey=(slot=activeSlot())=>`${saveKey}-backup-${slot}`;

  function persist(state,slot=activeSlot()){
    if(!state)return;
    const key=slotKey(slot),serialized=saveSystem.serialize(state),current=storage.getItem(key);
    if(current&&current!==serialized&&saveSystem.safeParse(current))storage.setItem(backupKey(slot),current);
    storage.setItem(key,serialized);
  }

  function restore(slot=activeSlot()){
    const key=slotKey(slot);
    let state=saveSystem.safeParse(storage.getItem(key)),recovered=false;
    if(!state){
      state=saveSystem.safeParse(storage.getItem(backupKey(slot)));
      if(state){
        storage.setItem(key,saveSystem.serialize(state));
        recovered=true;
      }
    }
    return {state,recovered};
  }

  function clear(slot=activeSlot()){
    storage.removeItem(slotKey(slot));
    storage.removeItem(backupKey(slot));
  }

  return {activeSlot,select,slotKey,backupKey,persist,restore,clear};
}
