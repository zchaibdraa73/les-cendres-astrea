/*
 * Catalogue de contenu — Les Cendres d'Astréa
 * Ce fichier ne contient aucune logique de jeu. Le moteur utilise uniquement
 * les identifiants stables ci-dessous, ce qui facilite l'équilibrage et l'ajout
 * futur de contenu sans modifier les systèmes.
 */
globalThis.GAME_DATA = {
  progression: {
    maxLevel: 30,
    abilityLevels: [1,3,5,8,12,16,20,25,30],
    passiveLevels: [1,4,7,10,14,18,22,26,30]
  },
  narrative: {
    factions: {
      veilleurs:{name:"Veilleurs de la Braise",icon:"◈",description:"Ils protègent les routes et se méfient des anciennes vérités."},
      archivistes:{name:"Archivistes noyés",icon:"▤",description:"Ils préservent les souvenirs que le monde cherche à effacer."},
      sansOmbre:{name:"Peuple sans ombre",icon:"☽",description:"Des réfugiés du Voile qui reconnaissent quelque chose en vous."}
    },
    questItems: {
      sealed_page:{name:"Page scellée",icon:"▧",description:"Une page écrite de votre main, encore impossible à ouvrir."},
      ash_sigil:{name:"Sceau de cendre",icon:"◇",description:"Le signe d'un Veilleur disparu. Il peut encore ouvrir certaines portes."},
      stolen_name:{name:"Syllabe volée",icon:"◉",description:"Un fragment de nom arraché au Sanctuaire."}
    },
    events: {
      story:{
        title:"L'inscription effacée",eyebrow:"Décision persistante",icon:"☾",
        copy:"Sous l'autel de la Chapelle muette, une silhouette blessée protège une page portant votre écriture. Dehors, les cloches annoncent l'approche des cendres.",
        choices:[
          {id:"save_watcher",label:"Sauver le Veilleur",description:"Abandonner la page pour mettre l'inconnu à l'abri.",effects:{reputation:{veilleurs:2},hpPercent:-.12,flags:["watcher_saved"]},result:"Le Veilleur survit. Avant de disparaître, il vous confie un sceau et promet que les routes s'en souviendront.",questItem:"ash_sigil"},
          {id:"take_page",label:"Prendre la page",description:"Choisir le savoir et laisser la chapelle à son destin.",condition:{stat:"Esprit",min:8},effects:{reputation:{archivistes:1,veilleurs:-1},xp:55,flags:["page_taken"]},result:"La page se referme sur vos doigts. Une phrase demeure visible : « Ne sauve pas celui qui se souvient. »",questItem:"sealed_page"},
          {id:"burn_all",label:"Brûler l'autel",description:"Refuser le choix et réduire les deux secrets en cendres.",effects:{reputation:{veilleurs:-1,archivistes:-1},resource:{ember:4},flags:["chapel_burned"]},result:"Les flammes prennent une couleur blanche. Quelque chose, très loin, rit avec votre voix."}
        ]
      },
      r2story:{
        title:"Le dernier astronome",eyebrow:"Rencontre rare",icon:"◉",
        copy:"Une femme aveugle règle encore les lentilles de l'Observatoire noyé. Elle affirme avoir vu votre arrivée trois cents ans plus tôt.",
        choices:[
          {id:"share_memory",label:"Partager un souvenir",description:"Lui abandonner une part de votre expérience.",effects:{xp:-40,reputation:{archivistes:2},flags:["astronomer_trusted"]},result:"Elle dessine une route invisible sur votre carte. « Vous n'êtes pas le premier à porter votre absence. »"},
          {id:"question_her",label:"Exiger une réponse",description:"Votre présence peut suffire à briser son silence.",condition:{classId:"penitent"},effects:{stat:{Esprit:1},reputation:{archivistes:-1},flags:["astronomer_frightened"]},result:"Elle recule devant votre chaîne. Le titre qu'elle prononce est avalé par l'eau avant de vous atteindre."},
          {id:"leave_observatory",label:"Respecter son silence",description:"Partir sans dette et sans certitude.",effects:{reputation:{sansOmbre:1},gold:35,flags:["astronomer_spared"]},result:"À votre départ, elle dépose trente-cinq éclats sur le seuil. Ils portent tous votre portrait, sans visage."}
        ]
      },
      r2library:{
        title:"Le livre qui vous attendait",eyebrow:"Conséquence différée",icon:"▤",
        copy:"Au centre des Archives, un livre respire sous l'eau. Sa serrure correspond exactement à la forme laissée par un souvenir que vous avez choisi de porter.",
        choices:[
          {id:"open_archive",label:"Ouvrir le livre",description:"Nécessite la Page scellée ou la confiance de l'astronome.",condition:{anyOf:[{questItem:"sealed_page"},{flag:"astronomer_trusted"}]},effects:{xp:140,reputation:{archivistes:2},resource:{moon_glass:3},flags:["archive_opened"]},result:"Le livre ne révèle qu'une image : vous, agenouillé devant le Maître des Cendres, tandis qu'il vous demande pardon."},
          {id:"give_sigil",label:"Confier le sceau aux Archives",description:"Échanger le Sceau de cendre contre une alliance durable.",condition:{questItem:"ash_sigil"},consumeQuestItem:"ash_sigil",effects:{reputation:{veilleurs:1,archivistes:2},resource:{pale_fiber:3},flags:["archive_alliance"]},result:"Les Archivistes reconnaissent le sceau. Désormais, leurs caches s'ouvriront sur votre passage."},
          {id:"copy_fragments",label:"Copier les fragments lisibles",description:"Une option modeste, mais sans condition.",effects:{xp:70,resource:{moon_glass:1},flags:["archive_copied"]},result:"Les phrases copiées changent lorsque vous détournez les yeux. Une seule reste stable : « Le héros doit demeurer anonyme. »"}
        ]
      },
      r2sanctum:{
        title:"La ligne sans lettres",eyebrow:"Serment narratif",icon:"☿",
        copy:"Votre nom occupait autrefois une ligne entière. Trois gardiens sans visage vous proposent de décider ce qui doit remplacer les lettres absentes.",
        choices:[
          {id:"oath_guard",label:"Jurer de protéger les sans-ombre",description:"Un serment durable : davantage de Vitalité, mais une dette envers leur peuple.",effects:{stat:{Vitalité:1},reputation:{sansOmbre:3},flags:["oath_shadowless"]},result:"Une ombre apparaît enfin à vos pieds. Elle ne reproduit pas vos mouvements."},
          {id:"steal_syllable",label:"Arracher une syllabe",description:"Gagner du pouvoir en profanant le Sanctuaire.",condition:{stat:"Force",min:12},effects:{stat:{Force:1},reputation:{sansOmbre:-3},flags:["name_stolen"]},result:"La pierre saigne une syllabe imprononçable. Les gardiens s'agenouillent — de peur, non de respect.",questItem:"stolen_name"},
          {id:"remain_nameless",label:"Rester anonyme",description:"Refuser encore une fois le nom qui vous est offert.",effects:{xp:160,reputation:{veilleurs:1,archivistes:1},flags:["nameless_vow"]},result:"Les gardiens murmurent : « Alors le cycle peut continuer. »"}
        ]
      }
    }
  },
  companions: [
    {id:"ilyra",name:"Ilyra la Veilleuse",icon:"♞",role:"Protection",region:1,description:"Une éclaireuse privée de son ordre. Elle intercepte les coups et respecte les héros qui protègent les inconnus.",ability:{name:"Égide du chemin",type:"barrier",power:12,evolvedName:"Rempart des Veilleurs"},quest:{name:"Le dernier fanal",description:"Terminer un détour avec Ilyra pour rallumer le fanal de son ordre."},scenes:{5:["Elle retire enfin son casque.","« Je suivais votre trace avant même de connaître votre visage. »"],10:["Une carte brûlée","Ilyra révèle que son ordre avait pour mission de vous retrouver — ou de vous arrêter."],15:["Le dernier fanal","Son ancien ordre a laissé un fanal dans un détour dangereux."],20:["Le serment rompu","Elle vous demande si une promesse injuste doit malgré tout être tenue."],25:["Veille éternelle","Ilyra vous offre le véritable blason des Veilleurs."]},synergies:{bastion:"Barrière renforcée de 40 %.",traqueuse:"Accorde aussi 8 % de critique.",arcaniste:"Rend 1 énergie tous les trois tours.",penitent:"La Barrière augmente sous 40 % de PV."}},
    {id:"orven",name:"Orven sans Ombre",icon:"◑",role:"Soutien",region:2,description:"Un habitant du Voile qui recueille les noms oubliés. Il soigne le héros et amplifie les effets spirituels.",ability:{name:"Souvenir partagé",type:"heal",power:10,evolvedName:"Mémoire indivisible"},quest:{name:"Les ombres rendues",description:"Terminer un détour avec Orven pour retrouver l'ombre de son village."},scenes:{5:["Un nom pour la route","Orven demande quel nom temporaire il pourrait vous donner."],10:["L'ombre empruntée","Votre ombre agit parfois avant vous. Orven prétend qu'elle se souvient."],15:["Les ombres rendues","Un fragment de son peuple attend dans un détour du Voile."],20:["Le prix d'un souvenir","Orven peut vous rendre un souvenir, mais il devra oublier votre rencontre."],25:["Celui qui se souvient","Il décide de porter votre mémoire même si le monde disparaît."]},synergies:{bastion:"Le soin accorde 5 points de posture.",traqueuse:"Le soin applique Furie pendant un tour.",arcaniste:"Le soin rend 2 énergies.",penitent:"Le soin est doublé après un sacrifice."}},
    {id:"nox",name:"Nox, Masque brisé",icon:"◐",role:"Assaut",region:3,description:"Un ancien serviteur de la Couronne. Il frappe la cible active et apprend à haïr ceux que vous choisissez d'épargner.",ability:{name:"Sentence sans visage",type:"damage",power:18,evolvedName:"Sentence de la Couronne"},quest:{name:"Le masque véritable",description:"Terminer un détour avec Nox pour retrouver la moitié manquante de son masque."},scenes:{5:["Sous le masque","Nox affirme que son visage ressemble au vôtre."],10:["L'ancien bourreau","Il exécutait ceux qui tentaient de prononcer votre nom."],15:["Le masque véritable","La moitié de son masque repose dans un détour du Royaume."],20:["La dernière sentence","Nox demande la permission de tuer un survivant qui connaît votre passé."],25:["Visage choisi","Il brise définitivement son masque et choisit de rester."]},synergies:{bastion:"Inflige davantage après une Garde.",traqueuse:"Peut produire un coup critique.",arcaniste:"Les dégâts deviennent du feu.",penitent:"Gagne 35 % de puissance sous 40 % de PV."}}
  ],
  contracts: [
    {id:"r1_ash_hunt",region:1,icon:"⚔",faction:"Veilleurs",name:"Ceux qui suivent la fumée",description:"Éclaircir les routes avant que les rôdeurs n'encerclent Cendrebourg.",objective:{type:"battle",target:3,label:"Combats remportés"},reward:{gold:90}},
    {id:"r1_broken_paths",region:1,icon:"⌘",faction:"Cartographes",name:"Les chemins qui n'existent pas",description:"Explorer les détours que les cartes refusent encore de montrer.",objective:{type:"optional",target:2,label:"Détours terminés"},reward:{resources:{iron:6,ember:2}}},
    {id:"r1_dry_blade",region:1,icon:"⚗",faction:"Ordre du Fanal",name:"La lame et non la fiole",description:"Prouver que la Route peut être vaincue sans dépendre des potions.",objective:{type:"potionless",target:2,label:"Victoires sans potion"},reward:{xp:120,potions:1}},
    {id:"r1_elite_trace",region:1,icon:"♞",faction:"Veilleurs",name:"Une trace plus profonde",description:"Traquer une présence d'élite cachée hors de la route principale.",objective:{type:"elite",target:1,label:"Élites vaincues"},reward:{itemRarity:"rare"}},
    {id:"r2_drowned_hunt",region:2,icon:"☽",faction:"Sans-Ombre",name:"Les noyés ne dorment pas",description:"Faire taire les silhouettes qui remontent du Voile.",objective:{type:"battle",target:4,label:"Combats remportés"},reward:{gold:130,xp:80}},
    {id:"r2_pale_roads",region:2,icon:"◇",faction:"Archivistes",name:"Fibres du passage",description:"Rapporter les matières qui poussent seulement loin des routes sûres.",objective:{type:"optional",target:2,label:"Détours terminés"},reward:{resources:{pale_fiber:4,moon_glass:2}}},
    {id:"r2_silent_elites",region:2,icon:"◉",faction:"Archivistes",name:"Deux silences à préserver",description:"Abattre deux gardiens d'élite avant qu'ils ne rejoignent les Archives.",objective:{type:"elite",target:2,label:"Élites vaincues"},reward:{itemRarity:"épique"}},
    {id:"r2_unbroken_memory",region:2,icon:"⚗",faction:"Sans-Ombre",name:"Une mémoire sans remède",description:"Traverser trois affrontements sans boire à la fiole.",objective:{type:"potionless",target:3,label:"Victoires sans potion"},reward:{xp:210,potions:2}},
    {id:"r3_crown_offensive",region:3,icon:"♚",faction:"Masques brisés",name:"Sous les murs de la Couronne",description:"Réduire les forces qui gardent la route du Maître des Cendres.",objective:{type:"battle",target:5,label:"Combats remportés"},reward:{gold:190,xp:120}},
    {id:"r3_forbidden_ways",region:3,icon:"☿",faction:"Exilés",name:"Là où la cendre regarde",description:"Revenir de trois chemins que personne n'a encore osé cartographier.",objective:{type:"optional",target:3,label:"Détours terminés"},reward:{resources:{essence:3,star_fragment:1}}},
    {id:"r3_severed_court",region:3,icon:"◐",faction:"Masques brisés",name:"Les juges sans visage",description:"Rompre les sentences de deux champions de la Couronne.",objective:{type:"elite",target:2,label:"Élites vaincues"},reward:{itemRarity:"épique",gold:100}},
    {id:"r3_ashen_lord",region:3,icon:"♛",faction:"Exilés",name:"Une couronne pour le bûcher",description:"Vaincre un seigneur majeur du Royaume sous la Cendre.",objective:{type:"boss",target:1,label:"Boss vaincus"},reward:{itemRarity:"légendaire",resources:{star_fragment:2}}}
  ],
  nemesis: {
    names:["Kaël","Morvane","Syr","Odrak","Veyra","Tharos","Nemeï","Korven"],
    titles:["le Porte-Cicatrice","la Gueule de Suie","l'Inoublié","le Chasseur sans Visage","la Main du Maître","le Dernier Témoin","l'Affamé d'Aubes","le Briseur de Serments"],
    bases:{1:["brute","widow","warden","knight"],2:["glass","pilgrim","nameEater","starSmith"],3:["gaoler","seraph","hollowKing","archon"],4:["cycleHound","ashScribe","oathKeeper","namelessTwin"]},
    traits:[
      {id:"tenacious",name:"Tenace",icon:"♥",description:"+30 % de points de vie.",hp:.3},
      {id:"brutal",name:"Brutale",icon:"⚔",description:"+22 % de dégâts.",damage:.22},
      {id:"warded",name:"Sous égide",icon:"◈",description:"Commence le combat avec une Barrière.",barrier:.18},
      {id:"ironhide",name:"Peau de fer",icon:"♜",description:"+20 % de résistance physique.",physical:.2},
      {id:"cinderborn",name:"Née des braises",icon:"♨",description:"+30 % de résistance au feu.",fire:.3},
      {id:"bloodless",name:"Sans sang",icon:"†",description:"+35 % de résistance au saignement.",bleed:.35}
    ]
  },
  camp: {
    choices:[
      {id:"rest",icon:"♥",name:"Dormir près des braises",description:"Restaure tous les PV et toute l'énergie.",effect:"Récupération complète"},
      {id:"sharpen",icon:"⚔",name:"Aiguiser l'arme",description:"Prépare une Furie de 15 % pour tout le prochain combat.",effect:"Coût : 2 Fer ancien",cost:{iron:2},buff:"edge"},
      {id:"ward",icon:"◈",name:"Tracer un cercle de garde",description:"Commence le prochain combat avec une Barrière égale à 20 % des PV maximum.",effect:"Coût : 2 Braises stables",cost:{ember:2},buff:"ward"},
      {id:"brew",icon:"⚗",name:"Distiller les restes",description:"Prépare deux potions à partir des matériaux de la Route.",effect:"Coût : 3 Fer · 1 Fibre pâle",cost:{iron:3,pale_fiber:1}},
      {id:"companion",icon:"♞",name:"Partager le feu",description:"Approfondit la confiance et la loyauté du compagnon actif.",effect:"Une fois par compagnon et par région"}
    ],
    buffs:{
      edge:{name:"Lame préparée",icon:"⚔",description:"+15 % de dégâts durant le prochain combat."},
      ward:{name:"Cercle de garde",icon:"◈",description:"Barrière de 20 % des PV au prochain combat."}
    }
  },
  sanctuary: {
    buildings:[
      {
        id:"forge",icon:"⚒",name:"Forge du Dernier Feu",npc:"Maëra",role:"Forgeronne des routes",
        costs:[18,36,60],
        stages:[
          {name:"Foyer rallumé",description:"Une enclume sauvée des ruines résonne de nouveau.",unlock:"Maëra rejoint le Sanctuaire."},
          {name:"Atelier restauré",description:"Les outils des anciennes expéditions reprennent vie.",unlock:"Préparatif : nécessaire du forgeron."},
          {name:"Grande forge",description:"Chaque marteau fait résonner les trophées du hameau.",unlock:"Le nécessaire du forgeron est amélioré."}
        ],
        dialogues:[
          "Je peux réparer cette forge. Mais pas avec des promesses.",
          "Chaque arme rapporte une histoire. La vôtre refuse toujours de parler.",
          "Avant votre départ, je peux glisser quelques outils dans votre paquetage.",
          "J'ai déjà reforgé cette lame. Dans une autre vie — ou une autre expédition."
        ]
      },
      {
        id:"archives",icon:"▤",name:"Archives des Noms",npc:"Sélène",role:"Archiviste aveugle",
        costs:[14,30,52],
        stages:[
          {name:"Registre restauré",description:"Des feuillets sauvés sèchent autour d'une lampe.",unlock:"Sélène ouvre le registre des souvenirs."},
          {name:"Scriptorium",description:"Les fragments rapportés peuvent enfin être reliés.",unlock:"Préparatif : sceau mémoriel."},
          {name:"Archive vivante",description:"Les pages se souviennent même de ce que le monde efface.",unlock:"Le sceau mémoriel est amélioré."}
        ],
        dialogues:[
          "Votre silence a une écriture. Aidez-moi à la conserver.",
          "Les pages vous reconnaissent, même lorsqu'elles ne vous ont jamais vu.",
          "Emportez ce sceau. Il retiendra une part de ce que vous avez appris.",
          "Toutes les fins portent votre trace. Une seule semble encore incomplète."
        ]
      },
      {
        id:"apothecary",icon:"⚗",name:"Jardin des Distillats",npc:"Ysandre",role:"Alchimiste des cendres",
        costs:[16,32,55],
        stages:[
          {name:"Serre rouverte",description:"Quelques pousses pâles grandissent sous le verre réparé.",unlock:"Ysandre installe son alambic."},
          {name:"Jardin stable",description:"Les plantes du Voile donnent leurs premiers remèdes.",unlock:"Préparatif : fiole distillée."},
          {name:"Verrière lunaire",description:"Une rosée impossible nourrit les cultures du Sanctuaire.",unlock:"La fiole distillée est améliorée."}
        ],
        dialogues:[
          "Même la cendre nourrit quelque chose. Il suffit d'accepter de regarder.",
          "Vos blessures guérissent. Leur souvenir, lui, s'accumule.",
          "Une seule fiole. Si vous en aviez davantage, vous oublieriez la prudence.",
          "Le Brasier change vos potions. Ou peut-être est-ce vous qui changez."
        ]
      },
      {
        id:"observatory",icon:"⌘",name:"Tour du Cartographe",npc:"Edern",role:"Cartographe sans boussole",
        costs:[20,40,65],
        stages:[
          {name:"Table des chemins",description:"Une première carte stable recouvre les anciennes ruines.",unlock:"Edern commence à relever les routes."},
          {name:"Salle des cartes",description:"Les itinéraires connus entourent désormais l'inconnu.",unlock:"Préparatif : itinéraire marchand."},
          {name:"Observatoire des routes",description:"La tour aperçoit des chemins qui n'existent pas encore.",unlock:"L'itinéraire marchand est amélioré."}
        ],
        dialogues:[
          "Les routes ne vont nulle part. Elles attendent seulement quelqu'un.",
          "J'ai dessiné votre trajet de retour. Vous n'en avez jamais suivi un seul.",
          "Cette carte passe près de caravanes oubliées. Elles paient encore en éclats.",
          "À chaque victoire, une route disparaît de mes cartes. Pourquoi ?"
        ]
      }
    ],
    preparations:[
      {id:"forge_kit",building:"forge",level:2,icon:"⚒",name:"Nécessaire du forgeron",description:"Commence la prochaine expédition avec 5 Fer ancien. 8 au niveau III."},
      {id:"memory_seal",building:"archives",level:2,icon:"▤",name:"Sceau mémoriel",description:"Commence avec 60 XP conservés. 90 au niveau III."},
      {id:"distilled_flask",building:"apothecary",level:2,icon:"⚗",name:"Fiole distillée",description:"Commence avec 1 potion supplémentaire. 2 au niveau III."},
      {id:"merchant_route",building:"observatory",level:2,icon:"⌘",name:"Itinéraire marchand",description:"Commence avec 40 éclats. 70 au niveau III."}
    ],
    collections:[
      {id:"road_veteran",icon:"⌘",name:"Le chemin insiste",description:"Achever 5 expéditions.",metric:"runs",target:5,reward:24},
      {id:"crown_cabinet",icon:"♚",name:"Cabinet des couronnes",description:"Rapporter les marques de 5 boss différents.",metric:"trophies",target:5,reward:32},
      {id:"reliquary",icon:"◆",name:"Reliquaire des routes",description:"Consigner 20 équipements différents.",metric:"items",target:20,reward:28},
      {id:"living_archive",icon:"☾",name:"L'archive vivante",description:"Préserver 8 fragments de mémoire.",metric:"lore",target:8,reward:26},
      {id:"many_endings",icon:"✦",name:"Ce que le monde devint",description:"Découvrir les 4 conclusions de la campagne.",metric:"endings",target:4,reward:45}
    ],
    memories:[
      {id:"prologue",icon:"☾",name:"Le Porteur de flamme"},
      {id:"story",icon:"▧",name:"La Chapelle muette"},
      {id:"r1memory",icon:"⚑",name:"Le Mémorial du Fanal"},
      {id:"r2story",icon:"◉",name:"L'Observatoire noyé"},
      {id:"r2library",icon:"▤",name:"Les Archives submergées"},
      {id:"r2sanctum",icon:"☿",name:"Le Sanctuaire des Noms"},
      {id:"r2monastery",icon:"☾",name:"Le Monastère des Reflets"},
      {id:"r3entry",icon:"▼",name:"Le Royaume sous la Cendre"},
      {id:"r3story",icon:"♚",name:"Le souvenir royal"},
      {id:"r3council",icon:"◐",name:"Le Conseil des Masques"},
      {id:"r4entry",icon:"✦",name:"Le Premier Souvenir"},
      {id:"r4story",icon:"☗",name:"La vérité du Cycle"},
      {id:"final_truth",icon:"◈",name:"Le Serment partagé"}
    ]
  },
  endings: [
    {id:"guardian",icon:"◈",name:"Le Dernier Gardien",choice:"Rallumer le sceau",description:"Refermer le Brasier et devenir la nouvelle sentinelle du monde.",requirement:"Toujours disponible",tone:"duty"},
    {id:"sovereign",icon:"♚",name:"La Couronne de Cendre",choice:"Prendre la couronne",description:"S'emparer du pouvoir du Maître et imposer un nouvel ordre aux royaumes.",requirement:"Toujours disponible",tone:"power"},
    {id:"wanderer",icon:"⌘",name:"La Route sans maître",choice:"Briser la couronne",description:"Détruire le cycle, libérer les routes et accepter un monde désormais sans gardien.",requirement:"Avoir pris au moins trois décisions",tone:"freedom"},
    {id:"remembered",icon:"✦",name:"Le Nom retrouvé",choice:"Prononcer le nom oublié",description:"Réunir les souvenirs confiés aux compagnons et rendre au héros son identité véritable.",requirement:"30 points de confiance cumulés · 2 quêtes de compagnon",tone:"secret",secret:true}
  ],
  challenges: [
    {id:"first_blood",name:"Première braise",icon:"⚔",category:"Général",description:"Remporter votre premier combat.",condition:{stat:"battlesWon",min:1},reward:5},
    {id:"boss_hunter",name:"Briseur de couronnes",icon:"♚",category:"Général",description:"Vaincre trois boss dans une expédition.",condition:{stat:"bossesDefeated",min:3},reward:18},
    {id:"wanderer",name:"Les routes interdites",icon:"⌘",category:"Exploration",description:"Terminer cinq détours optionnels.",condition:{stat:"optionalCleared",min:5},reward:12},
    {id:"potionless",name:"Soif de victoire",icon:"⚗",category:"Maîtrise",description:"Vaincre un boss sans utiliser de potion.",condition:{flag:"bossNoPotion"},reward:14},
    {id:"posture_master",name:"À genoux",icon:"◇",category:"Maîtrise",description:"Briser dix postures au cours d'une expédition.",condition:{stat:"postureBreaks",min:10},reward:15},
    {id:"bastion_trial",name:"Mur éternel",icon:"♜",category:"Bastion",classId:"bastion",description:"Vaincre un boss après avoir utilisé Garde au moins cinq fois.",condition:{flag:"classMastery"},reward:16},
    {id:"traqueuse_trial",name:"Aucune trace",icon:"♞",category:"Traqueuse",classId:"traqueuse",description:"Vaincre un boss sans potion.",condition:{flag:"classMastery"},reward:16},
    {id:"arcaniste_trial",name:"Surcharge occulte",icon:"✦",category:"Arcaniste",classId:"arcaniste",description:"Lancer huit pouvoirs durant un combat de boss.",condition:{flag:"classMastery"},reward:16},
    {id:"penitent_trial",name:"Dette acquittée",icon:"☿",category:"Pénitent",classId:"penitent",description:"Vaincre un boss en terminant sous 40 % de PV.",condition:{flag:"classMastery"},reward:16},
    {id:"act_one",name:"Celui qui revient",icon:"☗",category:"Histoire",description:"Terminer la campagne.",condition:{flag:"actComplete"},reward:30},
    {id:"true_name",name:"Ce qui fut confié",icon:"✦",category:"Secret",description:"Découvrir la fin du Nom retrouvé.",condition:{flag:"secretEnding"},reward:40}
  ],
  combat: {
    hazards: [
      {id:"ember_wind",region:1,icon:"♨",name:"Vent de braise",cadence:3,description:"Tous les 3 tours, tous les combattants reçoivent Brûlure."},
      {id:"broken_ground",region:1,icon:"◇",name:"Sol fracturé",cadence:4,description:"Tous les 4 tours, les ennemis perdent de la posture mais le héros perd 1 énergie."},
      {id:"upward_tide",region:2,icon:"↟",name:"Marée inversée",cadence:3,description:"Tous les 3 tours, le héros récupère 1 énergie et les ennemis gagnent une Barrière."},
      {id:"mirror_static",region:2,icon:"◈",name:"Foudre des miroirs",cadence:4,description:"Tous les 4 tours, la cible est Marquée et le héros subit Faiblesse."},
      {id:"royal_edict",region:3,icon:"♚",name:"Décret royal",cadence:3,description:"Tous les 3 tours, l'avant-garde gagne une Barrière et l'arrière-garde entre en Furie."},
      {id:"memory_rain",region:3,icon:"☾",name:"Pluie de mémoire",cadence:4,description:"Tous les 4 tours, le héros se régénère et les ennemis subissent Faiblesse."},
      {id:"cycle_spark",region:4,icon:"✦",name:"Étincelle du Cycle",cadence:3,description:"Tous les 3 tours, le héros récupère de l'énergie mais tous les combattants gagnent Furie."},
      {id:"oath_pressure",region:4,icon:"☗",name:"Poids du Serment",cadence:4,description:"Tous les 4 tours, le héros et les ennemis perdent de la posture ou de l'énergie."}
    ],
    mutations: [
      {id:"armored",icon:"♜",name:"Cuirassés",description:"+18 % PV et +15 % de résistance physique.",effects:{hp:.18,physical:.15}},
      {id:"frenzied",icon:"▲",name:"Frénétiques",description:"+15 % de dégâts et Furie au début de chaque vague.",effects:{damage:.15,fury:12}},
      {id:"warded",icon:"◈",name:"Voilés",description:"Commencent chaque vague avec une Barrière de 15 % des PV.",effects:{barrier:.15}},
      {id:"unyielding",icon:"◇",name:"Inébranlables",description:"+35 posture et résistance accrue au Saignement.",effects:{posture:35,bleed:.2}},
      {id:"volatile",icon:"♨",name:"Instables",description:"Explosent à leur défaite et blessent le héros.",effects:{deathDamage:.045}},
      {id:"leeching",icon:"♥",name:"Sangsues",description:"Récupèrent 15 % des dégâts qu'ils infligent.",effects:{lifesteal:.15}}
    ],
    statuses: {
      burn:{name:"Brûlure",icon:"♨",tone:"negative",description:"Subit des dégâts au début du tour."},
      bleed:{name:"Saignement",icon:"†",tone:"negative",description:"Subit des dégâts au début du tour."},
      weakness:{name:"Faiblesse",icon:"↓",tone:"negative",description:"Inflige 25 % de dégâts en moins."},
      armorBreak:{name:"Armure brisée",icon:"◇",tone:"negative",description:"Subit 25 % de dégâts supplémentaires."},
      marked:{name:"Marqué",icon:"◎",tone:"negative",description:"Subit 20 % de dégâts supplémentaires."},
      barrier:{name:"Barrière",icon:"◈",tone:"positive",description:"Absorbe une partie des prochains dégâts."},
      regeneration:{name:"Régénération",icon:"♥",tone:"positive",description:"Restaure des PV à la fin du tour."},
      fury:{name:"Furie",icon:"▲",tone:"positive",description:"Inflige 20 % de dégâts supplémentaires."}
    },
    abilityEffects: {
      b_shield_bash:{effects:[{target:"enemy",type:"weakness",turns:2,potency:25}]},
      b_rampart:{effects:[{target:"player",type:"barrier",turns:2,potency:14}]},
      b_retribution:{synergy:{condition:"guard",multiplier:1.5,label:"Rétribution après Garde"}},
      b_breaker:{effects:[{target:"enemy",type:"armorBreak",turns:3,potency:25}]},
      b_last_stand:{effects:[{target:"player",type:"barrier",turns:2,potency:22}]},
      b_oath:{effects:[{target:"player",type:"barrier",turns:3,potency:30}]},
      b_worldwall:{effects:[{target:"player",type:"barrier",turns:3,potency:42}]},
      t_quick_cut:{effects:[{target:"enemy",type:"bleed",turns:3,potency:5}]},
      t_twin:{synergy:{status:"bleed",multiplier:1.35,label:"Cible en Saignement"}},
      t_mark:{effects:[{target:"enemy",type:"marked",turns:3,potency:20}]},
      t_fan:{effects:[{target:"enemy",type:"bleed",turns:2,potency:4}]},
      t_ambush:{synergy:{status:"marked",multiplier:1.45,consume:true,label:"Consomme Marqué"}},
      t_bloodtrail:{synergy:{status:"bleed",multiplier:1.4,label:"Suit la piste sanglante"}},
      t_execution:{synergy:{status:"bleed",multiplier:1.65,consume:true,label:"Exécute la cible"}},
      a_spark:{effects:[{target:"enemy",type:"burn",turns:3,potency:6}]},
      a_ember:{synergy:{status:"burn",multiplier:1.3,label:"Cible en Brûlure"}},
      a_sigil:{effects:[{target:"enemy",type:"weakness",turns:3,potency:25}]},
      a_rain:{effects:[{target:"enemy",type:"burn",turns:3,potency:5}]},
      a_void:{effects:[{target:"enemy",type:"armorBreak",turns:2,potency:25}]},
      a_collapse:{synergy:{status:"burn",multiplier:1.5,consume:true,label:"Consume Brûlure"}},
      a_nameless:{effects:[{target:"enemy",type:"weakness",turns:4,potency:25}]},
      a_veil:{effects:[{target:"enemy",type:"burn",turns:4,potency:9}]},
      p_chain:{effects:[{target:"enemy",type:"bleed",turns:3,potency:5}]},
      p_mark:{effects:[{target:"enemy",type:"marked",turns:3,potency:20}]},
      p_confession:{effects:[{target:"player",type:"fury",turns:3,potency:20}]},
      p_scourge:{effects:[{target:"enemy",type:"weakness",turns:2,potency:25}]},
      p_debt:{synergy:{status:"marked",multiplier:1.4,label:"Dette du condamné"}},
      p_absolution:{effects:[{target:"player",type:"regeneration",turns:3,potency:7}]},
      p_procession:{effects:[{target:"enemy",type:"bleed",turns:3,potency:7}]},
      p_true_name:{effects:[{target:"enemy",type:"armorBreak",turns:3,potency:25}]},
      p_first_sin:{effects:[{target:"enemy",type:"burn",turns:4,potency:8},{target:"enemy",type:"bleed",turns:4,potency:8}]}
    }
  },
  builds: {
    specializations: {
      bastion: {
        10:[{id:"guardian",name:"Gardien",description:"Barrières renforcées et défense supérieure.",stats:{Vitalité:3},barrierBonus:.35},{id:"avenger",name:"Vengeur",description:"Transforme la robustesse en puissance offensive.",stats:{Force:3},damageBonus:.12}],
        20:[{id:"citadel",requires:"guardian",name:"Citadelle vivante",description:"+25 PV et Barrières encore renforcées.",maxHp:25,barrierBonus:.25},{id:"iron_judge",requires:"avenger",name:"Juge de fer",description:"Dégâts augmentés contre les ennemis affaiblis.",stats:{Force:4},debuffDamage:.18}]
      },
      traqueuse: {
        10:[{id:"assassin",name:"Assassin",description:"Dégâts critiques et exécutions renforcés.",stats:{Agilité:3},critBonus:.08},{id:"blood_hunter",name:"Chasseuse de sang",description:"Saignements plus puissants et durables.",stats:{Force:2,Agilité:1},dotBonus:.35}],
        20:[{id:"night_blade",requires:"assassin",name:"Lame de nuit",description:"Les cibles Marquées subissent davantage de dégâts.",markedBonus:.2,critBonus:.05},{id:"red_track",requires:"blood_hunter",name:"Piste écarlate",description:"Les dégâts persistants restaurent vos PV.",dotBonus:.3,dotHealing:.25}]
      },
      arcaniste: {
        10:[{id:"pyromancer",name:"Pyromancien",description:"Brûlures plus puissantes.",stats:{Esprit:3},dotBonus:.4},{id:"void_scholar",name:"Érudit du Vide",description:"Techniques moins coûteuses et affaiblissements renforcés.",stats:{Esprit:2},costReduction:1}],
        20:[{id:"ashen_sun",requires:"pyromancer",name:"Soleil de cendre",description:"Les cibles brûlées subissent davantage de dégâts.",burnBonus:.25,dotBonus:.25},{id:"reality_bender",requires:"void_scholar",name:"Tisseur de réalité",description:"+3 énergie et puissance accrue contre les ennemis affaiblis.",maxEnergy:3,debuffDamage:.2}]
      },
      penitent: {
        10:[{id:"martyr",name:"Martyr",description:"Sacrifices plus puissants et davantage de PV.",maxHp:18,sacrificeBonus:.3},{id:"redeemed",name:"Racheté",description:"Régénération renforcée et meilleure défense.",stats:{Vitalité:2,Esprit:1},healingBonus:.3}],
        20:[{id:"first_sinner",requires:"martyr",name:"Premier Pécheur",description:"Sous 40 % de PV, inflige encore plus de dégâts.",stats:{Force:3,Esprit:3},lowHpDamage:.25},{id:"chain_breaker",requires:"redeemed",name:"Briseur de chaînes",description:"Régénération et Barrières renforcées.",maxHp:20,healingBonus:.25,barrierBonus:.25}]
      }
    },
    masteries: {
      bastion:[
        {id:"bm_guard",branch:"Rempart",tier:1,level:5,name:"Ancrage",description:"La Garde réduit 8 % de dégâts supplémentaires.",guardBonus:.08},
        {id:"bm_aegis",branch:"Rempart",tier:2,level:15,requires:"bm_guard",name:"Égide profonde",description:"Les Barrières sont 22 % plus puissantes.",barrierBonus:.22},
        {id:"bm_resolve",branch:"Rempart",tier:3,level:25,requires:"bm_aegis",name:"Inébranlable",description:"La Résolution renforce davantage vos coups.",resourceBonus:.15},
        {id:"bm_impact",branch:"Jugement",tier:1,level:5,name:"Masse vivante",description:"+6 % de dégâts avec toutes les attaques.",damageBonus:.06},
        {id:"bm_fracture",branch:"Jugement",tier:2,level:15,requires:"bm_impact",name:"Fracture royale",description:"+25 % de dégâts de posture.",postureBonus:.25},
        {id:"bm_sentence",branch:"Jugement",tier:3,level:25,requires:"bm_fracture",name:"Sentence de fer",description:"+20 % de dégâts contre les ennemis affaiblis.",debuffDamage:.2},
        {id:"bm_oath",branch:"Serment",tier:1,level:5,name:"Souffle du veilleur",description:"+12 PV maximum.",maxHp:12},
        {id:"bm_memory",branch:"Serment",tier:2,level:15,requires:"bm_oath",name:"Mémoire du rempart",description:"+20 % aux soins reçus.",healingBonus:.2},
        {id:"bm_worldwall",branch:"Serment",tier:3,level:25,requires:"bm_memory",name:"Mur-monde",description:"+14 % de dégâts avec les techniques.",abilityDamage:.14}
      ],
      traqueuse:[
        {id:"tm_eye",branch:"Ombre",tier:1,level:5,name:"Œil froid",description:"+4 % de chance de critique.",critBonus:.04},
        {id:"tm_firstblood",branch:"Ombre",tier:2,level:15,requires:"tm_eye",name:"Premier sang",description:"+8 % de dégâts directs.",damageBonus:.08},
        {id:"tm_dance",branch:"Ombre",tier:3,level:25,requires:"tm_firstblood",name:"Danse sans trace",description:"Le Combo renforce davantage les techniques.",resourceBonus:.15},
        {id:"tm_wound",branch:"Sang",tier:1,level:5,name:"Plaie ouverte",description:"+20 % de dégâts persistants.",dotBonus:.2},
        {id:"tm_scent",branch:"Sang",tier:2,level:15,requires:"tm_wound",name:"Odeur de faiblesse",description:"+14 % contre les ennemis affaiblis.",debuffDamage:.14},
        {id:"tm_harvest",branch:"Sang",tier:3,level:25,requires:"tm_scent",name:"Moisson écarlate",description:"Récupère 18 % des dégâts persistants.",dotHealing:.18},
        {id:"tm_breath",branch:"Survie",tier:1,level:5,name:"Second souffle",description:"+1 énergie maximum.",maxEnergy:1},
        {id:"tm_hide",branch:"Survie",tier:2,level:15,requires:"tm_breath",name:"Peau des pistes",description:"+12 PV maximum.",maxHp:12},
        {id:"tm_economy",branch:"Survie",tier:3,level:25,requires:"tm_hide",name:"Geste parfait",description:"Réduit de 1 le coût des techniques.",costReduction:1}
      ],
      arcaniste:[
        {id:"am_ember",branch:"Cendre",tier:1,level:5,name:"Braise savante",description:"+25 % de dégâts persistants.",dotBonus:.25},
        {id:"am_sun",branch:"Cendre",tier:2,level:15,requires:"am_ember",name:"Soleil intérieur",description:"+15 % contre les cibles brûlées.",burnBonus:.15},
        {id:"am_inferno",branch:"Cendre",tier:3,level:25,requires:"am_sun",name:"Feu sans lumière",description:"+14 % de dégâts avec les techniques.",abilityDamage:.14},
        {id:"am_void",branch:"Vide",tier:1,level:5,name:"Syllabe retranchée",description:"Réduit de 1 le coût des techniques.",costReduction:1},
        {id:"am_fracture",branch:"Vide",tier:2,level:15,requires:"am_void",name:"Réalité friable",description:"+15 % contre les ennemis affaiblis.",debuffDamage:.15},
        {id:"am_overload",branch:"Vide",tier:3,level:25,requires:"am_fracture",name:"Surcharge absolue",description:"La Surcharge renforce davantage les sorts.",resourceBonus:.18},
        {id:"am_reserve",branch:"Runes",tier:1,level:5,name:"Réserve runique",description:"+2 énergie maximum.",maxEnergy:2},
        {id:"am_sigil",branch:"Runes",tier:2,level:15,requires:"am_reserve",name:"Sceau protecteur",description:"Les Barrières sont 20 % plus puissantes.",barrierBonus:.2},
        {id:"am_echo",branch:"Runes",tier:3,level:25,requires:"am_sigil",name:"Écho réparateur",description:"+22 % aux soins et régénérations.",healingBonus:.22}
      ],
      penitent:[
        {id:"pm_flesh",branch:"Martyre",tier:1,level:5,name:"Chair consacrée",description:"+15 PV maximum.",maxHp:15},
        {id:"pm_offering",branch:"Martyre",tier:2,level:15,requires:"pm_flesh",name:"Offrande parfaite",description:"+18 % de puissance pour les sacrifices.",sacrificeBonus:.18},
        {id:"pm_abyss",branch:"Martyre",tier:3,level:25,requires:"pm_offering",name:"Au bord du gouffre",description:"+20 % de dégâts sous 40 % de PV.",lowHpDamage:.2},
        {id:"pm_mercy",branch:"Rachat",tier:1,level:5,name:"Grâce imparfaite",description:"+20 % aux soins reçus.",healingBonus:.2},
        {id:"pm_halo",branch:"Rachat",tier:2,level:15,requires:"pm_mercy",name:"Halo de chaînes",description:"Les Barrières sont 20 % plus puissantes.",barrierBonus:.2},
        {id:"pm_refusal",branch:"Rachat",tier:3,level:25,requires:"pm_halo",name:"Refus du verdict",description:"La Garde réduit 10 % de dégâts supplémentaires.",guardBonus:.1},
        {id:"pm_chain",branch:"Chaînes",tier:1,level:5,name:"Maillons barbelés",description:"+20 % de dégâts persistants.",dotBonus:.2},
        {id:"pm_weight",branch:"Chaînes",tier:2,level:15,requires:"pm_chain",name:"Poids de la faute",description:"+6 % de dégâts directs.",damageBonus:.06},
        {id:"pm_debt",branch:"Chaînes",tier:3,level:25,requires:"pm_weight",name:"Dette infinie",description:"La Dette de sang renforce davantage vos coups.",resourceBonus:.2}
      ]
    },
    abilityEvolutions: {
      bastion:{
        power:{name:"Fracas",description:"+20 % de dégâts et +30 % de dégâts de posture.",damage:1.2,postureBonus:.3},
        mastery:{name:"Égide",description:"Coût réduit de 1 et confère une Barrière de 4 % des PV.",costReduction:1,barrierOnCast:.04}
      },
      traqueuse:{
        power:{name:"Prédation",description:"+20 % de dégâts, puis +25 % sous 35 % des PV ennemis.",damage:1.2,executeBonus:.25},
        mastery:{name:"Danse",description:"Coût réduit de 1 et conserve 1 charge de Combo.",costReduction:1,resourceGain:1}
      },
      arcaniste:{
        power:{name:"Combustion",description:"+20 % de dégâts et altérations 35 % plus puissantes.",damage:1.2,statusPotency:.35},
        mastery:{name:"Flux",description:"Coût réduit de 1 et gagne une charge supplémentaire de Surcharge.",costReduction:1,resourceGain:1}
      },
      penitent:{
        power:{name:"Sacrifice",description:"+20 % de dégâts et sacrifice renforcé de 25 %.",damage:1.2,sacrificeBonus:.25},
        mastery:{name:"Pardon",description:"Coût réduit de 1 et coût en PV diminué de moitié.",costReduction:1,hpCostMultiplier:.5}
      }
    },
    artifactEffects: {
      ash_crown:{name:"Souveraineté ardente",description:"Toutes les ressources de classe sont 12 % plus efficaces.",resourceBonus:.12},
      first_flame:{name:"Flamme primordiale",description:"+12 % de dégâts de technique et Brûlures renforcées.",abilityDamage:.12,dotBonus:.25},
      forgotten_mail:{name:"Mémoire du royaume",description:"+18 PV et Barrières renforcées.",maxHp:18,barrierBonus:.2},
      road_end:{name:"Dernier pas",description:"+7 % de critique et +18 % contre une cible affaiblie.",critBonus:.07,debuffDamage:.18},
      astral_shell:{name:"Carapace impossible",description:"+20 PV et +15 % aux soins.",maxHp:20,healingBonus:.15},
      veil_fragment:{name:"Faille stabilisée",description:"+2 énergie et techniques 8 % plus puissantes.",maxEnergy:2,abilityDamage:.08},
      moonless_edge:{name:"Nuit incomplète",description:"+8 % de critique et +10 % de dégâts.",critBonus:.08,damageBonus:.1},
      well_scepter:{name:"Profondeur intérieure",description:"Réduit de 1 le coût des techniques.",costReduction:1},
      keeper_hide:{name:"Vigilance stellaire",description:"La Garde et les Barrières sont renforcées.",guardBonus:.08,barrierBonus:.2},
      first_map:{name:"Route antérieure",description:"+10 % de dégâts directs et persistants.",damageBonus:.1,dotBonus:.1},
      broken_halo:{name:"Sainteté fendue",description:"+25 % aux soins et Barrières.",healingBonus:.25,barrierBonus:.25},
      comet_bow:{name:"Orbite captive",description:"+10 % de critique et Combo renforcé.",critBonus:.1,resourceBonus:.1},
      dead_star_anvil:{name:"Masse céleste",description:"+15 % de dégâts de posture et directs.",postureBonus:.15,damageBonus:.1},
      first_sky_robe:{name:"Firmament antérieur",description:"+3 énergie et Surcharge renforcée.",maxEnergy:3,resourceBonus:.12},
      asterion_eye:{name:"Regard de l'étoile morte",description:"+15 % contre les ennemis affaiblis et +8 % aux techniques.",debuffDamage:.15,abilityDamage:.08},
      unwritten_weapon:{name:"Arme sans origine",description:"+15 % de dégâts directs et +20 % de posture.",damageBonus:.15,postureBonus:.2},
      last_guardian_mail:{name:"Trône vacant",description:"+25 PV et Garde renforcée.",maxHp:25,guardBonus:.12},
      true_name_seal:{name:"Reconnaissance",description:"+3 énergie et toutes les techniques gagnent 12 % de puissance.",maxEnergy:3,abilityDamage:.12}
    },
    affixes: [
      {id:"force",name:"du Titan",stats:{Force:2}},
      {id:"agility",name:"du Vent",stats:{Agilité:2}},
      {id:"vitality",name:"de la Muraille",stats:{Vitalité:2}},
      {id:"spirit",name:"des Songes",stats:{Esprit:2}},
      {id:"balanced",name:"du Voyageur",stats:{Force:1,Agilité:1,Vitalité:1,Esprit:1}}
    ],
    sets: {
      veil:{name:"Vestiges du Voile",items:["veil_fragment","keeper_hide","well_scepter"],bonuses:{2:{stats:{Esprit:3,Vitalité:3}},3:{maxEnergy:2,stats:{Esprit:4}}}},
      mirror:{name:"Reflets impossibles",items:["mirror_knives","mirror_coat","upward_drop"],bonuses:{2:{stats:{Agilité:4}},3:{stats:{Agilité:3,Esprit:3}}}},
      ash:{name:"Héritage des Cendres",items:["ash_crown","first_flame","forgotten_mail"],bonuses:{2:{stats:{Force:3,Vitalité:3}},3:{maxHp:20,stats:{Force:3}}}}
    },
    runes: [
      {id:"rune_force",name:"Rune de Frappe",icon:"ᚠ",stats:{Force:2},cost:{iron:5,ember:2}},
      {id:"rune_agility",name:"Rune de Célérité",icon:"ᚱ",stats:{Agilité:2},cost:{iron:5,pale_fiber:2}},
      {id:"rune_vitality",name:"Rune de Rempart",icon:"ᛉ",stats:{Vitalité:2},cost:{iron:6,moon_glass:1}},
      {id:"rune_spirit",name:"Rune d'Écho",icon:"ᛟ",stats:{Esprit:2},cost:{ember:3,moon_glass:2}}
    ],
    recipes: [
      {id:"recipe_vein_spear",name:"Schéma de la Lance-veine",item:"vein_spear",cost:{iron:14,pale_fiber:6,moon_glass:2}},
      {id:"recipe_tide_blades",name:"Schéma des Lames célestes",item:"tide_blades",cost:{iron:16,pale_fiber:5,moon_glass:5}},
      {id:"recipe_inverted_robe",name:"Patron de la Robe renversée",item:"inverted_robe",cost:{pale_fiber:8,moon_glass:6,essence:1}},
      {id:"recipe_archive_hammer",name:"Plan du Marteau d'archive",item:"archive_hammer",cost:{iron:20,moon_glass:4,star_fragment:1}}
    ]
  },
  items: [
    {id:"iron_sword",name:"Épée du guetteur",slot:"Arme",rarity:"commun",stats:{Force:2},description:"Une lame entretenue malgré les années."},
    {id:"mist_dagger",name:"Dague des brumes",slot:"Arme",rarity:"commun",stats:{Agilité:2},description:"Son fil semble disparaître dans l'ombre."},
    {id:"ember_staff",name:"Sceptre de braise",slot:"Arme",rarity:"commun",stats:{Esprit:2},description:"Une chaleur faible persiste dans son bois."},
    {id:"split_armor",name:"Cuirasse fendue",slot:"Armure",rarity:"commun",stats:{Vitalité:2},description:"L'impact qui l'a fendue devait être immense."},
    {id:"wanderer_cloak",name:"Cape du vagabond",slot:"Armure",rarity:"commun",stats:{Agilité:1,Vitalité:1},description:"Elle porte la poussière de routes inconnues."},
    {id:"soot_ring",name:"Anneau de suie",slot:"Bijou",rarity:"commun",stats:{Force:1,Esprit:1},description:"La suie revient chaque fois qu'on l'essuie."},
    {id:"bone_axe",name:"Hache d'os noir",slot:"Arme",rarity:"rare",stats:{Force:4},description:"Taillée dans un os qui n'appartenait à aucun animal."},
    {id:"glass_bow",name:"Arc de verre fumé",slot:"Arme",rarity:"rare",stats:{Agilité:4},description:"Sa corde vibre en présence d'un danger."},
    {id:"nameless_tome",name:"Livre sans titre",slot:"Arme",rarity:"rare",stats:{Esprit:4},description:"Toutes ses pages décrivent le lecteur."},
    {id:"penitent_chain",name:"Chaîne du Pénitent",slot:"Arme",rarity:"rare",stats:{Force:2,Esprit:2},description:"Un maillon est encore chaud."},
    {id:"warden_plate",name:"Harnois du gardien",slot:"Armure",rarity:"rare",stats:{Vitalité:4,Force:1},description:"Lourd, austère et presque intact."},
    {id:"nightweave",name:"Tissu de la nuit basse",slot:"Armure",rarity:"rare",stats:{Agilité:3,Esprit:2},description:"Il ne projette aucune ombre."},
    {id:"hollow_crown",name:"Diadème creux",slot:"Bijou",rarity:"rare",stats:{Esprit:3,Vitalité:2},description:"Une voix s'interrompt lorsqu'on le retire."},
    {id:"red_compass",name:"Boussole rouge",slot:"Bijou",rarity:"rare",stats:{Agilité:2,Force:2},description:"Son aiguille indique toujours le prochain combat."},
    {id:"exile_blade",name:"Lame de l'Exilé",slot:"Arme",rarity:"épique",stats:{Force:4,Agilité:2},description:"Le nom de son propriétaire a été retiré du métal."},
    {id:"void_coat",name:"Manteau du Néant",slot:"Armure",rarity:"épique",stats:{Vitalité:3,Esprit:3},description:"La pluie le traverse sans le mouiller."},
    {id:"astrea_eye",name:"Œil d'Astréa",slot:"Bijou",rarity:"épique",stats:{Force:2,Agilité:2,Vitalité:2,Esprit:2},description:"Il se ferme lorsque le héros dort."},
    {id:"last_bow",name:"Arc des derniers jours",slot:"Arme",rarity:"épique",stats:{Force:3,Agilité:5},description:"Chacune de ses flèches porte une date passée."},
    {id:"sunken_bulwark",name:"Rempart englouti",slot:"Armure",rarity:"épique",stats:{Vitalité:6},description:"Une eau noire coule parfois de ses jointures."},
    {id:"silent_bell",name:"Cloche silencieuse",slot:"Bijou",rarity:"épique",stats:{Esprit:5,Agilité:2},description:"On l'entend seulement après une victoire."},
    {id:"ash_crown",name:"Couronne des Cendres",slot:"Bijou",rarity:"légendaire",stats:{Force:4,Agilité:4,Vitalité:4,Esprit:4},description:"Vharos la portait-il, ou l'attendait-elle ?"},
    {id:"first_flame",name:"Éclat de la Première Flamme",slot:"Arme",rarity:"légendaire",stats:{Force:6,Esprit:6},description:"Il brûle sans lumière et ne consume rien."},
    {id:"forgotten_mail",name:"Armure du Royaume oublié",slot:"Armure",rarity:"légendaire",stats:{Vitalité:7,Force:3},description:"Le blason effacé ressemble au vôtre."},
    {id:"road_end",name:"Talisman du Bout de la Route",slot:"Bijou",rarity:"légendaire",stats:{Agilité:5,Esprit:5},description:"Il montre un chemin qui n'existe pas encore."},
    {id:"root_blade",name:"Lame-racine",slot:"Arme",rarity:"rare",region:2,stats:{Force:3,Vitalité:2},description:"Des fibres vivantes entourent une lame minérale."},
    {id:"mirror_knives",name:"Couteaux du reflet tardif",slot:"Arme",rarity:"rare",region:2,stats:{Agilité:5},description:"Le reflet frappe une seconde après la lame."},
    {id:"star_rod",name:"Bâton des étoiles noyées",slot:"Arme",rarity:"épique",region:2,stats:{Esprit:6,Agilité:1},description:"Son extrémité contient un ciel minuscule."},
    {id:"thorn_chain",name:"Chaîne d'épines blanches",slot:"Arme",rarity:"épique",region:2,stats:{Force:4,Esprit:3},description:"Les épines poussent vers celui qui la porte."},
    {id:"bark_plate",name:"Armure d'écorce minérale",slot:"Armure",rarity:"rare",region:2,stats:{Vitalité:5},description:"Elle se referme lentement après chaque impact."},
    {id:"mirror_coat",name:"Manteau des cent reflets",slot:"Armure",rarity:"épique",region:2,stats:{Agilité:4,Vitalité:3},description:"Chaque pli montre une silhouette différente."},
    {id:"astral_shell",name:"Carapace astrale",slot:"Armure",rarity:"légendaire",region:2,stats:{Vitalité:6,Esprit:5},description:"Plus légère qu'une pensée, plus dure qu'un serment."},
    {id:"pale_leaf",name:"Feuille de l'Arbre pâle",slot:"Bijou",rarity:"commun",region:2,stats:{Agilité:1,Esprit:2},description:"Elle ne fane jamais et ne semble pas vivante."},
    {id:"drowned_lens",name:"Lentille de l'observatoire",slot:"Bijou",rarity:"rare",region:2,stats:{Esprit:4,Agilité:2},description:"Elle révèle des constellations sous la peau."},
    {id:"shadow_seed",name:"Graine sans ombre",slot:"Bijou",rarity:"épique",region:2,stats:{Force:2,Vitalité:3,Esprit:3},description:"Elle bat faiblement comme un second cœur."},
    {id:"veil_fragment",name:"Fragment du Voile",slot:"Bijou",rarity:"légendaire",region:2,stats:{Force:3,Agilité:3,Vitalité:3,Esprit:6},description:"Ce n'est pas un objet, mais une déchirure stabilisée."},
    {id:"moonless_edge",name:"Tranchant de la lune absente",slot:"Arme",rarity:"légendaire",region:2,stats:{Force:5,Agilité:5,Esprit:3},description:"La nuit paraît incomplète lorsqu'on le dégaine."},
    {id:"vein_spear",name:"Lance des veines blanches",slot:"Arme",rarity:"rare",region:2,stats:{Force:5,Vitalité:2},description:"Elle pulse lorsqu'un ennemi approche."},
    {id:"tide_blades",name:"Lames de la marée céleste",slot:"Arme",rarity:"épique",region:2,stats:{Agilité:7,Esprit:2},description:"Leur fil suit une lune invisible."},
    {id:"archive_hammer",name:"Marteau de l'Archiviste",slot:"Arme",rarity:"épique",region:2,stats:{Force:7,Esprit:2},description:"Chaque impact efface une ligne d'un livre lointain."},
    {id:"well_scepter",name:"Sceptre du Puits",slot:"Arme",rarity:"légendaire",region:2,stats:{Esprit:8,Vitalité:3},description:"Il est plus profond à l'intérieur qu'à l'extérieur."},
    {id:"silver_bark",name:"Plastron d'écorce argentée",slot:"Armure",rarity:"rare",region:2,stats:{Vitalité:6,Agilité:1},description:"Il pousse lentement autour des blessures."},
    {id:"inverted_robe",name:"Robe de la cité renversée",slot:"Armure",rarity:"épique",region:2,stats:{Esprit:5,Agilité:4},description:"Sa doublure montre des rues suspendues."},
    {id:"keeper_hide",name:"Peau du Gardien stellaire",slot:"Armure",rarity:"légendaire",region:2,stats:{Vitalité:8,Esprit:4},description:"Elle retient encore une partie de sa vigilance."},
    {id:"white_mask",name:"Masque du citoyen blanc",slot:"Bijou",rarity:"commun",region:2,stats:{Esprit:2,Vitalité:1},description:"Il sourit lorsque personne ne le regarde."},
    {id:"archive_key",name:"Clé des archives fermées",slot:"Bijou",rarity:"rare",region:2,stats:{Esprit:4,Force:2},description:"Aucune serrure connue ne lui correspond."},
    {id:"upward_drop",name:"Goutte tombée vers le ciel",slot:"Bijou",rarity:"épique",region:2,stats:{Agilité:4,Esprit:4,Vitalité:2},description:"Elle refuse obstinément de toucher le sol."},
    {id:"first_map",name:"Première carte du monde",slot:"Bijou",rarity:"légendaire",region:2,stats:{Force:3,Agilité:3,Vitalité:3,Esprit:7},description:"Votre route y était tracée avant votre naissance."},
    {id:"broken_halo",name:"Halo brisé",slot:"Bijou",rarity:"légendaire",region:2,stats:{Force:5,Vitalité:5,Esprit:5},description:"Une moitié manque. Vous savez pourtant où elle se trouve."},
    {id:"name_cleaver",name:"Fendoir des noms perdus",slot:"Arme",rarity:"épique",region:2,stats:{Force:8,Vitalité:2},description:"La lame retire quelque chose de plus durable que la chair."},
    {id:"comet_bow",name:"Arc de la comète captive",slot:"Arme",rarity:"légendaire",region:2,stats:{Agilité:9,Esprit:4},description:"Sa corde trace une orbite lumineuse dans l'obscurité."},
    {id:"dead_star_anvil",name:"Masse de l'Étoile morte",slot:"Arme",rarity:"légendaire",region:2,stats:{Force:9,Vitalité:5},description:"Son poids varie avec le ciel."},
    {id:"ascendant_mail",name:"Cotte de la Faille ascendante",slot:"Armure",rarity:"épique",region:2,stats:{Vitalité:7,Agilité:3},description:"Les coups glissent vers le haut comme la pluie de cette terre."},
    {id:"first_sky_robe",name:"Robe du Premier Ciel",slot:"Armure",rarity:"légendaire",region:2,stats:{Esprit:9,Agilité:4},description:"Un firmament antérieur au monde repose dans ses plis."},
    {id:"void_menagerie_hide",name:"Peau de la Ménagerie",slot:"Armure",rarity:"épique",region:2,stats:{Vitalité:8,Force:3},description:"Elle frémit à l'approche des créatures astrales."},
    {id:"erased_name",name:"Nom effacé",slot:"Bijou",rarity:"épique",region:2,stats:{Force:3,Agilité:3,Esprit:5},description:"Porté au cou, ce fragment rend votre présence difficile à retenir."},
    {id:"asterion_eye",name:"Œil d'Asterion",slot:"Bijou",rarity:"légendaire",region:2,stats:{Force:5,Agilité:5,Vitalité:5,Esprit:8},description:"Il contemple une étoile qui n'existe plus."},
    {id:"cycle_blade",name:"Lame du Cycle rompu",slot:"Arme",rarity:"épique",region:4,stats:{Force:8,Agilité:5},description:"Son fil porte les entailles de toutes vos vies précédentes."},
    {id:"oath_armor",name:"Armure du Premier Serment",slot:"Armure",rarity:"épique",region:4,stats:{Vitalité:9,Esprit:4},description:"Elle se souvient de la promesse que le héros a oubliée."},
    {id:"memory_knot",name:"Nœud de mémoire",slot:"Bijou",rarity:"épique",region:4,stats:{Agilité:4,Vitalité:4,Esprit:6},description:"Trois voix familières y retiennent un nom incomplet."},
    {id:"unwritten_weapon",name:"Arme qui ne fut jamais forgée",slot:"Arme",rarity:"légendaire",region:4,stats:{Force:8,Agilité:8,Esprit:5},description:"Le monde ne possède aucun souvenir de sa création."},
    {id:"last_guardian_mail",name:"Harnois du Dernier Gardien",slot:"Armure",rarity:"légendaire",region:4,stats:{Vitalité:11,Force:5,Esprit:5},description:"Sa surface reflète un trône vide et une route ouverte."},
    {id:"true_name_seal",name:"Sceau du Nom véritable",slot:"Bijou",rarity:"légendaire",region:4,stats:{Force:6,Agilité:6,Vitalité:6,Esprit:10},description:"Le porter donne l'impression d'avoir enfin été reconnu."}
  ],
  resources: [
    {id:"iron",name:"Fer ancien",icon:"⬢",description:"Métal récupéré dans les ruines. Base de toute amélioration."},
    {id:"ember",name:"Braise stable",icon:"◆",description:"Fragment de chaleur utilisé pour les améliorations rares."},
    {id:"essence",name:"Essence du Néant",icon:"✦",description:"Matière impossible requise par les objets les plus puissants."},
    {id:"pale_fiber",name:"Fibre pâle",icon:"⌁",region:2,description:"Fil vivant récolté sur les arbres aux veines blanches."},
    {id:"moon_glass",name:"Verre lunaire",icon:"◇",region:2,description:"Cristal tiré des miroirs de la seconde région."},
    {id:"star_fragment",name:"Fragment stellaire",icon:"✧",region:2,description:"Éclat d'une étoile trouvée sous terre."}
  ],
  enemies: [
    {id:"ash_scout",name:"Rôdeur des Cendres",icon:"♞",hp:58,damage:9,xp:55,gold:12,tags:["humanoïde"]},
    {id:"char_hound",name:"Molosse calciné",icon:"♣",hp:42,damage:11,xp:45,gold:9,tags:["bête"]},
    {id:"veiled_cultist",name:"Adepte voilé",icon:"♝",hp:50,damage:10,xp:50,gold:11,tags:["humanoïde","mystique"]},
    {id:"ruin_brute",name:"Brute des ruines",icon:"♜",hp:75,damage:13,xp:70,gold:16,tags:["humanoïde"]},
    {id:"profane_warden",name:"Gardien profané",icon:"♛",hp:105,damage:16,xp:100,gold:28,tags:["élite"]},
    {id:"pale_widow",name:"Veuve pâle",icon:"✣",hp:48,damage:14,xp:62,gold:13,tags:["bête"]},
    {id:"grave_singer",name:"Chante-tombe",icon:"♪",hp:62,damage:12,xp:68,gold:17,tags:["mystique","soigneur"]},
    {id:"iron_remnant",name:"Vestige de fer",icon:"♟",hp:92,damage:12,xp:80,gold:21,tags:["armure"]},
    {id:"cinder_thief",name:"Voleur de braises",icon:"♦",hp:55,damage:15,xp:66,gold:24,tags:["humanoïde"]},
    {id:"faceless",name:"Sans-Visage",icon:"◉",hp:70,damage:14,xp:82,gold:19,tags:["mystique"]},
    {id:"abyss_knight",name:"Chevalier de l'Abîme",icon:"♠",hp:125,damage:18,xp:125,gold:35,tags:["élite","armure"]},
    {id:"ash_oracle",name:"Oracle des Cendres",icon:"☿",hp:88,damage:19,xp:118,gold:32,tags:["élite","mystique","soutien"]},
    {id:"chain_giant",name:"Géant aux chaînes",icon:"♖",hp:155,damage:21,xp:145,gold:40,tags:["élite","colosse"]},
    {id:"nameless_echo",name:"Écho sans nom",icon:"◌",hp:110,damage:22,xp:138,gold:38,tags:["élite","mystique"]},
    {id:"cinder_colossus",name:"Colosse errant des Cendres",icon:"♔",hp:185,damage:20,xp:185,gold:58,tags:["boss","errant"],boss:true},
    {id:"vharos",name:"Vharos, Seigneur des Cendres",icon:"♚",hp:230,damage:17,xp:260,gold:90,tags:["boss"],boss:true},
    {id:"ash_banneret",name:"Banneret des Cendres",icon:"⚑",hp:130,damage:19,xp:135,gold:36,region:1,tags:["humanoïde","soutien"]},
    {id:"vharos_unbound",name:"Vharos, Délié du Trône",icon:"♚",hp:420,damage:24,xp:450,gold:145,region:1,tags:["boss","mystique"],boss:true},
    {id:"root_stalker",name:"Traque-racine",icon:"♣",hp:105,damage:18,xp:110,gold:27,region:2,tags:["bête","végétal"]},
    {id:"mirror_wraith",name:"Spectre du miroir",icon:"◈",hp:92,damage:21,xp:118,gold:30,region:2,tags:["mystique"]},
    {id:"star_leech",name:"Sangsue astrale",icon:"✦",hp:78,damage:23,xp:105,gold:26,region:2,tags:["bête","astral"]},
    {id:"hollow_pilgrim",name:"Pèlerin creux",icon:"♙",hp:125,damage:19,xp:128,gold:34,region:2,tags:["humanoïde"]},
    {id:"glass_sentinel",name:"Sentinelle de verre",icon:"♜",hp:155,damage:22,xp:155,gold:42,region:2,tags:["élite","armure","protecteur"]},
    {id:"shadowless",name:"Habitant sans ombre",icon:"●",hp:115,damage:24,xp:142,gold:36,region:2,tags:["humanoïde","mystique"]},
    {id:"archive_moth",name:"Phalène des archives",icon:"✤",hp:95,damage:22,xp:125,gold:29,region:2,tags:["bête","mystique"]},
    {id:"inverted_guard",name:"Garde renversé",icon:"♝",hp:145,damage:24,xp:152,gold:39,region:2,tags:["humanoïde","armure"]},
    {id:"moon_mimic",name:"Imitateur lunaire",icon:"◑",hp:120,damage:26,xp:148,gold:37,region:2,tags:["mystique"]},
    {id:"vein_harvester",name:"Moissonneur de veines",icon:"♤",hp:165,damage:25,xp:170,gold:44,region:2,tags:["élite","végétal"]},
    {id:"starved_astronomer",name:"Astronome affamé",icon:"☽",hp:135,damage:28,xp:178,gold:46,region:2,tags:["élite","astral","invocateur"]},
    {id:"white_magistrate",name:"Magistrat blanc",icon:"♕",hp:190,damage:27,xp:205,gold:55,region:2,tags:["élite","humanoïde","soutien"]},
    {id:"name_eater",name:"Dévoreur de noms",icon:"☍",hp:175,damage:29,xp:195,gold:49,region:2,tags:["mystique"]},
    {id:"sky_grave",name:"Tombe céleste",icon:"✥",hp:215,damage:27,xp:220,gold:58,region:2,tags:["armure","astral"]},
    {id:"void_beast",name:"Bête de la Ménagerie",icon:"♧",hp:245,damage:31,xp:250,gold:65,region:2,tags:["élite","bête"]},
    {id:"star_smith",name:"Forgeron de l'Étoile morte",icon:"⚒",hp:230,damage:30,xp:245,gold:70,region:2,tags:["élite","humanoïde"]},
    {id:"world_eye",name:"Œil sous le monde",icon:"◉",hp:285,damage:33,xp:310,gold:85,region:2,tags:["élite","astral"]},
    {id:"veil_keeper",name:"Asterion, Gardien du Puits",icon:"♛",hp:520,damage:28,xp:650,gold:220,region:2,tags:["boss","astral"],boss:true},
    {id:"lunar_monk",name:"Moine de la Lune morte",icon:"☾",hp:250,damage:32,xp:270,gold:72,region:2,tags:["humanoïde","soigneur"]},
    {id:"asterion_eclipsed",name:"Asterion, Cœur de l'Éclipse",icon:"✦",hp:760,damage:36,xp:900,gold:300,region:2,tags:["boss","astral","mystique"],boss:true},
    {id:"buried_legionary",name:"Légionnaire enseveli",icon:"♜",hp:210,damage:30,xp:210,gold:52,region:3,tags:["humanoïde","armure","protecteur"]},
    {id:"crown_wisp",name:"Feu follet couronné",icon:"♨",hp:135,damage:36,xp:195,gold:48,region:3,tags:["mystique","soigneur"]},
    {id:"memory_gaoler",name:"Geôlier des souvenirs",icon:"♝",hp:235,damage:34,xp:235,gold:61,region:3,tags:["humanoïde","soutien"]},
    {id:"soot_seraph",name:"Séraphin de suie",icon:"✥",hp:190,damage:39,xp:245,gold:66,region:3,tags:["astral","invocateur"]},
    {id:"hollow_king",name:"Roi évidé",icon:"♚",hp:310,damage:38,xp:315,gold:88,region:3,tags:["élite","armure","soutien"]},
    {id:"first_flame_beast",name:"Bête de la Première Flamme",icon:"♧",hp:340,damage:42,xp:340,gold:94,region:3,tags:["élite","bête"]},
    {id:"mask_archon",name:"Archonte au masque vide",icon:"◐",hp:275,damage:43,xp:330,gold:91,region:3,tags:["élite","mystique","soigneur"]},
    {id:"ash_prince",name:"Prince sous la Cendre",icon:"♛",hp:460,damage:41,xp:480,gold:130,region:3,tags:["boss","humanoïde"],boss:true},
    {id:"ash_master_manifestation",name:"Manifestation du Maître des Cendres",icon:"☗",hp:820,damage:44,xp:1100,gold:360,region:3,tags:["boss","astral","invocateur"],boss:true},
    {id:"royal_memory",name:"Mémoire royale",icon:"♜",hp:360,damage:45,xp:420,gold:115,region:3,tags:["mystique","protecteur"]},
    {id:"crowned_manifestation",name:"Manifestation couronnée",icon:"☗",hp:1080,damage:49,xp:1450,gold:470,region:3,tags:["boss","astral","invocateur"],boss:true},
    {id:"cycle_hound",name:"Molosse du Cycle",icon:"♣",hp:285,damage:45,xp:310,gold:76,region:4,tags:["bête","mystique"]},
    {id:"ash_scribe",name:"Scribe de la Fin",icon:"▤",hp:245,damage:48,xp:325,gold:82,region:4,tags:["mystique","soutien"]},
    {id:"oath_keeper",name:"Gardien du Premier Serment",icon:"♜",hp:390,damage:44,xp:370,gold:94,region:4,tags:["armure","protecteur"]},
    {id:"nameless_twin",name:"Votre Jumeau sans nom",icon:"♙",hp:330,damage:51,xp:390,gold:102,region:4,tags:["humanoïde","mystique"]},
    {id:"first_witness",name:"Premier Témoin",icon:"◉",hp:470,damage:52,xp:510,gold:140,region:4,tags:["élite","astral","invocateur"]},
    {id:"crown_eater",name:"Dévoreur de Couronnes",icon:"♛",hp:520,damage:54,xp:540,gold:150,region:4,tags:["élite","armure","soutien"]},
    {id:"ash_master_true",name:"Le Maître des Cendres",icon:"☗",hp:1350,damage:52,xp:1800,gold:600,region:4,tags:["boss","astral","mystique","invocateur"],boss:true}
  ],
  abilities: {
    bastion: [
      {id:"b_shield_bash",name:"Heurt de bouclier",cost:2,power:12,scaling:"Force",ratio:1.0,description:"Un coup fiable qui ébranle la cible."},
      {id:"b_rampart",name:"Frappe du rempart",cost:3,power:18,scaling:"Vitalité",ratio:0.9,description:"Convertit la robustesse en dégâts."},
      {id:"b_retribution",name:"Rétribution",cost:3,power:22,scaling:"Force",ratio:1.1,description:"Plus puissante après avoir utilisé Garde."},
      {id:"b_iron_wave",name:"Vague de fer",cost:4,power:15,scaling:"Vitalité",ratio:0.7,targets:"all",description:"Frappe tous les adversaires."},
      {id:"b_breaker",name:"Brise-armure",cost:4,power:28,scaling:"Force",ratio:1.2,description:"Une attaque lourde contre une cible."},
      {id:"b_last_stand",name:"Dernier rempart",cost:5,power:34,scaling:"Vitalité",ratio:1.0,description:"Gagne en force sous la moitié des PV."},
      {id:"b_quake",name:"Séisme du bastion",cost:6,power:25,scaling:"Force",ratio:1.0,targets:"all",description:"Écrase tous les ennemis sous l'acier."},
      {id:"b_oath",name:"Serment immuable",cost:7,power:52,scaling:"Vitalité",ratio:1.3,description:"L'ultime technique des anciens gardiens."},
      {id:"b_worldwall",name:"Mur entre les mondes",cost:8,power:65,scaling:"Vitalité",ratio:1.5,region:2,description:"Une défense capable de repousser ce qui traverse le Voile."}
    ],
    traqueuse: [
      {id:"t_quick_cut",name:"Taille rapide",cost:2,power:13,scaling:"Agilité",ratio:1.0,description:"Une attaque vive et précise."},
      {id:"t_twin",name:"Entaille jumelle",cost:3,power:19,scaling:"Agilité",ratio:1.1,description:"Deux frappes dans un même souffle."},
      {id:"t_mark",name:"Marque de proie",cost:3,power:24,scaling:"Agilité",ratio:1.0,description:"Une frappe qui cherche le point faible."},
      {id:"t_fan",name:"Éventail de lames",cost:4,power:14,scaling:"Agilité",ratio:0.8,targets:"all",description:"Atteint tous les ennemis."},
      {id:"t_ambush",name:"Embuscade",cost:4,power:32,scaling:"Agilité",ratio:1.2,description:"Terrible contre une cible encore intacte."},
      {id:"t_bloodtrail",name:"Piste sanglante",cost:5,power:37,scaling:"Force",ratio:1.1,description:"La Traqueuse ne lâche plus sa proie."},
      {id:"t_storm",name:"Tempête de couteaux",cost:6,power:25,scaling:"Agilité",ratio:1.0,targets:"all",description:"Une pluie de métal sur le groupe adverse."},
      {id:"t_execution",name:"Dernière trace",cost:7,power:58,scaling:"Agilité",ratio:1.4,description:"Une exécution presque impossible à voir."},
      {id:"t_reflection",name:"Meurtre du reflet",cost:8,power:70,scaling:"Agilité",ratio:1.6,region:2,description:"La cible tombe avant que la vraie lame ne la touche."}
    ],
    arcaniste: [
      {id:"a_spark",name:"Étincelle grise",cost:2,power:14,scaling:"Esprit",ratio:1.0,description:"Une décharge élémentaire stable."},
      {id:"a_ember",name:"Trait de braise",cost:3,power:21,scaling:"Esprit",ratio:1.1,description:"Un trait de feu ancien."},
      {id:"a_sigil",name:"Sceau fracturé",cost:3,power:25,scaling:"Esprit",ratio:1.2,description:"Réveille un signe interdit."},
      {id:"a_rain",name:"Pluie d'escarbilles",cost:4,power:16,scaling:"Esprit",ratio:0.9,targets:"all",description:"Brûle tous les adversaires."},
      {id:"a_void",name:"Éclat du vide",cost:5,power:38,scaling:"Esprit",ratio:1.3,description:"Une absence projetée sous forme de lame."},
      {id:"a_memory",name:"Mémoire consumée",cost:5,power:42,scaling:"Esprit",ratio:1.3,description:"Sacrifie un souvenir qui n'a jamais existé."},
      {id:"a_collapse",name:"Effondrement astral",cost:6,power:29,scaling:"Esprit",ratio:1.1,targets:"all",description:"Le ciel tombe sur tous les ennemis."},
      {id:"a_nameless",name:"Le Mot sans nom",cost:8,power:64,scaling:"Esprit",ratio:1.5,description:"Un sort dont le nom s'efface après usage."},
      {id:"a_veil",name:"Déchirure du Voile",cost:9,power:76,scaling:"Esprit",ratio:1.7,region:2,description:"Ouvre une blessure très brève dans le réel."}
    ],
    penitent: [
      {id:"p_chain",name:"Coup de chaîne",cost:2,power:15,scaling:"Force",ratio:1.0,description:"La chaîne brisée devient une arme."},
      {id:"p_mark",name:"Marque du condamné",cost:3,power:22,scaling:"Esprit",ratio:1.0,hpCost:0.06,description:"Consume des PV pour accroître les dégâts."},
      {id:"p_confession",name:"Confession sanglante",cost:3,power:28,scaling:"Force",ratio:1.0,hpCost:0.08,description:"Une vérité offerte contre du sang."},
      {id:"p_scourge",name:"Fléau des anonymes",cost:4,power:17,scaling:"Esprit",ratio:0.8,targets:"all",hpCost:0.05,description:"Marque tous les adversaires."},
      {id:"p_debt",name:"Dette ancienne",cost:4,power:35,scaling:"Vitalité",ratio:0.8,hpCost:0.1,description:"La douleur passée revient frapper."},
      {id:"p_absolution",name:"Fausse absolution",cost:5,power:40,scaling:"Esprit",ratio:1.2,description:"Une lumière qui ne pardonne rien."},
      {id:"p_procession",name:"Procession des chaînes",cost:6,power:27,scaling:"Force",ratio:1.0,targets:"all",hpCost:0.08,description:"Les chaînes balayent le champ de bataille."},
      {id:"p_true_name",name:"Nom véritable",cost:7,power:62,scaling:"Esprit",ratio:1.4,hpCost:0.15,description:"Prononce une syllabe du nom oublié."},
      {id:"p_first_sin",name:"Le Premier Péché",cost:8,power:82,scaling:"Esprit",ratio:1.5,hpCost:0.18,region:2,description:"Une faute plus ancienne que le monde connu."}
    ]
  },
  passives: {
    bastion: [
      {id:"bp_1",name:"Peau de fer",description:"+2 Vitalité.",stats:{Vitalité:2}},
      {id:"bp_2",name:"Poigne ferme",description:"+2 Force.",stats:{Force:2}},
      {id:"bp_3",name:"Mur ancien",description:"+10 PV maximum.",maxHp:10},
      {id:"bp_4",name:"Garde parfaite",description:"La Garde réduit davantage les dégâts.",guardBonus:.15},
      {id:"bp_5",name:"Armure vivante",description:"+3 Vitalité.",stats:{Vitalité:3}},
      {id:"bp_6",name:"Contrepoids",description:"+1 Force et +1 Agilité.",stats:{Force:1,Agilité:1}},
      {id:"bp_7",name:"Inébranlable",description:"+15 PV maximum.",maxHp:15},
      {id:"bp_8",name:"Forteresse",description:"+3 Force et +3 Vitalité.",stats:{Force:3,Vitalité:3}},
      {id:"bp_9",name:"Gardien du seuil",description:"+4 Vitalité et +20 PV maximum.",stats:{Vitalité:4},maxHp:20,region:2}
    ],
    traqueuse: [
      {id:"tp_1",name:"Pas léger",description:"+2 Agilité.",stats:{Agilité:2}},
      {id:"tp_2",name:"Œil du chasseur",description:"+1 Force et +1 Agilité.",stats:{Force:1,Agilité:1}},
      {id:"tp_3",name:"Souffle mesuré",description:"+1 énergie maximum.",maxEnergy:1},
      {id:"tp_4",name:"Goût du sang",description:"+3 Agilité.",stats:{Agilité:3}},
      {id:"tp_5",name:"Survie sauvage",description:"+10 PV maximum.",maxHp:10},
      {id:"tp_6",name:"Main sûre",description:"+2 Force.",stats:{Force:2}},
      {id:"tp_7",name:"Ombre vive",description:"+2 Agilité et +1 Esprit.",stats:{Agilité:2,Esprit:1}},
      {id:"tp_8",name:"Prédatrice parfaite",description:"+4 Agilité.",stats:{Agilité:4}},
      {id:"tp_9",name:"Chasseuse de reflets",description:"+5 Agilité et +1 énergie.",stats:{Agilité:5},maxEnergy:1,region:2}
    ],
    arcaniste: [
      {id:"ap_1",name:"Esprit ouvert",description:"+2 Esprit.",stats:{Esprit:2}},
      {id:"ap_2",name:"Réserve occulte",description:"+2 énergie maximum.",maxEnergy:2},
      {id:"ap_3",name:"Signes protecteurs",description:"+1 Vitalité et +1 Esprit.",stats:{Vitalité:1,Esprit:1}},
      {id:"ap_4",name:"Braise intérieure",description:"+3 Esprit.",stats:{Esprit:3}},
      {id:"ap_5",name:"Corps conducteur",description:"+10 PV maximum.",maxHp:10},
      {id:"ap_6",name:"Économie runique",description:"+2 énergie maximum.",maxEnergy:2},
      {id:"ap_7",name:"Savoir défendu",description:"+2 Esprit et +1 Agilité.",stats:{Esprit:2,Agilité:1}},
      {id:"ap_8",name:"Conscience astrale",description:"+4 Esprit.",stats:{Esprit:4}},
      {id:"ap_9",name:"Au-delà du Voile",description:"+5 Esprit et +2 énergie.",stats:{Esprit:5},maxEnergy:2,region:2}
    ],
    penitent: [
      {id:"pp_1",name:"Douleur familière",description:"+1 Force et +1 Vitalité.",stats:{Force:1,Vitalité:1}},
      {id:"pp_2",name:"Chaîne intérieure",description:"+2 Esprit.",stats:{Esprit:2}},
      {id:"pp_3",name:"Refus de mourir",description:"+12 PV maximum.",maxHp:12},
      {id:"pp_4",name:"Péché utile",description:"+2 Force et +1 Esprit.",stats:{Force:2,Esprit:1}},
      {id:"pp_5",name:"Sang ancien",description:"+2 Vitalité.",stats:{Vitalité:2}},
      {id:"pp_6",name:"Mémoire du corps",description:"+1 dans tous les attributs.",stats:{Force:1,Agilité:1,Vitalité:1,Esprit:1}},
      {id:"pp_7",name:"Martyre",description:"+18 PV maximum.",maxHp:18},
      {id:"pp_8",name:"Dernière pénitence",description:"+3 Force et +3 Esprit.",stats:{Force:3,Esprit:3}},
      {id:"pp_9",name:"Faute originelle",description:"+3 Force, +3 Esprit et +15 PV.",stats:{Force:3,Esprit:3},maxHp:15,region:2}
    ]
  }
};
