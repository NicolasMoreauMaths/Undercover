// ============================================================
// UNDERCOVER — Service Worker (PWA)
// Stratégie : Cache-first pour les assets statiques
// ============================================================
const CACHE_NAME = 'undercover-v1';

// Fichiers à mettre en cache (app shell)
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './js/words.js',
  './js/online/config.js',
  './js/online/firebase.js',
  './js/online/voice.js',
  './js/offline/game.js',
  './js/offline/ui.js',
  './js/offline/app.js',
  './js/online/app.js',
  './js/main.js',
];

// Installation : on pré-cache l'app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_FILES);
    }).then(() => self.skipWaiting())
  );
});

// Activation : on supprime les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les requêtes Firebase / CDN externes
  const externalHosts = [
    'firebaseio.com',
    'firebase.com',
    'googleapis.com',
    'gstatic.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ];
  if (externalHosts.some((h) => url.hostname.includes(h))) {
    // Réseau uniquement pour Firebase et CDN
    return;
  }

  // Stratégie Cache-first pour les assets statiques
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        // Pas en cache → réseau, puis mise en cache
        return fetch(request)
          .then((response) => {
            // Ne mettre en cache que les réponses valides
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
            return response;
          })
          .catch(() => {
            // Hors ligne et pas en cache → page hors ligne
            if (request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
    );
  }
});
