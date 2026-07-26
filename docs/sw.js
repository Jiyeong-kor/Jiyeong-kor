const CACHE_NAME = 'adsp-v5-concept-rebuild-20260727';
const ASSET_VERSION = '20260727-v5-concept-rebuild';
const APP_FILES = [
  './',
  './index.html',
  './sw.js',
  './adsp/manifest.webmanifest',
  './adsp/payload/part-01.gz.b64?v=' + ASSET_VERSION,
  './adsp/payload/part-02.gz.b64?v=' + ASSET_VERSION,
  './adsp/payload/part-03.gz.b64?v=' + ASSET_VERSION
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
