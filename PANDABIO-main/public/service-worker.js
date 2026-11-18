const CACHE_NAME = 'pandabio-static-v1';
const APP_SHELL_URLS = [
  new URL('./', self.registration.scope).href,
  new URL('manifest.webmanifest', self.registration.scope).href,
  new URL('icons/panda-192.png', self.registration.scope).href,
  new URL('icons/panda-512.png', self.registration.scope).href,
];
const ASSET_PATH = new URL('assets/', self.registration.scope).pathname;
const ICON_PATH = new URL('icons/', self.registration.scope).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS)),
      self.skipWaiting(),
    ]),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('pandabio-') && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async (error) => {
        const cachedPage = await caches.match(request);
        const appShell = await caches.match(APP_SHELL_URLS[0]);

        if (cachedPage || appShell) {
          return cachedPage || appShell;
        }

        throw error;
      }),
    );
    return;
  }

  if (
    ['font', 'image', 'script', 'style'].includes(request.destination) ||
    requestUrl.pathname.startsWith(ASSET_PATH) ||
    requestUrl.pathname.startsWith(ICON_PATH)
  ) {
    event.respondWith(
      caches.match(request.url, { ignoreVary: true }).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }

          return response;
        });
      }),
    );
  }
});
