const CACHE_NAME = "yazzow-cache-v9";
const OFFLINE_URL = "/offline.html";

const ASSETS_TO_CACHE = [
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

  // Network-only for HTML/page requests to prevent caching dynamic authorized pages
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    // Only intercept and serve offline page if we are actually offline
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      event.respondWith(
        caches.match(OFFLINE_URL).then((response) => {
          return response || new Response("Offline", {
            headers: { "Content-Type": "text/html" }
          });
        })
      );
      return;
    }
    // Let the browser load the page naturally
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        return new Response("Service unavailable offline", { status: 503 });
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
  
  // Resolve relative target URL to absolute location
  const absoluteUrl = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Find an open tab/window with the same hostname and path
      for (const client of clientList) {
        try {
          const clientUrlObj = new URL(client.url);
          const targetUrlObj = new URL(absoluteUrl);
          
          if (clientUrlObj.pathname === targetUrlObj.pathname && "focus" in client) {
            // Navigate the tab to select the tab/route and focus it
            if ("navigate" in client) {
              client.navigate(absoluteUrl);
            }
            return client.focus();
          }
        } catch (e) {
          // ignore parsing error
        }
      }
      
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    })
  );
});
