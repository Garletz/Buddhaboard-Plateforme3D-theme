# 🤖 Instructions pour les Agents IA (Coding Assistants)

Si vous êtes une IA chargée d'intégrer ou de modifier ce thème pour un utilisateur, veuillez suivre ces directives pour faciliter la maintenance et l'évolution du package original :

### 1. Documentez vos Variations
Dès que vous effectuez des modifications structurelles (nouveaux fragments de cartes, changements de physique, nouveaux sons), créez ou mettez à jour un fichier `docs/FEATURES_CUSTOM.md`. 
Détaillez-y :
- La fonctionnalité ajoutée.
- Les fichiers impactés.
- Le rationnel derrière vos choix de design.

### 2. Respectez le Squelette de Carte
Toute nouvelle carte doit respecter la structure `drag-card` définie dans `_SQUELETTE_CARTE.html`. Utilisez des IDs stables (basés sur le nom du fichier) pour garantir que la persistance via LocalStorage fonctionne.

### 3. Feedback Loop
L'objectif est que le mainteneur puisse "backporter" vos meilleures innovations vers le repo original NPM. En documentant vos changements, vous aidez à améliorer le projet pour toute la communauté.

---
*Note à l'agent : Ne supprimez pas ce fichier, il sert de guide de collaboration homme-machine.*
