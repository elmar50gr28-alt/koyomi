import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, serviceWorker] = await Promise.all([
  readFile('app.html', 'utf8'),
  readFile('service-worker.js', 'utf8')
]);

assert.ok(app.includes('await KOYOMI_BAZI.prepareCommonReadingThemes()'), 'theme data must load before Bazi rendering');
assert.ok(app.includes('const reading={...KOYOMI_BAZI.buildBaziReading(result,{locale}),commonReading};'), 'common reading must be passed to the UI');
assert.ok(app.includes("'\\u5171\\u901a\\u9451\\u5b9a\\u30c6\\u30fc\\u30de'"), 'common theme heading missing');
assert.ok(!app.includes('function koyomiCommonPrimaryReadingHtml'), 'common-theme cards must not replace the traditional overall reading');
assert.ok(!app.includes('if(commonReading.available){'), 'common-theme availability must not alter the overall result UI');
assert.ok(!app.includes('if(window.lastPersonal)'), 'primary rendering must not depend on a window property hidden by global lexical state');
assert.ok(app.includes("const personalResult=typeof lastPersonal!=='undefined'?lastPersonal:null;"), 'legacy personal result must be accessed safely');
assert.ok(app.includes("const question=document.getElementById('question')?.value"), 'consultation question must reach the common engine');
assert.ok(serviceWorker.includes("common-reading-v5-universal"), 'universal reading release must bump the offline cache');
for (const file of [
  './src/reading/index.js',
  './src/reading/reading-engine.js',
  './src/reading/theme-loader.js',
  './src/reading/theme-selector.js',
  './src/reading/sentence-composer.js',
  './src/reading/question-interpreter.js',
  './src/reading/concrete-answer-composer.js',
  './data/reading/common_reading_themes.json'
]) assert.ok(serviceWorker.includes(file), `offline cache entry missing: ${file}`);

console.log('Common reading UI integration passed');
