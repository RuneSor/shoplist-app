// Bump versjonen når du endrer filene, så henter appen den nye versjonen.
const CACHE = "handleliste-v1";
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
    // Skannerbiblioteket caches separat, så en CDN-feil ikke stopper installasjonen
    try { await cache.add(SCANNER_LIB); } catch (e) { console.warn("Kunne ikke cache ZXing", e); }
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

  // Produktoppslag går alltid mot nettet
  if (url.hostname.endsWith("openfoodfacts.org")) return;

  // Selve siden: nett først (for oppdateringer), cache hvis offline
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("./index.html", res.clone());
        return res;
      } catch {
        return (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  // Alt annet: cache først
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    if (res.ok && (url.origin === location.origin || req.url === SCANNER_LIB)) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  })());
});
