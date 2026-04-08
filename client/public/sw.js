const CACHE = 'kakeibu-v2'
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  // API 요청은 캐시하지 않음
  if (request.url.includes('/api/')) return

  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res
        const clone = res.clone()
        caches.open(CACHE).then((c) => c.put(request, clone))
        return res
      }).catch(() => caches.match('/index.html'))
    })
  )
})
