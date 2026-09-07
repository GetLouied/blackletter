/* Black Letter — offline shell.
   Bump CACHE whenever you publish, or phones keep serving the old copy. */
const CACHE = "blackletter-v11";

const SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./css/mobile.css",
  "./js/app.js",
  "./manifest.webmanifest",
  "./apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./data/manifest.json",
  "./data/contracts.json",
  "./data/torts.json",
  "./data/civpro.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit ||
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html"))
    )
  );
});