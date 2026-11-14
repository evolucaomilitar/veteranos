// Service Worker - Veteranos 5º BE Cmb Bld (PWA Offline & Instant Load)
const CACHE_NAME = 'veteranos-5be-v12';

const STATIC_ASSETS = [
  './',
  './index.html',
  './reencontro.html',
  './cadastro.html',
  './dados.js',
  './cloud-sync.js',
  './pwa.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './logo.svg',
  './logo_veteranos.png',
  './logo_veteranos.jpg',
  './logo_evolucao_militar.jpg',
  './logo_evolucao_militar.mp4',
  './animal_leao.svg',
  './animal_onca.svg',
  './animal_pantera.svg',
  './animal_aguia.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Alguns assets locais não puderam ser pré-cacheados:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Apenas intercepta requisições GET
  if (event.request.method !== 'GET') return;

  // Nunca cacheia chamadas para a nuvem de sincronização em tempo real (ntfy.sh / SSE / polling)
  if (event.request.url.includes('ntfy.sh')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Retorna do cache e tenta atualizar em segundo plano (stale-while-revalidate)
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Fallback offline para páginas HTML
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
