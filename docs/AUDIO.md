# Audio — Tone.js & autoplay

La plateforme joue trois types de sons via [Tone.js](https://tonejs.github.io/) :

| Action utilisateur | Son | Module |
|---|---|---|
| Carte qui se pose à l'écran (intro / reload) | `playLand(index)` | `audio/xylophone.ts` |
| Clic sur une carte (passage en aperçu) | `playFocus(index)` (octave +12) | idem |
| Carte relâchée hors du plateau | `playVanish(index)` (octave −12, voix dédiée) | idem |

Chaque carte a une **note pentatonique** dérivée de son index sur le plateau (`SCALE = ['C5','D5','E5','G5','A5','C6','D6','E6','G6','A6']`).

---

## 1. Politique d'autoplay

Chrome (et Safari) bloquent l'audio tant qu'aucune interaction utilisateur n'a eu lieu. Le module `audio/audio-context.ts` gère ça :

```typescript
import * as Tone from 'tone';

export async function unlockAudio() {
    if (Tone.context.state !== 'running') await Tone.start();
    return Tone.context.state === 'running';
}

document.addEventListener('pointerdown', () => unlockAudio(), { once: true, passive: true });
document.addEventListener('keydown',     () => unlockAudio(), { once: true });
```

→ Au premier clic / touche, l'audio passe en `running`.

### Conséquence

L'**intro de page** ne joue **pas** la séquence sonore (rien n'autorise encore l'audio). Pour entendre les cartes se poser une à une, l'utilisateur clique sur le bouton **« ↻ »** posé sur la face avant du plateau (`#platform-reload-cards`) :

1. Le clic appelle `unlockAudio()` (geste utilisateur ⇒ Tone démarre).
2. `reloadPlatformCards()` réinjecte les fragments cartes.
3. `Animations.playCardsEntranceWithSounds()` réplique l'animation et binde un `tl.call(playLandForCard)` à chaque entrée de carte (ordre `stagger.from('center')`).

---

## 2. API « par carte »

Le module `audio/card-audio.ts` expose une couche au-dessus de `xylophone.ts` qui est **100% découplée** de l'UI grâce au `EventBus`. Il écoute les événements de la plateforme et lit le `Store` pour déterminer l'index de la note, plutôt que d'analyser le DOM.

```typescript
import { eventBus } from '@/core/EventBus';

// L'audio s'abonne de façon transparente :
eventBus.on('CARD_FOCUSED', ({ id }) => playFocus(getCardIndex(id)));
eventBus.on('CARD_VANISHED', ({ id }) => playVanish(getCardIndex(id)));
```
Cependant, pour l'intro GSAP séquentielle, il expose l'utilitaire `bindIntroCardSounds(timeline, regularCards, t0, each)` :

`bindIntroCardSounds` calcule l'ordre `stagger.from('center')` et déclenche des `eventBus.emit('CARD_LANDED')` au bon moment de la timeline GSAP.

---

## 3. Régler le rendu sonore

Tous les paramètres du synthé sont dans `audio/xylophone.ts` :

```typescript
poly = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope:  { attack: 0.003, decay: 0.14, sustain: 0.18, release: 0.42 },
}).toDestination();
poly.volume.value = -13; // dB
```

Idées d'évolution :
- ajouter un `Tone.Reverb` global pour la chaleur,
- panoramiser les cartes (`Tone.Panner`) selon leur position X,
- substituer le `triangle` par un `Tone.Sampler` chargé d'un vrai sample de balafon.

---

## 4. Désactiver entièrement l'audio

Aucun flag global pour l'instant ; ajouter dans `audio-context.ts` :

```typescript
export const AUDIO_ENABLED = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export async function unlockAudio() {
    if (!AUDIO_ENABLED) return false;
    /* … */
}
```

(non implémenté ; une issue suffit.)
