// ChantFlow Service Worker - Enables offline functionality

const CACHE_NAME = 'chantflow-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
    '/manifest.json',
    '/audio/om.mp3',
    '/audio/music1.mp3',
    '/audio/censor.mp3'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache).catch((err) => {
                    console.log('Some assets failed to cache:', err);
                    // Continue even if some files fail to cache
                });
            })
    );
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // If found in cache, return it
                if (response) {
                    return response;
                }

                // Otherwise, try network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a success response
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache successful responses (but not for audio files to save space)
                        if (!event.request.url.includes('/audio/')) {
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    })
                    .catch(() => {
                        // Fallback for offline - return offline page if available
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Background sync for future enhancement
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-playlist') {
        event.waitUntil(
            // Sync playlist data when back online
            Promise.resolve()
        );
    }
});

// Push notification handler for future enhancement
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'ChantFlow reminder',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
    };

    event.waitUntil(
        self.registration.showNotification('ChantFlow', options)
    );
});
