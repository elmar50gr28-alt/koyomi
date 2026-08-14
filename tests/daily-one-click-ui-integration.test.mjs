import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, worker] = await Promise.all([readFile('app.html', 'utf8'), readFile('service-worker.js', 'utf8')]);
assert.ok(app.includes('今日の結論を見る'));
assert.ok(app.includes('行動結果の入力は不要'));
assert.ok(app.includes('KOYOMI_DAILY_READING?.getOrCreate'));
assert.ok(app.includes('function koyomiDailyReadingHtml'));
assert.ok(app.includes("source==='cache'"));
assert.ok(app.includes('dailyReading?.action||commonReading.todayAction'));
for (const path of ['./src/reading/daily/daily-reading-core.js', './src/reading/daily/daily-reading-controller.js']) assert.ok(worker.includes(path));
assert.ok(app.includes('reading.blocks'));
assert.ok(app.includes('reading.safetyNotice'));
assert.ok(app.includes('function koyomiRenderHomeResult'));
assert.ok(app.includes('function koyomiGeneratePersonalOnce'));
assert.ok(worker.includes('home-one-click-v1'));
console.log('daily one-click UI integration: ok');
