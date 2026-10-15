// Service worker mínimo: permite instalar la app. No guarda nada en caché,
// así que siempre se ve la versión más reciente de la página.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
