// Vite config — Svelte plugin plus a tiny inline plugin that copies our hand-rolled
// service worker from src/ into dist/ on production builds. This keeps the SW
// authored alongside the rest of the source while still being served from the
// site root (where the registration in main.js expects it).
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Copy src/service-worker.js → dist/service-worker.js after the bundle is written.
function copyServiceWorker() {
  return {
    name: 'copy-service-worker',
    apply: 'build',
    writeBundle() {
      const src = resolve(__dirname, 'src/service-worker.js');
      const out = resolve(__dirname, 'dist/service-worker.js');
      if (existsSync(src)) {
        copyFileSync(src, out);
      }
    },
  };
}

export default defineConfig({
  plugins: [svelte(), copyServiceWorker()],
});
