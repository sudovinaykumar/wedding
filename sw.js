const CACHE_NAME = "wedding-assets-v1";
const INDEX_PATH = "./index.html";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Always check the network for the latest index.html.
  if (
    request.mode === "navigate" ||
    url.pathname.endsWith("/index.html")
  ) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(INDEX_PATH, copy);
            });
          }

          return response;
        })
        .catch(() =>
          caches.match(INDEX_PATH).then(
            cached => cached || Response.error()
          )
        )
    );

    return;
  }

  // Cache images and the wedding song for faster repeat visits.
  if (/\.(png|jpg|jpeg|webp|mp3)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        });
      })
    );
  }
});
