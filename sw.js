/* Offline-Cache: Dateien werden beim ersten Aufruf gespeichert. Alte Marifa-Caches (Präfix „wf-“) werden beim Update gelöscht,
   fremde Caches auf derselben Domain bleiben unberührt. Die Version setzt „node tools/version.mjs <neu>“. */
const VERSION = "wf-3.3";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("wf-") && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(ch => ch.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});
