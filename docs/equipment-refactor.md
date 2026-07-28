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

Ces coefficients sont maintenant appliqués au calcul des statistiques portées.
Une valeur d'objet est d'abord améliorée selon son niveau, puis pondérée par
l'emplacement qui l'accueille. Un groupe entièrement équipé conserve ainsi un
budget proche de l'ancien objet unique.

## État du catalogue actuel

Le catalogue contient désormais 98 objets : les 62 pièces historiques et
36 nouvelles pièces déclarées directement avec leur `equipType`.

| Région | Objets | Tête | Torse | Jambes | Armes | Amulettes | Bagues |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Route des Cendres | 32 | 4 | 7 | 4 | 10 | 4 | 3 |
| Contrées du Voile | 40 | 4 | 9 | 4 | 12 | 7 | 4 |
| Royaume sous la Cendre | 12 | 2 | 2 | 2 | 2 | 2 | 2 |
| Brasier Originel | 14 | 2 | 2 | 2 | 3 | 2 | 3 |

Les jambes existent aux quatre raretés. Le catalogue total possède désormais
29 pouvoirs d'artéfact, six ensembles et quatorze recettes de forge. Deux
formules d'amulettes complètent la couverture de fabrication.

Le classement préparatoire place les 24 armes historiques dans le type
`weapon`, les 18 anciennes armures sur le torse, quatre anciens bijoux visuels
sur la tête, neuf bijoux en amulettes et sept en bagues. Aucune ancienne pièce
ne correspondait réellement aux jambes : cet emplacement est donc alimenté par
du nouveau contenu plutôt que par un renommage artificiel.

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

## Consolidation de l'axe 6

La refonte est désormais protégée par `equipment-audit.mjs`, exécuté pendant
`npm run check`. Une release est refusée si :

- une région ne propose pas chacun des six types d'objet ;
- la puissance moyenne d'un groupe régresse entre deux régions ou s'écarte
  excessivement des deux autres groupes ;
- une rareté ne dépasse pas la précédente ;
- un artéfact ne possède pas son pouvoir dédié ;
- le palier maximal d'un ensemble ne peut pas être porté simultanément ;
- la forge oublie un type d'équipement ;
- un des huit emplacements n'a plus aucun objet compatible.

Le rapport `npm run audit:equipment` expose les courbes d'armure, d'armes et de
bijoux par région. Les tests injectent volontairement des catalogues cassés afin
de garantir que chaque garde-fou bloque effectivement la release.
