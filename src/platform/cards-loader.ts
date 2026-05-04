/**
 * Chargeur de fragments de cartes — basé sur Vite `import.meta.glob`.
 * Pas de manifest manuel : tout fichier `.html` posé dans `src/cards/fragments/`
 * est automatiquement disponible.
 *
 * Convention de nommage des fichiers : `NN_slug.html`
 *   - `NN` = ordre d’affichage (00 = estrade en premier)
 *   - `slug` = identifiant unique (ex. « editorial », « don », …)
 *
 * Les fichiers commençant par `_` sont ignorés (ex. `_SQUELETTE_CARTE.html`).
 */

interface CardFragment {
    id: string;
    file: string;
    order: number;
    html: string;
}

const FRAGMENT_MODULES = import.meta.glob('@/cards/fragments/*.html', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

/**
 * @returns {CardFragment[]} cartes triées par préfixe NN.
 */
export function listCardFragments(): CardFragment[] {
    return Object.entries(FRAGMENT_MODULES)
        .map(([path, html]) => {
            const fileName = path.split('/').pop()?.replace(/\.html$/, '') || '';
            if (!fileName || fileName.startsWith('_')) return null;
            const m = fileName.match(/^(\d+)[_-](.+)$/);
            const order = m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
            const id = m ? m[2] : fileName;
            
            // Injection propre des attributs de plateforme juste après l'ouverture du tag <div
            const uniqueId = id;
            const sluggedHtml = html.replace(
                /<div\s+/, 
                `<div id="${uniqueId}" data-slug="${id}" `
            );
            
            return { id, file: fileName, order, html: sluggedHtml };
        })
        .filter((c): c is CardFragment => c !== null)
        .sort((a, b) => (a.order - b.order) || a.id.localeCompare(b.id));
}

/** HTML concaténé dans l’ordre — drop-in remplaçant l’ancien `loadCardsJoined()`. */
export function loadCardsJoined(): string {
    return listCardFragments()
        .map((c) => c.html)
        .join('\n');
}

/** Récupère un fragment par identifiant (ex. « editorial », « don », « 04_editorial »). */
export function getCardFragment(idOrFile: string): CardFragment | null {
    const list = listCardFragments();
    return (
        list.find((c) => c.id === idOrFile) ||
        list.find((c) => c.file === idOrFile) ||
        null
    );
}

/** Convertit largeurs / positions en PX issues des fragments en % plateau. */
export function applyPercentSizing(containerEl: HTMLElement, refWidth: number, refHeight: number): void {
    containerEl.querySelectorAll('.drag-card').forEach((c) => {
        const card = c as HTMLElement;
        if (card.style.width.includes('px')) {
            const px = parseInt(card.style.width, 10);
            card.style.width = ((px / refWidth) * 100).toFixed(1) + '%';
        }
        if (card.style.height && card.style.height.includes('px')) {
            const px = parseInt(card.style.height, 10);
            card.style.height = ((px / refHeight) * 100).toFixed(1) + '%';
        }
        if (card.style.left.includes('px')) {
            const px = parseInt(card.style.left, 10);
            card.style.left = ((px / refWidth) * 100).toFixed(1) + '%';
        }
        if (card.style.top.includes('px')) {
            const px = parseInt(card.style.top, 10);
            card.style.top = ((px / refHeight) * 100).toFixed(1) + '%';
        }
    });
}
