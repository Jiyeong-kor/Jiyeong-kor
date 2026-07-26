const CACHE_NAME = 'adsp-mobile-v3-20260726';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './parts/p01.b64',
  './parts/p02.b64',
  './parts/p03.b64',
  './parts/p04.b64',
  './parts/p05.b64',
  './parts/p06.b64',
  './parts/p07.b64',
  './parts/p08.b64',
  './parts/p09.b64'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
