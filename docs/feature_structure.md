# Feature Structure — Évolutions Architecturales

Ce document détaille la stratégie recommandée pour transformer la base actuelle en une plateforme robuste, persistante et facile à intégrer dans l'écosystème **Astro / EmDash**.

---

## 1. Central Store (Gestion d'État)
**Concept** : Déplacer la source de vérité du DOM vers un objet TypeScript.
- **Le problème actuel** : Les positions sont lues/écrites directement dans les styles inline des éléments.
- **La solution** : Un module `Store.ts` qui maintient un objet `Registry` (liste des cartes actives, leurs positions, leurs tailles).
- **Avantage** : Facilite la sauvegarde (Persistence) et le calcul des collisions.

## 2. Système de Signaux (Event Bus)
**Concept** : Découpler les modules pour éviter les imports circulaires.
- **Le problème actuel** : `Animations.ts` appelle directement `Audio.ts`.
- **La solution** : Un bus d'événements léger typé.
    - `DRAG_START`
    - `CARD_FOCUSED`
    - `LAYOUT_UPDATED` (déclenche la sauvegarde LocalStorage)
- **Avantage** : On peut ajouter un nouveau module (ex: un logger de stats) sans toucher au code existant.

## 3. Persistance (LocalStorage) & Validation
**Concept** : Enregistrement automatique de la disposition.
- **Méthode** : À chaque signal `LAYOUT_UPDATED`, le Store sérialise l'état en JSON dans le `localStorage`.
- **Validation** : Les données issues du LocalStorage doivent être validées à l'initialisation pour éviter des crashs si la structure des données évolue.
- **Reset** : Une fonction `resetLayout()` vide le stockage et recharge les positions par défaut.

## 4. Composants de Cartes (Métadonnées)
**Concept** : Enrichir les fragments `.html`.
- **Le problème actuel** : Les cartes sont de simples blocs HTML.
- **La solution** : Ajouter des attributs `data-slug` et `data-type`. 
- **Évolution** : Permettre à Astro de passer des props (ex: `color-theme`, `priority`) appliquées dynamiquement.

## 5. Design Tokens (CSS-in-JS Bridge)
**Concept** : Centraliser les constantes visuelles.
- **La solution** : Utiliser des CSS Variables (`--focus-aura-color`, `--card-transition-speed`) pilotées par JS.

## 6. Cycle de Vie et Nettoyage (Lifecycle)
**Concept** : Rendre la plateforme compatible avec des routeurs côté client (Astro ViewTransitions).
- **La solution** : Chaque module doit exposer une méthode `init()` et une méthode `destroy()` (qui retire les écouteurs d'événements et vide la mémoire).

## 7. Séparation Moteur Physique et DOM
**Concept** : Le moteur physique ne doit plus lire le DOM.
- **La solution** : Calculs des collisions et de l'élévation (`z-index`) purement basés sur l'objet d'état `Store`, pour des performances accrues.

---

## Roadmap d'Implémentation Globale

1. **Phase 1 - Fondations** : Création du Bus d'événements typé (`EventBus.ts`) et du Store central (`Store.ts`).
2. **Phase 2 - Data & Loader** : Implémenter le `data-slug` dans le loader (`cards-loader`), et peupler le Store.
3. **Phase 3 - Moteur & UI** : Raccorder le `Draggable`, la Physique et l'Audio au Store et à l'EventBus (ne plus lire le DOM).
4. **Phase 4 - Persistance** : Connecter le Store au `localStorage` avec validation.
5. **Phase 5 - Lifecycle** : Ajouter les méthodes de destruction/cleanup pour Astro.
