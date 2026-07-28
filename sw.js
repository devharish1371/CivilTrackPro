const CACHE_NAME = 'civiltrack-v1';
const BASE = '/CivilTrackPro';

const PRECACHE_URLS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  BASE + '/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).catch(() => {
      // Silently fail if precache fails (e.g. offline during install)
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Return cached version, or fetch from network
      return cached || fetch(e.request).then((response) => {
        // Cache successful navigation requests
        if (response.ok && e.request.mode === 'navigate') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback to index.html for navigation when offline
        if (e.request.mode === 'navigate') {
          return caches.match(BASE + '/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
