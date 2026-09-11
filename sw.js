const CACHE_NAME = 'tonic-and-verse-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Only manage same-origin GET requests for the app's own files. Any
  // cross-origin request - Datamuse, Anthropic, OpenAI, OpenRouter, Groq, or
  // any custom AI provider base URL the user configures - is left completely
  // alone here, so nothing in this file can ever interfere with an API call.
  if (requestUrl.origin !== self.location.origin || event.request.method !== 'GET') {
    return;
  }

  // Network-first for the app's own files: always try to fetch the latest
  // version when online, and only fall back to the cached copy if the
  // network request actually fails (e.g. genuinely offline). This means
  // updates to index.html show up on next load automatically, instead of
  // requiring a cache-name bump every time the app changes.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
