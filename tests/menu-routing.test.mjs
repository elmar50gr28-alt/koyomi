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
  mundane: 'マンデン',
  compat: '相性',
  timeline: '人生年表',
  calendar: '世界の暦',
  ledger: '人物入力',
  settings: '設定・ことば案内'
};

for (const [page, label] of Object.entries(expected)) {
  assert.equal(routing.resolveHash(`#${page}`), page, `${label} hash must resolve`);
  assert.ok(app.includes(`id="page-${page}"`) || app.includes(`page.id='page-${page}'`), `${label} page must exist`);
}
assert.ok(index.includes('href="app.html#ledger"'), 'home must keep the person-input destination');
assert.ok(!index.includes('詳しく見る'), 'home must not show the old detail menu');

assert.equal(routing.resolveHash(''), 'calendar', 'empty hash must use the safe default');
assert.equal(routing.resolveHash('#unknown'), 'calendar', 'unknown hash must use the safe default');
assert.equal(routing.resolveHash('#oracle'), 'oracle');
assert.ok(app.includes('id="page-oracle"'), 'tarot/rune must have a dedicated route');
assert.doesNotMatch(index, /href="app\.html#personal"[^>]*>[^<]*<span[^>]*>牌/);
assert.ok(app.includes('id="page-oracle"'), 'tarot/rune route must remain available');
assert.ok(!app.includes('古代メソポタミア神託 × ミツノメ神字・音環占'));
assert.ok(!app.includes('id="reading-mesopotamia"'));
assert.ok(!app.includes('id="reading-onkan"'));
assert.ok(app.includes('buildDivinationReadings=function(c){return v192BuildDivinationsBase(c)}'), 'retired oracles must not enter integrated readings');
assert.ok(app.includes('compatibility=function(){return v192CompatibilityBase()}'), 'retired oracles must not affect compatibility scores');
assert.ok(app.includes('collectState=function(){return v192CollectBase()}'), 'retired oracle inputs must not enter saved state');
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

assert.ok(worker.includes("koyomi-foundation-20260723-66"), 'service worker cache version must be bumped');
assert.ok(worker.includes("'./src/persona/divination-glossary.js'"));
assert.ok(worker.includes("'./src/persona/beginner-explainer.js'"));
assert.ok(worker.includes("'./src/persona/sister-lexicon.js'"));
assert.ok(worker.includes("'./src/persona/sister-renderer.js'"));
assert.ok(worker.includes("'./src/persona/conversation-adapter.js'"), 'persona adapter must be available offline');
assert.ok(worker.includes("'./src/shared/menu-routing-core.js'"), 'routing core must be available offline');
assert.ok(worker.includes("fetch(request, { cache: 'no-store' })"), 'HTML navigation must bypass stale browser caches');

console.log('Menu routing regression checks passed.');
