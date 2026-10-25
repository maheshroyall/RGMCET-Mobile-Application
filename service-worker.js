/*
  service-worker.js  -  makes the app installable and lets it open without internet

  How it works:
  - The first time the app opens, it saves the main files (pages, css, js) in the phone.
  - HTML, CSS and JS files: use the saved copy if it exists, otherwise ask the server.
  - Data (JSON or PHP) and PDFs: ask the server first, so students always get fresh data.
    If there is no internet, the last saved copy is used.

  IMPORTANT: when you change any file of the app, change the number in CACHE_NAME
  (for example "rgmcet-v2"). Then phones will download the new files.
*/

var CACHE_NAME = "rgmcet-v1";

var FILES_TO_SAVE = [
  "index.html", "home.html", "circulars.html", "exams.html", "calendar.html",
  "timetable.html", "results.html", "marks.html", "regulations.html", "hallticket.html",
  "classes.html", "attendance.html", "profile.html", "departments.html", "department.html",
  "fees.html", "discipline.html", "notifications.html", "documents.html", "services.html",
  "more.html", "settings.html",
  "css/style.css", "js/api.js", "js/app.js",
  "vendor/bootstrap/bootstrap.min.css", "vendor/bootstrap/bootstrap.bundle.min.js",
  "vendor/bootstrap-icons/bootstrap-icons.min.css",
  "vendor/bootstrap-icons/fonts/bootstrap-icons.woff2",
  "vendor/bootstrap-icons/fonts/bootstrap-icons.woff",
  "icons/icon-192.png", "icons/icon-512.png", "manifest.json"
];

// Step 1: save the main files when the service worker is installed
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(FILES_TO_SAVE);
    })
  );
  self.skipWaiting();
});

// Step 2: delete old saved copies from earlier versions
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.map(function (name) {
          if (name != CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Step 3: answer every request
self.addEventListener("fetch", function (event) {
  if (event.request.method != "GET") {
    return;
  }

  var url = event.request.url;
  var isData = url.indexOf("/data/") != -1 || url.indexOf("/api/") != -1 ||
               url.indexOf(".pdf") != -1 || url.indexOf(".json") != -1 || url.indexOf(".php") != -1;

  if (isData) {
    // Internet first, saved copy if offline
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
          return caches.match(event.request);
        })
    );
  } else {
    // Saved copy first, internet if not saved
    event.respondWith(
      caches.match(event.request).then(function (saved) {
        return saved || fetch(event.request);
      })
    );
  }
});
