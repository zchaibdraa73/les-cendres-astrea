// Clés persistantes et options stables de l'application.
export const SAVE_KEY="astrea-save-v3",ACTIVE_SLOT_KEY="astrea-active-slot-v1",IMPORT_BACKUP_KEY="astrea-import-backup-v1";
export const META_KEY="astrea-legacy-v1",META_BACKUP_KEY="astrea-legacy-backup-v1";
export const SETTINGS_KEY="astrea-settings-v1";
export const difficulties={normal:{name:"Voyage",description:"L'expérience originale."},peril:{name:"Péril",description:"Ennemis renforcés · récompenses +25 %."},nightmare:{name:"Cauchemar",description:"Danger extrême · héritage +80 %."}};
export const modifiers={none:{name:"Aucun serment",description:"Règles standards."},fragile:{name:"Serment de verre",description:"-20 % PV · héritage +30 %."},scarcity:{name:"Terre stérile",description:"Soins réduits · héritage +20 %."},hunters:{name:"Chasse éternelle",description:"Ennemis +1 niveau · héritage +25 %."}};
export const sanctuaryUpgrades=[
  {id:"flask",name:"Fiole du souvenir",cost:12,icon:"⚗",description:"+1 potion au départ de chaque expédition."},
  {id:"scavenger",name:"Outils du récupérateur",cost:24,icon:"◆",description:"+4 Fer ancien et +2 Braises stables au départ."},
  {id:"heirloom",name:"Héritage anonyme",cost:38,icon:"⚔",description:"Commence avec un équipement commun adapté."},
  {id:"cartographer",name:"Encre du cartographe",cost:55,icon:"⌘",description:"Les destinations voisines révèlent toujours leur nature."}
];
