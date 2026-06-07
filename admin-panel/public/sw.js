// Basic Service Worker to satisfy PWA install requirements
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Just a pass-through to satisfy the PWA fetch handler requirement
  e.respondWith(fetch(e.request).catch(() => new Response("Network error occurred")));
});
