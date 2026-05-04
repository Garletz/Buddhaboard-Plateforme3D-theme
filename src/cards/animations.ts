/* =============================================
   ANIMATIONS — Intro cinématique + entrées de cartes
   ============================================= */

import gsap from 'gsap';
import { bindIntroCardSounds } from '../audio/card-audio';

const Animations = (() => {
    'use strict';

    let particleContainer: HTMLElement | null = null;

    function _createParticleLayer() {
        particleContainer = document.createElement('div');
        particleContainer.className = 'particle-layer';
        particleContainer.setAttribute('aria-hidden', 'true');
        const scene = document.getElementById('scene');
        if (!scene) return;
        scene.appendChild(particleContainer);

        for (let i = 0; i < 35; i++) {
            const p = document.createElement('div');
            p.className = 'particle';

            const size = 2 + Math.random() * 4;
            const startX = Math.random() * 100;
            const startY = 60 + Math.random() * 40;
            const duration = 8 + Math.random() * 14;
            const delay = Math.random() * 6;
            const opacity = 0.15 + Math.random() * 0.35;

            p.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${startX}%;
                top: ${startY}%;
                opacity: 0;
            `;

            particleContainer.appendChild(p);

            gsap.to(p, {
                y: -(200 + Math.random() * 400),
                x: (Math.random() - 0.5) * 150,
                opacity,
                duration,
                delay: delay + 3,
                ease: 'none',
                repeat: -1,
                yoyo: false,
                onRepeat: () => {
                    gsap.set(p, {
                        x: 0,
                        y: 0,
                        left: Math.random() * 100 + '%',
                        top: 60 + Math.random() * 40 + '%',
                    });
                },
            });

            gsap.to(p, {
                opacity: 0,
                duration: duration * 0.4,
                delay: delay + 3 + duration * 0.6,
                ease: 'power1.in',
                repeat: -1,
            });
        }
    }

    function playIntro(): gsap.core.Timeline | void {
        const scene = document.getElementById('scene');
        const bg = document.getElementById('background');
        const platformWrapper = document.getElementById('platform-wrapper');
        const platformTop = document.getElementById('platform-top');
        const toolbox = document.querySelector('.card-toolbox') as HTMLElement;

        if (!scene || !platformWrapper) {
            console.warn('[Animations] Missing DOM elements, skipping intro.');
            return;
        }

        const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: () => {
                console.log('[Animations] Intro sequence complete.');
                _setupHoverEffects();
                _createParticleLayer();
            },
        });

        gsap.set(scene, { opacity: 1 });
        gsap.set(bg, { scale: 1.1, opacity: 0 });
        gsap.set(platformWrapper, { y: '120%', opacity: 0 });
        if (toolbox) gsap.set(toolbox, { x: -300, opacity: 0 });

        const menuWrapper = document.querySelector('.sky-menu-wrapper') as HTMLElement;
        if (menuWrapper) {
            gsap.set(menuWrapper, {
                y: -150,
                opacity: 0,
                rotationX: -40,
                transformPerspective: 1200,
            });
        }

        const allCards = platformTop
            ? Array.from(platformTop.querySelectorAll('.drag-card:not(.estrade-block)'))
            : [];
        gsap.set(allCards, {
            opacity: 0,
            scale: 0.7,
            rotationX: 45,
            y: 60,
            transformPerspective: 800,
        });

        tl.to(
            bg,
            {
                opacity: 1,
                scale: 1,
                duration: 1.8,
                ease: 'power2.out',
            },
            0
        );

        tl.to(
            platformWrapper,
            {
                y: '0%',
                opacity: 1,
                duration: 1.6,
                ease: 'power4.out',
            },
            0.6
        );

        const estrade = platformTop ? (platformTop.querySelector('.estrade-block') as HTMLElement) : null;
        if (estrade) {
            gsap.set(estrade, { opacity: 0 });
            tl.to(
                estrade,
                {
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.inOut',
                    clearProps: 'opacity',
                },
                1.0
            );
        }

        const regularCards = platformTop
            ? (Array.from(platformTop.querySelectorAll('.drag-card:not(.estrade-block)')) as HTMLElement[])
            : [];

        if (regularCards.length > 0) {
            tl.to(
                regularCards,
                {
                    opacity: 1,
                    scale: 1,
                    rotationX: 0,
                    y: 0,
                    duration: 0.8,
                    stagger: { each: 0.12, from: 'center' },
                    ease: 'back.out(1.7)',
                    clearProps: 'transform,opacity',
                },
                1.8
            );
        }

        const actionPillars = Array.from(document.querySelectorAll('.action-pillar')) as HTMLElement[];
        if (actionPillars.length > 0) {
            tl.fromTo(
                actionPillars,
                { y: 150, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1.2,
                    stagger: 0.15,
                    ease: 'back.out(1.4)',
                    clearProps: 'all',
                },
                2.0
            );
        }

        if (toolbox) {
            tl.to(
                toolbox,
                {
                    x: 0,
                    opacity: 1,
                    duration: 0.7,
                    ease: 'power3.out',
                },
                2.4
            );
        }

        if (menuWrapper) {
            tl.to(
                menuWrapper,
                {
                    y: 0,
                    opacity: 1,
                    rotationX: -24,
                    duration: 2.2,
                    ease: 'power4.out',
                    onComplete: () => {
                        gsap.to(menuWrapper, {
                            y: '+=10',
                            duration: 3,
                            ease: 'sine.inOut',
                            repeat: -1,
                            yoyo: true,
                        });
                        gsap.to(menuWrapper, {
                            rotationX: '-=2',
                            duration: 4,
                            ease: 'sine.inOut',
                            repeat: -1,
                            yoyo: true,
                        });
                    },
                },
                1.2
            );
        }

        return tl;
    }

    function animateCardIn(card: HTMLElement | null): void {
        if (!card) return;
        gsap.set(card, {
            opacity: 0,
            scale: 0.5,
            rotationX: 60,
            y: 80,
            transformPerspective: 800,
        });
        gsap.to(card, {
            opacity: 1,
            scale: 1,
            rotationX: 0,
            y: 0,
            duration: 0.7,
            ease: 'back.out(1.7)',
            clearProps: 'transform,opacity',
        });
    }

    /** Entrée des cartes + notes (utilisé par le bouton « recharger »). */
    function playCardsEntranceWithSounds(regularCards: HTMLElement[]): gsap.core.Timeline | null {
        if (!regularCards.length) return null;
        gsap.set(regularCards, {
            opacity: 0,
            scale: 0.7,
            rotationX: 45,
            y: 60,
            transformPerspective: 800,
        });
        const tl = gsap.timeline();
        tl.to(
            regularCards,
            {
                opacity: 1,
                scale: 1,
                rotationX: 0,
                y: 0,
                duration: 0.8,
                stagger: { each: 0.12, from: 'center' },
                ease: 'back.out(1.7)',
                clearProps: 'transform,opacity',
            },
            0
        );
        bindIntroCardSounds(tl, regularCards, 0, 0.12);
        return tl;
    }

    function animateCardOut(card: HTMLElement): gsap.core.Tween {
        return gsap.to(card, {
            opacity: 0,
            scale: 0.5,
            rotationX: -30,
            y: 40,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => card.remove(),
        });
    }

    function _setupHoverEffects(): void {
        const cards = Array.from(document.querySelectorAll('.drag-card:not(.estrade-block)')) as HTMLElement[];
        cards.forEach((card) => _bindCardHover(card));

        const platformTop = document.getElementById('platform-top');
        if (platformTop) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                    m.addedNodes.forEach((node) => {
                        const el = node as HTMLElement;
                        if (
                            el.nodeType === 1 &&
                            el.classList.contains('drag-card') &&
                            !el.classList.contains('estrade-block')
                        ) {
                            _bindCardHover(el);
                        }
                    });
                });
            });
            observer.observe(platformTop, { childList: true });
        }
    }

    function _bindCardHover(card: HTMLElement): void {
        if (card.dataset.hoverBound) return;
        card.dataset.hoverBound = 'true';

        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                boxShadow:
                    '0 12px 0 #dcc890, 0 20px 35px rgba(0,0,0,0.22), 0 0 25px rgba(251, 235, 194, 0.3)',
                duration: 0.3,
                ease: 'power2.out',
                overwrite: 'auto',
            });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                boxShadow: '0 8px 0 #dcc890, 0 14px 20px rgba(0,0,0,0.15)',
                duration: 0.4,
                ease: 'power2.inOut',
                overwrite: 'auto',
            });
        });
    }

    function animateButtonPress(btn: HTMLElement): void {
        gsap.fromTo(btn, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' });
    }

    return {
        playIntro,
        animateCardIn,
        animateCardOut,
        animateButtonPress,
        playCardsEntranceWithSounds,
    };
})();

if (typeof window !== 'undefined') {
    (window as any).Animations = Animations;
}

export default Animations;
