/// <reference lib="webworker" />

// Advanced PWA Service Worker for QuadraFC
const CACHE_NAME = 'quadrafc-v1.0.0';
const RUNTIME_CACHE = 'quadrafc-runtime';
const IMAGE_CACHE = 'quadrafc-images';
const API_CACHE = 'quadrafc-api';

// URLs críticas para cache
const CRITICAL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/assets/icon.png'];

// URLs da API para cache
const API_URLS = ['/api/rodadas', '/api/ranking', '/api/user'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache crítico
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(CRITICAL_URLS);
      }),

      // Cache de runtime
      caches.open(RUNTIME_CACHE),

      // Cache de imagens
      caches.open(IMAGE_CACHE),

      // Cache de API
      caches.open(API_CACHE),
    ]).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== IMAGE_CACHE &&
              cacheName !== API_CACHE
            ) {
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Tomar controle de todas as páginas
      self.clients.claim(),
    ]).then(() => {})
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia baseada no tipo de recurso
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'document') {
    event.respondWith(handleDocumentRequest(request));
  } else {
    event.respondWith(handleResourceRequest(request));
  }
});

// Manipulador para imagens - Cache First
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Retornar imagem placeholder se necessário
    return new Response('', { status: 404 });
  }
}

// Manipulador para API - Network First com fallback
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache apenas GETs bem-sucedidos
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } else {
      throw new Error(`API returned ${networkResponse.status}`);
    }
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Retornar resposta offline personalizada
    return createOfflineApiResponse(request);
  }
}

// Manipulador para documentos HTML - Network First
async function handleDocumentRequest(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache documentos bem-sucedidos
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback para página offline
    return createOfflinePageResponse();
  }
}

// Manipulador para outros recursos - Cache First
async function handleResourceRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Buscar atualização em background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response);
        }
      })
      .catch(() => {
        // Ignorar erros de background fetch
      });

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

// Criar resposta offline para API
function createOfflineApiResponse(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  let offlineData = {};

  if (pathname.includes('/ranking')) {
    offlineData = {
      message: 'Dados offline - Ranking não disponível',
      offline: true,
      data: [],
    };
  } else if (pathname.includes('/rodadas')) {
    offlineData = {
      message: 'Dados offline - Rodadas não disponíveis',
      offline: true,
      data: [],
    };
  } else {
    offlineData = {
      message: 'Você está offline. Alguns dados podem não estar atualizados.',
      offline: true,
    };
  }

  return new Response(JSON.stringify(offlineData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

// Criar página offline
function createOfflinePageResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>QuadraFC - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .offline-container {
          max-width: 400px;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .offline-icon {
          font-size: 60px;
          margin-bottom: 20px;
        }

        h1 {
          margin: 0 0 16px 0;
          font-size: 24px;
        }

        p {
          margin: 0 0 24px 0;
          opacity: 0.9;
          line-height: 1.5;
        }

        .retry-button {
          background: #ff6a3d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .retry-button:hover {
          background: #e55a2b;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱⚡</div>
        <h1>QuadraFC</h1>
        <p>Você está offline, mas o app ainda funciona! Algumas funcionalidades podem estar limitadas.</p>
        <button class="retry-button" onclick="window.location.reload()">
          Tentar Novamente
        </button>
      </div>
    </body>
    </html>
  `;

  return new Response(offlineHTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
  });
}

// Listener para mensagens do app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(RUNTIME_CACHE),
        caches.delete(IMAGE_CACHE),
        caches.delete(API_CACHE),
      ]).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// Listener para sync em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sincronizar dados críticos
    const cache = await caches.open(API_CACHE);

    for (const url of API_URLS) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {}
    }
  } catch (error) {}
}

// Listener para push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nova atualização disponível!',
    icon: '/icons/apple-icon-180.png',
    badge: '/icons/apple-icon-180.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icons/apple-icon-180.png',
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/apple-icon-180.png',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('QuadraFC', options));
});

// Listener para clique em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(self.clients.openWindow('/'));
  }
});
