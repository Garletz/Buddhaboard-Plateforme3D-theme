/**
 * Buddhachannel Plateforme — API publique (mode « package »).
 *
 * Permet à un projet hôte d'importer le composant et de le monter manuellement :
 *
 *   import { mount, addCard } from 'buddhachannel-plateforme';
 *   mount(document.querySelector('#scene'));
 *
 * Les styles sont importés automatiquement quand on importe ce module ;
 * GSAP et Tone.js sont déclarés en `peerDependencies` côté `package.json`.
 */

import './styles/index.css';

import Platform from './platform/platform';
import Physics from './platform/physics';
import { applyPercentSizing, getCardFragment, loadCardsJoined, listCardFragments } from './platform/cards-loader';
import { reloadPlatformCards, setupReloadButton } from './platform/reload';

import Draggable from './cards/draggable';
import Animations from './cards/animations';
import { initCardFocus } from './cards/card-focus';

import { mountSkyMenu } from './ui/sky-menu/index';
import { mountActionPillars } from './ui/action-pillars/index';

import { unlockAudio } from './audio/audio-context';
import './audio/card-audio'; // Side-effect : enregistre les listeners EventBus

interface MountOptions {
    skyMenu?: boolean;
    actionPillars?: boolean;
    intro?: boolean;
}

/**
 * Monte la plateforme dans un conteneur existant.
 *
 * @param {HTMLElement} container
 * @param {MountOptions} [options]
 */
export function mount(container: HTMLElement, options: MountOptions = {}) {
    const { skyMenu = true, actionPillars = true, intro = true } = options;

    const platform = container.querySelector('#platform-top');
    if (!platform) {
        throw new Error("[Buddhachannel] L'élément #platform-top est introuvable dans le conteneur cible.");
    }

    Platform.init();

    if (skyMenu) {
        const skyContainer = container.querySelector('#sky-menu-container');
        mountSkyMenu(skyContainer);
    }
    if (actionPillars) {
        const pillarsContainer = container.querySelector('#action-pillars-container');
        mountActionPillars(pillarsContainer);
    }

    const refWidth = platform.clientWidth || window.innerWidth * 0.68;
    const refHeight = platform.clientHeight || 800;

    const html = loadCardsJoined();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    applyPercentSizing(temp, refWidth, refHeight);
    platform.innerHTML = temp.innerHTML;

    setupReloadButton();
    Draggable.init();
    initCardFocus();
    Physics.updateAllElevations?.();

    if (intro) {
        setTimeout(() => Animations.playIntro(), 100);
    }
}

/**
 * Injecte programmatiquement une carte dans le plateau actif.
 * @param {string} name identifiant (ex. `01_don`, `editorial`)
 */
export function addCard(name: string) {
    const platform = document.getElementById('platform-top');
    if (!platform) return;
    const fragment = getCardFragment(name);
    if (!fragment) {
        console.warn('[Buddhachannel] Carte introuvable :', name);
        return;
    }
    platform.insertAdjacentHTML('beforeend', fragment.html);
    const newCard = platform.lastElementChild as HTMLElement;
    if (newCard) {
        newCard.style.left ||= '45%';
        newCard.style.top ||= '45%';
    }

    Animations.animateCardIn(newCard);
    Draggable.makeDraggable?.(newCard, platform);
    Physics.updateElevation?.(newCard, newCard.offsetLeft, newCard.offsetTop);
}

export {
    /* Sons */
    unlockAudio,

    /* Cartes */
    listCardFragments,
    getCardFragment,
    reloadPlatformCards,
    Animations,
    Draggable,
    Physics,
    Platform,
};

export default { mount, addCard, reloadPlatformCards };
