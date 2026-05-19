// Vite entry point.
// 1. Pulls in the global stylesheet so it ends up in the bundle.
// 2. Mounts the root <App> component into #app using Svelte 5's mount() API.
// 3. Registers the PWA service worker — but only in production builds, since
//    the SW is copied into dist/ at build time and isn't served by `vite dev`.
import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app'),
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}

export default app;
