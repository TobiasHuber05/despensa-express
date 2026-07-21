const CACHE_NAME = 'despensa-express-v2'

const urlsToCache = [
  '/login',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Nunca interceptar pedidos que no sean GET (login, ventas, etc. siempre van directo a internet)
  if (event.request.method !== 'GET') return

  // "Network first": siempre intenta traer lo más nuevo del servidor.
  // Solo usa la copia guardada si no hay conexión a internet.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const copia = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})