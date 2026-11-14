import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';
import { self as worker } from '$app/service-worker';
const cacheName = `fokus-${version}`;
const paths = [...immutable, ...assets].map(({ path }) => `/${path}`);
worker.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(paths)));
});
worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('fokus-') && key !== cacheName)
            .map((key) => caches.delete(key))
        )
      )
  );
});
worker.addEventListener('fetch', (event) => {
  if (
    event.request.method !== 'GET' ||
    new URL(event.request.url).origin !== worker.location.origin
  )
    return;
  const path = new URL(event.request.url).pathname;
  if (paths.includes(path))
    event.respondWith(
      caches
        .open(cacheName)
        .then(async (cache) => (await cache.match(path)) || fetch(event.request))
    );
  else if (event.request.mode === 'navigate')
    event.respondWith(
      fetch(event.request).catch(async () => (await caches.match('/offline.html'))!)
    );
});
