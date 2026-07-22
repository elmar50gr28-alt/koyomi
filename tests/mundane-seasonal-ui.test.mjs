import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile('app.html', 'utf8');
const worker = await readFile('service-worker.js', 'utf8');

assert.ok(app.includes('data-page="mundane">マンデン'), 'desktop navigation must expose mundane astrology');
assert.ok(app.includes('id=\'page-mundane\''), 'mundane page must be installed');
assert.ok(app.includes('id="mundaneGenerate"'), 'mundane page must provide a generation action');
assert.ok(app.includes("import('./src/mundane/western/index.js')"), 'UI must load the independent mundane core');
assert.ok(app.includes('<script src="./src/mundane/western/browser-global.js"></script>'), 'file protocol must preload the classic browser core');
assert.ok(app.includes("location.protocol==='file:'?Promise.resolve(window.KOYOMI_MUNDANE_BROWSER_CORE)"), 'file protocol must avoid blocked dynamic module imports');
assert.ok(app.includes('module.buildSeasonalIngressCharts'), 'UI must render the shared seasonal ingress result');
assert.ok(app.includes('id="mundaneReading"'), 'mundane page must provide an annual reading area');
assert.ok(app.includes('module.interpretSeasonalIngressChart'), 'UI must interpret each seasonal chart');
assert.ok(app.includes('module.synthesizeSeasonalIngressReadings'), 'UI must synthesize the annual reading');
assert.ok(app.includes('判断の根拠'), 'seasonal reading must expose its evidence');
assert.ok(app.includes('年間を通して確認するもの'), 'annual reading must explain what to observe');
assert.ok(app.includes('現実での備え'), 'seasonal reading must provide concrete preparation');
assert.ok(app.includes('id="mundaneMonthly"'), 'mundane page must provide a monthly visualization');
assert.ok(app.includes('module.buildMonthlyIngressCharts'), 'UI must calculate twelve monthly charts');
assert.ok(app.includes('module.buildMonthlyTrend'), 'UI must calculate transparent monthly indices');
assert.ok(app.includes('数値は出来事の確率ではなく'), 'UI must explain what the indices mean');
for (const path of ['index.js', 'browser-global.js', 'seasonal-ingress-core.js', 'seasonal-interpretation-core.js', 'monthly-trend-core.js', 'astronomy-engine-adapter.js']) {
  assert.ok(worker.includes(`'./src/mundane/western/${path}'`), `${path} must be available offline`);
}

console.log('Mundane seasonal UI passed');
