// Moody Gardens Sales Showcase: serves the app from the tablet's cache so it works offline.
// The page (offlineSync in index.html) fills the cache from files.json.
const C = 'mg-showcase';
const FRESH = /\/(index\.html|data\/showcase\.json|files\.json)?$/;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  if (req.mode === 'navigate' || FRESH.test(u.pathname)) e.respondWith(networkFirst(req));
  else e.respondWith(cacheFirst(req));
});
const scopeUrl = p => new URL(p, self.registration.scope).href;
async function networkFirst(req){
  const c = await caches.open(C);
  const key = req.mode === 'navigate' ? scopeUrl('index.html') : req.url.split('?')[0];
  try {
    const r = await Promise.race([fetch(req, {cache: 'no-cache'}), new Promise((_, no) => setTimeout(no, 4000))]);
    if (r && r.ok){ c.put(key, r.clone()); return r; }
    throw 0;
  } catch (err) {
    const hit = await c.match(key, {ignoreSearch: true});
    if (hit) return hit;
    return fetch(req);
  }
}
async function cacheFirst(req){
  const hit = await caches.match(req, {ignoreSearch: true});
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok){ const c = await caches.open(C); c.put(req.url.split('?')[0], r.clone()); }
  return r;
}
