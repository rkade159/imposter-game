// Minimal offline-capable service worker.
//
// Strategy: cache the app shell on install, then serve cached responses on fetch
// with a network fallback. This is intentionally simple — it gets the PWA install
// affordance to appear and keeps the placeholder loading offline, which is all we
// need for the scaffold. A smarter cache strategy (versioning, runtime caching of
// word lists, etc.) can replace this once we have real assets worth caching.

const CACHE_NAME = 'imposter-shell-v1';
const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest'];

// On install: pre-cache the shell so the app loads offline immediately.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// On activate: drop any caches that aren't the current one so old assets don't linger.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// On fetch: cache-first for GETs, fall through to the network on a miss.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});
