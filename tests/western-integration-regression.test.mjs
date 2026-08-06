import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app.html','utf8');
const worker=await readFile('service-worker.js','utf8');
const modules=['western-core-v1.js','western-transits-v1.js','western-synastry-v1.js','western-solar-return-v1.js','western-progressions-v1.js','western-dignities-v1.js','western-points-v1.js','western-patterns-v1.js','western-composite-v1.js','western-professional-v1.js','western-reading-v1.js','western-suite-loader.js'];
for(const file of modules){assert.ok(app.includes(`./src/astrology/${file}`),`${file} must load in app`);assert.ok(worker.includes(`'./src/astrology/${file}'`),`${file} must be cached offline`)}
assert.ok(app.includes('id="reading-shichu"'),'Bazi result remains available');
assert.ok(app.includes('id="reading-sukuyo"'),'Sukuyo result remains available');
assert.ok(app.includes('id="reading-kyusei"'),'Kyusei result remains available');
assert.ok(app.includes('id="overallReading"'),'Integrated reading remains available');
const loader=await readFile('src/astrology/western-suite-loader.js','utf8');
assert.ok(loader.includes('c.westernConsensusTags=c.westernAstrology.consensusTags'),'integrated boundary must expose consensusTags only');
assert.ok(!loader.includes('c.reading='),'suite must not inject Western prose into integrated reading');
console.log('Western integration and offline regression test passed');
