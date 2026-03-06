const CACHE_NAME = 'animes-gammy-v3';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/catalogo.js',
    '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si está en cache, devolver cache
                if (response) {
                    return response;
                }
                
                // Si no, buscar en red
                return fetch(event.request)
                    .then(response => {
                        // Verificar respuesta válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar respuesta para cachear
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Si falla la red y es una imagen, mostrar placeholder
                        if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                            return caches.match('https://via.placeholder.com/300x400?text=No+Image');
                        }
                    });
            })
    );
});

// Activar y limpiar caches antiguos
self.addEventListener('activate', event => {
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
