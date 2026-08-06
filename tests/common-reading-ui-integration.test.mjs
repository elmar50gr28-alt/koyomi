import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, serviceWorker] = await Promise.all([
  readFile('app.html', 'utf8'),
  readFile('service-worker.js', 'utf8')
]);

assert.ok(app.includes('await KOYOMI_BAZI.prepareCommonReadingThemes()'), 'theme data must load before Bazi rendering');
assert.ok(app.includes('commonReading:result.commonReading'), 'common reading must be passed to the UI');
assert.ok(app.includes("'\\u5171\\u901a\\u9451\\u5b9a\\u30c6\\u30fc\\u30de'"), 'common theme heading missing');
for (const file of [
  './src/reading/index.js',
  './src/reading/reading-engine.js',
  './src/reading/theme-loader.js',
  './src/reading/theme-selector.js',
  './src/reading/sentence-composer.js',
  './data/reading/common_reading_themes.json'
]) assert.ok(serviceWorker.includes(file), `offline cache entry missing: ${file}`);

console.log('Common reading UI integration passed');
