const CACHE_NAME = "analog-radio-hour-v1";

const APP_SHELL = [
    "./",
    "./index.html",
    "./app.js",
    "./style.css",
    "./manifest.json",
    "./jungle-bg.svg",
    "./videos.json",
    "./icon-192.png",
    "./icon-512.png"
];


self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
    );

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
        )
    );

    self.clients.claim();
});


self.addEventListener("fetch", event => {
    // Let YouTube and other external requests go directly
    // to the network.
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                return cachedResponse || fetch(event.request);
            })
    );
});
