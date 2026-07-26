const CACHE_NAME = 'mldraft-cache-v4';

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

  // Never intercept cross-origin traffic. The OTA worker serves the patch
  // metadata and hero payloads; caching those here handed the app a stale
  // dataset on the launch after a new patch was published.
  if (url.origin !== self.location.origin) return;

  // Patch data must always reflect the server. Network-first with a cache
  // fallback keeps offline launches working without ever serving a stale
  // dataset while the device is online.
  const isPatchData = url.pathname.startsWith('/data/');

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      const fromNetwork = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          // cache.put can reject on storage pressure — never let that surface
          cache.put(event.request, networkResponse.clone()).catch((err) => {
            logger_log(`Cache write skipped for ${url.pathname}: ${err}`);
          });
        }
        return networkResponse;
      }).catch((err) => {
        logger_log(`Fetch failure on ${url.pathname}: ${err}`);
        return cachedResponse; // Offline fallback
      });

      if (isPatchData) return fromNetwork;

      // Static shell and artwork: stale-while-revalidate is fine, they are
      // versioned by filename / ?v= query.
      return cachedResponse || fromNetwork;
    })
  );
});

function logger_log(msg) {
  // Custom console prefix for Service Worker diagnostics
  console.log(`[sw.js] ${msg}`);
}
