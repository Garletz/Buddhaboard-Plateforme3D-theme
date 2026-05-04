import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite — configuration projet Buddhachannel Plateforme.
 *
 * Conventions :
 *  - alias `@`   → `src/`        (imports propres : `@/cards/draggable.js`)
 *  - alias `@@`  → racine projet (rare cas où on doit cibler hors src/)
 */
export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@@': fileURLToPath(new URL('.', import.meta.url)),
        },
    },
    server: {
        host: true,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2020',
        sourcemap: false,
    },
});
