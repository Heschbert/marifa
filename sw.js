/* Offline-Cache: Dateien werden beim ersten Aufruf gespeichert. VERSION erhöhen, um Updates zu erzwingen. */
const VERSION = "wf-v12";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(ch => ch.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
