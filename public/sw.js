const CACHE_NAME = 'keuanganku-v2';
const STATIC_ASSETS = [
  '/app',
  '/app/history',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip Next.js internal requests (HMR, _next/*, etc.)
  if (
    url.origin !== location.origin ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/__nextjs') ||
    url.pathname.includes('webpack') ||
    url.pathname.includes('hot-update')
  ) return;

  // Cache-first for static assets (fonts, icons, manifest)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetch(event.request)
      )
    );
    return;
  }

  // Network-first for pages (no background double-fetch)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});