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
assert.ok(app.includes('id="koyomiHomeResult"'), 'short result must render on the calendar home');
assert.ok(app.includes('理由と本鑑定を見る'));
assert.ok(app.includes('window.KOYOMI_DAILY_CONTEXT=Object.freeze'));
assert.ok(app.includes('const dailyContext=window.KOYOMI_DAILY_CONTEXT'));
assert.ok(!app.includes('const dateKey=fmtIso(selectedDate||new Date())'), 'module must not read private calendar functions');
assert.ok(app.includes('ledgerEscape(profile.displayName'), 'home renderer must use an escape helper in its own scope');
assert.ok(app.includes("$('koyomiOpenFullReading').onclick=()=>{setPage('personal')"), 'details must only reveal the generated reading');
assert.ok(app.includes("sessionStorage.setItem('koyomi.pending-reading.v1','today')"), 'first-time setup must remember the requested reading');
assert.ok(app.includes("sessionStorage.getItem('koyomi.pending-reading.v1')==='today'&&p.birthData?.date"), 'saving initial details must resume automatically');
assert.ok(app.includes('body.koyomi-profile-ready #personalForm .personal-actions{display:none}'), 'saved users must not face a redundant start button');
assert.ok(!app.includes('今日の私を占う'));
assert.ok(worker.includes('home-one-click-v2'));
console.log('home one-click reading: ok');
