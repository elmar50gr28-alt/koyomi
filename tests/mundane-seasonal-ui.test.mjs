import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile('app.html', 'utf8');
const worker = await readFile('service-worker.js', 'utf8');

assert.ok(app.includes('data-page="mundane">マンデン'), 'desktop navigation must expose mundane astrology');
assert.ok(app.includes('id=\'page-mundane\''), 'mundane page must be installed');
assert.ok(app.includes('id="mundaneGenerate"'), 'mundane page must provide a generation action');
assert.ok(app.includes("import('./src/mundane/western/index.js')"), 'UI must load the independent mundane core');
assert.ok(app.includes('module.buildSeasonalIngressCharts'), 'UI must render the shared seasonal ingress result');
for (const path of ['index.js', 'seasonal-ingress-core.js', 'astronomy-engine-adapter.js']) {
  assert.ok(worker.includes(`'./src/mundane/western/${path}'`), `${path} must be available offline`);
}

console.log('Mundane seasonal UI passed');
