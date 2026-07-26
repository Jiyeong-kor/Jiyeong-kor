const CACHE_NAME = 'history-grade1-20260726-1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './payload/part-01.gz.b64?v=20260726-1', './payload/part-02.gz.b64?v=20260726-1', './payload/part-03.gz.b64?v=20260726-1', './payload/part-04.gz.b64?v=20260726-1'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match('./index.html'))));
});
