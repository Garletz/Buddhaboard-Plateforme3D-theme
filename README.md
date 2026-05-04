# Buddhachannel — Plateforme 3D (TypeScript Edition)

Plateforme web interactive : un plateau 3D « table basse » sur lequel des cartes (don, actualités, vidéo, …) sont posées, déplacées, redimensionnées, affichées en plein écran, ré-ordonnées au son d'un xylophone.

> Construit avec **Vite** + **TypeScript**. Animations **GSAP**, audio **Tone.js**.

---

## Démarrage rapide

```bash
npm install
npm run dev          # http://localhost:5173/
npm run build        # bundle de production dans dist/
```

---

## Architecture Technique (Résumé)

Le projet a été entièrement migré vers **TypeScript** pour faciliter son intégration dans l'écosystème **Astro / EmDash**.

- **`/src/index.ts`** : Point d'entrée principal (API publique).
- **`/src/core/`** : Cœur de l'application (Store d'état, EventBus typé, ThemeManager CSS-in-JS).
- **`/src/platform/`** : Gestion du plateau 3D, de la perspective et de la physique (collisions).
- **`/src/cards/`** : Logique des cartes (Drag & Drop, Focus, Animations GSAP).
- **`/src/audio/`** : Moteur sonore Tone.js (totalement découplé via l'EventBus).
- **`/src/ui/`** : Overlays et menus (SkyMenu, ActionPillars).

Pour une analyse approfondie destinée aux agents IA ou aux développeurs, consultez [**`docs/ARCHITECTURE.md`**](./docs/ARCHITECTURE.md) et [**`docs/feature_structure.md`**](./docs/feature_structure.md).

---

## Architecture Avancée (Nouveautés)

- **State-driven & Persistance** : Le placement des cartes est géré par un `Store` centralisé et est sauvegardé automatiquement dans le `localStorage`.
- **Event-driven** : Le couplage direct entre les modules a été supprimé au profit d'un `EventBus` typé (`CARD_FOCUSED`, `CARD_VANISHED`, etc.).
- **Thèmes dynamiques** : Un `ThemeManager` modifie nativement les variables CSS (`--color-top`) pour des changements de thème instantanés.
- **Cycle de Vie (Lifecycle)** : Les méthodes `initBuddhachannel()` et `destroyBuddhachannel()` garantissent qu'il n'y a pas de fuites de mémoire lors de l'utilisation de routeurs clients (Astro ViewTransitions).

---

## Utilisation en tant que module

```typescript
import { mount, addCard } from 'buddhachannel-plateforme';
import 'buddhachannel-plateforme/styles';

// Initialisation
const container = document.querySelector('#scene') as HTMLElement;
mount(container, {
    skyMenu: true,
    actionPillars: true,
    intro: true
});

// Ajout dynamique
addCard('editorial');
```

---

## Conventions TypeScript

- **Types Stricts** : Tous les nouveaux modules doivent être typés. Les interfaces pour les éléments DOM (`HTMLElement`) et les configurations sont obligatoires.
- **Imports** : Utilisez l'alias `@/` sans extension (ex: `import Physics from '@/platform/physics'`).
- **Peer Dependencies** : `gsap` et `tone` doivent être fournis par le projet hôte.

---

## Développement

### Ajouter une carte
1. Créer un fragment HTML dans `src/cards/fragments/`.
2. Le système (`cards-loader.ts`) le détectera automatiquement.
3. Utilisez `addCard('mon_slug')` pour l'injecter.

### Modifier la physique
Les règles de collision et d'élévation se trouvent dans `src/platform/physics.ts`.
