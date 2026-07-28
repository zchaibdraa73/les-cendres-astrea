# Refonte de l'équipement

## Contrat cible

Le héros disposera de huit emplacements persistants :

| Groupe | Emplacements | Types d'objet compatibles |
| --- | --- | --- |
| Armure | Tête, Torse, Jambes | tête, torse, jambes |
| Armes | Main droite, Main gauche | arme à une main |
| Bijoux | Amulette, Bague 1, Bague 2 | amulette, bague |

Les identifiants internes sont `head`, `chest`, `legs`, `mainHand`, `offHand`,
`amulet`, `ring1` et `ring2`. Ils sont indépendants des libellés affichés afin
que l'interface puisse évoluer ou être traduite sans modifier les sauvegardes.

Une bague est compatible avec les deux emplacements de bague. Une arme à une
main est compatible avec les deux mains. Le moteur d'équipement choisira la
destination ou demandera au joueur laquelle remplacer lors de l'axe consacré
aux règles.

## Budget de puissance

Le passage de trois à huit pièces ne doit pas multiplier la puissance totale.
Chaque groupe conserve un budget global réparti entre ses emplacements :

- armure : tête 25 %, torse 45 %, jambes 30 % ;
- armes : main droite 60 %, main gauche 40 % ;
- bijoux : amulette 40 %, chaque bague 30 %.

Ces coefficients serviront au rééquilibrage du catalogue. Ils ne modifient pas
encore les statistiques du jeu.

## État du catalogue actuel

Le catalogue de départ contient 62 objets :

- 24 armes ;
- 18 armures ;
- 20 bijoux.

Le classement préparatoire place les 24 armes dans le type `weapon`, les
18 armures actuelles sur le torse, quatre anciens bijoux visuels sur la tête,
neuf bijoux en amulettes et sept en bagues. Aucune ancienne pièce ne correspond
réellement aux jambes : cet emplacement sera donc alimenté par le nouveau
contenu plutôt que par un renommage artificiel.

L'audit a relevé 59 usages directs de l'ancien modèle dans le moteur, les
schémas, les interfaces et les tests. Les objets seront reclassés explicitement
pendant la migration ; les valeurs par défaut de compatibilité ne servent que
de filet de sécurité pour une ancienne sauvegarde dont l'objet serait absent du
catalogue.

La table exhaustive est conservée dans
`src/equipment/legacy-item-classification.mjs`. Toute modification du catalogue
qui oublierait un ancien objet fera échouer les tests avant d'atteindre une
sauvegarde réelle.

## Règles invariantes

- un emplacement contient zéro ou une instance d'objet ;
- une même instance ne peut pas occuper deux emplacements ;
- les statistiques proviennent des huit emplacements sans double comptage ;
- le type d'objet détermine les emplacements compatibles ;
- les identifiants des emplacements restent stables dans les sauvegardes ;
- les armes à deux mains, boucliers et focalisateurs pourront être ajoutés plus
  tard sans renommer les huit emplacements.

## Migration version 29

La version 29 conserve l'ancien bloc `equipped` uniquement comme entrée de
compatibilité pour les sauvegardes historiques. Dès que la migration est
terminée :

- `equipment` devient la source de vérité des huit emplacements ;
- `equipmentModelVersion` vaut `1` ;
- chaque objet sauvegardé reçoit son `equipType` ;
- chaque présélection est normalisée sur les huit identifiants stables ;
- une instance dupliquée ou incompatible est automatiquement écartée.

Une ancienne sauvegarde SHA-256 est d'abord authentifiée, puis migrée et enfin
réenregistrée avec une nouvelle empreinte. Les sauvegardes déjà migrées
préservent leur bloc canonique au lieu de le recalculer depuis les trois anciens
emplacements.

## Règles actives depuis l'axe 3

Le module `equipment-rules.mjs` centralise désormais les opérations du gameplay.
Le moteur, la forge, le butin et les présélections passent tous par ces règles :

- le joueur choisit explicitement la main ou la bague concernée ;
- l'équipement automatique remplit d'abord un emplacement libre, puis compare
  l'objet avec la pièce compatible la plus faible ;
- vendre ou démanteler retire l'instance de son emplacement exact ;
- statistiques, ensembles et artéfacts parcourent les huit emplacements sans
  compter deux fois une même instance ;
- une présélection ne peut charger qu'un objet possédé et compatible.
