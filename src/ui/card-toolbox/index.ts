/**
 * Card Toolbox — palette latérale pour ajouter des cartes / exporter la config.
 *
 * Usage :
 *   import { mountCardToolbox } from '@/ui/card-toolbox/index';
 *   mountCardToolbox(document.body, { onAddCard, onExportConfig });
 *
 * Ne dépend d’aucune globale ; les actions sont des callbacks injectés.
 */
import html from '@/ui/card-toolbox/card-toolbox.html?raw';

export function mountCardToolbox(container, { onAddCard, onExportConfig } = {}) {
    if (!container) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const node = wrap.firstElementChild;
    container.prepend(node);

    node.addEventListener('click', (e) => {
        const addBtn = e.target.closest('[data-add-card]');
        if (addBtn) {
            const id = addBtn.dataset.addCard;
            onAddCard?.(id, addBtn);
            return;
        }
        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn) {
            const action = actionBtn.dataset.action;
            if (action === 'export-config') onExportConfig?.(actionBtn);
        }
    });

    return node;
}
