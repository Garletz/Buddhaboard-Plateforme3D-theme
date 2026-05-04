/* =============================================
   DRAGGABLE LOGIC
   • Cartes : déplacer via poignée 3D ; redimensionner via poignée SE
   • Clic sur la carte → CardFocus (sauf contrôles / liens / champs)
   • Relâchée hors plateau → disparition
   • Estrade : drag sur la carte + poignées de bord classiques
   ============================================= */

import Physics from '../platform/physics';
import { store } from '../core/Store';
import { eventBus } from '../core/EventBus';

interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

const Draggable = (() => {
    'use strict';

    function isColliding(rect1: Rect, rect2: Rect): boolean {
        return !(
            rect1.right <= rect2.left ||
            rect1.left >= rect2.right ||
            rect1.bottom <= rect2.top ||
            rect1.top >= rect2.bottom
        );
    }

    function isCardOutsidePlatform(card: HTMLElement, container: HTMLElement): boolean {
        const cr = card.getBoundingClientRect();
        const pr = container.getBoundingClientRect();
        const cx = (cr.left + cr.right) / 2;
        const cy = (cr.top + cr.bottom) / 2;
        const centerOutside =
            cx < pr.left || cx > pr.right || cy < pr.top || cy > pr.bottom;
        const noOverlap =
            cr.right < pr.left ||
            cr.left > pr.right ||
            cr.bottom < pr.top ||
            cr.top > pr.bottom;
        return centerOutside || noOverlap;
    }

    function vanishCard(card: HTMLElement): void {
        card.style.transition = 'opacity 0.38s ease, transform 0.38s ease';
        card.style.pointerEvents = 'none';
        requestAnimationFrame(() => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.86)';
        });

        eventBus.emit('CARD_VANISHED', { id: card.id });

        setTimeout(() => {
            if (card.parentElement) card.remove();
            store.removeCard(card.id);
            try {
                Physics.updateAllElevations();
            } catch (_) {}
        }, 400);
    }

    function bindSEResize(card: HTMLElement, _container: HTMLElement, triggerEl: HTMLElement): void {
        triggerEl.addEventListener('mousedown', (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const startMouseX = e.clientX;
            const startMouseY = e.clientY;
            const startWidth = card.offsetWidth;
            const startHeight = card.offsetHeight;

            let moved = false;

            const onMouseMove = (moveE: MouseEvent) => {
                if (
                    !moved &&
                    (Math.abs(moveE.clientX - startMouseX) > 4 ||
                        Math.abs(moveE.clientY - startMouseY) > 4)
                ) {
                    moved = true;
                }
                const parent = card.parentElement as HTMLElement;
                if (!parent) return;
                const parentW = parent.clientWidth;
                const parentH = parent.clientHeight;

                const newWidth = startWidth + (moveE.clientX - startMouseX);
                const newHeight = startHeight + (moveE.clientY - startMouseY);
                if (newWidth > 80) {
                    card.style.width = (newWidth / parentW) * 100 + '%';
                }
                if (newHeight > 50) {
                    card.style.height = (newHeight / parentH) * 100 + '%';
                }
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                if (moved) {
                    card.dataset.suppressFocusClick = '1';
                    setTimeout(() => {
                        if (card.isConnected) delete card.dataset.suppressFocusClick;
                    }, 80);
                }
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    function createTooldock(card: HTMLElement): { moveBtn: HTMLElement; resizeBtn: HTMLElement } {
        const moveBtn = document.createElement('button');
        moveBtn.type = 'button';
        moveBtn.className = 'card-move-btn';
        moveBtn.setAttribute('aria-label', 'Déplacer la carte');
        moveBtn.innerHTML = `<svg class="card-dpad-icon" viewBox="0 0 36 36" aria-hidden="true" width="11" height="11">
            <rect x="13" y="5" width="10" height="9" rx="2" fill="currentColor" opacity=".85"/>
            <rect x="13" y="22" width="10" height="9" rx="2" fill="currentColor" opacity=".85"/>
            <rect x="5" y="13" width="9" height="10" rx="2" fill="currentColor" opacity=".85"/>
            <rect x="22" y="13" width="9" height="10" rx="2" fill="currentColor" opacity=".85"/>
            <circle cx="18" cy="18" r="4" fill="currentColor" opacity=".2"/>
        </svg>`;

        const resizeBtn = document.createElement('button');
        resizeBtn.type = 'button';
        resizeBtn.className = 'card-resize-btn';
        resizeBtn.setAttribute('aria-label', 'Redimensionner');
        resizeBtn.innerHTML =
            '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M14 10l8-8M22 6V2h-4M10 14L2 22M2 18v4h4"/></svg>';

        const header = card.querySelector('.drag-card__header');
        if (header) {
            const wrap = document.createElement('span');
            wrap.className = 'drag-card__header-text';
            while (header.firstChild) {
                wrap.appendChild(header.firstChild);
            }
            header.appendChild(wrap);
            header.appendChild(moveBtn);
        } else {
            moveBtn.classList.add('card-move-btn--floating');
            card.appendChild(moveBtn);
        }

        card.appendChild(resizeBtn);
        return { moveBtn, resizeBtn };
    }

    function makeDraggable(card: HTMLElement, container: HTMLElement): void {
        if (card.dataset.draggableInited) return;
        card.dataset.draggableInited = 'true';

        card.style.resize = 'none';

        const isEstrade = card.classList.contains('estrade-block');

        if (!isEstrade) {
            const { resizeBtn } = createTooldock(card);
            bindSEResize(card, container, resizeBtn);
        }

        const edgeHandles = isEstrade ? ['n', 's', 'e', 'w', 'se'] : [];
        edgeHandles.forEach((side) => {
            const h = document.createElement('div');
            h.className = `resizer resizer-${side}`;
            h.style.position = 'absolute';
            h.style.zIndex = '5';

            if (side === 'n') {
                h.style.top = '0';
                h.style.left = '0';
                h.style.width = '100%';
                h.style.height = '6px';
                h.style.cursor = 'ns-resize';
            }
            if (side === 's') {
                h.style.bottom = '0';
                h.style.left = '0';
                h.style.width = '100%';
                h.style.height = '6px';
                h.style.cursor = 'ns-resize';
            }
            if (side === 'e') {
                h.style.top = '0';
                h.style.right = '0';
                h.style.width = '6px';
                h.style.height = '100%';
                h.style.cursor = 'ew-resize';
            }
            if (side === 'w') {
                h.style.top = '0';
                h.style.left = '0';
                h.style.width = '6px';
                h.style.height = '100%';
                h.style.cursor = 'ew-resize';
            }
            if (side === 'se') {
                h.style.bottom = '0';
                h.style.right = '0';
                h.style.width = '12px';
                h.style.height = '12px';
                h.style.cursor = 'nwse-resize';
                h.style.background = 'rgba(0,0,0,0.1)';
                h.style.borderRadius = '0 0 8px 0';
            }

            h.addEventListener('mousedown', (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();

                const startMouseX = e.clientX;
                const startMouseY = e.clientY;
                const startWidth = card.offsetWidth;
                const startHeight = card.offsetHeight;
                const startLeft = card.offsetLeft;
                const startTop = card.offsetTop;

                const onMouseMove = (moveE: MouseEvent) => {
                    const parent = card.parentElement as HTMLElement;
                    if (!parent) return;
                    const parentW = parent.clientWidth;
                    const parentH = parent.clientHeight;

                    if (side.includes('e')) {
                        const newWidth = startWidth + (moveE.clientX - startMouseX);
                        card.style.width = (newWidth / parentW) * 100 + '%';
                    }
                    if (side.includes('s')) {
                        const newHeight = startHeight + (moveE.clientY - startMouseY);
                        card.style.height = (newHeight / parentH) * 100 + '%';
                    }
                    if (side.includes('w')) {
                        const newWidth = startWidth - (moveE.clientX - startMouseX);
                        if (newWidth > 100) {
                            card.style.width = (newWidth / parentW) * 100 + '%';
                            card.style.left =
                                ((startLeft + (moveE.clientX - startMouseX)) / parentW) * 100 + '%';
                        }
                    }
                    if (side.includes('n')) {
                        const newHeight = startHeight - (moveE.clientY - startMouseY);
                        if (newHeight > 50) {
                            card.style.height = (newHeight / parentH) * 100 + '%';
                            card.style.top =
                                ((startTop + (moveE.clientY - startMouseY)) / parentH) * 100 + '%';
                        }
                    }
                };

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            card.appendChild(h);
        });

        let isDragging = false;
        let dragMoved = false;
        let startX: number;
        let startY: number;
        let initialLeft: number;
        let initialTop: number;
        let dragChildren: Array<{ el: HTMLElement; initialLeft: number; initialTop: number }> = [];

        card.addEventListener('mousedown', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!isEstrade) {
                if (target.closest?.('.card-resize-btn')) return;
                if (!target.closest?.('.card-move-btn')) return;
            } else {
                if (target.closest?.('.resizer')) return;
            }

            const cRect = card.getBoundingClientRect();
            if (isEstrade && e.clientX > cRect.right - 20 && e.clientY > cRect.bottom - 20) return;

            isDragging = true;
            dragMoved = false;

            try {
                const rawRect = Physics.getRawRect(card);
                initialLeft = rawRect.left;
                initialTop = rawRect.top;
            } catch (_) {
                initialLeft = card.offsetLeft;
                initialTop = card.offsetTop;
            }

            startX = e.clientX;
            startY = e.clientY;

            if (isEstrade) {
                dragChildren = Physics.getCardsOnEstrade(card).map((child) => ({
                    el: child,
                    initialLeft: Physics.getRawRect(child).left,
                    initialTop: Physics.getRawRect(child).top,
                }));
            } else {
                dragChildren = [];
            }

            document.querySelectorAll('.drag-card').forEach((c) => {
                const cel = c as HTMLElement;
                if (cel.classList.contains('estrade-block')) {
                    cel.style.zIndex = '0';
                } else {
                    cel.style.zIndex = cel === card ? '100' : '10';
                }
            });

            card.classList.add('card--dragging');
            eventBus.emit('DRAG_START', { id: card.id });
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = (e.clientY - startY) * 1.5;

            if (Math.abs(dx) + Math.abs(dy) > 4) dragMoved = true;

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            const maxLeft = container.clientWidth - card.offsetWidth;
            const maxTop = container.clientHeight - card.offsetHeight;

            if (isEstrade) {
                newLeft = Math.max(0, Math.min(newLeft, maxLeft));
                newTop = Math.max(0, Math.min(newTop, maxTop));
            }

            const isE = isEstrade;
            const otherCards = Array.from(document.querySelectorAll('.drag-card')).filter((c) => {
                if (c === card) return false;
                if (isE) return c.classList.contains('estrade-block');
                return !c.classList.contains('estrade-block');
            }) as HTMLElement[];

            const proposedRect = {
                left: newLeft,
                top: newTop,
                right: newLeft + card.offsetWidth,
                bottom: newTop + card.offsetHeight,
            };

            const checkCol = (r1: Rect, r2: Rect, isE1: boolean, isE2: boolean) =>
                Physics.isColliding ? Physics.isColliding(r1, r2, isE1, isE2) : isColliding(r1, r2);

            let collision = false;
            for (const other of otherCards) {
                const otherRect = Physics.getRawRect
                    ? Physics.getRawRect(other)
                    : {
                          left: other.offsetLeft,
                          top: other.offsetTop,
                          right: other.offsetLeft + other.offsetWidth,
                          bottom: other.offsetTop + other.offsetHeight,
                      };

                if (
                    checkCol(
                        proposedRect,
                        otherRect,
                        isE,
                        other.classList.contains('estrade-block')
                    )
                ) {
                    collision = true;
                    break;
                }
            }

            const applyPositions = (targetLeft: number, targetTop: number) => {
                card.style.left = (targetLeft / container.clientWidth) * 100 + '%';
                card.style.top = (targetTop / container.clientHeight) * 100 + '%';

                if (isEstrade && dragChildren.length > 0) {
                    const actualDx = targetLeft - initialLeft;
                    const actualDy = targetTop - initialTop;
                    dragChildren.forEach((child) => {
                        child.el.style.left =
                            ((child.initialLeft + actualDx) / container.clientWidth) * 100 + '%';
                        child.el.style.top =
                            ((child.initialTop + actualDy) / container.clientHeight) * 100 + '%';
                    });
                } else if (!isEstrade) {
                    Physics.updateElevation(card, targetLeft, targetTop);
                }
            };

            if (!collision) {
                applyPositions(newLeft, newTop);
            } else {
                const currentRaw = Physics.getRawRect
                    ? Physics.getRawRect(card)
                    : {
                          left: card.offsetLeft,
                          top: card.offsetTop,
                          right: card.offsetLeft + card.offsetWidth,
                          bottom: card.offsetTop + card.offsetHeight,
                      };

                const rectX = { ...proposedRect, top: currentRaw.top, bottom: currentRaw.bottom };
                const colX = otherCards.some((other) => {
                    const oRect = Physics.getRawRect
                        ? Physics.getRawRect(other)
                        : {
                              left: other.offsetLeft,
                              top: other.offsetTop,
                              right: other.offsetLeft + other.offsetWidth,
                              bottom: other.offsetTop + other.offsetHeight,
                          };
                    return checkCol(rectX, oRect, isE, other.classList.contains('estrade-block'));
                });

                const rectY = { ...proposedRect, left: currentRaw.left, right: currentRaw.right };
                const colY = otherCards.some((other) => {
                    const oRect = Physics.getRawRect
                        ? Physics.getRawRect(other)
                        : {
                              left: other.offsetLeft,
                              top: other.offsetTop,
                              right: other.offsetLeft + other.offsetWidth,
                              bottom: other.offsetTop + other.offsetHeight,
                          };
                    return checkCol(rectY, oRect, isE, other.classList.contains('estrade-block'));
                });

                let finalLeft = currentRaw.left;
                let finalTop = currentRaw.top;

                if (!colX) finalLeft = newLeft;
                if (!colY) finalTop = newTop;

                if (!colX || !colY) applyPositions(finalLeft, finalTop);
            }
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            card.classList.remove('card--dragging');

            if (dragMoved) {
                card.dataset.suppressFocusClick = '1';
                setTimeout(() => {
                    if (card.isConnected) delete card.dataset.suppressFocusClick;
                }, 80);
            }

            if (!isEstrade && card.parentElement === container) {
                if (isCardOutsidePlatform(card, container)) {
                    vanishCard(card);
                    return;
                }
            }

            if (isEstrade) {
                Physics.updateAllElevations?.();
            } else if (card.isConnected) {
                const raw = Physics.getRawRect(card);
                Physics.updateElevation(card, raw.left, raw.top);
            }

            store.updateCardPosition(
                card.id,
                parseFloat(card.style.left) || 0,
                parseFloat(card.style.top) || 0,
                parseInt(card.style.zIndex || '0', 10)
            );

            eventBus.emit('DRAG_END', {
                id: card.id,
                x: parseFloat(card.style.left) || 0,
                y: parseFloat(card.style.top) || 0
            });
        });
    }

    function init(): void {
        const container = document.getElementById('platform-top');
        if (!container) return;
        const cards = document.querySelectorAll('.drag-card');
        cards.forEach((c) => {
            const card = c as HTMLElement;
            const parentW = container.clientWidth;
            const parentH = container.clientHeight;

            if (card.style.width.includes('px')) {
                card.style.width =
                    ((parseInt(card.style.width, 10) / parentW) * 100).toFixed(1) + '%';
            }
            if (card.style.height && card.style.height.includes('px')) {
                card.style.height =
                    ((parseInt(card.style.height, 10) / parentH) * 100).toFixed(1) + '%';
            }
            if (card.style.left.includes('px')) {
                card.style.left =
                    ((parseInt(card.style.left, 10) / parentW) * 100).toFixed(1) + '%';
            }
            if (card.style.top.includes('px')) {
                card.style.top =
                    ((parseInt(card.style.top, 10) / parentH) * 100).toFixed(1) + '%';
            }

            makeDraggable(card, container);
        });
        console.log(
            '[Draggable] Initialised (poignées déplacer / resize, hors plateau = disparition)'
        );
    }

    return { init, makeDraggable };
})();

if (typeof window !== 'undefined') {
    (window as any).Draggable = Draggable;
}

export default Draggable;
