const CACHE_NAME = "yazzow-cache-v6";
const OFFLINE_URL = "/offline.html";

const ASSETS_TO_CACHE = [
  "/",
  OFFLINE_URL,
  "/icon.png?v=3",
  "/favicon.ico"
];

// Install: Cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Offline fallback
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Network-First for HTML/page requests to ensure updates load immediately when online
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        return null;
      });
    })
  );
});


// Push: Handle background push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "You have a new update.",
      icon: "/icon.png?v=3",
      badge: "/icon.png?v=3",
      data: {
        url: data.url || "/dashboard"
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Yazzow Alert", options)
    );
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("Yazzow Alert", {
        body: text,
        icon: "/icon.png?v=3",
        badge: "/icon.png?v=3",
        data: { url: "/dashboard" }
      })
    );
  }
});

// Notification Click: Open correct link
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.endsWith(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
