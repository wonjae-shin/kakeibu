const CACHE = 'kakeibu-v3'
const STATIC = [
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
  const url = new URL(request.url)

  // API 요청은 캐시하지 않음
  if (url.pathname.startsWith('/api/')) return

  // HTML 네비게이션 요청 → Network-First (항상 최신 버전)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).then((res) => {
        const clone = res.clone()
        caches.open(CACHE).then((c) => c.put(request, clone))
        return res
      }).catch(() => caches.match('/index.html'))
    )
    return
  }

  // 해시된 정적 자산(JS/CSS 등) → Cache-First
  if (url.pathname.match(/\.(js|css|woff2?|png|svg|ico)(\?.*)?$/) && url.pathname.match(/[-_][a-f0-9]{8,}\./)) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          if (!res || res.status !== 200 || res.type !== 'basic') return res
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(request, clone))
          return res
        })
      })
    )
    return
  }

  // 그 외 → Network-First
  e.respondWith(
    fetch(request).then((res) => {
      if (!res || res.status !== 200 || res.type !== 'basic') return res
      const clone = res.clone()
      caches.open(CACHE).then((c) => c.put(request, clone))
      return res
    }).catch(() => caches.match(request))
  )
})
