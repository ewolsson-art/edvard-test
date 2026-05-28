const CACHE_NAME = 'toddy-v5-no-html-cache';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and API requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/') || url.hostname.includes('supabase')) return;

  // NEVER intercept OAuth broker paths or auth callbacks/errors — these must always hit the network.
  if (url.pathname.startsWith('/~oauth') || url.hostname === 'oauth.lovable.app') return;

  // NEVER cache navigations / HTML documents — stale index.html references deleted hashed JS chunks
  // and causes "Importing a module script failed" / blank screen after a deploy.
  if (request.mode === 'navigate' || request.destination === 'document') {
    return; // let the browser hit the network
  }

  // Only cache hashed static assets (JS/CSS/fonts/images). These are content-hashed so safe to cache.
  if (!url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|woff2?)$/)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || new Response('Offline', { status: 503 })))
  );
});
