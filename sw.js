// Bump the version on every change, otherwise iOS may keep serving the old files from cache.
const CACHE = "handleliste-v2";
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
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

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
