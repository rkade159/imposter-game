// Vite entry point.
// 1. Pulls in the global stylesheet so it ends up in the bundle.
// 2. Mounts the root <App> component into #app using Svelte 5's mount() API.
// 3. Wires up native-shell behaviour (back button, status bar) — no-op on web.
// 4. Registers the PWA service worker — but only in production WEB builds, since
//    the SW is copied into dist/ at build time and isn't served by `vite dev`.
import { mount } from 'svelte';
import { Capacitor } from '@capacitor/core';
import './app.css';
import App from './App.svelte';
import { initNative } from './lib/native.js';

const app = mount(App, {
  target: document.getElementById('app'),
});

// Hook up native behaviour. Returns immediately when not running in Capacitor.
initNative();

// Register the service worker only for the web/PWA build. Inside the Capacitor
// shell the app's assets are already served locally, so the SW is redundant and
// can interfere — skip it on native.
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}

export default app;
