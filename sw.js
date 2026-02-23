// === SERVICE WORKER GAZDISPO ===
// Version du cache
const CACHE_NAME = 'gazdispo-v1';

// Fichiers à mettre en cache
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/styles.css',
  '/admin.css',
  '/app.js',
  '/admin.js',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner depuis le cache si disponible
        if (response) {
          return response;
        }
        
        // Sinon, faire la requête réseau
        return fetch(event.request).then((response) => {
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Cloner la réponse
          const responseToCache = response.clone();
          
          // Mettre en cache pour utilisation future
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // En cas d'erreur (hors ligne), retourner une page de fallback si nécessaire
        return caches.match('/index.html');
      })
  );
});

// Synchronisation en arrière-plan (optionnel)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stations') {
    event.waitUntil(syncStations());
  }
});

async function syncStations() {
  // Cette fonction pourra synchroniser avec Firebase quand configuré
  console.log('Synchronisation des données...');
}
