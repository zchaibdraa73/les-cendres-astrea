import { itemEquipTypes, resolveEquipType } from "./equipment-model.mjs";

function frozenList(values){
  return Object.freeze([...values]);
}

export const legacyItemIdsByEquipType=Object.freeze({
  head:frozenList([
    "hollow_crown",
    "ash_crown",
    "white_mask",
    "broken_halo",
  ]),
  chest:frozenList([
    "split_armor",
    "wanderer_cloak",
    "warden_plate",
    "nightweave",
    "void_coat",
    "sunken_bulwark",
    "forgotten_mail",
    "bark_plate",
    "mirror_coat",
    "astral_shell",
    "silver_bark",
    "inverted_robe",
    "keeper_hide",
    "ascendant_mail",
    "first_sky_robe",
    "void_menagerie_hide",
    "oath_armor",
    "last_guardian_mail",
  ]),
  legs:frozenList([]),
  weapon:frozenList([
    "iron_sword",
    "mist_dagger",
    "ember_staff",
    "bone_axe",
    "glass_bow",
    "nameless_tome",
    "penitent_chain",
    "exile_blade",
    "last_bow",
    "first_flame",
    "root_blade",
    "mirror_knives",
    "star_rod",
    "thorn_chain",
    "moonless_edge",
    "vein_spear",
    "tide_blades",
    "archive_hammer",
    "well_scepter",
    "name_cleaver",
    "comet_bow",
    "dead_star_anvil",
    "cycle_blade",
    "unwritten_weapon",
  ]),
  amulet:frozenList([
    "red_compass",
    "silent_bell",
    "road_end",
    "pale_leaf",
    "drowned_lens",
    "veil_fragment",
    "archive_key",
    "first_map",
    "asterion_eye",
  ]),
  ring:frozenList([
    "soot_ring",
    "astrea_eye",
    "shadow_seed",
    "upward_drop",
    "erased_name",
    "memory_knot",
    "true_name_seal",
  ]),
});

export const legacyItemEquipTypeById=Object.freeze(Object.fromEntries(
  Object.entries(legacyItemIdsByEquipType).flatMap(([equipType,ids])=>ids.map(id=>[id,equipType])),
));

export function equipTypeForCatalogItem(item){
  return legacyItemEquipTypeById[item?.id]||resolveEquipType(item);
}

export function validateLegacyItemClassification(items){
  const errors=[];
  const classifiedIds=Object.values(legacyItemIdsByEquipType).flat();
  if(new Set(classifiedIds).size!==classifiedIds.length)errors.push("Un équipement historique est classé plusieurs fois.");
  const catalogIds=new Set(items.map(item=>item.id));
  for(const id of classifiedIds)if(!catalogIds.has(id))errors.push(`Équipement classé absent du catalogue : ${id}`);
  for(const item of items){
    const legacyType=legacyItemEquipTypeById[item.id],equipType=legacyType||resolveEquipType(item);
    if(!equipType)errors.push(`Équipement sans type cible : ${item.id}`);
    else if(!legacyType&&!item.equipType)errors.push(`Nouvel équipement sans type explicite : ${item.id}`);
    else if(!itemEquipTypes[equipType])errors.push(`Type cible inconnu pour ${item.id} : ${equipType}`);
  }
  return errors;
}
