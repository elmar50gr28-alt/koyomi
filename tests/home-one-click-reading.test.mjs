import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [index, app, worker] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('app.html', 'utf8'),
  readFile('service-worker.js', 'utf8')
]);

assert.ok(index.includes('app.html?start=today#calendar'), 'home CTA must request immediate reading');
assert.ok(app.includes("new URLSearchParams(location.search).get('start')==='today'"));
assert.ok(app.includes('await koyomiStartPersonalReading()'), 'direct entry must continue without a second confirmation');
assert.ok(!app.includes('id="koyomiHomeResult"'), 'a low-value intermediate result must not interrupt the flow');
assert.ok(app.includes('function koyomiOpenGeneratedPersonalReading'));
assert.ok(app.includes("setPage('personal')"), 'the CTA must open the full reading directly');
assert.ok(app.includes('window.KOYOMI_DAILY_CONTEXT=Object.freeze'));
assert.ok(app.includes('const dailyContext=window.KOYOMI_DAILY_CONTEXT'));
assert.ok(!app.includes('const dateKey=fmtIso(selectedDate||new Date())'), 'module must not read private calendar functions');
assert.ok(app.includes("koyomiRenderedPersonalKey===key&&window.KOYOMI_LAST_BAZI_READING"), 'same-day full reading must be reused');
assert.ok(app.includes('今日の本鑑定へ戻る'));
assert.ok(app.includes("sessionStorage.setItem('koyomi.pending-reading.v1','today')"), 'first-time setup must remember the requested reading');
assert.ok(app.includes("sessionStorage.getItem('koyomi.pending-reading.v1')==='today'&&p.birthData?.date"), 'saving initial details must resume automatically');
assert.ok(app.includes('body.koyomi-profile-ready #personalForm .personal-actions{display:none}'), 'saved users must not face a redundant start button');
assert.ok(!app.includes('今日の私を占う'));
assert.ok(worker.includes('direct-full-reading-v1'));
console.log('home one-click reading: ok');
