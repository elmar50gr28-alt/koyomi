import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { calculateGeomagneticSignal, RESEARCH_SIGNAL_DEFINITIONS, validateGeomagneticDataset } from '../src/world/earthquake-forecast/index.js';
import { fetchOfficialKp } from '../scripts/update-geomagnetic-research-data.mjs';

const dataset=validateGeomagneticDataset(JSON.parse(await readFile('data/world/geomagnetic-research-v1.json','utf8'))),ui=await readFile('src/world/world-map-ui.js','utf8'),signalsSource=await readFile('src/world/earthquake-forecast/research-signals.js','utf8'),serviceWorker=await readFile('service-worker.js','utf8'),workflow=await readFile('.github/workflows/update-geomagnetic-data.yml','utf8');
const hash=createHash('sha256').update(JSON.stringify(dataset.observations)).digest('hex');
assert.equal(dataset.schemaId,'koyomi-geomagnetic-research-v1'); // GT01/GT07/GT08
assert.equal(hash,dataset.sha256);assert.equal(dataset.recordCount,dataset.observations.length);
assert.ok(dataset.recordCount>30_000);assert.match(dataset.provider.kp.sourceName,/GFZ/);assert.equal(dataset.provider.kp.license,'CC BY 4.0');
assert.ok(dataset.observations.every((item,index)=>item.dst===null&&(!index||Date.parse(item.timeUtc)>Date.parse(dataset.observations[index-1].timeUtc))));

const forecastTime=Date.parse(dataset.coverageEndUtc)-2*86_400_000,signal=calculateGeomagneticSignal(dataset,{forecastTime});
assert.ok(['available','inactive'].includes(signal.status));assert.equal(signal.global,true);assert.ok(signal.strongestLagDays>=7&&signal.strongestLagDays<=21); // GT11/GT16
assert.ok(Number.isFinite(signal.anomalyAt15d));assert.ok(Number.isFinite(signal.lag27Control));assert.ok(Number.isFinite(signal.lag54Control)); // GT12-GT14
assert.equal(signal.dstAtStrongestLag,null);assert.ok(Number.isFinite(signal.kpAtStrongestLag)); // GT06/GT15
const future={...dataset,coverageEndUtc:new Date(forecastTime+86_400_000).toISOString(),observations:[...dataset.observations.filter(item=>Date.parse(item.timeUtc)<forecastTime),{timeUtc:new Date(forecastTime+3_600_000).toISOString(),kp:9,dst:-200}]};
const futureSignal=calculateGeomagneticSignal(future,{forecastTime});for(const key of ['signal0To100','geomagneticLagPercentile','strongestLagDays','kpAtStrongestLag','dstAtStrongestLag','anomalyAt15d','lag27Control','lag54Control','observationTimeUtc'])assert.equal(futureSignal[key],signal[key],`future leakage: ${key}`); // GT10 future leakage
const outside=calculateGeomagneticSignal(dataset,{forecastTime:Date.parse(dataset.coverageStartUtc)+20*86_400_000});assert.equal(outside.status,'data-unavailable');assert.equal(outside.reasonCode,'coverage-out-of-range'); // GT09
const missing=calculateGeomagneticSignal(null,{forecastTime});assert.equal(missing.reasonCode,'geomagnetic-dataset-missing');assert.equal(missing.signal0To100,null); // GT05/GT06

for(const text of ['長期平均活動率','直近5日活動率','活動低下率','活動低下の珍しさ','最大地磁気異常の日数前','地磁気状態・全球共通','データ未取得','履歴不足','反応あり','反応なし','計算できません','更新停止中','一部データ不足'])assert.ok(ui.includes(text),text); // GT02/GT04
for(const key of ['backgroundDailyRate','activityDropRatio','geomagneticLagPercentile'])assert.ok(ui.includes(`'${key}'`)||ui.includes(`${key}:`)||signalsSource.includes(`${key}:`),`internal key retained: ${key}`); // GT01
assert.ok(ui.includes('地震発生確率、確立した前兆ではありません'));assert.ok(!ui.includes('地震発生確率%')); // GT22
assert.ok(ui.includes("'データなし'"));assert.ok(!ui.includes("dstAtStrongestLag)?`${geomagnetic.dstAtStrongestLag||0}"));
assert.ok(serviceWorker.includes('geomagnetic-research-v1.json'));assert.ok(workflow.includes('pull-requests: write')&&workflow.includes('npm run test:geomagnetic')); // GT17/GT18
assert.deepEqual(RESEARCH_SIGNAL_DEFINITIONS.geomagnetic.controlLagDays,[27,54]);

const payload={datetime:['2020-01-01T00:00:00Z'],Kp:[3]},fakeFetch=async()=>({ok:true,json:async()=>payload});
await assert.rejects(fetchOfficialKp({start:'2020-01-01T00:00:00Z',end:'2020-01-02T00:00:00Z',fetcher:fakeFetch}),/coverage failed closed/); // empty/short updates fail closed
console.log('GT01-GT18, GT22 geomagnetic data and Japanese research UI tests passed');
