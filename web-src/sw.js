// Offline cache. tools/sync-site.sh rewrites the next line with a content hash and the file list.
const V = 'dev', FILES = [];

addEventListener('install', (e) => e.waitUntil(caches.open(V).then((c) => c.addAll(FILES)).then(() => skipWaiting())));
addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => clients.claim())));
addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method === 'GET' && new URL(r.url).origin === location.origin) e.respondWith(caches.match(r).then((hit) => hit || fetch(r)));
});
