/* =============================================
   APERÇU CARTE — GSAP : ouverture fluide ; fermeture = disparition du clone
   + fondu du voile (pas d’animation de « retour » vers la carte plateau).
   ============================================= */

import gsap from 'gsap';
import { eventBus } from '../core/EventBus';

const reduceMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const EASE = {
    envIn: 'power2.out',
    hero: 'expo.out',
    heroIn: 'power3.out',
    out: 'power3.inOut',
};

const DUR = {
    openEnv: 0.55,
    openHero: 1.05,
    openFast: 0.12,
    close: 0.85,
    closeHero: 0.72,
};

let rootLayer: HTMLElement | null = null;
let active = false;
let sourceCard: HTMLElement | null = null;
let closeBtn: HTMLButtonElement | null = null;
let escapeHandler: ((e: KeyboardEvent) => void) | null = null;
let onResizeHandler: (() => void) | null = null;
let resizeRaf: number | null = null;
let openTimeline: gsap.core.Timeline | null = null;

function ensureRoot() {
    if (rootLayer) return rootLayer;
    rootLayer = document.createElement('div');
    rootLayer.id = 'card-focus-root';
    rootLayer.className = 'card-focus-root';
    rootLayer.setAttribute('aria-hidden', 'true');
    rootLayer.innerHTML = `
        <div class="card-focus-aura" aria-hidden="true"></div>
        <div class="card-focus-backdrop" aria-hidden="true"></div>
        <div class="card-focus-vignette" aria-hidden="true"></div>
        <div class="card-focus-layer-cards">
            <div class="card-focus-stage"></div>
        </div>
        <button type="button" class="card-focus-close" aria-label="Fermer l'aperçu">✕</button>
    `;
    document.body.appendChild(rootLayer);
    closeBtn = rootLayer.querySelector('.card-focus-close') as HTMLButtonElement;
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            close();
        });
    }
    const backdrop = rootLayer.querySelector('.card-focus-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => close());
    }
    return rootLayer;
}

function stripCloneControls(clone: HTMLElement) {
    clone
        .querySelectorAll('.card-move-btn, .card-resize-btn, .resizer')
        .forEach((n) => n.remove());
}

function setParallax(on: boolean) {
    if (typeof window !== 'undefined' && (window as any).Platform && (window as any).Platform.setParallax) {
        try {
            (window as any).Platform.setParallax(on);
        } catch (_) {}
    }
}

/** Délais stagger proportionnels à la distance depuis la carte active (effet « onde »). */
function staggerByDistance(focusedCard: HTMLElement, nodes: HTMLElement[], spread = 0.0011, maxDelay = 0.38) {
    const fr = focusedCard.getBoundingClientRect();
    const fx = fr.left + fr.width / 2;
    const fy = fr.top + fr.height / 2;

    return (i: number, target: HTMLElement) => {
        const r = target.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(cx - fx, cy - fy);
        return Math.min(d * spread, maxDelay);
    };
}

function killOpenTimeline() {
    if (openTimeline) {
        openTimeline.kill();
        openTimeline = null;
    }
}

function clearSiblingWillChange() {
    document.querySelectorAll('.platform-fade-sibling').forEach((el) => {
        (el as HTMLElement).style.removeProperty('will-change');
    });
}

function open(card: HTMLElement) {
    if (active || !card || card.classList.contains('estrade-block')) return;
    const fast = reduceMotion();

    eventBus.emit('CARD_FOCUSED', { id: card.id });

    active = true;
    sourceCard = card;
    setParallax(false);
    document.body.classList.add('card-focus-active');

    const layer = ensureRoot();
    const stage = layer.querySelector('.card-focus-stage');
    const backdrop = layer.querySelector('.card-focus-backdrop');
    const vignette = layer.querySelector('.card-focus-vignette');
    const aura = layer.querySelector('.card-focus-aura');
    layer.classList.add('card-focus-root--open');
    layer.setAttribute('aria-hidden', 'false');

    const rect = card.getBoundingClientRect();
    const clone = card.cloneNode(true) as HTMLElement;
    clone.classList.add('drag-card--focus-clone');
    stripCloneControls(clone);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const endW = Math.min(960, vw * 0.92);
    const aspectH = rect.height * (endW / Math.max(rect.width, 1));
    const endH = Math.min(Math.max(aspectH, 220), vh * 0.88);
    const endLeft = (vw - endW) / 2;
    const endTop = (vh - endH) / 2;

    gsap.set(clone, {
        position: 'fixed',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        margin: 0,
        zIndex: 10,
        x: 0,
        y: 0,
        filter: 'none',
    });

    if (stage) {
        stage.innerHTML = '';
        stage.appendChild(clone);
    }

    gsap.set(card, { opacity: 0, pointerEvents: 'none', visibility: 'hidden' });
    gsap.set([backdrop, vignette, aura], { opacity: 0 });
    gsap.set(closeBtn, { scale: 0.92, opacity: 0, y: -12 });

    const others = Array.from(document.querySelectorAll('.drag-card')).filter((c) => c !== card) as HTMLElement[];
    others.forEach((c) => {
        c.classList.add('platform-fade-sibling');
        c.style.willChange = 'opacity, transform';
    });

    const sky = document.querySelector('.sky-menu-wrapper');
    const pillars = document.querySelector('.action-pillars');
    const bg = document.getElementById('background');
    const bgImg = bg?.querySelector('.background__image');
    const wrap = document.getElementById('platform-wrapper');

    [sky, pillars, bg, bgImg, wrap, ...others].forEach((el) => {
        if (el) gsap.killTweensOf(el);
    });
    killOpenTimeline();

    const dEnv = fast ? DUR.openFast : DUR.openEnv;
    const dHero = fast ? DUR.openFast : DUR.openHero;
    const easeHero = fast ? 'none' : EASE.hero;

    const tl = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => {
            openTimeline = null;
            clearSiblingWillChange();
        },
    });
    openTimeline = tl;

    tl.addLabel('env', 0)
        .to(backdrop, { opacity: 1, duration: dEnv, ease: EASE.envIn }, 'env')
        .to(
            vignette,
            { opacity: fast ? 0.18 : 0.26, duration: dEnv * 1.05, ease: EASE.envIn },
            'env'
        )
        .to(
            aura,
            { opacity: fast ? 0.22 : 0.35, duration: dEnv * 1.2, ease: EASE.envIn },
            'env+=0.04'
        );

    if (sky) {
        tl.fromTo(
            sky,
            { y: 0, opacity: 1 },
            {
                y: fast ? 0 : -56,
                opacity: fast ? 0.6 : 0,
                duration: dEnv * 0.95,
                ease: EASE.envIn,
            },
            'env'
        );
    }
    if (pillars) {
        tl.fromTo(
            pillars,
            { y: 0, opacity: 1 },
            {
                y: fast ? 0 : 96,
                opacity: fast ? 0.6 : 0,
                duration: dEnv * 0.95,
                ease: EASE.envIn,
            },
            'env+=0.02'
        );
    }

    if (bg) {
        tl.to(
            bg,
            {
                opacity: fast ? 1 : 0.88,
                duration: dEnv,
                ease: EASE.envIn,
            },
            'env'
        );
    }
    if (bgImg) {
        tl.to(
            bgImg,
            {
                scale: fast ? 1 : 1.05,
                duration: dEnv * 1.1,
                ease: EASE.envIn,
                transformOrigin: '50% 60%',
            },
            'env'
        );
    }

    if (wrap) {
        tl.to(
            wrap,
            {
                y: fast ? 0 : 16,
                opacity: fast ? 1 : 0.94,
                scale: fast ? 1 : 0.992,
                duration: dEnv * 1.05,
                ease: EASE.envIn,
                transformOrigin: '50% 95%',
            },
            'env+=0.03'
        );
    }

    const stFn = fast ? 0 : staggerByDistance(card, others);

    tl.fromTo(
        others,
        { opacity: 1, y: 0 },
        {
            opacity: fast ? 0.5 : 0.38,
            y: fast ? 0 : 10,
            duration: dEnv * 1.1,
            ease: EASE.envIn,
            stagger: fast ? 0 : stFn,
        },
        'env+=0.05'
    );

    tl.addLabel('hero', fast ? 0 : 'env+=0.06').fromTo(
        clone,
        {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 8px 0 #dcc890, 0 14px 20px rgba(0,0,0,0.15)',
        },
        {
            left: endLeft,
            top: endTop,
            width: endW,
            height: endH,
            duration: dHero,
            ease: easeHero,
            boxShadow:
                '0 6px 0 rgba(190, 165, 110, 0.55), 0 52px 130px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.45) inset, 0 0 100px rgba(251,235,194,0.18)',
        },
        'hero'
    );

    tl.to(
        closeBtn,
        {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: fast ? 0.05 : 0.42,
            ease: 'power3.out',
        },
        fast ? 0 : 'hero+=0.28'
    );

    escapeHandler = (e) => {
        if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', escapeHandler);

    const quickDims = gsap.quickTo(clone, 'width', { duration: 0.45, ease: 'power3.out' });
    const quickHeight = gsap.quickTo(clone, 'height', { duration: 0.45, ease: 'power3.out' });
    const quickLeft = gsap.quickTo(clone, 'left', { duration: 0.45, ease: 'power3.out' });
    const quickTop = gsap.quickTo(clone, 'top', { duration: 0.45, ease: 'power3.out' });

    onResizeHandler = () => {
        if (!active || !clone?.isConnected) return;
    if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const nw = Math.min(960, w * 0.92);
            const nh = Math.min(
                Math.max(rect.height * (nw / Math.max(rect.width, 1)), 220),
                h * 0.88
            );
            const nl = (w - nw) / 2;
            const nt = (h - nh) / 2;
            quickDims(nw);
            quickHeight(nh);
            quickLeft(nl);
            quickTop(nt);
        });
    };
    window.addEventListener('resize', onResizeHandler, { passive: true });
}

function close() {
    if (!active || !sourceCard) return;
    const fast = reduceMotion();
    const card = sourceCard;

    killOpenTimeline();

    const layer = rootLayer;
    const stage = layer?.querySelector('.card-focus-stage');
    const clone = stage?.querySelector('.drag-card--focus-clone');
    const backdrop = layer?.querySelector('.card-focus-backdrop');
    const vignette = layer?.querySelector('.card-focus-vignette');
    const aura = layer?.querySelector('.card-focus-aura');

    if (document.removeEventListener && escapeHandler) {
        document.removeEventListener('keydown', escapeHandler);
        escapeHandler = null;
    }
    if (onResizeHandler) {
        window.removeEventListener('resize', onResizeHandler);
        onResizeHandler = null;
    }

    const others = Array.from(document.querySelectorAll('.platform-fade-sibling')) as HTMLElement[];

    const sky = document.querySelector('.sky-menu-wrapper');
    const pillars = document.querySelector('.action-pillars');
    const bg = document.getElementById('background');
    const bgImg = bg?.querySelector('.background__image');
    const wrap = document.getElementById('platform-wrapper');

    if (!clone || !layer) {
        gsap.set(card, { opacity: 1, pointerEvents: '', visibility: '' });
        _clearFocusEnvStyles();
        _finishCleanup(card, others);
        if (layer) {
            layer.classList.remove('card-focus-root--open');
            layer.setAttribute('aria-hidden', 'true');
        }
        return;
    }

    [sky, pillars, bg, bgImg, wrap, ...others, clone, backdrop, vignette, aura, closeBtn].forEach(
        (el) => {
            if (el) gsap.killTweensOf(el);
        }
    );

    /* Pas d’animation « retour » vers la carte : on réaffiche la carte au plateau tout de suite,
       puis on ferme seulement le voile (évite les bugs de tween géométrique). */
    clone.remove();
    gsap.set(card, { opacity: 1, pointerEvents: '', visibility: '' });

    const dur = fast ? 0.05 : 0.22;

    const tl = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => {
            _clearFocusEnvStyles();
            _finishCleanup(card, others);
            if (layer) {
                layer.classList.remove('card-focus-root--open');
                layer.setAttribute('aria-hidden', 'true');
            }
        },
    });

    tl.to(closeBtn, { opacity: 0, scale: 0.88, duration: dur * 0.75, ease: 'power2.in' }, 0)
        .to([backdrop, vignette, aura], { opacity: 0, duration: dur, ease: 'power2.inOut' }, 0)
        .to(
            others,
            { opacity: 1, y: 0, duration: dur * 1.05, ease: 'power2.out', stagger: 0 },
            0
        );

    if (sky) {
        tl.to(sky, { y: 0, opacity: 1, duration: dur * 1.1, ease: 'power2.out' }, 0);
    }
    if (pillars) {
        tl.to(pillars, { y: 0, opacity: 1, duration: dur * 1.1, ease: 'power2.out' }, 0);
    }
    if (bg) {
        tl.to(bg, { opacity: 1, duration: dur * 0.95, ease: 'power2.out' }, 0);
    }
    if (bgImg) {
        tl.to(
            bgImg,
            {
                scale: 1,
                duration: dur * 1.05,
                ease: 'power2.out',
                transformOrigin: '50% 60%',
            },
            0
        );
    }
    if (wrap) {
        tl.to(
            wrap,
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: dur * 1.1,
                ease: 'power3.out',
                transformOrigin: '50% 95%',
            },
            0
        );
    }
}

/** Retire les styles inline GSAP du décor si une fermeture partielle les laissait coincés. */
function _clearFocusEnvStyles() {
    const sky = document.querySelector('.sky-menu-wrapper');
    const pillars = document.querySelector('.action-pillars');
    const bg = document.getElementById('background');
    const bgImg = bg?.querySelector('.background__image');
    const wrap = document.getElementById('platform-wrapper');
    [sky, pillars, bg, bgImg, wrap].forEach((el) => {
        if (el) gsap.set(el, { clearProps: 'opacity,transform,filter' });
    });
}

function _finishCleanup(card: HTMLElement, others: HTMLElement[]) {
    others.forEach((c) => {
        c.classList.remove('platform-fade-sibling');
        c.style.removeProperty('will-change');
        gsap.set(c, { clearProps: 'opacity,transform,filter' });
    });
    document.body.classList.remove('card-focus-active');
    setParallax(true);
    active = false;
    sourceCard = null;
}

export function initCardFocus() {
    const platform = document.getElementById('platform-top');
    if (!platform || platform.dataset.cardFocusInit) return;
    platform.dataset.cardFocusInit = '1';

    platform.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const card = target.closest('.drag-card:not(.estrade-block)') as HTMLElement | null;
        if (!card) return;
        if (target.closest('.card-move-btn, .card-resize-btn')) return;
        if (target.closest('a[href], button, input, textarea, select, label')) return;
        if (card.dataset.suppressFocusClick === '1') {
            delete card.dataset.suppressFocusClick;
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        open(card);
    });

    if (typeof window !== 'undefined') {
        (window as any).CardFocus = { open, close };
    }
}

export default { initCardFocus, open, close };
