# BuddhaBoard 3D Theme

Un thème spatial 3D immersif ("glassmorphism", plateau isométrique, animations GSAP) prêt à être intégré dans votre projet Astro ou EmDash. Inclut désormais un module **Podcast Audio** avec mini-player intégré.

> Ce projet est conçu selon le modèle "Shadcn/UI" : vous téléchargez le code source brut directement dans votre projet, pour avoir le contrôle absolu sur la physique, l'audio et les composants.

---

## 🚀 Installation rapide via NPX

Placez-vous à la racine de votre projet (Astro, Vite, etc.) et lancez la commande suivante :

```bash
npx create-buddhaboard mon-dossier-theme
```

*Le script téléchargera la dernière version officielle du code source brut et la placera dans le dossier de votre choix.*

### Dépendances requises

Le thème utilise deux librairies majeures. Assurez-vous de les installer dans votre projet hôte :

```bash
npm install gsap tone
```

## 🛠️ Intégration dans Astro

Une fois le dossier téléchargé (ex: `src/components/buddhaboard`), importez simplement le point d'entrée et le CSS :

```typescript
// Dans votre fichier Astro ou Layout principal
import { mount, addCard } from './buddhaboard/src/index';
import './buddhaboard/src/styles/index.css';

const container = document.getElementById('platform-wrapper');
mount(container, { skyMenu: true });
```

---

## 🤖 Pour les Agents IA
Si vous utilisez ce thème dans un projet de développement assisté, merci de consulter [docs/AGENTS.md](./docs/AGENTS.md) pour les directives de documentation des modifications.

*Développé avec 🧘 par la communauté Buddhachannel.*
