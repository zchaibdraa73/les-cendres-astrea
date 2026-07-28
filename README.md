# Les Cendres d'Astréa

Prototype d'un RPG solo roguelite au tour par tour.

## Lancer le jeu

Exécuter `npm ci`, puis `npm run dev`. Vite affiche l'adresse locale à ouvrir
dans un navigateur moderne. Pour vérifier la version distribuable, utiliser
`npm run build`, puis `npm run preview`.

## Développement

Le projet utilise Node.js `24.18.x` et npm `11.16.x`. Les versions attendues sont
déclarées dans `package.json` et `.nvmrc`. Après récupération du projet, exécuter
`npm ci`, puis `npm run check` pour reproduire exactement l'environnement validé.
La commande complète contrôle la syntaxe, ESLint, TypeScript, les tests unitaires,
l'audit d'équilibrage, le build Vite de production et cinq parcours réels dans
Chromium avec Playwright.

Les commandes `npm run test:e2e` et `npm run test:e2e:headed` permettent de
relancer séparément les tests navigateur, en arrière-plan ou avec une fenêtre
visible. Les polices Cinzel et Inter sont embarquées afin que le jeu et ses tests
fonctionnent entièrement hors ligne.

Les données chargées à l'exécution sont protégées par des schémas Zod centralisés
dans `src/validation/game-schemas.mjs`. Ils contrôlent le contenu, les cartes, les
options, la méta-progression, les sauvegardes et les archives importées.

## Intégration continue

Le workflow `.github/workflows/quality.yml` exécute `npm run ci` à chaque
pull request et à chaque envoi vers une branche principale. Il installe les
dépendances verrouillées sans script automatique, contrôle leurs vulnérabilités,
lance toute la recette et publie le build web validé.

En cas d'échec navigateur, le rapport, les captures, les vidéos et les traces
Playwright sont conservés comme artefacts GitHub. Dependabot vérifie chaque
semaine les paquets npm et les actions GitHub. La procédure de signalement est
décrite dans `SECURITY.md`.

## Contenu actuel — v3.0 RC1

- Menu principal
- Écran de choix de classe
- Quatre classes avec attributs, rôle et talent unique
- Navigation souris et clavier
- Prologue narratif en cinq tableaux, avec navigation et option pour le passer
- Univers mystérieux autour du héros anonyme et du Maître des Cendres
- Quatre classes aux histoires et styles de jeu détaillés
- Nouvelle classe : le Pénitent, fondée sur le sacrifice et la polyvalence
- Catalogue externe `data.js` séparant le contenu de la logique
- 56 équipements répartis en quatre raretés
- 34 familles d'ennemis
- 9 attaques et 9 passifs propres à chacune des quatre classes
- Progression complète jusqu'au niveau 30 pour chaque classe
- Attaques et passifs triés par niveau d'apprentissage et débloqués automatiquement
- Arsenal limité à quatre attaques équipées, modifiable hors combat
- Génération déterministe par graine propre à chaque sauvegarde
- Rencontres et butins différents d'une nouvelle partie à l'autre
- Description détaillée du rôle de Force, Agilité, Vitalité et Esprit
- Choix d'une récompense parmi trois après chaque victoire
- Tirages composés d'attaques, passifs, équipements, améliorations ou ressources
- Trois rangs par attaque : +25 % de puissance par rang et coût réduit au rang 3
- Qualité supérieure des choix après les élites et le boss
- Possibilité de refuser le tirage contre des éclats
- Trois nouvelles étapes obligatoires : Cendrebourg, Mine de scories et Arsenal brisé
- Forge permettant d'améliorer chaque équipement du niveau 1 au niveau 5
- Raretés visuelles : blanc commun, vert rare, violet légendaire et rouge artéfact
- Six matériaux, dont Fibre pâle, Verre de lune et Fragment stellaire
- Vente d'équipement à la forge
- Événements de revisite avec combats, boss errants, ressources, repos ou absence d'événement
- Tables de revisite plus dangereuses et lucratives dans les zones optionnelles
- Première région étendue à 22 lieux principaux et 10 détours, avec destinations cachées
- Trois nouvelles étapes obligatoires avant le boss
- Quatre embranchements optionnels avec rencontres élites
- Difficulté et équipement rare croissants sur les détours
- Trois zones abyssales accessibles derrière les premiers détours
- Combats extrêmes à trois adversaires avec modificateurs de danger
- Récompense artéfact garantie dans les zones abyssales
- HUD enrichi : matériaux, légende, intention ennemie et difficulté active
- Transition vers une deuxième région après le parcours principal et Vharos
- Diaporama intermédiaire de sept pages
- Deuxième carte étendue à 20 lieux principaux et 10 détours
- Boss final Asterion doté de trois phases, d'un drain d'énergie et d'une attaque d'extinction
- Système de défaite avec repli au dernier lieu sûr et pénalité mesurée
- Niveaux ennemis adaptatifs et niveau conseillé affiché sur la carte
- Interface de combat tactique : cible détaillée, estimations, énergie, armure et critique
- Menu du personnage unifié avec navigation entre héros, inventaire et pouvoirs
- Comparaison directe des équipements et arsenal visuel à quatre emplacements
- Combat tactique avec Brûlure, Saignement, Faiblesse, Armure brisée et Marqué
- Barrière, Régénération et Furie pour construire des synergies défensives ou offensives
- Intentions ennemies par rôle : attaque lourde, lacération, malédiction et fortification
- Trois difficultés, quatre serments d'expédition et graines partageables
- Sanctuaire permanent transformé en hameau évolutif avec quatre bâtiments sur trois niveaux
- Forgeronne, archiviste, alchimiste et cartographe dont les dialogues changent après les expéditions
- Préparatif de départ horizontal au choix, renforcé par la restauration sans devenir obligatoire
- Collections permanentes, trophées de boss, galerie des fins et fragments de mémoire
- Braises d'héritage et quatre reliques fondatrices conservées pour les futures expéditions
- Bilan d'expédition : durée, dégâts, boss, détours et récompense permanente
- Deux spécialisations de classe au niveau 10, prolongées par une voie avancée au niveau 20
- Évolution alternative des attaques : Puissance ou Maîtrise
- Six passifs équipables parmi les neuf appris
- Affixes aléatoires et trois ensembles d'équipement à bonus progressifs
- Démantèlement de l'équipement à la forge contre des matériaux
- Plafonds d'amélioration par rareté : niveaux 3, 5, 7 et 10
- Réenchantement des affixes et sertissage de quatre types de runes
- Recettes rares découvertes dans les détours et fabrication dédiée
- Marchand déterministe lié à la graine et protection de butin contre les doublons inutiles
- Journal du monde regroupant fragments de lore, bestiaire et collection d'objets
- Ambiance sonore générée et effets distincts pour attaques, sorts, impacts et récompenses
- Paysage sonore dynamique propre au menu, au Sanctuaire, aux quatre régions et aux boss
- Mixeur séparé pour le volume général, la musique et les effets sonores
- Indications sonores visuelles optionnelles pour les joueurs jouant sans audio
- Animations de combat, transitions et retours visuels renforcés
- Impacts directionnels, alerte de PV critiques et transitions de phase de boss
- Journal tactique déroulant conservant les dix dernières actions du combat
- Vitesse de combat réglable et secousses d'écran désactivables
- Copie de secours automatique avant chaque écrasement de sauvegarde
- Réparation automatique d'un emplacement principal depuis sa dernière copie valide
- Export et import d'une archive JSON regroupant parties, Sanctuaire et options
- Audit de release automatisé pour les cartes, catalogues, classes, ennemis, équipement et économie
- Options persistantes : volume, sourdine, texte, contraste et réduction des animations
- Événements narratifs à choix multiples avec conditions de classe, statistiques et décisions antérieures
- Réputation persistante auprès de trois factions, objets de quête séparés et conséquences différées
- Historique des décisions intégré au journal du monde
- Ennemis spécialisés capables de soigner, protéger, renforcer ou invoquer des alliés
- Lignes avant/arrière, jauges de posture et rupture exposant temporairement les adversaires
- Résistances et faiblesses physiques, feu et saignement affichées pendant le combat
- Phases de boss réactives aux actions et récompenses de maîtrise conditionnelles
- Troisième région complète et prolongée : le Royaume sous la Cendre
- Vingt lieux principaux, onze détours et trois refuges dans le troisième chapitre
- Quinze adversaires régionaux, dont de nouvelles élites, deux manifestations et un boss final renforcé
- Diaporama de sept tableaux et conclusion jouable du premier acte
- Trois compagnons recrutés progressivement, avec un seul allié actif à la fois
- Capacités automatiques de protection, soin ou assaut et synergies propres aux quatre classes
- Confiance gagnée en combat et influencée par certaines décisions narratives
- Emplacement d'équipement dédié pour chaque compagnon
- Cinq scènes relationnelles par compagnon, déclenchées aux paliers 5, 10, 15, 20 et 25
- Dialogues à choix avec loyauté, récompense immédiate et risque de départ définitif
- Quêtes personnelles dans les détours, conclues par une capacité évoluée 20 % plus puissante
- Douze contrats secondaires répartis sur les trois régions
- Trois offres déterministes par région, renouvelées selon la graine de l'expédition
- Objectifs de chasse, détours, élites, boss et victoires sans potion
- Suivi d'un contrat actif et récompenses en expérience, équipement, ressources ou éclats
- Némésis unique générée à partir de la graine de chaque expédition
- Apparitions lors des revisites ou chasse volontaire depuis son tableau dédié
- Quatre rangs d'évolution et six mutations modifiant PV, dégâts, Barrière ou résistances
- Évolution de la Némésis lorsqu'elle terrasse le héros et prime spéciale lorsqu'elle est vaincue
- Campements stratégiques remplaçant les soins automatiques des cases de repos
- Cinq actions de camp : repos, aiguisage, cercle de garde, alchimie ou conversation
- Préparations consommées au prochain combat : Furie de 15 % ou Barrière de 20 % des PV
- Conversations de camp uniques par compagnon et par région, avec confiance et loyauté
- Historique des haltes et indicateur de préparation dans le HUD
- Quatrième et dernier chapitre : le Brasier Originel
- Dix lieux principaux et quatre fins oubliées à explorer dans le chapitre final
- Sept nouveaux adversaires de fin de campagne et six équipements associés
- Véritable confrontation contre le Maître des Cendres en trois phases
- Mécaniques finales de Serment, perte d'énergie, Barrière et forme originelle
- Quatre conclusions : Gardien, Souverain, Route libre et Nom retrouvé
- Fin secrète conditionnée par la confiance et les quêtes des compagnons
- Épilogues variables pour Ilyra, Orven et Nox selon la conclusion, leur confiance et leur quête
- Conclusions découvertes enregistrées dans la progression permanente
- Reprise sécurisée du choix final ou de l'épilogue après rechargement
- Dix succès globaux et défis de maîtrise, dont un objectif propre à chaque classe
- Mode quotidien utilisant une graine commune dérivée de la date
- Dix niveaux d'Ascension à débloquer progressivement
- Classement local conservant les dix meilleures expéditions
- Trois emplacements de sauvegarde avec migration automatique de l'ancienne partie
- Mode plein écran, choix ZQSD/WASD et prise en charge basique de la manette
- Écran de crédits, version de démonstration et gestion visible des erreurs inattendues
- Tutoriel de combat étendu à l'attaque, la garde, le pouvoir et la potion
- Huit guides contextuels mémorisés et glossaire consultable à tout moment
- Terrain d'entraînement sans consommation permanente ni récompense
- Ressources de combat propres aux classes : Résolution, Combo, Surcharge et Dette de sang
- Coûts, critiques et dégâts dynamiques adaptés à la ressource active
- Combats avancés en plusieurs vagues avec renforts annoncés et récupération partielle entre les assauts
- Huit dangers de champ de bataille, deux par région, déclenchés selon une cadence lisible
- Six mutations d'élite : Cuirassés, Frénétiques, Voilés, Inébranlables, Instables et Sangsues
- Mutations et règles régionales affichées directement dans l'interface de combat
- Récompenses d'expérience et d'éclats augmentées selon le nombre de vagues
- Bilan d'expédition enrichi avec les vagues surmontées et dangers traversés
- Neuf maîtrises par classe réparties en trois branches, avec six points gagnés jusqu'au niveau 30
- Transformations de techniques propres à chaque classe : Fracas/Égide, Prédation/Danse, Combustion/Flux et Sacrifice/Pardon
- Effets uniques pour les dix-huit artéfacts, désormais capables de modifier ressources, techniques, posture ou survie
- Trois présélections enregistrant simultanément équipement, techniques, passifs et transformations
- Réinitialisation complète du build contre un Fragment stellaire
- Détail transparent du calcul de dégâts pour chaque technique

## Tests

Exécuter `npm test` pour lancer les tests unitaires avec le moteur de test natif de Node.js.
La commande `npm run check` vérifie également la syntaxe de tous les scripts.
- Nouvelle direction artistique « Au-delà du Voile »
- Douze équipements, sept ennemis et un boss propres à la deuxième région
- Une attaque et un passif régionaux supplémentaires par classe
- Route aléatoire persistante : butin, sanctuaire, repos ou rencontre hostile
- Combat tutoriel scripté : attaque, garde, compétence et potion
- Combats aléatoires et affrontement contre deux adversaires
- Ciblage des ennemis par leur personnage ou leur barre de vie
- Boss final avec seconde phase sous 50 % de vie
- Gain d'expérience et passages de niveau multiples
- Croissance propre à chaque classe : attributs, PV, énergie et dégâts
- Profil détaillé, ressources, statistiques et progression
- Inventaire avec équipement interchangeable et bonus réellement appliqués
- Comparaison de puissance avant de changer d'équipement
- Les bonus portés modifient attributs, dégâts, PV et énergie
- Menu pause, sauvegarde locale et reprise de partie
- Interface responsive

## Organisation du contenu

- `data.js` : catalogue déclaratif des objets, ennemis, attaques, builds et artisanat.
- `engine.js` : formules pures de progression, combat, économie et butin.
- `state-system.js` : sérialisation sûre et migrations versionnées des sauvegardes.
- `map-system.js` : génération déterministe et validation des graphes de cartes.
- `balance-system.js` : simulations des quatre classes aux niveaux clés.
- `release-audit.js` : seuils de validation de la release, du contenu et de l'économie.
- `validation-system.js` : contrôle des identifiants et références croisées.
- `main.js` : point d'entrée unique conservant l'ordre d'initialisation des systèmes.
- `vite.config.mjs` : serveur local et build de production.
- `eslint.config.mjs` et `tsconfig.json` : analyse statique progressive.
- `src/content/` : classes, graphes des cartes, guides et diaporamas narratifs.
- `src/config/` : clés persistantes, difficultés et options de campagne.
- `src/services/` : sauvegardes, méta-progression, options et moteur audio.
- `src/maps/` : sélection des régions, métadonnées et validation du monde.
- `src/combat/` : helpers de ciblage, mutations et réglage des adversaires.
- `src/ui/` : conventions d'affichage partagées entre les écrans.
- `game.js` : orchestration du déroulement, des écrans et des interactions.
- `index.html` : écrans et structure de l'interface.
- `styles.css` : direction artistique et comportement responsive.
- `tests/` : tests unitaires, migrations, cartes et simulations d'équilibrage.

Les entrées du catalogue possèdent des identifiants stables. Les sauvegardes
stockent ces identifiants plutôt que de dupliquer les définitions, afin de
faciliter l'équilibrage et l'ajout de nouveau contenu.
