const CACHE_NAME = 'mldraft-cache-v3';

// Base critical templates to cache on install
const PRE_CACHE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      logger_log("Pre-caching key PWA assets...");
      return cache.addAll(PRE_CACHE_RESOURCES);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Take control immediately and delete old caches
  event.waitUntil(
    self.clients.claim().then(() => {
      return caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              logger_log(`Deleting legacy cache: ${key}`);
              return caches.delete(key);
            }
          })
        );
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache standard GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass dev HMR socket streams or React source builders
  if (url.protocol === 'ws:' || url.pathname.includes('/@vite') || url.pathname.includes('/@react') || url.pathname.includes('node_modules')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Cache a clone of the successful fetch response
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          logger_log(`Fetch failure on ${url.pathname}: ${err}`);
          return cachedResponse; // Offline fallback
        });

        // Stale-While-Revalidate: Return cached item immediately if present, otherwise fetch from server
        return cachedResponse || networkFetch;
      });
    })
  );
});

function logger_log(msg) {
  // Custom console prefix for Service Worker diagnostics
  console.log(`[sw.js] ${msg}`);
}
