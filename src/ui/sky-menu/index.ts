/**
 * Sky Menu — composant flottant en haut du plateau.
 * Le HTML est embarqué via Vite (`?raw`) ; pas de fetch runtime.
 */
import html from '@/ui/sky-menu/sky-menu.html?raw';

export function mountSkyMenu(container) {
    if (!container) return;
    container.innerHTML = html;
}
