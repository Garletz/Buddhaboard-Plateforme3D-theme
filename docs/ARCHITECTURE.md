# Architecture

Ce document décrit la structure des modules JavaScript et CSS, le flux d'initialisation, et les points d'extension de la plateforme Buddhachannel.

---

## 1. Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        index.html (shell)                       │
│  └─ <script type="module" src="/src/boot.ts">                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          src/boot.ts                            │
│  • importe styles/index.css                                     │
│  • initialise le Core (Store, EventBus, ThemeManager)           │
│  • monte UI (sky-menu, action-pillars, card-toolbox)            │
│  • initialise Platform, Physics, Animations, Draggable, Focus   │
│  • restaure le layout depuis le LocalStorage (Store)            │
│  • injecte les fragments cartes via cards-loader                │
│  • lance l'intro GSAP                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   src/platform/          src/cards/            src/audio/
   ─ platform.ts         ─ animations.ts       ─ audio-context.ts
   ─ physics.ts          ─ draggable.ts        ─ xylophone.ts
   ─ cards-loader.ts     ─ card-focus.ts       ─ card-audio.ts
   ─ reload.ts           ─ fragments/*.html
   ─ mobile-3d-adapter.ts   
   
   src/core/              src/ui/
   ─ Store.ts             ─ sky-menu/
   ─ EventBus.ts          ─ action-pillars/
   ─ ThemeManager.ts      ─ card-toolbox/
```

---

## 2. Modules par responsabilité

### `src/platform/`

| Fichier | Rôle |
|---|---|
| `platform.ts` | Calcule la perspective et le rotateX du plateau, gère le parallax curseur. |
| `physics.ts` | Détection de collisions, élévation Z (cartes posées sur l'estrade). |
| `cards-loader.ts` | Charge les fragments HTML cartes via `import.meta.glob` et injecte les data-slug. |
| `reload.ts` | Bouton « ↻ » qui relance la séquence d'apparition des cartes (avec son). |
| `mobile-3d-adapter.ts` | Gère l'expérience mobile (lobby + autofit landscape). |

### `src/cards/`

| Fichier | Rôle |
|---|---|
| `animations.ts` | Timeline GSAP : intro cinématique, entrée individuelle de carte, hover. |
| `draggable.ts` | Drag, resize, vanish hors plateau (communique avec Store et EventBus). |
| `card-focus.ts` | Aperçu plein écran d'une carte (clone fixe, fond + vignette + aura). |
| `fragments/*.html` | Contenu HTML brut de chaque carte (drag-card). |

### `src/audio/`

Voir [`AUDIO.md`](AUDIO.md).

### `src/ui/<composant>/`

Chaque composant suit la convention :

```
ui/<nom>/
├── <nom>.html     # template HTML embarqué via `?raw`
└── index.js       # `mount<Nom>(container, options?)`
```

`boot.js` (et/ou `src/index.js` pour l'API package) appelle ces fonctions de montage.

### `src/core/`

Modules transverses constituant le cœur de la plateforme state-driven :
| Fichier | Rôle |
|---|---|
| `Store.ts` | Source de vérité (positions, tailles, z-index des cartes) + persistance LocalStorage. |
| `EventBus.ts` | Système de signaux typé (EventMap) pour le découplage total des modules (ex: Audio). |
| `ThemeManager.ts` | Pont CSS-in-JS pilotant les Design Tokens (dark mode, etc.). |
| `debug-panel.ts` | Panneau de réglages (Tuner) accessible via `[H]`. |

---

## 3. Flux d'initialisation (boot.ts)

L'initialisation est packagée dans `initBuddhachannel()` pour être compatible avec les ViewTransitions d'Astro.

1. Import des styles (`styles/index.css`) → CSS injectée par Vite.
2. Montage des composants UI (`mountCardToolbox`, `mountSkyMenu`, `mountActionPillars`).
3. `Platform.init()` : calcule perspective + lance le parallax.
4. Chargement des cartes (`cards-loader`) et peuplement initial du `Store`.
5. **Persistance** : Le `Store` lit le LocalStorage et applique les positions sauvegardées directement sur les cartes DOM.
6. Insertion dans `#platform-top`.
7. `setupReloadButton()` lie le bouton « ↻ » de la face avant.
8. `Draggable.init()` rend chaque carte draggable (et met à jour le Store en temps réel).
9. `initCardFocus()` active le clic → aperçu plein écran (déclenche `CARD_FOCUSED`).
10. `Physics.updateAllElevations()` détermine quelles cartes sont sur l'estrade.
11. `Animations.playIntro()` lance la timeline cinématique.

---

## 4. Conventions

### Imports

Toujours utiliser l'alias `@/` :

```js
import gsap from 'gsap';
import { unlockAudio } from '@/audio/audio-context.js';
```

### Globales

Les modules historiques exposent `window.Platform`, `window.Draggable`, `window.Animations`, etc., **uniquement** pour ne pas casser des codes externes existants. Tout nouveau module doit utiliser les imports nommés.

### Assets

| Cas | Emplacement |
|---|---|
| Image bundlée (hash, optimisation) | `src/assets/`, importée en JS (`import url from '@/assets/x.png'`) |
| Asset à URL fixe (référencé en string dans du HTML) | `public/` (servi à la racine, ex. `/logo.png`) |

### Fragments cartes

`NN_slug.html` :
- `NN` (deux chiffres) = ordre d'apparition.
- `slug` = identifiant unique réutilisable (`addCard('editorial')`).
- Les fichiers commençant par `_` (ex. `_SQUELETTE_CARTE.html`) sont **ignorés**.

---

## 5. Mode « package »

`src/index.js` est l'API publique pour intégrer la plateforme dans un projet hôte. Voir le README pour l'usage `mount()` / `addCard()`.

`gsap` et `tone` sont déclarés en **peerDependencies** : un projet hôte qui les a déjà ne paie pas le prix deux fois.

---

## 6. Pour aller plus loin

- **Tests** : Vitest + happy-dom pour valider la logique du `Store`, de l'`EventBus`, de `physics` et du `xylophone`.
- **Moteur Physique** : Actuellement la détection de collision lit encore partiellement le DOM pour récupérer les largeurs/hauteurs précises. La prochaine étape serait de 100% découpler `Physics` du DOM en se basant uniquement sur l'objet `Store`.
- **Lint/format** : ESLint + Prettier à configurer.
