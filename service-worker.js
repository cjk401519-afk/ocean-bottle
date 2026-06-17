const CACHE_NAME = "ocean-bottle-v08-immersive-hero-4";

const CACHE_ASSETS = [
  "./",
  "./index.html",
  "./styles-pick1.css",
  "./styles-pick2.css",
  "./bottle-art.css",
  "./v05-echo.css",
  "./v06-hero-art.css",
  "./v06-hero-art.css?v=hero-3",
  "./v07-dynamic-scene.css",
  "./v08-immersive-hero.css",
  "./v08-immersive-hero.css?v=hero-image-3",
  "./v05-echo-bridge.js",
  "./app-audio5.js",
  "./tide-detail.js",
  "./manifest.webmanifest",
  "./favicon.ico",
  "./apple-touch-icon.png",
  "./assets/drift-bottle-refined.svg",
  "./assets/hero-ocean-icon-scene.webp",
  "./assets/hero-ocean-icon-scene.webp?v=hero-720-q8",
  "./assets/hero-ocean-icon-scene.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isPageShell = request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  const matchOptions = isPageShell ? { ignoreSearch: true } : undefined;

  event.respondWith(
    caches.match(request, matchOptions).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request);
    })
  );
});