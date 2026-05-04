/**
 * Buddhachannel Plateforme — point d'entrée navigateur.
 *
 * Ce fichier est appelé par `index.html` (`<script type="module" src="/src/boot">`)
 * et orchestre l'initialisation de tous les modules : plateau, cartes, UI, audio.
 *
 * ⚠️ Pour une intégration en tant que package (mount dans une app tierce),
 * voir plutôt `src/index.ts` qui expose une API explicite (`mount`, `addCard`, …).
 */

import './styles/index.css';

import Platform from './platform/platform';
import Physics from './platform/physics';
import { applyPercentSizing, getCardFragment, loadCardsJoined } from './platform/cards-loader';
import { setupReloadButton } from './platform/reload';
import Mobile3DAdapter from './platform/mobile-3d-adapter';

import Draggable from './cards/draggable';
import Animations from './cards/animations';
import { initCardFocus } from './cards/card-focus';

import DebugPanel from './core/debug-panel';
import { store } from './core/Store';
import { eventBus } from './core/EventBus';
import { themeManager } from './core/ThemeManager';

import { mountSkyMenu } from './ui/sky-menu/index';
import { mountActionPillars } from './ui/action-pillars/index';
import { mountCardToolbox } from './ui/card-toolbox/index';

import './audio/audio-context';

/* ── Image de fond — importée pour profiter du hashing Vite ─── */
import bgImageUrl from '@/assets/background.png';

/** Ajoute une carte (par identifiant `01_don`, `editorial`, …) au plateau. */
function addCard(name: string): void {
    const platform = document.getElementById('platform-top');
    if (!platform) return;
    const fragment = getCardFragment(name);
    if (!fragment) {
        console.warn('[boot] Carte introuvable :', name);
        return;
    }

    platform.insertAdjacentHTML('beforeend', fragment.html);
    const newCard = platform.lastElementChild as HTMLElement;
    if (newCard) {
        newCard.style.left = '45%';
        newCard.style.top = '45%';
        store.addCard({
            id: newCard.id,
            slug: newCard.getAttribute('data-slug') || name,
            x: parseFloat(newCard.style.left),
            y: parseFloat(newCard.style.top),
            z: parseInt(newCard.style.zIndex || '0', 10),
            width: parseFloat(newCard.style.width || '0'),
            height: parseFloat(newCard.style.height || '0')
        });
    }

    Animations.animateCardIn(newCard);
    Draggable.makeDraggable?.(newCard, platform);
    Physics.updateElevation?.(newCard, newCard.offsetLeft, newCard.offsetTop);
}

/** Exporte la configuration courante (positions / tailles) dans le presse-papier. */
function exportConfig(): void {
    const platform = document.getElementById('platform-top');
    if (!platform) return;
    const cards = document.querySelectorAll('.drag-card');

    let output = 'Voici ma configuration actuelle :\n\n';
    cards.forEach((c) => {
        const card = c as HTMLElement;
        const header = card.querySelector('.drag-card__header') as HTMLElement;
        const title = header ? header.innerText.split('\n')[0] : 'Inconnu';
        const leftPercent = ((card.offsetLeft / platform.clientWidth) * 100).toFixed(1);
        const topPercent = ((card.offsetTop / platform.clientHeight) * 100).toFixed(1);
        const widthPercent = ((card.offsetWidth / platform.clientWidth) * 100).toFixed(1);
        const heightPercent = ((card.offsetHeight / platform.clientHeight) * 100).toFixed(1);
        output += `[${title}] -> style="left: ${leftPercent}%; top: ${topPercent}%; width: ${widthPercent}%; height: ${heightPercent}%;"\n`;
    });

    console.log(output);
    navigator.clipboard
        .writeText(output)
        .then(() => alert('Configuration copiée dans le presse-papier !'))
        .catch(() => {});
}

function injectBackgroundImage(): void {
    const bg = document.getElementById('background');
    if (!bg) return;
    const img = bg.querySelector('.background__image') as HTMLImageElement;
    if (img) img.src = bgImageUrl;
}

function renderError(platform: HTMLElement | null, message: string): void {
    if (!platform) return;
    platform.innerHTML = `
        <div style="position:absolute; top:20%; left:20%; width:60%; padding:20px; background:rgba(255,255,255,0.9); border:2px solid red; text-align:center; border-radius:8px;">
            <h2 style="color:red; margin:0 0 10px 0;">Erreur de chargement</h2>
            <p>${message}</p>
            <p><strong>Solution :</strong> ouvrez le projet via Vite (<code>npm run dev</code>) ou un autre serveur HTTP.</p>
        </div>
    `;
}

let isInitialized = false;

export function initBuddhachannel(): void {
    if (isInitialized) return;
    isInitialized = true;
    /* Toolbox + composants UI — montés avant la plateforme */
    mountCardToolbox(document.body, {
        onAddCard: (name: string, btn?: HTMLElement) => {
            addCard(name);
            if (btn) Animations.animateButtonPress(btn);
        },
        onExportConfig: exportConfig,
    });

    Platform.init();
    (DebugPanel as any)?.init?.();

    const platform = document.getElementById('platform-top');
    const skyContainer = document.getElementById('sky-menu-container');
    const pillarsContainer = document.getElementById('action-pillars-container');

    mountSkyMenu(skyContainer);
    mountActionPillars(pillarsContainer);
    injectBackgroundImage();

    try {
        if (!platform) throw new Error('Platform not found');
        const refWidth = platform.clientWidth || window.innerWidth * 0.68;
        const refHeight = platform.clientHeight || 800;

        const html = loadCardsJoined();
        const temp = document.createElement('div');
        temp.innerHTML = html;
        applyPercentSizing(temp, refWidth, refHeight);
        platform.innerHTML = temp.innerHTML;

        platform.querySelectorAll('.drag-card').forEach((el) => {
            const cardEl = el as HTMLElement;
            store.addCard({
                id: cardEl.id,
                slug: cardEl.getAttribute('data-slug') || '',
                x: parseFloat(cardEl.style.left || '0'),
                y: parseFloat(cardEl.style.top || '0'),
                z: parseInt(cardEl.style.zIndex || '0', 10),
                width: parseFloat(cardEl.style.width || '0'),
                height: parseFloat(cardEl.style.height || '0')
            });
        });

        // ---------------------------------------------------
        // Persistance: Charger le layout et l'appliquer au DOM
        // ---------------------------------------------------
        store.loadFromLocalStorage();
        platform.querySelectorAll('.drag-card').forEach((el) => {
            const cardEl = el as HTMLElement;
            const state = store.getCard(cardEl.id);
            if (state) {
                cardEl.style.left = `${state.x}%`;
                cardEl.style.top = `${state.y}%`;
                cardEl.style.zIndex = `${state.z}`;
            }
        });

        setupReloadButton();
        Draggable.init();
        initCardFocus();
        Physics.updateAllElevations?.();

        setTimeout(() => Animations.playIntro(), 100);
    } catch (err) {
        console.error('[boot] Erreur d’init plateau :', err);
        renderError(platform, 'Impossible de charger les fichiers de la plateforme.');
    }

    /* Mobile 3D adapter — chargé seulement si le device est tactile (logique interne). */
    new (Mobile3DAdapter as any)();

    console.log('[App] Buddhachannel platform ready.');
}

export function destroyBuddhachannel(): void {
    if (!isInitialized) return;
    
    // Nettoyage de l'EventBus pour éviter les fuites de mémoire
    eventBus.clear();
    
    // Réinitialisation du flag
    isInitialized = false;
    console.log('[App] Buddhachannel platform destroyed.');
}

document.addEventListener('DOMContentLoaded', () => {
    initBuddhachannel();
});

// Support pour Astro ViewTransitions
document.addEventListener('astro:page-load', () => {
    initBuddhachannel();
});

document.addEventListener('astro:before-swap', () => {
    destroyBuddhachannel();
});

/* Expose une mini-API utile en console (sans polluer un éventuel host). */
if (typeof window !== 'undefined') {
    (window as any).Buddhachannel = Object.assign((window as any).Buddhachannel || {}, {
        addCard,
        exportConfig,
        themeManager,
    });
}
