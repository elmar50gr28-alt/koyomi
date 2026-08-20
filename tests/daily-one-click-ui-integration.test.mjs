import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, worker] = await Promise.all([readFile('app.html', 'utf8'), readFile('service-worker.js', 'utf8')]);
assert.ok(app.includes('今日の鑑定を見る'));
assert.ok(app.includes('入力画面や簡易結果は挟みません'));
assert.ok(app.includes('KOYOMI_DAILY_READING?.getOrCreate'));
for (const path of ['./src/reading/daily/daily-reading-core.js', './src/reading/daily/daily-reading-controller.js']) assert.ok(worker.includes(path));
assert.ok(app.includes('function koyomiGeneratePersonalOnce'));
assert.ok(worker.includes('integrated-persona-v1'));
for (const removed of ['function koyomiDailyReadingHtml','koyomi-daily-one-click','personalActionSummary','data-personal-action=']) assert.ok(!app.includes(removed), `${removed} must not remain in the DOM path`);
assert.ok(!app.includes('overall.innerHTML'), 'the traditional overall reading must never be replaced with generated cards');
assert.ok(app.includes("$('overallReading').textContent=g.text"), 'the traditional integrated reading must remain the only overall result');
console.log('daily one-click UI integration: ok');
