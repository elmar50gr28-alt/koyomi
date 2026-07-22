const CACHE_VERSION = 'koyomi-foundation-20260722-33';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  './',
  './index.html',
  './today.html',
  './app.html',
  './src/shared/calendar-time-core.js',
  './src/shared/profile-validation-core.js',
  './src/shared/profile-normalization-core.js',
  './src/shared/profile-save-core.js',
  './src/shared/menu-routing-core.js',
  './src/persona/conversation-adapter.js',
  './src/persona/sister-renderer.js',
  './src/data/name-strokes.js',
  './src/shared/calendar-time-compat.js',
  './src/shared/profile-schema-compat.js',
  './src/shared/crypto-compat.js',
  './src/shared/indexeddb-compat.js',
  './src/shared/backup-compat.js',
  './smoke-test.html',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const activeCaches = new Set([
    SHELL_CACHE,
    RUNTIME_CACHE
  ]);

  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => !activeCaches.has(key))
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isHtmlRequest(request) {
  const accept = request.headers.get('accept') || '';

  return (
    request.mode === 'navigate' ||
    accept.includes('text/html')
  );
}

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

async function networkFirstHtml(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });

    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);

      cache
        .put(request, response.clone())
        .catch(() => {});
    }

    return response;
  } catch (error) {
    const cachedPage = await caches.match(request);

    if (cachedPage) {
      return cachedPage;
    }

    const homePage = await caches.match('./index.html');

    if (homePage) {
      return homePage;
    }

    return new Response(
      'KOYOMIは現在オフラインです。',
      {
        status: 503,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const networkRequest = fetch(request).then(
    async response => {
      if (response && response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);

        cache
          .put(request, response.clone())
          .catch(() => {});
      }

      return response;
    }
  );

  if (cachedResponse) {
    networkRequest.catch(() => {});
    return cachedResponse;
  }

  try {
    return await networkRequest;
  } catch (error) {
    return new Response(
      'オフラインのため、このデータを取得できません。',
      {
        status: 503,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      }
    );
  }
}

self.addEventListener('fetch', event => {
  const { request } = event;

  if (
    request.method !== 'GET' ||
    !isSameOrigin(request)
  ) {
    return;
  }

  if (isHtmlRequest(request)) {
    event.respondWith(networkFirstHtml(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
