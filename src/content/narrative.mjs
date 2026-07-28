// Textes, guides et diaporamas de la campagne.
export const nodeEvents = {
  loot:{icon:"◆",name:"Cache de voyageur",copy:"Sous des pierres noircies repose un objet encore intact."},
  encounter:{icon:"⚔",name:"Présence hostile",copy:"Une créature attirée par votre flamme surgit du brouillard."},
  shrine:{icon:"✦",name:"Sanctuaire de braise",copy:"Une ancienne lueur fortifie définitivement votre corps."},
  rest:{icon:"♨",name:"Feu abandonné",copy:"Les dernières braises suffisent à panser vos blessures."},
  story:{icon:"☾",name:"La Chapelle muette",copy:"Sur l'autel, une phrase a été grattée jusqu'à la pierre : « Tu l'as déjà vaincu. Tu le vaincras encore. » L'écriture ressemble à la vôtre."},
  gate:{icon:"◈",name:"La Porte des Cendres",copy:"La porte s'ouvre sans que vous la touchiez. De l'autre côté, quelque chose prononce un nom. Vous ne parvenez pas à le retenir."},
  mine:{icon:"⬢",name:"La Mine de scories",copy:"Dans les galeries abandonnées subsistent des veines de fer et quelques braises stables."},
  resource:{icon:"⬢",name:"Matériaux abandonnés",copy:"Quelqu'un a laissé derrière lui des ressources encore utilisables."},
  salvage:{icon:"▣",name:"Débris de valeur",copy:"Ces fragments ne servent plus au combat, mais la forge les rachètera volontiers."},
  r2entry:{icon:"❅",name:"La Frontière blanche",copy:"Ici, la cendre remonte vers le ciel. Derrière vous, le passage s'est déjà refermé."},
  r2story:{icon:"◉",name:"L'Observatoire noyé",copy:"Les lentilles sont tournées vers un puits. Sur une plaque : « Nous regardions en bas pour surveiller ce qui rêvait sous les étoiles. »"},
  r2village:{icon:"⌂",name:"Le Village sans ombre",copy:"Les maisons sont habitées, les foyers sont chauds, mais personne ne projette d'ombre — pas même vous."},
  r2library:{icon:"▤",name:"Les Archives submergées",copy:"Les livres respirent sous une eau immobile. L'un d'eux contient une page écrite de votre main."},
  r2city:{icon:"⌂",name:"La Cité renversée",copy:"Les rues pendent au-dessus du vide. Les habitants marchent au plafond et prétendent que c'est vous qui êtes à l'envers."},
  r2sanctum:{icon:"☿",name:"Le Sanctuaire des Noms",copy:"Des milliers de noms sont gravés ici. Le vôtre occupe une ligne entière, mais chaque lettre a été retirée de la pierre."},
  r2forge:{icon:"⚒",name:"La Forge de l'Étoile morte",copy:"Une enclume bat seule sous un soleil éteint. Elle peut renforcer une pièce d'équipement sans réclamer de métal."}
  ,r3entry:{icon:"▼",name:"Le Royaume sous la Cendre",copy:"La capitale ensevelie s'étend sous vos pieds. Toutes ses statues se tournent lentement vers vous."}
  ,r3story:{icon:"☾",name:"Un souvenir royal",copy:"La fresque vous représente aux côtés du Maître des Cendres. Vous ne combattiez pas. Vous lui tendiez une couronne."}
  ,r1memory:{icon:"⚑",name:"Le Mémorial du Fanal",copy:"Les noms des Veilleurs sont gravés autour d'un emplacement vide. Sa forme correspond exactement à votre silhouette."}
  ,r2monastery:{icon:"☾",name:"Le Monastère des Reflets",copy:"Les moines méditent face à leurs doubles. Le vôtre garde les yeux ouverts et vous supplie de ne pas descendre."}
  ,r3council:{icon:"♚",name:"Le Conseil des Masques",copy:"Sept masques débattent sans porteur. Tous vous appellent « Revenant », mais aucun ne s'accorde sur ce que vous êtes revenu accomplir."}
  ,r4entry:{icon:"✦",name:"Le Seuil du Premier Souvenir",copy:"Derrière la manifestation ne se trouvait pas un trône, mais le premier instant du monde — conservé comme une blessure qui refuse de cicatriser."}
  ,r4story:{icon:"☗",name:"Une vérité antérieure",copy:"Vous n'étiez pas le prisonnier du cycle. Vous en étiez l'auteur. Le Maître a accepté de porter la couronne lorsque vous lui avez demandé de contenir ce qui brûlait derrière le monde."}
};
export const guideBook={
  exploration:{icon:"⌘",title:"Choisir sa route",copy:"Déplacez-vous uniquement vers une case reliée. Les lieux dorés poursuivent l'histoire ; les détours offrent plus de danger et de meilleures récompenses."},
  combat:{icon:"⚔",title:"Lire un combat",copy:"Observez les intentions, le danger régional, les mutations et le nombre de vagues avant d'agir. Choisissez une cible et gardez de l'énergie pour les renforts annoncés."},
  statuses:{icon:"†",title:"Altérations et Barrière",copy:"Brûlure et Saignement infligent des dégâts persistants. Faiblesse réduit les dégâts. Barrière absorbe les prochains impacts. Survolez toujours une icône pour son détail."},
  posture:{icon:"◇",title:"Rompre la posture",copy:"Chaque attaque réduit la jauge de posture ennemie. Une rupture applique Armure brisée et ouvre une courte fenêtre pour concentrer vos pouvoirs les plus puissants."},
  equipment:{icon:"◆",title:"Équipement et statistiques",copy:"Armes, armures et bijoux modifient réellement vos attributs. L'inventaire compare le nouvel objet avec celui porté avant chaque changement."},
  forge:{icon:"⚒",title:"Forge et ressources",copy:"Améliorez, enchantez, sertissez ou démantelez vos objets. Les raretés élevées coûtent davantage mais possèdent un niveau maximum supérieur."},
  powers:{icon:"✦",title:"Construire son arsenal",copy:"Vous apprenez de nombreuses attaques, mais quatre seulement peuvent être équipées. Six passifs au maximum restent actifs. Adaptez-les avant un boss."},
  companion:{icon:"♞",title:"Compagnons",copy:"Un seul compagnon intervient automatiquement un tour sur deux. Sa confiance et l'objet qui lui est confié renforcent sa capacité."}
};

export const prologueSlides = [
  {roman:"I",kicker:"Avant les routes",title:"Le monde portait un autre nom",copy:"Il n'en reste rien. Ni dans les livres, ni sur les tombes. Seulement des tours sans portes et une poussière grise qui tombe parfois d'un ciel sans nuages.",art:"world"},
  {roman:"II",kicker:"Puis vint la cendre",title:"Quelque chose s'est éveillé",copy:"Les feux se sont éteints d'est en ouest. Des silhouettes ont marché hors des foyers froids. Ceux qui connurent la raison gardèrent le silence — ou furent réduits au silence.",art:"ash"},
  {roman:"III",kicker:"La menace sans visage",title:"Ils le nomment le Maître",copy:"Nul ne sait s'il est homme, dieu ou souvenir. Son nom véritable a disparu. Pourtant son pouvoir grandit, et là où son regard se pose, les vivants oublient jusqu'à leur propre visage.",art:"master"},
  {roman:"IV",kicker:"Un voyageur anonyme",title:"Vous vous éveillez sur la route",copy:"Vous ne portez aucun nom. Seulement une arme, une marque sous la peau et la certitude inexplicable que la route vous attendait. Peut-être avez-vous déjà emprunté ce chemin.",art:"hero"},
  {roman:"V",kicker:"Votre unique certitude",title:"Atteindre le Trône de l'Extinction",copy:"Au-delà des terres mortes demeure celui que certains appellent le Maître des Cendres. Vous ignorez ce qu'il veut. Vous ignorez pourquoi vous devez l'affronter. Mais chaque pas vous rapproche de la réponse — ou de l'oubli.",art:"throne"}
];
export const regionTwoSlides = [
  {roman:"I",kicker:"Après Vharos",title:"Le trône était une porte",copy:"Lorsque le Seigneur des Cendres tombe, son corps ne laisse aucune dépouille. Seulement une ouverture dans l'air, fine comme une blessure, et un vent chargé du parfum d'une forêt que personne ne connaît.",art:"veil"},
  {roman:"II",kicker:"De l'autre côté",title:"La cendre ne tombe plus",copy:"Au-delà du Voile, une neige blanche monte du sol vers les nuages. Les arbres ont des veines. Les rivières reflètent un ciel qui n'est pas celui au-dessus de vous.",art:"whiteforest"},
  {roman:"III",kicker:"Un doute nouveau",title:"Vharos n'était peut-être pas le Maître",copy:"Son dernier regard ne portait ni haine ni défaite. Il ressemblait à du soulagement. Sur son trône, un seul mot demeure gravé : « Gardien ».",art:"guardian"},
  {roman:"IV",kicker:"Les traces impossibles",title:"Quelqu'un vous a précédé",copy:"Dans la boue pâle apparaissent vos propres empreintes. Elles vont dans la même direction. Elles sont anciennes de plusieurs siècles.",art:"footprints"},
  {roman:"V",kicker:"L'observatoire",title:"Les étoiles sont sous la terre",copy:"Des cartes parlent d'un observatoire noyé et d'un puits où les astronomes descendaient pour regarder le ciel. Aucun texte n'explique pourquoi ils ne levaient jamais les yeux.",art:"observatory"},
  {roman:"VI",kicker:"Le nom perdu",title:"Une voix devient plus claire",copy:"Elle ne vous appelle toujours pas par un nom. Elle dit seulement : « Tu es revenu trop tôt. » Puis elle vous indique le Puits des étoiles.",art:"voice"},
  {roman:"VII",kicker:"Deuxième région",title:"Au-delà du Voile",copy:"Vous poursuivez la route. Non parce que vous comprenez enfin votre rôle, mais parce que la chute de Vharos a prouvé une chose : le Maître des Cendres se cache encore plus loin.",art:"beyond"}
];
export const regionThreeSlides = [
  {roman:"I",kicker:"Sous le Puits",title:"Le ciel était un plafond",copy:"Asterion tombe et le Puits s'ouvre. Vous ne descendez pas : le monde entier bascule autour de vous, révélant un royaume bâti sous toutes les routes.",art:"throne"},
  {roman:"II",kicker:"La capitale oubliée",title:"Le Royaume sous la Cendre",copy:"Des tours intactes dorment sous une mer de braises froides. Leurs bannières portent le blason martelé que certains héros cachent encore sur leur armure.",art:"ash"},
  {roman:"III",kicker:"Les habitants",title:"Ils connaissent votre absence",copy:"Les rares survivants ne demandent pas votre nom. Ils baissent les yeux et vous appellent le Revenant, comme si votre retour était une faute annoncée.",art:"hero"},
  {roman:"IV",kicker:"Une première vérité",title:"Le Maître n'a pas détruit ce royaume",copy:"Les fresques racontent autre chose : il l'a enfermé. Non pour contenir ses habitants, mais pour empêcher ce qui règne ici de remonter vers le monde.",art:"guardian"},
  {roman:"V",kicker:"Votre trace",title:"Un trône attend depuis des siècles",copy:"Dans les galeries, chaque statue de souverain a perdu son visage. La dernière tient votre arme et porte, sous la cendre, la marque qui brûle sous votre peau.",art:"footprints"},
  {roman:"VI",kicker:"La menace véritable",title:"Une voix derrière la couronne",copy:"Le Maître des Cendres vous parle enfin sans intermédiaire : « Ne me tue pas encore. Souviens-toi d'abord de ce que tu m'as demandé d'oublier. »",art:"voice"},
  {roman:"VII",kicker:"Conclusion du premier acte",title:"Atteindre la Couronne",copy:"Au sommet inversé repose une manifestation du Maître. La vaincre ne terminera pas la guerre, mais forcera peut-être le monde à rendre son premier souvenir.",art:"beyond"}
];
export const regionFourSlides = [
  {roman:"I",kicker:"Après la manifestation",title:"Le visage se brise, la voix demeure",copy:"La forme du Maître se disperse. Derrière elle apparaît une route faite de souvenirs, plus ancienne que les royaumes et que la cendre elle-même.",art:"fracture"},
  {roman:"II",kicker:"Le souvenir interdit",title:"Vous lui aviez confié la couronne",copy:"Une image revient : deux silhouettes devant un feu sans horizon. L'une était le Maître. L'autre portait votre arme et lui demandait de ne jamais laisser le Brasier s'ouvrir.",art:"oath"},
  {roman:"III",kicker:"Le prix du sceau",title:"Chaque héros était une serrure",copy:"À chaque âge, vous reveniez sans nom. À chaque âge, le Maître vous arrêtait. Vos défaites nourrissaient le sceau ; vos victoires le fissuraient.",art:"cycle"},
  {roman:"IV",kicker:"La faute partagée",title:"Le Maître vous attendait",copy:"Il n'a pas conquis le monde. Il a obéi trop longtemps. Mais quelque chose, derrière lui, apprend désormais à prononcer votre nom.",art:"master"},
  {roman:"V",kicker:"La dernière route",title:"Le Brasier Originel",copy:"Il reste un chemin, court et impossible. Les lieux qui le bordent sont les vestiges de vos précédentes fins. Au bout, le Maître des Cendres attend sans masque.",art:"origin"},
  {roman:"VI",kicker:"Chapitre final",title:"Ce qui doit prendre fin",copy:"Cette fois, vaincre ne suffira pas. Lorsque la couronne tombera, vous devrez décider ce que le monde deviendra — et ce qu'il devra oublier.",art:"lastroad"}
];
