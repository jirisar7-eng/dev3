const CACHE_NAME = 'tata-ma-pravo-v1';
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
  '/robots.txt'
];

// Install Event - Precache kritické assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Vyčištění starých cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Mazání staré cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Caching strategie
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. ABSOLUTNÍ BEZPEČNOST: Ignorovat všechny ne-GET requesty
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. NECACHEOVAT /api/*, auth, mfa, login, registr, admin nebo citlivé endpoints
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/mfa') ||
    url.pathname.includes('/login') ||
    url.pathname.includes('/register') ||
    url.pathname.includes('/administrace') ||
    url.pathname.includes('/admin') ||
    url.pathname.includes('/private/')
  ) {
    // Network only - absolutní bezpečnost citlivých dat
    return;
  }

  // 3. Navigační requesty (HTML stránky) - Network First s Offline Fallbackem
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Pokud síť funguje, uložit/aktualizovat kopii v cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Pokud síť selže, zkusit vrátit cachovanou verzi nebo offline fallback
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // 4. Statické assets (JS, CSS, Obrázky, Fonty) - Cache First s Network fallbackem
  const isStaticAsset = 
    url.pathname.includes('/assets/') || 
    url.pathname.includes('/fonts/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          // Kontrola na validní response před uložením do cache
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // 5. Ostatní requesty - Network First s fallbackem do cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
