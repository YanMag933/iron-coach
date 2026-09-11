const CACHE = "iron-coach-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/exercises.js",
  "./js/muscles.js",
  "./js/coach.js",
  "./js/storage.js",
  "./js/app.js",
  "./manifest.json",
  "./icon.svg",
  "./reset.html",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // sw.js никогда из кэша — иначе обновления блокируются
  if (url.pathname.endsWith("/sw.js") || url.pathname.endsWith("sw.js")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // сеть важнее кэша
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((c) => c || caches.match("./index.html")))
  );
});
