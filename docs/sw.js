const CACHE_NAME = 'adsp-mobile-v3-20260726-gzip';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './parts/app01.gz.b64',
  './parts/app02.gz.b64',
  './parts/app03.gz.b64',
  './parts/app04.gz.b64',
  './parts/app05.gz.b64'
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
