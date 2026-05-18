const CACHE = 'vozz-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => {
      if (k !== CACHE) return caches.delete(k)
    }))).then(() => clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => {
      return hit || fetch(e.request).then((res) => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy))
        }
        return res
      }).catch(() => caches.match('/'))
    })
  )
})