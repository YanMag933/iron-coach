const CACHE = "iron-coach-v4";
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
  "./assets/exercises/pullup-form.png",
  "./assets/exercises/weighted_pullup-form.png",
  "./assets/exercises/chinup-form.png",
  "./assets/exercises/scap_pull-form.png",
  "./assets/exercises/australian_row-form.png",
  "./assets/exercises/dip-form.png",
  "./assets/exercises/pushup-form.png",
  "./assets/exercises/pike_pushup-form.png",
  "./assets/exercises/hanging_knee-form.png",
  "./assets/exercises/hanging_leg-form.png",
  "./assets/exercises/dead_hang-form.png",
  "./assets/muscles/muscles-pull.png",
  "./assets/muscles/muscles-push.png",
  "./assets/muscles/muscles-core.png",
  "./assets/muscles/muscles-chin.png",
  "./assets/muscles/muscles-shoulders.png",
  "./assets/muscles/muscles-grip.png",
  "./assets/muscles/weighted_pullup-muscles.png",
  "./assets/muscles/dip-muscles.png",
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

  if (url.pathname.endsWith("/sw.js") || url.pathname.endsWith("sw.js")) {
    e.respondWith(fetch(e.request));
    return;
  }

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
