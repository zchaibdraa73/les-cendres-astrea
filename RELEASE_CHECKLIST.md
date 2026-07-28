# Recette de release

## Validation automatique

Exécuter `npm run check`. La release est bloquée si la syntaxe, un test unitaire,
un parcours Playwright, une référence de contenu, une carte, un seuil
d'équilibrage ou l'audit spécialisé de l'équipement échoue.

`npm run audit:equipment` peut être exécuté séparément. Il vérifie la couverture
des huit emplacements dans chaque région, la progression de puissance des trois
groupes, les quatre raretés, les pouvoirs d'artéfact, les ensembles réellement
équipables et la présence d'une recette pour chaque type d'objet.

Les tests navigateur automatisent le menu principal, la création d'une partie,
la persistance des options, la restauration d'une sauvegarde et un tour de combat.

Sur GitHub, le workflow `Qualité et sécurité` doit être vert. Il vérifie également
les vulnérabilités npm de niveau élevé ou critique et publie le dossier `dist`
comme artefact uniquement lorsque toute la recette réussit.

## Parcours manuel essentiel

- Lancer une nouvelle partie avec chacune des quatre classes.
- Reprendre chacun des trois emplacements de sauvegarde.
- Vérifier un combat simple, un combat de groupe, une élite et chaque boss final.
- Terminer les quatre cartes et contrôler les transitions, dialogues et conclusions.
- Remplir les huit emplacements, déplacer une arme et une bague entre leurs deux
  destinations, puis vérifier que les statistiques suivent chaque changement.
- Utiliser recherche, filtres et tris de l'inventaire sur ordinateur et mobile.
- Améliorer, vendre, recycler et fabriquer au moins un objet de chaque rareté et
  de chaque type d'équipement.
- Acheter une amélioration du Sanctuaire, puis démarrer une nouvelle expédition.
- Exporter une archive, l'importer et restaurer la copie précédant l'importation.
- Tester clavier ZQSD/WASD, manette, plein écran et affichage mobile.

## Statut de la v3.0 RC1

- Audit automatique : validé.
- Intégration continue et maintenance Dependabot : configurées.
- Sauvegardes : versionnées, migrées, doublées et exportables.
- Équilibrage : conforme aux seuils définis jusqu'au niveau 30.
- Distribution : version web jouable ; création de l'installeur bureau et intégration
  Steam prévues dans une étape distincte.
