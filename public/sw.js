const CACHE_NAME = "extractile-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css"
];

// Install Event - Pre-cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline shell");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.error("[Service Worker] Pre-cache failed:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle caching strategy (Network First falling back to Cache for doc/pages, Stale-While-Revalidate for static assets)
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests (such as analytics or APIs that use POST)
  if (request.method !== "GET") {
    return;
  }

  // Handle local application routes/navigation (Network First)
  if (request.mode === "navigate" || url.origin === self.location.origin && !url.pathname.includes(".")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Put replica in cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to cached index.html for SPA routes
            return caches.match("/");
          });
        })
    );
    return;
  }

  // Handle static assets (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn("[Service Worker] Asset fetch failed, serving from cache:", err);
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
