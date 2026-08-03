/* ════════════════════════════════════════════════════
   Francesca's Building — Service Worker
   Caches app shell for offline / installable use.
   Firebase calls always hit the network.
════════════════════════════════════════════════════ */

const CACHE = 'fb-project-v1';

const SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

/* ── Install: pre-cache the shell ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

/* ── Activate: drop old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch strategy ── */
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Always network for Firebase, Google APIs, and external CDNs
  const isExternal = [
    'firebasejs', 'googleapis.com', 'gstatic.com',
    'firestore.googleapis', 'storage.googleapis'
  ].some(p => url.includes(p));

  if (isExternal) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for app shell, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
