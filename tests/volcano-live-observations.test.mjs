import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FIRMS_SOURCES, assignToVolcanoes, isExcluded, normalizeFirmsRows, normalizeUsgsFeatures, summarizeThermal, volcanicTiles } from '../scripts/update-volcano-observations.mjs';

const volcano={id:'fixture',name:'試験火山',latitude:35,longitude:139,excludedHeatSources:[{latitude:35.05,longitude:139.05,radiusKm:2}]},row=(overrides={})=>({latitude:'35.001',longitude:'139.001',bright_ti4:'350',bright_ti5:'290',frp:'4.2',acq_date:'2026-08-20',acq_time:'0130',satellite:'N20',instrument:'VIIRS',confidence:'n',daynight:'N',...overrides});
assert.deepEqual(FIRMS_SOURCES,['VIIRS_SNPP_NRT','VIIRS_NOAA20_NRT','VIIRS_NOAA21_NRT']);
const normalized=normalizeFirmsRows([row()],volcano,'VIIRS_NOAA20_NRT');assert.equal(normalized.length,1);assert.equal(normalized[0].timeUtc,'2026-08-20T01:30:00Z');assert.equal(normalized[0].frpMw,4.2);
assert.equal(normalizeFirmsRows([row({latitude:'36'})],volcano,'VIIRS_NOAA20_NRT').length,0,'distant detections must be excluded');
assert.equal(isExcluded({latitude:35.05,longitude:139.05},volcano),true,'known industrial heat sources must be excluded');
const summary=summarizeThermal([...normalized,{...normalized[0],source:'VIIRS_NOAA21_NRT'}]);assert.equal(summary.multiSensorConfirmed,true);assert.equal(summary.sensorCount,2);assert.equal(summary.detectionCount,2);
const noDetection=summarizeThermal([]);assert.equal(noDetection.status,'no-detection');assert.equal(noDetection.maximumBrightnessKelvin,null,'no detection must not become a normal baseline');
const tileVolcanoes=[volcano,{...volcano,id:'west',longitude:121},{...volcano,id:'south',latitude:-7,longitude:110}];assert.equal(volcanicTiles(tileVolcanoes).length,3);const assigned=assignToVolcanoes([{latitude:35.001,longitude:139.001}],tileVolcanoes,15);assert.equal(assigned.fixture.length,1);assert.equal(assigned.west.length,0);

const asOf='2026-08-20T02:00:00Z',feature=(time,lat=35.001)=>({id:String(time),properties:{time:Date.parse(time),mag:2.3},geometry:{coordinates:[139.001,lat,5]}}),events=normalizeUsgsFeatures([feature('2026-08-20T01:00:00Z'),feature('2026-08-20T03:00:00Z'),feature('2026-08-20T01:00:00Z',36)],volcano,asOf);assert.equal(events.length,1,'future and distant earthquakes must be excluded');

const data=JSON.parse(await readFile(new URL('../data/world/volcano-observations-v1.json',import.meta.url),'utf8'));assert.equal(data.schemaId,'koyomi-volcano-observations-v1');assert.equal(typeof data.freshness.thermalConfigured,'boolean');assert.equal(data.freshness.complete,data.freshness.thermalConfigured===true&&data.freshness.seismicComplete===true&&data.freshness.errors.length===0);assert.match(data.sha256||'',/^[a-f0-9]{64}$/);
const script=await readFile(new URL('../scripts/update-volcano-observations.mjs',import.meta.url),'utf8'),workflow=await readFile(new URL('../.github/workflows/update-volcano-observations.yml',import.meta.url),'utf8'),ui=await readFile(new URL('../src/world/volcano/map-layer.js',import.meta.url),'utf8'),worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
assert.ok(script.includes('process.env.NASA_FIRMS_MAP_KEY'));assert.ok(!script.includes('NASA_FIRMS_MAP_KEY='));assert.ok(workflow.includes('secrets.NASA_FIRMS_MAP_KEY'));assert.ok(workflow.includes("cron: '17 */6 * * *'"));
assert.ok(script.includes('volcanicTiles(catalog.volcanoes)'));assert.ok(script.includes('minmagnitude=2.5'));assert.ok(!script.includes('for(const volcano of catalog.volcanoes){const detections=[]'));
for(const token of ['検出なし（安全判定ではありません）','複数衛星一致','最終更新','一部未取得','一致しても噴火予測とは扱いません'])assert.ok(ui.includes(token),token);
assert.ok(worker.includes('data/world/volcano-observations-v1.json'));
console.log('Volcano live observation pipeline safety passed');
