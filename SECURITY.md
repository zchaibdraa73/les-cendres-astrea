# Politique de sécurité

## Version suivie

La branche principale et la version `3.0.0-rc.1` sont actuellement prises en
charge. Les anciennes copies du prototype ne reçoivent pas de correctifs.

## Signaler un problème

Ne publiez pas de sauvegarde personnelle, de faille exploitable ou de secret dans
une issue publique. Utilisez le signalement privé de vulnérabilité GitHub lorsqu'il
est activé, ou un canal privé convenu avec le mainteneur du dépôt.

Le rapport doit indiquer la version, le parcours de reproduction, l'impact attendu
et, si possible, une sauvegarde minimale débarrassée de toute donnée personnelle.

## Protections en place

- dépendances verrouillées par `package-lock.json` et installées avec `npm ci` ;
- audit des vulnérabilités de niveau élevé ou critique à chaque intégration ;
- validation Zod du contenu, des options, des sauvegardes et des archives ;
- copie de secours automatique des sauvegardes ;
- tests unitaires, audit d'équilibrage et tests Playwright obligatoires ;
- jeu autonome sans ressource web nécessaire à son exécution.

Les fichiers de sauvegarde importés doivent toujours être considérés comme des
données non fiables. Leur validation ne doit jamais être contournée.
