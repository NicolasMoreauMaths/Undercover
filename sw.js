// ============================================================
// UNDERCOVER — Service Worker v2
// Stratégie : réseau d'abord pour HTML, stale-while-revalidate
// pour les assets statiques. Rechargement auto à chaque mise à jour.
// ============================================================
const CACHE_VERSION = 2;
const CACHE_NAME = `undercover-v${CACHE_VERSION}`;

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

// Hôtes externes à ne jamais intercepter
const BYPASS_HOSTS = [
  'firebaseio.com',
  'firebase.com',
  'googleapis.com',
  'gstatic.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ---------- Install ----------
// Pré-cache le shell et active immédiatement sans attendre la fermeture des onglets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())       // Prendre le contrôle immédiatement
      .catch((err) => console.warn('[SW] pre-cache failed:', err))
  );
});

// ---------- Activate ----------
// Supprimer les anciens caches, puis prendre le contrôle de tous les onglets
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())     // Contrôle immédiat de tous les onglets
  );
});

// ---------- Fetch ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ne pas intercepter les requêtes vers Firebase, CDN Google Fonts, etc.
  if (BYPASS_HOSTS.some((h) => url.hostname.includes(h))) return;

  // ── Stratégie 1 : Réseau d'abord pour les documents HTML ──
  // On essaie toujours d'obtenir la version la plus récente.
  // En cas d'échec réseau on sert le cache.
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // ── Stratégie 2 : Stale-While-Revalidate pour JS/CSS/images ──
  // On répond immédiatement depuis le cache (si dispo), puis on met à jour en arrière-plan.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        // Répondre immédiatement depuis le cache si dispo, sinon attendre le réseau
        return cached || networkFetch;
      })
    )
  );
});
