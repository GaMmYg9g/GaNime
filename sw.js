const CACHE_NAME = 'ganime-v3';
const OFFLINE_URL = '/index.html';

// Recursos a cachear
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/config.js',
    '/js/data.js',
    '/js/data2.js',
    '/js/app.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap'
];

// ===== AÑADIR TUS OPENINGS AQUÍ =====
// Haz una lista con TODOS tus archivos de música
// Ejemplo:
'/music/otonoke.mp3',
// '/music/solo_leveling_op.mp3',
// '/music/chainsaw_op.mp3',

// ===== INSTALACIÓN =====
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando recursos iniciales');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[SW] Instalación completada');
                return self.skipWaiting();
            })
    );
});

// ===== ACTIVACIÓN =====
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('[SW] Activado y controlando clientes');
            return self.clients.claim();
        })
    );
});

// ===== ESTRATEGIA: Stale-While-Revalidate =====
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Excluir peticiones a WhatsApp y externas
    if (url.hostname.includes('wa.me') || 
        url.hostname.includes('whatsapp.com') ||
        url.hostname.includes('analytics')) {
        return;
    }

    // ===== PARA AUDIOS (OPENINGS) =====
    if (request.destination === 'audio' || url.pathname.endsWith('.mp3') || url.pathname.endsWith('.ogg')) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        // Si está en caché, devolverlo (0 datos)
                        return cachedResponse;
                    }
                    // Si no está en caché, descargar y guardar
                    return fetch(request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, networkResponse.clone());
                            });
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Fallback: silencio (no hay audio)
                        return new Response(null, { status: 404 });
                    });
                })
        );
        return;
    }

    // ===== PARA IMÁGENES =====
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        fetch(request).then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(request, networkResponse.clone());
                                });
                            }
                        }).catch(() => {});
                        return cachedResponse;
                    }
                    return fetch(request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, networkResponse.clone());
                            });
                        }
                        return networkResponse;
                    }).catch(() => {
                        return new Response(
                            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#14102a"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="#6a5f8a">🎬</text></svg>',
                            { headers: { 'Content-Type': 'image/svg+xml' } }
                        );
                    });
                })
        );
        return;
    }

    // ===== PARA HTML, CSS, JS =====
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (request.mode === 'navigate') {
                        return cache.match(OFFLINE_URL);
                    }
                    return new Response('Offline', { status: 503 });
                });

                return cachedResponse || fetchPromise;
            });
        })
    );
});

// ===== SINCRONIZACIÓN =====
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
