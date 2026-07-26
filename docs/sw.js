const CACHE_NAME = 'adsp-study-20260727-v5-home-screen-fix';
const APP_FILES = [
  "./",
  "./index.html",
  "./adsp/manifest.webmanifest?v=20260727-v5-home-screen-fix",
  "./adsp/payload/part-01.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-02.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-03.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-04a.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-04b.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-05a.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-05b.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-06a.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-06b.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-07a.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-07b.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-08a.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-08b.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-09a.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-09b.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-10a.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-10b.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-11a.gz.b64?v=20260727-v5-foundation-first",
  "./adsp/payload/part-11b.gz.b64?v=20260727-v5-foundation-first"
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
