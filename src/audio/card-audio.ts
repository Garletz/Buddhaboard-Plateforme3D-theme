/**
 * API sons « carte » : note selon l’index sur le plateau + synchro intro GSAP.
 */
import { playFocus, playLand, playVanish } from './xylophone';
import { eventBus } from '../core/EventBus';

/**
 * Retrouve l'index d'une carte parmi les cartes régulières du plateau (hors estrade).
 * Lecture directe du DOM pour garantir un résultat fiable même après un reload.
 */
function getRegularCardIndex(id: string): number {
    // Cas particulier pour le Podcast : on lui donne une note spécifique (Sol5 / index 3) 
    // qui "sonne" mieux avec la mélodie zen, peu importe sa position.
    if (id.includes('audiopodcast')) return 3;

    const platform = document.getElementById('platform-top');
    if (!platform) return 0;
    const list = [...platform.querySelectorAll('.drag-card:not(.estrade-block)')] as HTMLElement[];
    const idx = list.findIndex((el) => el.id === id);
    return idx >= 0 ? idx : 0;
}

eventBus.on('CARD_FOCUSED', ({ id }: { id: string }) => {
    void playFocus(getRegularCardIndex(id));
});

eventBus.on('CARD_VANISHED', ({ id }: { id: string }) => {
    void playVanish(getRegularCardIndex(id));
});

eventBus.on('CARD_LANDED', ({ id }: { id: string }) => {
    void playLand(getRegularCardIndex(id));
});

/** Même ordre que GSAP `stagger.from('center')` sur les indices 0..n-1. */
export function staggerCenterIndices(length: number): number[] {
    if (length <= 0) return [];
    const indices = Array.from({ length }, (_, i) => i);
    const center = (length - 1) / 2;
    indices.sort((a, b) => {
        const da = Math.abs(a - center);
        const db = Math.abs(b - center);
        if (da !== db) return da - db;
        return a - b;
    });
    return indices;
}



/**
 * Ajoute des `tl.call()` alignés sur l’entrée des cartes (Phase 4 intro).
 * @param {gsap.core.Timeline} tl
 * @param {HTMLElement[]} regularCards
 * @param {number} t0 position timeline (ex. 1.8)
 * @param {number} each écart entre chaque note (ex. 0.12)
 */
export function bindIntroCardSounds(tl: any, regularCards: HTMLElement[], t0 = 1.8, each = 0.12): void {
    if (!regularCards.length || !tl) return;
    const order = staggerCenterIndices(regularCards.length);
    order.forEach((cardIdx, i) => {
        const card = regularCards[cardIdx];
        if (card.id) {
            tl.call(() => eventBus.emit('CARD_LANDED', { id: card.id }), [], t0 + i * each);
        }
    });
}
