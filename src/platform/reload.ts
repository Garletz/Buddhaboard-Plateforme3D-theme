/**
 * Recharge les cartes du plateau (sans recharger la page).
 * Joue la séquence sonore en même temps (le clic utilisateur débloque l’audio).
 */
import Animations from '@/cards/animations';
import { applyPercentSizing, loadCardsJoined } from '@/platform/cards-loader';
import { unlockAudio } from '@/audio/audio-context';
import Physics from '@/platform/physics';

export async function reloadPlatformCards() {
    await unlockAudio();
    const platform = document.getElementById('platform-top');
    if (!platform) return;

    const refWidth = platform.clientWidth || window.innerWidth * 0.68;
    const refHeight = platform.clientHeight || 800;

    const html = loadCardsJoined();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    applyPercentSizing(temp, refWidth, refHeight);

    platform.innerHTML = temp.innerHTML;

    if (typeof window.Draggable !== 'undefined' && window.Draggable.init) {
        window.Draggable.init();
    }
    Physics.updateAllElevations?.();

    const regularCards = [
        ...platform.querySelectorAll('.drag-card:not(.estrade-block)'),
    ];
    Animations.playCardsEntranceWithSounds(regularCards);
}

export function setupReloadButton(selector = '#platform-reload-cards') {
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        reloadPlatformCards().catch((err) =>
            console.error('[Platform reload]', err)
        );
    });
}
