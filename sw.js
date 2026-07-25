// Service worker for Midview HS Girls Soccer - Stat Tracking
// Caches the app shell so it keeps working with no signal after the first load.
// When a new version is deployed, bump CACHE_NAME (e.g. v1 -> v2) so old caches
// get cleared out automatically for everyone on their next successful online load.

var CACHE_NAME = "midview-tracker-v2";
var APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (names) {
        return Promise.all(
          names
            .filter(function (name) {
              return name !== CACHE_NAME;
            })
            .map(function (name) {
              return caches.delete(name);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  // Only manage same-origin requests (this app's own files). Firebase/Firestore/gstatic
  // and any other cross-origin calls pass straight through untouched — Firestore's own
  // SDK handles its offline behavior, and caching its responses here would only confuse it.
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match("./index.html");
        });
      })
  );
});
