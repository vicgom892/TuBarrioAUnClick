// sw.js — Service Worker para Tu Barrio A Un Click
// Versión: v26 — ¡Recuerda incrementar esto en cada actualización!

const CACHE_VERSION = 'v34'; // ⬅️ ¡CAMBIA ESTO EN CADA DEPLOY!
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const ASSETS_CACHE = `assets-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Límites de caché
const CACHE_LIMITS = {
  assets: 200,
  dynamic: 100,
  api: 50
};

// === ARCHIVOS ESENCIALES (se precargan en install) ===
const PRECACHED_URLS = [
  '/',
  '/index.html',
  '/comunidad.html',
  '/inscripcion.html',
  '/offline.html',
  '/manifest.json',
  '/css/styles.css',
  '/css/negocios.css',
  '/js/main.js',
  '/js/splash.js',
  '/js/chat.js',
  '/js/testimonials.js'
];

// Imágenes críticas
const PRECACHED_IMAGES = [
  '/img/icono-192x192.png',
  '/img/icon-logo.png',
  '/img/icon-abeja-sola.png',
  '/img/banner-1.jpeg',
  '/img/banner-2.jpeg',
  '/img/banner.png',
  '/img/mapa.jpeg',
  '/img/contacto.jpeg'
];

// Páginas de negocios
const NEGOCIOS_PAGES = [
  '/negocios/barberia.html',
  '/negocios/bacico-panaderia.html',
  '/negocios/bacico-panaderia-1.html',
  '/negocios/ferreteria.html',
  '/negocios/kiosco.html',
  '/negocios/pagos.html',
  '/negocios/panaderia.html',
  '/negocios/pastas.html',
  '/negocios/tienda.html',
  '/negocios/verduleria.html',
  '/negocios/veterinaria.html',
  '/negocios/veterinaria-1.html',
  '/negocios/fiambreria.html'
];

// Imágenes de negocios (agrega aquí si las tienes)
const NEGOCIOS_IMAGES = [
  // Ej: '/img/negocios/panaderia.jpg'
];

// Archivos JSON
const API_ENDPOINTS = [
  '/data/promociones.json',
  '/data/panaderias.json',
  '/data/verdulerias.json',
  '/data/fiambrerias.json',
  '/data/veterinarias.json',
  '/data/ferreterias.json',
  '/data/kioscos.json',
  '/data/barberias.json',
  '/data/pastas.json',
  '/data/tiendas.json',
  '/datos/comercios.json'
];

// Todos los archivos para precache
const ALL_PRECACHED = [
  ...PRECACHED_URLS,
  ...PRECACHED_IMAGES,
  ...NEGOCIOS_PAGES,
  ...NEGOCIOS_IMAGES,
  ...API_ENDPOINTS
];

// === INSTALL: Precachea todo lo esencial ===
self.addEventListener('install', (event) => {
  console.log(`[SW] Instalando nueva versión: ${CACHE_VERSION}`);
  self.skipWaiting(); // Activa inmediatamente si es posible

  event.waitUntil(
    (async () => {
      try {
        const [staticCache, assetsCache, apiCache] = await Promise.all([
          caches.open(STATIC_CACHE),
          caches.open(ASSETS_CACHE),
          caches.open(API_CACHE)
        ]);

        // Precache en paralelo
        const results = await Promise.allSettled([
          precacheResources(staticCache, PRECACHED_URLS),
          precacheResources(assetsCache, [...PRECACHED_IMAGES, ...NEGOCIOS_IMAGES]),
          precacheResources(apiCache, API_ENDPOINTS)
        ]);

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`[SW] Error en precache grupo ${index}:`, result.reason);
          }
        });

        console.log('[SW] Instalación completada. Listo para activar.');
      } catch (error) {
        console.error('[SW] Error crítico en install:', error);
      }
    })()
  );
});

// === ACTIVATE: Limpia cachés viejos y toma control ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpiar cachés antiguos
      const cacheNames = await caches.keys();
      const currentCaches = [STATIC_CACHE, ASSETS_CACHE, API_CACHE, DYNAMIC_CACHE];

      await Promise.all(
        cacheNames
          .filter(name => !currentCaches.includes(name))
          .map(name => caches.delete(name))
      );

      // Limitar tamaño de cachés actuales
      await Promise.all([
        limitCacheSize(ASSETS_CACHE, CACHE_LIMITS.assets),
        limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS.dynamic),
        limitCacheSize(API_CACHE, CACHE_LIMITS.api)
      ]);

      // Tomar control inmediato de las pestañas abiertas
      await clients.claim();

      console.log(`[SW] ✅ Activado: ${CACHE_VERSION}`);

      // Notificar a todas las ventanas abiertas que el SW está activo
      const clientsList = await clients.matchAll({ type: 'window' });
      clientsList.forEach(client => {
        client.postMessage({ type: 'SW_ACTIVATED' });
      });
    })()
  );
});

// === FETCH: Estrategia por tipo de recurso ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar solicitudes no-GET o externas
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Clasificar y manejar
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImage(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
  } else if (isApiRequest(url.pathname)) {
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (isNegocioPage(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// === MESSAGE: Comunicación con la app ===
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] Mensaje recibido: SKIP_WAITING → Activando nuevo SW');
    self.skipWaiting(); // ¡Esto fuerza la activación inmediata!
  } else if (event.data?.type === 'CLEAN_CACHE') {
    event.waitUntil(
      Promise.all([
        limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS.dynamic),
        limitCacheSize(ASSETS_CACHE, CACHE_LIMITS.assets)
      ])
    );
  } else if (event.data?.type === 'REFRESH_CONTENT') {
    event.waitUntil(refreshContent());
  }
});

// === PUSH NOTIFICATIONS ===
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Tienes una nueva actualización',
    icon: '/img/icono-192x192.png',
    badge: '/img/icono-192x192.png',
    data: { 
      url: data.url || '/' 
    },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Tu Barrio A Un Click', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsList => {
      const client = clientsList.find(c => c.url === urlToOpen && 'focus' in c);
      if (client) return client.focus();
      return clients.openWindow(urlToOpen);
    })
  );
});

// === FUNCIONES DE APOYO ===

// Precache con manejo de errores y validación de JSON
async function precacheResources(cache, resources) {
  for (const resource of resources) {
    try {
      const response = await fetch(resource, { cache: 'no-cache' });
      if (response.ok) {
        if (resource.endsWith('.json')) {
          const text = await response.text();
          JSON.parse(text); // Validar JSON
          await cache.put(resource, new Response(text, { 
            status: response.status,
            headers: response.headers
          }));
        } else {
          await cache.put(resource, response.clone());
        }
        console.log(`[SW] ✅ Precacheado: ${resource}`);
      }
    } catch (error) {
      console.warn(`[SW] ❌ No se pudo precachear: ${resource}`, error);
    }
  }
}

// Detectar tipo de recurso
function isStaticAsset(path) {
  return /\.(html|css|js|xml|woff2?|ttf|eot)$/i.test(path);
}

function isImage(path) {
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(path);
}

function isApiRequest(path) {
  return /\.json($|\?)/i.test(path);
}

function isNegocioPage(path) {
  return path.startsWith('/negocios/') && path.endsWith('.html');
}

// Estrategia: Cache First (estáticos)
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache-first falló:', error);
    const fallback = await caches.match('/offline.html');
    return fallback || new Response('Offline', { status: 503 });
  }
}

// Estrategia: Network First (APIs)
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request.url, { 
      headers: request.headers,
      mode: 'cors'
    });

    if (response.ok) {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(request);

      const newBodyText = await response.clone().text();
      let cachedBodyText = '';
      if (cached) {
        cachedBodyText = await cached.text();
      }

      if (!cached || cachedBodyText !== newBodyText) {
        await cache.put(request, new Response(newBodyText, {
          status: response.status,
          headers: response.headers
        }));
        console.log(`[SW] ✅ Actualizado: ${request.url}`);
      } else {
        console.log(`[SW] ✅ Servido desde red (sin cambios): ${request.url}`);
      }

      return new Response(newBodyText, response);
    }
  } catch (error) {
    console.error(`[SW] Network falló: ${request.url}`, error);
  }

  // Fallback: caché
  const cached = await caches.match(request);
  if (cached) {
    try {
      const body = await cached.text();
      JSON.parse(body); // Validar JSON
      console.log(`[SW] ⚠️ Sirviendo desde caché: ${request.url}`);
      return cached;
    } catch (e) {
      console.warn(`[SW] JSON inválido en caché: ${request.url}`);
    }
  }

  // Fallback para navegaciones HTML
  const isHtmlRequest = request.destination === 'document';
  if (isHtmlRequest) {
    const fallback = await caches.match('/offline.html');
    if (fallback) return fallback;
  }

  // Último recurso para JSON: array vacío
  return new Response(JSON.stringify([]), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Estrategia: Stale While Revalidate (dinámicos)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await caches.match(request);

  const networkFetch = fetch(request).then(async (res) => {
    if (res.ok) {
      await cache.put(request, res.clone());
    }
    return res;
  }).catch(async () => {
    const fallback = await caches.match('/offline.html');
    return fallback || new Response('Offline', { status: 503 });
  });

  return cached || networkFetch;
}

// Limitar tamaño de caché (FIFO)
async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const toDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(toDelete.map(key => cache.delete(key)));
    }
  } catch (error) {
    console.error(`[SW] Error limpiando ${cacheName}:`, error);
  }
}

// Refrescar contenido manualmente
async function refreshContent() {
  const apiCache = await caches.open(API_CACHE);
  const staticCache = await caches.open(STATIC_CACHE);

  const refreshPromises = [
    ...API_ENDPOINTS,
    ...PRECACHED_URLS.filter(url => url.endsWith('.html') || url.endsWith('.css'))
  ].map(async (url) => {
    try {
      const response = await fetch(url + '?t=' + Date.now());
      if (response.ok) {
        const cache = url.includes('.json') ? apiCache : staticCache;
        await cache.put(url, response.clone());
      }
    } catch (error) {
      console.warn(`[SW] No se pudo refrescar: ${url}`, error);
    }
  });

  await Promise.all(refreshPromises);
}
