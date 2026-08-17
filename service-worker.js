const CACHE_VERSION = 'koyomi-foundation-20260728-72-v117-20260805-73-western-suite-v1-20260806-common-reading-v5-universal-mundane-research-v1-integrated-persona-v1-adaptive-narrative-v1-western-120-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  './',
  './index.html',
  './today.html',
  './app.html',
  './src/ui/sol-theme.css',
  './src/ui/today-layer-renderer.js',
  './src/ui/today-personal-location.js',
  './src/shared/calendar-time-core.js',
  './src/shared/profile-validation-core.js',
  './src/shared/profile-normalization-core.js',
  './src/shared/profile-save-core.js',
  './src/shared/menu-routing-core.js',
  './src/shared/native-date-picker-core.js',
  './src/mundane/western/index.js',
  './src/mundane/western/browser-global.js',
  './src/mundane/western/seasonal-ingress-core.js',
  './src/mundane/western/seasonal-interpretation-core.js',
  './src/mundane/western/monthly-trend-core.js',
  './src/mundane/western/astronomy-engine-adapter.js',
  './src/bazi/astronomy/solar-term-core.js',
  './src/bazi/reading/chart-interpretation.js',
  './src/reading/index.js',
  './src/reading/reading-engine.js',
  './src/reading/theme-loader.js',
  './src/reading/theme-selector.js',
  './src/reading/sentence-composer.js',
  './src/reading/question-interpreter.js',
  './src/reading/concrete-answer-composer.js',
  './src/reading/universal-reading-engine.js',
  './src/reading/integrated-judgment-core.js',
  './src/reading/meaning-evidence-translator.js',
  './src/reading/adaptive-narrative-engine.js',
  './src/reading/daily/daily-reading-core.js',
  './src/reading/daily/daily-reading-controller.js',
  './data/reading/common_reading_themes.json',
  './data/reading/adaptive_narrative_catalog.json',
  './src/persona/conversation-adapter.js',
  './src/persona/reading-structure-planner.js',
  './src/persona/persona-policy.js',
  './src/persona/sister-renderer.js',
  './src/persona/sister-lexicon.js',
  './src/persona/beginner-explainer.js',
  './src/persona/divination-glossary.js',
  './src/data/name-strokes.js',
  './src/astrology/western-core-v1.js',
  './src/astrology/western-transits-v1.js',
  './src/astrology/western-synastry-v1.js',
  './src/astrology/western-solar-return-v1.js',
  './src/astrology/western-progressions-v1.js',
  './src/astrology/western-dignities-v1.js',
  './src/astrology/western-points-v1.js',
  './src/astrology/western-patterns-v1.js',
  './src/astrology/western-composite-v1.js',
  './src/astrology/western-professional-v1.js',
  './src/astrology/western-reading-v1.js',
  './src/astrology/western-chart-wheel-v1.js',
  './src/astrology/western-forecast-v1.js',
  './src/astrology/western-solar-arc-v1.js',
  './src/astrology/western-davison-v1.js',
  './src/astrology/western-fixed-stars-v1.js',
  './src/astrology/western-suite-loader.js',
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
      'こよみは現在オフラインです。',
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
