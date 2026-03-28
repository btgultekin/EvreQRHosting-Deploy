/**
 * EvreQR Offline Menu Service Worker
 * Cache-first strategy for menu pages
 */

const CACHE_NAME = 'evreqr-menu-v1';
const CACHE_URLS = [
    // CSS
    '/css/site.css',
    '/css/menu-themes.css',
    '/css/modern-modal.css',
    // JS
    '/js/modern-modal.js',
    '/js/cart-service.js',
    '/js/auth-service.js',
    '/js/address-service.js',
    '/js/order-service.js',
    // Images
    '/images/favicon.png',
    // External CDN (will be cached on first load)
    'https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.css'
];

// Dynamic cache for menu pages and images
const DYNAMIC_CACHE = 'evreqr-dynamic-v1';

// Install: Pre-cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Pre-caching static assets');
                return cache.addAll(CACHE_URLS).catch(err => {
                    console.warn('[SW] Some assets failed to cache:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
                        .map(key => {
                            console.log('[SW] Deleting old cache:', key);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch: Cache-first for menu pages, network-first for API
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API calls - these should always go to network
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Skip SignalR
    if (url.pathname.startsWith('/hubs/')) {
        return;
    }

    // Skip admin/superadmin areas
    if (url.pathname.startsWith('/Admin') || url.pathname.startsWith('/SuperAdmin')) {
        return;
    }

    // Skip authentication endpoints
    if (url.pathname.startsWith('/Account') || url.pathname.startsWith('/Identity')) {
        return;
    }

    // Dine-in / QR doğrulama: asla önbellekten servis etme — eski Check JSON'u yeni QR sonrası
    // "oturum doldu" ekranında takılı kalma hatasına yol açıyordu (cache-first GET).
    if (url.pathname.startsWith('/DineIn/')) {
        return;
    }
    const p = url.pathname.toLowerCase();
    if (p === '/qrverify' || p === '/v') {
        return;
    }

    // Cache-first strategy for menu pages and assets
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached version, but also update cache in background
                    event.waitUntil(updateCache(event.request));
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetchAndCache(event.request);
            })
            .catch(() => {
                // Network failed and no cache - return offline page for HTML
                if (event.request.headers.get('Accept')?.includes('text/html')) {
                    return caches.match('/offline.html');
                }
            })
    );
});

// Fetch from network and cache the response
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        // Only cache successful responses
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            // Clone the response since it can only be consumed once
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.log('[SW] Fetch failed:', error);
        throw error;
    }
}

// Update cache in background (stale-while-revalidate)
async function updateCache(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
            console.log('[SW] Cache updated:', request.url);
        }
    } catch (error) {
        // Network failed, keep using cached version
        console.log('[SW] Background update failed, using cached version');
    }
}

// Listen for messages from the page
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data === 'clearCache') {
        caches.keys().then(keys => {
            keys.forEach(key => caches.delete(key));
        });
    }
});
