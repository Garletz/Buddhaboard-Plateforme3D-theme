/**
 * Action Pillars — barre HUD bas (4 piliers d’action).
 * Le HTML est embarqué via Vite (`?raw`) ; pas de fetch runtime.
 */
import html from '@/ui/action-pillars/action-pillars.html?raw';

export function mountActionPillars(container) {
    if (!container) return;
    container.innerHTML = html;
}
