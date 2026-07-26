const CACHE_NAME = 'adsp-study-20260726-v4';
const APP_FILES = [
  "./",
  "./index.html",
  "./adsp/manifest.webmanifest",
  "./adsp/payload/part-01.gz.b64",
  "./adsp/payload/part-02a.gz.b64",
  "./adsp/payload/part-02b.gz.b64",
  "./adsp/payload/part-03.gz.b64",
  "./adsp/payload/part-04.gz.b64"
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
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
      .catch(() =>
        caches.match(event.request).then(cached => cached || caches.match('./index.html'))
      )
  );
});
