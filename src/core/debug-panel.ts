/* =============================================
   DEBUG PANEL – Platform Tuning Tool
   Touche [H] pour afficher / masquer le panneau.
   ============================================= */

const DebugPanel = (() => {
    'use strict';

    let panelEl = null;
    let isVisible = true;

    const PARAMS = [
        { id: 'top-perspective',  label: 'Top Perspective',     cssVar: '--platform-perspective', unit: 'px',  min: 200, max: 2000, step: 10,  initial: 820  },
        { id: 'top-rotateX',      label: 'Top RotateX',         cssVar: '--platform-rotate-x',    unit: 'deg', min: 0,   max: 50,   step: 0.5, initial: 24   },
        { id: 'top-aspect-w',     label: 'Aspect Ratio W',      cssVar: null,                     unit: '',    min: 10,  max: 24,   step: 0.5, initial: 12.5 },
        { id: 'top-aspect-h',     label: 'Aspect Ratio H',      cssVar: null,                     unit: '',    min: 2,   max: 12,   step: 0.5, initial: 6.5  },
        { id: 'front-perspective', label: 'Front Perspective',  cssVar: '--front-perspective',    unit: 'px',  min: 200, max: 3000, step: 10,  initial: 800  },
        { id: 'front-rotateX',    label: 'Front RotateX',       cssVar: '--front-rotate-x',       unit: 'deg', min: -20, max: 5,    step: 0.5, initial: -18.5 },
        { id: 'platform-width',   label: 'Platform Width',      cssVar: '--platform-width',       unit: 'vw',  min: 40,  max: 95,   step: 1,   initial: 68   },
        { id: 'wrapper-top',      label: 'Wrapper Top %',       cssVar: null,                     unit: '%',   min: 10,  max: 90,   step: 1,   initial: 82   },
        { id: 'gutter',           label: 'Gutter (side space)', cssVar: '--gutter',               unit: 'px',  min: 0,   max: 120,  step: 2,   initial: 4    },
    ];

    function init() {
        _createPanel();
        _bindKeyboard();
        console.log('[DebugPanel] Ready. Press [H] to toggle.');
    }

    function _createPanel() {
        panelEl = document.createElement('div');
        panelEl.id = 'debug-panel';
        panelEl.innerHTML = `
            <div class="dbg-header">
                <span>🎛️ Platform Tuner</span>
                <button id="dbg-close" title="Fermer (H)">×</button>
            </div>
            <div class="dbg-controls">
                ${PARAMS.map(
                    (p) => `
                    <div class="dbg-row">
                        <label for="dbg-${p.id}">${p.label}</label>
                        <div class="dbg-slider-wrap">
                            <input type="range" id="dbg-${p.id}"
                                min="${p.min}" max="${p.max}" step="${p.step}" value="${p.initial}">
                            <span class="dbg-value" id="dbg-val-${p.id}">${p.initial}${p.unit}</span>
                        </div>
                    </div>
                `
                ).join('')}
            </div>
            <div class="dbg-footer">
                <button id="dbg-copy">📋 Copier les valeurs CSS</button>
                <button id="dbg-reset">↺ Reset</button>
            </div>
            <pre id="dbg-output" class="dbg-output"></pre>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #debug-panel { position: fixed; top: 10px; right: 10px; width: 320px; max-height: 95vh; overflow-y: auto;
                background: rgba(15,15,25,0.92); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px; color: #e0e0e0; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px;
                z-index: 99999; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
            #debug-panel.hidden { display: none; }
            .dbg-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px;
                border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600; font-size: 13px; }
            #dbg-close { background: none; border: none; color: #888; font-size: 18px; cursor: pointer; padding: 0 4px; }
            #dbg-close:hover { color: #fff; }
            .dbg-controls { padding: 8px 14px; }
            .dbg-row { margin-bottom: 8px; }
            .dbg-row label { display: block; margin-bottom: 2px; color: #aaa; font-size: 11px;
                text-transform: uppercase; letter-spacing: 0.5px; }
            .dbg-slider-wrap { display: flex; align-items: center; gap: 8px; }
            .dbg-slider-wrap input[type="range"] { flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
                background: rgba(255,255,255,0.15); border-radius: 2px; outline: none; cursor: pointer; }
            .dbg-slider-wrap input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px;
                border-radius: 50%; background: #FBEBC2; cursor: pointer; }
            .dbg-value { min-width: 55px; text-align: right; font-family: 'Consolas', monospace; font-size: 12px; color: #FBEBC2; }
            .dbg-footer { display: flex; gap: 6px; padding: 8px 14px; border-top: 1px solid rgba(255,255,255,0.08); }
            .dbg-footer button { flex: 1; padding: 6px 8px; background: rgba(251,235,194,0.12); border: 1px solid rgba(251,235,194,0.2);
                border-radius: 6px; color: #FBEBC2; font-size: 11px; cursor: pointer; transition: background 0.2s; }
            .dbg-footer button:hover { background: rgba(251,235,194,0.25); }
            .dbg-output { display: none; margin: 0; padding: 10px 14px; background: rgba(0,0,0,0.3);
                border-top: 1px solid rgba(255,255,255,0.08); font-family: 'Consolas', monospace; font-size: 11px;
                color: #8f8; white-space: pre-wrap; word-break: break-all; border-radius: 0 0 12px 12px; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(panelEl);

        PARAMS.forEach((p) => {
            const slider = document.getElementById(`dbg-${p.id}`);
            const valueEl = document.getElementById(`dbg-val-${p.id}`);
            slider.addEventListener('input', () => {
                const val = parseFloat(slider.value);
                valueEl.textContent = `${val}${p.unit}`;
                _applyParam(p, val);
            });
        });

        document.getElementById('dbg-close').addEventListener('click', _toggle);
        document.getElementById('dbg-copy').addEventListener('click', _copyCSS);
        document.getElementById('dbg-reset').addEventListener('click', _reset);
    }

    function _applyParam(param, value) {
        const root = document.documentElement;

        if (param.cssVar) {
            root.style.setProperty(param.cssVar, `${value}${param.unit}`);
        }

        if (param.id === 'top-aspect-w' || param.id === 'top-aspect-h') {
            const w = parseFloat(document.getElementById('dbg-top-aspect-w').value);
            const h = parseFloat(document.getElementById('dbg-top-aspect-h').value);
            root.style.setProperty('--platform-aspect', `${w} / ${h}`);
        }

        if (param.id === 'wrapper-top') {
            const wrapper = document.getElementById('platform-wrapper');
            if (wrapper) wrapper.style.top = `${value}%`;
        }

        if (typeof window.Platform !== 'undefined') {
            if (param.id === 'top-perspective' && window.Platform._debugUpdatePerspective) {
                window.Platform._debugUpdatePerspective(value);
            }
            if (param.id === 'top-rotateX' && window.Platform._debugUpdateRotateX) {
                window.Platform._debugUpdateRotateX(value);
            }
        }
    }

    function _toggle() {
        isVisible = !isVisible;
        panelEl.classList.toggle('hidden', !isVisible);
    }

    function _bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                if (e.target.tagName === 'INPUT') return;
                _toggle();
            }
        });
    }

    function _copyCSS() {
        const values = {};
        PARAMS.forEach((p) => {
            values[p.id] = parseFloat(document.getElementById(`dbg-${p.id}`).value);
        });

        const css = `:root {
    --platform-perspective: ${values['top-perspective']}px;
    --platform-rotate-x:    ${values['top-rotateX']}deg;
    --platform-aspect:      ${values['top-aspect-w']} / ${values['top-aspect-h']};
    --front-perspective:    ${values['front-perspective']}px;
    --front-rotate-x:       ${values['front-rotateX']}deg;
    --platform-width:       ${values['platform-width']}vw;
    --gutter:               ${values['gutter']}px;
}
/* wrapper top: ${values['wrapper-top']}% */`;

        navigator.clipboard
            .writeText(css)
            .then(() => {
                const outputEl = document.getElementById('dbg-output');
                outputEl.style.display = 'block';
                outputEl.textContent = '✅ Copié !\n\n' + css;
                setTimeout(() => {
                    outputEl.style.display = 'none';
                }, 4000);
            })
            .catch(() => {
                const outputEl = document.getElementById('dbg-output');
                outputEl.style.display = 'block';
                outputEl.textContent = css;
            });
    }

    function _reset() {
        PARAMS.forEach((p) => {
            const slider = document.getElementById(`dbg-${p.id}`);
            const valueEl = document.getElementById(`dbg-val-${p.id}`);
            slider.value = p.initial;
            valueEl.textContent = `${p.initial}${p.unit}`;
            _applyParam(p, p.initial);
        });
    }

    return { init };
})();

if (typeof window !== 'undefined') {
    window.DebugPanel = DebugPanel;
}

export default DebugPanel;
