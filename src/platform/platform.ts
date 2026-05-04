/* =============================================
   PLATFORM
   Parallax + responsive perspective du plateau 3D.
   ============================================= */

interface PlatformConfig {
    basePerspective: number;
    baseRotateX: number;
    frontPerspective: number;
    frontRotateX: number;
    parallaxEnabled: boolean;
    parallaxStrength: number;
    resizeDebounce: number;
}

const Platform = (() => {
    'use strict';

    let topFaceEl: HTMLElement | null = null;
    let frontFaceEl: HTMLElement | null = null;
    let platformEl: HTMLElement | null = null;

    const CONFIG: PlatformConfig = {
        basePerspective: 820,
        baseRotateX: 24,
        frontPerspective: 800,
        frontRotateX: -19,
        parallaxEnabled: true,
        parallaxStrength: 0.1,
        resizeDebounce: 150,
    };

    let currentRotateX = CONFIG.baseRotateX;
    let targetRotateX = CONFIG.baseRotateX;
    let rafId: number | null = null;
    let isInitialised = false;

    function init() {
        platformEl = document.getElementById('platform');
        topFaceEl = document.getElementById('platform-top');
        frontFaceEl = document.getElementById('platform-front');

        if (!platformEl || !topFaceEl) {
            console.warn('[Platform] DOM elements not found.');
            return;
        }

        _updateResponsive();
        _bindEvents();
        isInitialised = true;
        console.log('[Platform] Ready.');
    }

    function _bindEvents() {
        if (CONFIG.parallaxEnabled) {
            document.addEventListener('mousemove', _onMouseMove, { passive: true });
            _startLoop();
        }

        let timer: ReturnType<typeof setTimeout>;
        window.addEventListener(
            'resize',
            () => {
                clearTimeout(timer);
                timer = setTimeout(_updateResponsive, CONFIG.resizeDebounce);
            },
            { passive: true }
        );
    }

    function _onMouseMove(e: MouseEvent) {
        if (!CONFIG.parallaxEnabled) return;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        targetRotateX = CONFIG.baseRotateX - ny * CONFIG.parallaxStrength * 5;
    }

    function _startLoop() {
        function tick() {
            currentRotateX += (targetRotateX - currentRotateX) * 0.06;
            if (topFaceEl) {
                topFaceEl.style.transform = `perspective(${CONFIG.basePerspective}px) rotateX(${currentRotateX}deg)`;
            }
            rafId = requestAnimationFrame(tick);
        }
        tick();
    }

    function _updateResponsive() {
        const vw = window.innerWidth;
        const root = document.documentElement;

        let perspective: number, rotateX: number, frontPersp: number, frontRotX: number;

        if (vw < 480) {
            perspective = 350;
            rotateX = 24;
            frontPersp = 700;
            frontRotX = -5;
        } else if (vw < 768) {
            perspective = 400;
            rotateX = 26;
            frontPersp = 800;
            frontRotX = -5;
        } else if (vw < 1200) {
            perspective = 460;
            rotateX = 28;
            frontPersp = 900;
            frontRotX = -6;
        } else {
            perspective = 820;
            rotateX = 24;
            frontPersp = 800;
            frontRotX = -19;
        }

        CONFIG.basePerspective = perspective;
        CONFIG.baseRotateX = rotateX;
        CONFIG.frontPerspective = frontPersp;
        CONFIG.frontRotateX = frontRotX;
        targetRotateX = rotateX;

        root.style.setProperty('--platform-perspective', `${perspective}px`);
        root.style.setProperty('--platform-rotate-x', `${rotateX}deg`);
        root.style.setProperty('--front-perspective', `${frontPersp}px`);
        root.style.setProperty('--front-rotate-x', `${frontRotX}deg`);
    }

    return {
        init,
        getTopFace: () => topFaceEl,
        setParallax(on: boolean) {
            CONFIG.parallaxEnabled = on;
            if (on && !rafId) _startLoop();
            if (!on && rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
                if (topFaceEl) {
                    topFaceEl.style.transform = `perspective(${CONFIG.basePerspective}px) rotateX(${CONFIG.baseRotateX}deg)`;
                }
            }
        },
        isReady: () => isInitialised,
        _debugUpdatePerspective: (val: number) => {
            CONFIG.basePerspective = val;
        },
        _debugUpdateRotateX: (val: number) => {
            CONFIG.baseRotateX = val;
            targetRotateX = val;
            if (!CONFIG.parallaxEnabled && topFaceEl) {
                currentRotateX = val;
                topFaceEl.style.transform = `perspective(${CONFIG.basePerspective}px) rotateX(${val}deg)`;
            }
        },
    };
})();

if (typeof window !== 'undefined') {
    (window as any).Platform = Platform;
}

export default Platform;
