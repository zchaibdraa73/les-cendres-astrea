import { z } from "zod";

const identifier=z.string().trim().min(1).max(96).regex(/^[a-z0-9_]+$/i);
const label=z.string().trim().min(1).max(180);
const finiteNumber=z.number().finite();
const nonNegativeNumber=finiteNumber.min(0);
const positiveNumber=finiteNumber.positive();
const nonNegativeInteger=z.number().int().min(0);
const statBlock=z.record(label,finiteNumber);
const stringList=z.array(z.string().max(160)).max(5000);
const dictionary=z.record(z.string(),z.unknown());

const itemSchema=z.object({
  id:identifier,
  name:label,
  slot:z.enum(["Arme","Armure","Bijou"]),
  rarity:z.enum(["commun","rare","épique","légendaire"]),
  stats:statBlock,
  description:z.string().trim().min(1).max(600),
  region:z.number().int().min(1).max(4).optional(),
}).passthrough();

const enemySchema=z.object({
  id:identifier,
  name:label,
  icon:z.string().min(1).max(12),
  hp:positiveNumber,
  damage:nonNegativeNumber,
  xp:nonNegativeNumber,
  gold:nonNegativeNumber,
  tags:stringList.optional(),
  boss:z.boolean().optional(),
  region:z.number().int().min(1).max(4).optional(),
}).passthrough();

const resourceSchema=z.object({
  id:identifier,
  name:label,
  icon:z.string().min(1).max(12),
  description:z.string().trim().min(1).max(600),
}).passthrough();

const abilitySchema=z.object({
  id:identifier,
  name:label,
  cost:nonNegativeNumber,
  power:nonNegativeNumber,
  scaling:z.enum(["Force","Agilité","Vitalité","Esprit"]),
  ratio:nonNegativeNumber,
  description:z.string().trim().min(1).max(600),
  targets:z.enum(["all","single"]).optional(),
  region:z.number().int().min(1).max(4).optional(),
  hpCost:nonNegativeNumber.optional(),
}).passthrough();

const passiveSchema=z.object({
  id:identifier,
  name:label,
  description:z.string().trim().min(1).max(600),
  stats:statBlock.optional(),
  maxHp:finiteNumber.optional(),
  maxEnergy:finiteNumber.optional(),
  guardBonus:finiteNumber.optional(),
  region:z.number().int().min(1).max(4).optional(),
}).passthrough();

export const gameContentSchema=z.object({
  progression:z.object({
    maxLevel:z.literal(30),
    abilityLevels:z.array(z.number().int().min(1).max(30)).min(1),
    passiveLevels:z.array(z.number().int().min(1).max(30)).min(1),
  }).passthrough(),
  items:z.array(itemSchema).min(1),
  enemies:z.array(enemySchema).min(1),
  resources:z.array(resourceSchema).min(1),
  abilities:z.record(identifier,z.array(abilitySchema).min(1)),
  passives:z.record(identifier,z.array(passiveSchema).min(1)),
  combat:z.object({
    hazards:z.array(z.object({id:identifier,region:z.number().int().min(1).max(4)}).passthrough()),
    mutations:z.array(z.object({id:identifier,effects:dictionary}).passthrough()),
    statuses:z.record(identifier,z.object({name:label}).passthrough()),
    abilityEffects:z.record(identifier,z.object({effects:z.array(dictionary).optional()}).passthrough()),
  }).passthrough(),
  builds:z.object({
    recipes:z.array(z.object({id:identifier,item:identifier,cost:z.record(identifier,nonNegativeNumber)}).passthrough()),
    runes:z.array(z.object({id:identifier,cost:z.record(identifier,nonNegativeNumber)}).passthrough()),
    sets:z.record(identifier,z.object({items:z.array(identifier).min(1)}).passthrough()),
  }).passthrough(),
}).passthrough();

export const mapNodeSchema=z.object({
  x:finiteNumber.min(0).max(100),
  y:finiteNumber.min(0).max(100),
  label,
  type:identifier,
  edges:z.array(nonNegativeInteger).min(1),
  optional:z.boolean().optional(),
  tier:z.number().int().positive().optional(),
  depth:z.number().int().positive().optional(),
}).passthrough();

export const mapCatalogSchema=z.object({
  1:z.array(mapNodeSchema).min(1),
  2:z.array(mapNodeSchema).min(1),
  3:z.array(mapNodeSchema).min(1),
  4:z.array(mapNodeSchema).min(1),
});

export const playerSettingsSchema=z.object({
  volume:finiteNumber.min(0).max(1),
  musicVolume:finiteNumber.min(0).max(1),
  sfxVolume:finiteNumber.min(0).max(1),
  mute:z.boolean(),
  reducedMotion:z.boolean(),
  highContrast:z.boolean(),
  screenShake:z.boolean(),
  audioCues:z.boolean(),
  combatPace:finiteNumber.min(.75).max(1.5),
  textScale:finiteNumber.min(.9).max(1.25),
  controls:z.enum(["zqsd","wasd"]),
}).passthrough();

export const playerMetaSchema=z.object({
  version:z.literal(4),
  embers:nonNegativeInteger,
  runs:nonNegativeInteger,
  wins:nonNegativeInteger,
  bestLevel:z.number().int().min(1).max(30),
  unlocks:stringList,
  achievements:stringList,
  endings:stringList,
  ascensionUnlocked:nonNegativeInteger,
  scores:z.array(z.unknown()).max(1000),
  classWins:z.record(identifier,nonNegativeInteger),
  buildings:z.record(identifier,z.number().int().min(0).max(3)),
  preparation:z.union([identifier,z.null()]),
  trophies:stringList,
  claimedCollections:stringList,
  discoveries:z.object({
    items:stringList,
    enemies:stringList,
    lore:stringList,
  }).passthrough(),
}).passthrough();

const savedItemSchema=z.object({
  id:identifier.optional(),
  name:label.optional(),
  uid:z.string().min(1).max(180).optional(),
  slot:z.enum(["Arme","Armure","Bijou"]).optional(),
  equipType:z.enum(["head","chest","legs","weapon","amulet","ring"]).optional(),
  rarity:z.enum(["commun","rare","épique","légendaire"]).optional(),
  level:z.number().int().positive().max(20).optional(),
  stats:statBlock.optional(),
  baseStats:statBlock.optional(),
}).passthrough().refine(item=>Boolean(item.id||item.name),{
  message:"Un équipement sauvegardé doit posséder un identifiant ou un nom",
});

const equipmentStateSchema=z.object({
  head:z.union([savedItemSchema,z.null()]),
  chest:z.union([savedItemSchema,z.null()]),
  legs:z.union([savedItemSchema,z.null()]),
  mainHand:z.union([savedItemSchema,z.null()]),
  offHand:z.union([savedItemSchema,z.null()]),
  amulet:z.union([savedItemSchema,z.null()]),
  ring1:z.union([savedItemSchema,z.null()]),
  ring2:z.union([savedItemSchema,z.null()]),
}).strict();

export const saveStateSchema=z.object({
  version:z.number().int().min(11).max(10_000),
  classId:z.enum(["bastion","traqueuse","arcaniste","penitent"]),
  level:z.number().int().min(1).max(30).optional(),
  seed:z.number().int().min(0).max(0xffffffff).optional(),
  rngState:z.number().int().min(0).max(0xffffffff).optional(),
  currentRegion:z.number().int().min(1).max(4).optional(),
  xp:nonNegativeNumber.optional(),
  xpNext:nonNegativeNumber.optional(),
  hp:nonNegativeNumber.optional(),
  maxHp:positiveNumber.optional(),
  energy:nonNegativeNumber.optional(),
  maxEnergy:positiveNumber.optional(),
  gold:nonNegativeNumber.optional(),
  potions:nonNegativeInteger.optional(),
  resources:z.record(identifier,nonNegativeNumber).optional(),
  mapIndex:nonNegativeInteger.optional(),
  route:stringList.optional(),
  cleared:z.array(nonNegativeInteger).optional(),
  inventory:z.array(savedItemSchema).max(1000).optional(),
  equipped:z.record(z.string(),z.union([savedItemSchema,z.null()])).optional(),
  equipmentModelVersion:z.literal(1).optional(),
  equipment:equipmentStateSchema.optional(),
  learnedAbilities:stringList.optional(),
  equippedAbilities:stringList.max(4).optional(),
  learnedPassives:stringList.optional(),
  equippedPassives:stringList.max(8).optional(),
  masteryNodes:stringList.optional(),
  buildPresets:z.array(z.union([dictionary,z.null()])).max(3).optional(),
  run:dictionary.optional(),
}).passthrough();

export const saveBundleSchema=z.object({
  bundleVersion:z.literal(1),
  createdAt:z.string().max(80),
  activeSlot:z.number().int().min(1).max(3),
  slots:z.array(z.union([z.string(),z.null()])).length(3),
  backups:z.array(z.union([z.string(),z.null()])).length(3),
  meta:z.record(z.string(),z.unknown()),
  settings:z.record(z.string(),z.unknown()),
}).passthrough();

function issueMessage(issue){
  const path=issue.path.length?issue.path.join("."):"racine";
  return `${path} : ${issue.message}`;
}

export function schemaErrors(schema,value){
  const result=schema.safeParse(value);
  return result.success?[]:result.error.issues.map(issueMessage);
}

export function assertSchema(schema,value,labelName){
  const result=schema.safeParse(value);
  if(!result.success){
    const details=result.error.issues.slice(0,3).map(issueMessage).join(" · ");
    throw new TypeError(`${labelName} invalide — ${details}`);
  }
  return value;
}

export const assertSaveState=value=>assertSchema(saveStateSchema,value,"Sauvegarde");
export const assertSaveBundle=value=>assertSchema(saveBundleSchema,value,"Archive de sauvegarde");
export const assertPlayerMeta=value=>assertSchema(playerMetaSchema,value,"Méta-progression");
export const assertPlayerSettings=value=>assertSchema(playerSettingsSchema,value,"Options");
export const validateGameContent=value=>schemaErrors(gameContentSchema,value);
export const validateMapCatalog=value=>schemaErrors(mapCatalogSchema,value);
