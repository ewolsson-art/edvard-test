const CACHE_NAME = 'toddy-v2-oauth-safe';
const STATIC_ASSETS = [
  '/',
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
  // A cached/navigation fallback here can break Google's one-time authorization code exchange.
  if (url.pathname.startsWith('/~oauth') || url.hostname === 'oauth.lovable.app') return;
  if (request.mode === 'navigate') {
    const search = url.search || '';
    const hash = url.hash || '';
    if (
      /[?&](code|token_hash|provider_token|error)=/.test(search) ||
      hash.includes('access_token') ||
      hash.includes('type=') ||
      hash.includes('error=')
    ) {
      return;
    }
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.ok && (url.pathname.match(/\.(js|css|svg|png|jpg|woff2?)$/) || url.pathname === '/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || new Response('Offline', { status: 503 })))
  );
});
