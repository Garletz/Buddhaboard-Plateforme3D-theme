/* =============================================
   PHYSICS & STACKING LOGIC
   Détection de collision et élévation Z des cartes
   sur le plateau 3D.
   ============================================= */

interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

interface Point {
    x: number;
    y: number;
}

const Physics = (() => {
    'use strict';

    /** Coordonnées « brutes » au sol (sans transform de profondeur). */
    function getRawRect(el: HTMLElement): Rect {
        const container = (el.parentElement || document.getElementById('platform-top')) as HTMLElement;
        const parentW = container ? container.clientWidth : window.innerWidth * 0.68;
        const parentH = container ? container.clientHeight : 800;

        const left = ((parseFloat(el.style.left) || 0) / 100) * parentW;
        const top = ((parseFloat(el.style.top) || 0) / 100) * parentH;

        return {
            left,
            top,
            right: left + el.offsetWidth,
            bottom: top + el.offsetHeight,
        };
    }

    /** Collision AABB sur l’empreinte au sol (les cartes peuvent se chevaucher en profondeur). */
    function isColliding(rect1: Rect, rect2: Rect, isEstrade1 = false, isEstrade2 = false): boolean {
        const f1 = isEstrade1
            ? rect1
            : { left: rect1.left, right: rect1.right, bottom: rect1.bottom, top: rect1.bottom - 25 };
        const f2 = isEstrade2
            ? rect2
            : { left: rect2.left, right: rect2.right, bottom: rect2.bottom, top: rect2.bottom - 25 };

        return !(
            f1.right <= f2.left ||
            f1.left >= f2.right ||
            f1.bottom <= f2.top ||
            f1.top >= f2.bottom
        );
    }

    function getCenter(rect: Rect): Point {
        return {
            x: rect.left + (rect.right - rect.left) / 2,
            y: rect.top + (rect.bottom - rect.top) / 2,
        };
    }

    function getEstradeUnderCard(card: HTMLElement, proposedRawLeft: number, proposedRawTop: number): HTMLElement | null {
        const estrades = Array.from(document.querySelectorAll('.estrade-block')).filter(
            (c) => c !== card
        ) as HTMLElement[];
        const proposedRect = {
            left: proposedRawLeft,
            top: proposedRawTop,
            right: proposedRawLeft + card.offsetWidth,
            bottom: proposedRawTop + card.offsetHeight,
        };
        const center = getCenter(proposedRect);

        for (const estrade of estrades) {
            const eRect = getRawRect(estrade);
            if (
                center.x >= eRect.left &&
                center.x <= eRect.right &&
                center.y >= eRect.top &&
                center.y <= eRect.bottom
            ) {
                return estrade;
            }
        }
        return null;
    }

    function getCardsOnEstrade(estrade: HTMLElement): HTMLElement[] {
        const allCards = Array.from(document.querySelectorAll('.drag-card')).filter(
            (c) => c !== estrade && !c.classList.contains('estrade-block')
        ) as HTMLElement[];
        const eRect = getRawRect(estrade);

        return allCards.filter((card) => {
            const cRect = getRawRect(card);
            const center = getCenter(cRect);
            return (
                center.x >= eRect.left &&
                center.x <= eRect.right &&
                center.y >= eRect.top &&
                center.y <= eRect.bottom
            );
        });
    }

    function updateElevation(card: HTMLElement, newRawLeft: number, newRawTop: number): void {
        if (card.classList.contains('estrade-block')) return;
        const estradeUnder = getEstradeUnderCard(card, newRawLeft, newRawTop);
        card.classList.toggle('on-estrade', !!estradeUnder);
    }

    function updateAllElevations(): void {
        const allCards = Array.from(document.querySelectorAll('.drag-card')).filter(
            (c) => !c.classList.contains('estrade-block')
        ) as HTMLElement[];
        allCards.forEach((card) => {
            const rect = getRawRect(card);
            updateElevation(card, rect.left, rect.top);
        });
    }

    return {
        getRawRect,
        isColliding,
        getEstradeUnderCard,
        getCardsOnEstrade,
        updateElevation,
        updateAllElevations,
    };
})();

if (typeof window !== 'undefined') {
    (window as any).Physics = Physics;
}

export default Physics;
