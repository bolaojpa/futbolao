
// Service Worker

const CACHE_NAME = 'futbolao-pro-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo-512x512.png',
  // Adicione aqui outros assets estáticos importantes que você queira cachear
  // Ex: '/styles/main.css', '/scripts/main.js'
];

self.addEventListener('install', event => {
  // Realiza a instalação do service worker e armazena os arquivos em cache
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Intercepta as requisições e serve os arquivos do cache se disponíveis
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o recurso está no cache, retorna ele
        if (response) {
          return response;
        }
        // Senão, busca na rede
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  // Remove caches antigos
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
