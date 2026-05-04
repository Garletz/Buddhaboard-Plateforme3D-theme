import autofit from 'autofit.js';
import screenfull from 'screenfull';

/**
 * Mobile 3D Adapter — affiche un lobby spécifique sur appareil tactile,
 * propose un mode liste ou un aperçu 3D avec autofit.
 */
const DESIGN_WIDTH = 1600;
const DESIGN_HEIGHT = 650;

class Mobile3DAdapter {
    constructor() {
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        if (!isTouchDevice) return;

        this.initOverlay();
        this.checkInitialOrientation();

        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => this.handleResize());
    }

    initOverlay(): void {
        const overlayHtml = `
            <div id="mobile-portrait-overlay">
                <div class="mobile-lobby-content">
                    <h1 class="mobile-overlay-title">Bienvenue sur Buddhachannel</h1>
                    <p class="mobile-overlay-text">
                        Notre plateforme 3D immersive est optimisée pour les ordinateurs de bureau ou la version Ios/Android pour les actualités.
                    </p>
                    <div class="mobile-lobby-buttons">
                        <button id="mobile-list-btn" class="mobile-overlay-btn primary-btn">📝 Version Web Mobile (Accès Rapide)</button>
                        <button id="mobile-force-btn" class="mobile-overlay-btn secondary-btn">🕹️ Aperçu 3D (Rotation requise)</button>
                    </div>
                </div>
            </div>
            <button id="mobile-quit-btn">✖ Quitter l'aperçu</button>
        `;
        document.body.insertAdjacentHTML('beforeend', overlayHtml);

        document.getElementById('mobile-list-btn')?.addEventListener('click', () => {
            document.body.classList.add('show-mobile-list');
        });
        document.getElementById('mobile-force-btn')?.addEventListener('click', () => {
            this.forceLandscape();
        });
        document.getElementById('mobile-quit-btn')?.addEventListener('click', () => {
            this.quitLandscape();
        });
    }

    checkInitialOrientation(): void {
        if (window.innerWidth > window.innerHeight && window.innerWidth <= 1250) {
            this.toggleResponsiveCSS(false);
            this.initAutofit();
        }
    }

    handleResize(): void {
        if (window.innerWidth > window.innerHeight && window.innerWidth <= 1250) {
            document.body.classList.remove('force-landscape');
            this.toggleResponsiveCSS(false);
            this.initAutofit();
        } else if (window.innerWidth <= 1250) {
            this.toggleResponsiveCSS(true);
        }
    }

    async forceLandscape(): Promise<void> {
        try {
            if (screenfull.isEnabled) {
                await screenfull.request(document.documentElement);
            }
            if (screen.orientation && (screen.orientation as any).lock) {
                try {
                    await (screen.orientation as any).lock('landscape');
                    return;
                } catch (err) {
                    console.warn(
                        "Le verrouillage d'orientation natif a échoué (souvent sur iOS) :",
                        err
                    );
                }
            }
            if (window.innerHeight > window.innerWidth) {
                document.body.classList.add('force-landscape');
                this.toggleResponsiveCSS(false);

                autofit.init(
                    {
                        dw: DESIGN_WIDTH,
                        dh: DESIGN_HEIGHT,
                        el: '#scene',
                        resize: false,
                    },
                    false
                );

                const scene = document.getElementById('scene');
                if (scene) {
                    const ratioX = window.innerHeight / DESIGN_WIDTH;
                    const ratioY = window.innerWidth / DESIGN_HEIGHT;
                    const scale = Math.min(ratioX, ratioY);

                    scene.style.transform = `scale(${scale})`;
                    scene.style.transformOrigin = `top left`;
                    scene.style.width = `${DESIGN_WIDTH}px`;
                    scene.style.height = `${DESIGN_HEIGHT}px`;
                }
            }
        } catch (error) {
            console.error('Erreur lors du forçage du mode paysage :', error);
        }
    }

    async quitLandscape(): Promise<void> {
        if (screenfull.isEnabled && screenfull.isFullscreen) {
            await screenfull.exit();
        }
        if (screen.orientation && screen.orientation.unlock) {
            try {
                screen.orientation.unlock();
            } catch (err) {}
        }
        if (typeof autofit !== 'undefined' && (autofit as any).off) {
            (autofit as any).off();
            const scene = document.getElementById('scene');
            if (scene) {
                scene.style.transform = '';
                scene.style.width = '';
                scene.style.height = '';
            }
        }
        document.body.classList.remove('force-landscape', 'show-mobile-list');
        this.toggleResponsiveCSS(true);
    }

    /** Bascule entre `(max-width: 1250px)` et un media factice pour activer/désactiver le CSS mobile. */
    toggleResponsiveCSS(enable: boolean): void {
        const targetMedia = enable ? '(max-width: 1250px)' : 'screen and (max-width: 10px)';
        const searchMedia = enable ? 'screen and (max-width: 10px)' : '(max-width: 1250px)';

        for (const sheet of Array.from(document.styleSheets)) {
            try {
                for (const rule of Array.from(sheet.cssRules)) {
                    if (
                        rule instanceof CSSMediaRule &&
                        rule.media.mediaText.includes(searchMedia.replace('screen and ', ''))
                    ) {
                        rule.media.mediaText = targetMedia;
                    }
                }
            } catch (e) {
                /* ignore CORS stylesheet errors */
            }
        }
    }

    initAutofit(): void {
        autofit.init({
            dw: DESIGN_WIDTH,
            dh: DESIGN_HEIGHT,
            el: '#scene',
            resize: true,
        });
    }
}

export default Mobile3DAdapter;
