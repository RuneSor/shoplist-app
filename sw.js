// Bump the version on every change, otherwise iOS may keep serving the old files from cache.
const CACHE = "handleliste-v10";
// Product images live in their own cache so they survive app updates (shown offline in the store)
const IMAGE_CACHE = "handleliste-images-v1";
const IMAGE_ORIGIN = "https://images.openfoodfacts.org";
const IMAGE_CACHE_MAX = 300;   // ~14 KB each
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];
const SCANNER_LIB = "https://unpkg.com/@zxing/browser@0.1.5/umd/zxing-browser.min.js";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    // The scanner library is cached separately so a CDN failure doesn't block installation
    try { await cache.add(SCANNER_LIB); } catch (e) { console.warn("Could not cache ZXing", e); }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE && key !== IMAGE_CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Product images: cache first, kept across versions, oldest dropped past IMAGE_CACHE_MAX
  if (url.origin === IMAGE_ORIGIN) {
    event.respondWith(cachedImage(req));
    return;
  }

  // Product lookups always go to the network
  if (url.hostname.endsWith("openfoodfacts.org")) return;

  // The page itself: network first (to get updates), cache when offline
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          const cache = await caches.open(CACHE);
          cache.put("./index.html", res.clone());
        }
        return res;
      } catch {
        return (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  // Everything else: cache first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res.ok && (url.origin === location.origin || req.url === SCANNER_LIB)) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      return Response.error();   // offline and not cached
    }
  })());
});

async function cachedImage(req) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    // Only real CORS responses: opaque ones count as several MB each against the storage quota
    if (res.ok && res.type === "cors") {
      await cache.put(req, res.clone());
      const keys = await cache.keys();   // insertion order, oldest first
      for (const old of keys.slice(0, Math.max(0, keys.length - IMAGE_CACHE_MAX))) await cache.delete(old);
    }
    return res;
  } catch {
    return Response.error();   // offline and not cached: the <img> error handler hides it
  }
}
