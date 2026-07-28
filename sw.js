self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

// A basic fetch listener is required by Chrome to trigger the "Add to Homescreen" prompt
self.addEventListener('fetch', (e) => {
  // We just pass the request through. This satisfies the PWA requirement.
  e.respondWith(fetch(e.request).catch(() => new Response('Offline')));
});
