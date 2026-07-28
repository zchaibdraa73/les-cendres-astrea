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
- enveloppe SHA-256 sur chaque nouvelle sauvegarde et archive exportée ;
- rejet des charges HTML, clés de pollution de prototype et structures excessives ;
- assainissement DOMPurify des principaux rendus HTML dynamiques ;
- politique CSP, interdiction d'intégration en iframe et en-têtes navigateur restrictifs ;
- manifeste SHA-384 et attributs SRI sur les ressources du build de production ;
- copie de secours automatique des sauvegardes ;
- tests unitaires, audit d'équilibrage et tests Playwright obligatoires ;
- jeu autonome sans ressource web nécessaire à son exécution.

Les fichiers de sauvegarde importés doivent toujours être considérés comme des
données non fiables. Leur validation ne doit jamais être contournée.

## Limites du client

Le code d'un jeu web est nécessairement livré à la machine du joueur. La
minification, les empreintes et les contrôles locaux compliquent les altérations
et détectent les corruptions, mais ne remplacent pas une autorité serveur pour
un classement compétitif. Aucun secret durable ne doit être intégré au bundle
JavaScript. Une future version de bureau devra également signer ses exécutables.
