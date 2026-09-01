const CACHE_VERSION = 'koyomi-foundation-20260728-72-v117-20260805-73-western-suite-v1-20260806-common-reading-v5-universal-mundane-research-v1-integrated-persona-v1-adaptive-narrative-v1-western-130-v1-language-quality-v3-world-forecast-v1-h3-v2-maplibre-local-v1-globe-v2-mundane-accuracy-v1-earthquake-safety-v2-8-world-layer-v2-preview-dated-v1-outcomes-v1-catalog-v2-change-map-v1-research-signals-v1-geomagnetic-v1-narrative-v2-prefectures-v1-volcano-v7-live-data-earth-signs-v1-conflict-signs-v1-mundane-integrated-v1-blind-world-v1-adaptive-zoom-v1-explainability-v1-multi-divination-v1-simple-ui-v1-single-layer-ui-v1-event-scenarios-v1-readable-ui-v1-natural-environment-v3-stable-selection-live-earthquake-v15-immediate-native-render';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const MAP_CORE_CACHE = `${CACHE_VERSION}-map-core`;
const MAP_REGION_CACHE = `${CACHE_VERSION}-map-region`;
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
  './src/shared/service-worker-update.js',
  './src/mundane/western/index.js',
  './src/mundane/western/browser-global.js',
  './src/mundane/western/seasonal-ingress-core.js',
  './src/mundane/western/seasonal-interpretation-core.js',
  './src/mundane/western/monthly-trend-core.js',
  './src/mundane/western/astronomy-engine-adapter.js',
  './src/mundane/integrated/national-charts.js',
  './src/mundane/integrated/integrated-mundane-core.js',
  './src/world/index.js',
  './src/world/world-core.js',
  './src/world/spatial-grid.js',
  './src/world/mundane-earthquake-adapter.js',
  './src/world/earth-signs-core.js',
  './src/world/earth-signs-ledger.js',
  './src/world/conflict/regions.js',
  './src/world/conflict/conflict-signs-core.js',
  './src/world/conflict/conflict-event-lexicon.js',
  './src/world/conflict/conflict-event-scenario-engine.js',
  './src/world/conflict/conflict-signs-ledger.js',
  './src/world/conflict/conflict-quality-guard.js',
  './src/world/blind-mundane/blind-world-grid.js',
  './src/world/blind-mundane/spatial-clusterer.js',
  './src/world/blind-mundane/world-place-resolver.js',
  './src/world/blind-mundane/selection-bias-guard.js',
  './src/world/blind-mundane/blind-mundane-scanner.js',
  './src/world/blind-mundane/adaptive-viewport-cache.js',
  './src/world/multi-mundane/world-divination-adapters.js',
  './src/world/world-map-ui.js',
  './src/world/earthquake-live-data.js',
  './src/world/natural-environment/natural-environment-core.js',
  './src/world/natural-environment/natural-environment-scanner.js',
  './src/world/world-map.css',
  './src/world/world-evaluation-cache.js',
  './src/world/validation-core.js',
  './src/world/earthquake-forecast/index.js',
  './src/world/earthquake-forecast/config.js',
  './src/world/earthquake-forecast/types.js',
  './src/world/earthquake-forecast/data.js',
  './src/world/earthquake-forecast/features.js',
  './src/world/earthquake-forecast/model.js',
  './src/world/earthquake-forecast/validation.js',
  './src/world/earthquake-forecast/display-policy.js',
  './src/world/earthquake-forecast/action-policy.js',
  './src/world/earthquake-forecast/ui.js',
  './src/world/earthquake-forecast/change-preview.js',
  './src/world/earthquake-forecast/research-signals.js',
  './src/world/earthquake-forecast/geomagnetic-data.js',
  './src/world/volcano/index.js',
  './src/world/volcano/config.js',
  './src/world/volcano/heat-transfer.js',
  './src/world/volcano/seismic-coupling.js',
  './src/world/volcano/release-gate.js',
  './src/world/volcano/display-policy.js',
  './src/world/volcano/map-layer.js',
  './src/world/volcano/alert-level.js',
  './src/world/volcano/localization.js',
  './src/world/volcano/observation-compat.js',
  './vendor/h3-js/4.5.0/h3-js.es.js',
  './vendor/h3-js/4.5.0/LICENSE',
  './vendor/h3-js/4.5.0/NOTICE',
  './vendor/h3-js/4.5.0/KOYOMI_VENDOR.md',
  './data/world/validation-events.json',
'./data/world/earthquake-research-preview-v1.json',
'./data/world/earthquake-research-catalog-v2.json',
'./data/world/geomagnetic-research-v1.json',
'./data/world/volcano-catalog-v1.json',
'./data/world/volcano-catalog-v2.json',
'./data/world/volcano-observations-v1.json',
'./data/world/volcano-official-alerts-v1.json',
  './data/research/earthquake-validation-summary.json',
  './src/bazi/astronomy/solar-term-core.js',
  './src/bazi/reading/chart-interpretation.js',
  './src/reading/index.js',
  './src/reading/reading-engine.js',
  './src/reading/theme-loader.js',
  './src/reading/theme-selector.js',
  './src/reading/sentence-composer.js',
  './src/reading/question-interpreter.js',
  './src/reading/concrete-answer-composer.js',
  './src/reading/app-narrative-engine.js',
  './src/reading/universal-reading-engine.js',
  './src/reading/integrated-judgment-core.js',
  './src/reading/meaning-evidence-translator.js',
  './src/reading/output-quality-guard.js',
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

const MAP_CORE_ASSETS = [
  './src/world/offline-map-style.js',
  './src/world/world-graticule.js',
  './vendor/maplibre-gl/5.24.0/maplibre-gl.js',
  './vendor/maplibre-gl/5.24.0/maplibre-gl.css',
  './vendor/maplibre-gl/5.24.0/LICENSE.txt',
  './vendor/maplibre-gl/5.24.0/KOYOMI_VENDOR.md',
  './data/map/natural-earth-50m-countries.geojson',
  './data/map/natural-earth-50m-lakes.geojson',
  './data/map/NATURAL_EARTH_LICENSE.md',
  './data/map/KOYOMI_MAP_DATA.md',
  './data/map/japan-prefectures-2026.geojson',
  './data/map/JAPAN_PREFECTURE_BOUNDARIES.md'
];

async function cacheMapCore() {
  const cache = await caches.open(MAP_CORE_CACHE);
  await Promise.allSettled(MAP_CORE_ASSETS.map(asset => cache.add(asset)));
}

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then(cache => cache.addAll(APP_SHELL)),
      cacheMapCore().catch(() => {})
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const activeCaches = new Set([
    SHELL_CACHE,
    MAP_CORE_CACHE,
    MAP_REGION_CACHE,
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

function isMapCoreRequest(request) {
  const path = new URL(request.url).pathname;
  return path.includes('/vendor/maplibre-gl/') || path.includes('/data/map/') || path.endsWith('/src/world/offline-map-style.js') || path.endsWith('/src/world/world-graticule.js');
}

async function cacheFirstMapCore(request) {
  const cache = await caches.open(MAP_CORE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (error) {
    return new Response('オフライン基本地図を取得できません。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
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

async function networkFirstLiveData(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('観測データを取得できません。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
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

  if (isMapCoreRequest(request)) {
    event.respondWith(cacheFirstMapCore(request));
    return;
  }

  if (/\/data\/world\/volcano-(?:observations|official-alerts)-v1\.json$/.test(new URL(request.url).pathname)) {
    event.respondWith(networkFirstLiveData(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
