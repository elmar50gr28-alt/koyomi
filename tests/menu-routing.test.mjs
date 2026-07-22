import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile('src/shared/menu-routing-core.js', 'utf8');
const app = await readFile('app.html', 'utf8');
const index = await readFile('index.html', 'utf8');
const worker = await readFile('service-worker.js', 'utf8');
const writes = [];
const context = {
  location: { hash: '', pathname: '/koyomi/app.html', search: '' },
  history: { replaceState: (_state, _title, url) => writes.push(url) }
};
context.window = context;
vm.runInNewContext(source, context);
const routing = context.KOYOMI_MENU_ROUTING_CORE;

const expected = {
  personal: '四柱推命・総合鑑定',
  qimen: '奇門遁甲',
  compat: '相性',
  timeline: '人生年表',
  calendar: '世界の暦',
  ledger: '人物入力',
  settings: '設定・ことば案内'
};

for (const [page, label] of Object.entries(expected)) {
  assert.equal(routing.resolveHash(`#${page}`), page, `${label} hash must resolve`);
  assert.match(index, new RegExp(`href="app\\.html#${page}"`), `${label} menu must use a relative Pages URL`);
  assert.ok(app.includes(`id="page-${page}"`), `${label} page must exist`);
}

assert.equal(routing.resolveHash(''), 'calendar', 'empty hash must use the safe default');
assert.equal(routing.resolveHash('#unknown'), 'calendar', 'unknown hash must use the safe default');
assert.equal(routing.resolveHash('#oracle'), 'oracle');
assert.ok(index.includes('href="app.html#oracle"'), 'tarot/rune must have a dedicated route');
assert.doesNotMatch(index, /href="app\.html#personal"[^>]*>[^<]*<span[^>]*>牌/);
assert.ok(app.includes('id="page-oracle"'));
assert.ok(app.includes('専用画面は準備中です'));
assert.ok(app.includes("window.addEventListener('hashchange'"), 'hashchange must drive routing');
assert.ok(app.includes('applyHashPage({replaceUnknown:true})'), 'initial load must apply the hash');
assert.ok(
  app.indexOf('startOfLocalDay:startOfDay') < app.indexOf('selectedDate=startOfDay(new Date())'),
  'calendar helpers must be initialized before the app selects its first date'
);

routing.writeHash('qimen');
assert.equal(context.location.hash, '#qimen', 'tab navigation must write a hash');
context.location.hash = '#unknown';
routing.writeHash('unknown', { replace: true });
assert.deepEqual(writes, ['/koyomi/app.html#calendar'], 'unknown hashes must be replaced safely under a Pages subpath');

assert.ok(worker.includes("koyomi-foundation-20260722-13"), 'service worker cache version must be bumped');
assert.ok(worker.includes("'./src/shared/menu-routing-core.js'"), 'routing core must be available offline');
assert.ok(worker.includes("fetch(request, { cache: 'no-store' })"), 'HTML navigation must bypass stale browser caches');

console.log('Menu routing regression checks passed.');
