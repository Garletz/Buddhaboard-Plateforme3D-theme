/**
 * Contexte Web Audio / Tone — déblocage autoplay (mobile & desktop).
 * Tant que l'utilisateur n'a pas interagi, les sons restent muets ;
 * dès le premier geste, `Tone.start()` est appelé automatiquement.
 */
import * as Tone from 'tone';

export async function unlockAudio() {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }
    return Tone.context.state === 'running';
}

export function isAudioRunning() {
    return typeof Tone !== 'undefined' && Tone.context?.state === 'running';
}

if (typeof document !== 'undefined') {
    const wake = () => {
        unlockAudio().catch(() => {});
    };
    document.addEventListener('pointerdown', wake, { once: true, passive: true });
    document.addEventListener('keydown', wake, { once: true });
}
