// ChantFlow Service Worker - Enables offline functionality

// Bumping this discards everything cached under the old name. The app shell is
// served network-first (see below), so routine code changes do NOT need a bump -
// only change it when you want to force every client to re-download the audio.
const CACHE_NAME = 'chantflow-v3';

// Relative so the app also works when served from a subpath, e.g.
// https://<user>.github.io/chantflow/ on GitHub Pages.
const CORE_ASSETS = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './manifest.json',
    './config.json'
];

// Every audio file listed in config.json is pre-cached, so a session built from
// any track keeps working offline.
async function audioAssets() {
    try {
        const response = await fetch('./config.json', { cache: 'no-cache' });
        if (!response.ok) return [];
        const config = await response.json();
        return (config.tracks || []).map(track => './' + track.file);
    } catch (err) {
        console.log('Could not read config.json for pre-caching:', err);
        return [];
    }
}

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const assets = CORE_ASSETS.concat(await audioAssets());

            // Cache individually so one missing file does not abort the install.
            await Promise.all(assets.map(asset =>
                cache.add(asset).catch(err => console.log(`Failed to cache ${asset}:`, err))
            ));
        })()
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

// Fetch Event
//
// App shell (HTML/JS/CSS/JSON) is network-first, so a push to GitHub Pages reaches
// users on their next load without needing a CACHE_NAME bump; the cache is the
// offline fallback. Audio is cache-first - the files never change, and a 108x
// session must not re-fetch the same file over the network.
const SHELL_PATTERN = /\.(?:html|js|css|json)$|\/$/;

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.destination === 'document') return caches.match('./index.html');
        throw err;
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'error') {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
}

self.addEventListener('fetch', (event) => {
    // Skip non-GET and cross-origin requests
    if (event.request.method !== 'GET') return;
    if (new URL(event.request.url).origin !== self.location.origin) return;

    const path = new URL(event.request.url).pathname;
    event.respondWith(
        SHELL_PATTERN.test(path) ? networkFirst(event.request) : cacheFirst(event.request)
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
        icon: './icon-192x192.png',
        badge: './badge-72x72.png'
    };

    event.waitUntil(
        self.registration.showNotification('ChantFlow', options)
    );
});
