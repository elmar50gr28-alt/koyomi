import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildFreshnessReport,evaluateEarthquakeDataFreshness } from '../scripts/check-earthquake-data-freshness.mjs';

const now='2026-09-29T12:00:00Z';
const catalog={schemaId:'koyomi-earthquake-research-catalog-v2',inputSha256:'a'.repeat(64),freshness:{complete:true,storedRecords:161326,catalogThroughUtc:'2026-09-29T11:00:00Z'}};
const thermal={schemaId:'koyomi-earthquake-thermal-public-v1',status:'available',sha256:'b'.repeat(64),observationCount:115115,coverageEndUtc:'2026-09-27T00:00:00Z'};
const healthy=evaluateEarthquakeDataFreshness({catalog,thermal,productionCatalog:structuredClone(catalog),productionThermal:structuredClone(thermal),checkProduction:true,now});
assert.equal(healthy.healthy,true);assert.equal(healthy.catalog.status,'current');assert.equal(healthy.thermal.status,'current');assert.equal(healthy.production.status,'current');assert.match(buildFreshnessReport(healthy),/総合結果: \*\*正常\*\*/);

const staleCatalog=evaluateEarthquakeDataFreshness({catalog:{...catalog,freshness:{...catalog.freshness,catalogThroughUtc:'2026-09-20T00:00:00Z'}},thermal,now});
assert.equal(staleCatalog.healthy,false);assert.equal(staleCatalog.catalog.status,'stale');assert.equal(staleCatalog.catalog.needsUpdate,true);
const staleThermal=evaluateEarthquakeDataFreshness({catalog,thermal:{...thermal,coverageEndUtc:'2026-09-20T00:00:00Z'},now,only:'thermal'});
assert.equal(staleThermal.healthy,false);assert.equal(staleThermal.thermal.status,'stale');
const invalid=evaluateEarthquakeDataFreshness({catalog:{...catalog,inputSha256:'bad'},thermal,now,only:'catalog'});
assert.equal(invalid.healthy,false);assert.equal(invalid.catalog.status,'invalid');
const future=evaluateEarthquakeDataFreshness({catalog:{...catalog,freshness:{...catalog.freshness,catalogThroughUtc:'2026-09-30T00:00:00Z'}},thermal,now,only:'catalog'});
assert.equal(future.catalog.status,'invalid');
const pendingDeploy=evaluateEarthquakeDataFreshness({catalog,thermal,productionCatalog:{...catalog,inputSha256:'c'.repeat(64)},productionThermal:thermal,checkProduction:true,now});
assert.equal(pendingDeploy.healthy,false);assert.equal(pendingDeploy.production.needsDeploy,true);

const [monitor,catalogWorkflow,thermalWorkflow,pkg]=await Promise.all([
  readFile(new URL('../.github/workflows/monitor-earthquake-data-freshness.yml',import.meta.url),'utf8'),
  readFile(new URL('../.github/workflows/update-earthquake-catalog.yml',import.meta.url),'utf8'),
  readFile(new URL('../.github/workflows/update-earthquake-thermal-public-data.yml',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8')
]);
for(const permission of ['actions: write','contents: read','issues: write'])assert.ok(monitor.includes(permission),`monitor permission missing: ${permission}`);
for(const workflow of ['update-earthquake-catalog.yml','update-earthquake-thermal-public-data.yml','pages-production.yml'])assert.ok(monitor.includes(`gh workflow run ${workflow} --ref main`),`bounded recovery missing: ${workflow}`);
assert.match(monitor,/continue-on-error: true/);assert.equal((monitor.match(/gh issue create/g)||[]).length,1,'monitor must create at most one issue');assert.match(monitor,/\[自動監視\] 地震データ更新遅延/);assert.match(monitor,/if \[ ! -f earthquake-data-freshness-report\.md \]/);assert.match(monitor,/gh issue edit/);assert.match(monitor,/gh issue close/);assert.match(monitor,/run: exit 1/);
assert.match(catalogWorkflow,/check:earthquake-data-freshness -- --only catalog/);assert.match(thermalWorkflow,/check:earthquake-data-freshness -- --only thermal/);
assert.match(pkg,/check:earthquake-data-freshness/);

console.log('Earthquake freshness monitor and bounded recovery passed');
