export const formatStats=stats=>Object.entries(stats||{}).map(([name,value])=>`+${value} ${name}`).join(", ");

export const rarityInfo=rarity=>({
  commun:{label:"Commune",color:"blanc",rank:1},
  rare:{label:"Rare",color:"vert",rank:2},
  épique:{label:"Légendaire",color:"violet",rank:3},
  légendaire:{label:"Artéfact",color:"rouge",rank:4},
}[rarity]);

export const itemDisplayName=item=>item?`${item.name}${item.affix?` ${item.affix.name}`:""}`:"";

const nodeIcons={camp:"⌂",tutorial:"⚔",duo:"⚔⚔",town:"⌂",mine:"⬢",arsenal:"⚒",story:"☾",gauntlet:"⚔",gate:"◈",boss:"♚",elite:"☠",abyss:"☠",r1march:"⚑",r1refuge:"⌂",r1memory:"☾",r1siege:"♜",r1finalboss:"♚",r1detour:"☠",r2entry:"❅",r2story:"◉",r2battle:"⚔",r2village:"⌂",r2gauntlet:"♜",r2library:"▤",r2bridge:"⚔",r2city:"⌂",r2heart:"◈",r2sanctum:"☿",r2rift:"↟",r2forge:"⚒",r2threshold:"✧",r2boss:"✦",r2elite:"☠",r2shore:"≋",r2monastery:"☾",r2aqueduct:"⚔",r2moonrest:"⌂",r2finalboss:"✦",r2detour:"☠",r3entry:"▼",r3battle:"⚔",r3refuge:"⌂",r3story:"☾",r3elite:"♜",r3threshold:"◈",r3boss:"♚",r3detour:"☠",r3crownroad:"♚",r3council:"☾",r3innerstairs:"⚔",r3lastrefuge:"⌂",r3finalboss:"☗",r3legacy:"☠",r4entry:"✦",r4battle:"⚔",r4refuge:"⌂",r4story:"☗",r4elite:"♜",r4threshold:"◉",r4boss:"♚",r4detour:"☠",loot:"◆",encounter:"⚔",shrine:"✦",rest:"♨"};

export const nodeIcon=type=>nodeIcons[type]||"?";

export function renderStatusBadges(statuses={},catalog={}){
  return Object.entries(statuses).map(([id,status])=>{
    const info=catalog[id];
    return `<i class="status-badge ${info?.tone||""}" title="${info?.description||""}">${info?.icon||"·"} ${info?.name||id} <b>${status.turns}</b></i>`;
  }).join("");
}
