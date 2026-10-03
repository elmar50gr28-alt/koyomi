# Astronomy Engine 2.1.19 vendor record

- Package: astronomy-engine@2.1.19
- Upstream: https://github.com/cosinekitty/astronomy
- Registry tarball: https://registry.npmjs.org/astronomy-engine/-/astronomy-engine-2.1.19.tgz
- npm shasum: 41b9fd2afb7eba3485e3803cbd9033011f8557af
- npm integrity: sha512-8yWKNf7UeNbH458h3sAJ6ZgAjE5jTXp/mNNRFoC20j2SHwZIjAQeEsBB2Q3uCFRaTCCJRv33K2XhkhZQMXoX6w==
- Included artifact: astronomy.browser.min.js
- Artifact SHA-256: f41139a87941ea017ab902b954c9389fa27ea72083d7fab4971756d7769d14e6
- License: MIT; copyright notice and license preserved in the artifact and LICENSE.

The browser artifact is unmodified. It replaces the same-version CDN script with a same-origin file so the service worker can cache it. No package install scripts were run. No new telemetry or external data transmission is introduced.

Initial offline use requires the app and this asset to have been loaded or cached successfully. Cache deletion, failed initial loading, or a damaged asset can still cause the existing approximation fallback. This change does not alter the engine version or the application's numerical rules. Future updates must check integrity, licensing, cached delivery, affected astrology calculations, and official solar-term fixtures.
