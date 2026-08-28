import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { combineIndependentVolcanoSignals, evaluateHeatTransfer, evaluateVolcanoReleaseGate, evaluateVolcanoSeismicCoupling, volcanoPublicView, VOLCANO_LAYER_DEFAULTS } from '../src/world/volcano/index.js';
import { volcanoGeoJson } from '../src/world/volcano/map-layer.js';

const T='2026-08-20T00:00:00Z',hour=36e5,obs=(hours,value,weatherQuality='good')=>({timeUtc:new Date(Date.parse(T)-hours*hour).toISOString(),value,weatherQuality});
const thermal=evaluateHeatTransfer([obs(96,10),obs(72,10),obs(24,13),obs(1,14)],{asOf:T});
assert.equal(thermal.status,'available');assert.equal(thermal.classification,'persistent-change');
assert.deepEqual(evaluateHeatTransfer([obs(96,10),obs(72,10),obs(24,13),obs(1,14),obs(-1,99)],{asOf:T}),thermal,'future observations must not enter dated evaluation');
assert.equal(evaluateHeatTransfer([obs(240,10),obs(200,10),obs(150,11),obs(100,12)],{asOf:T}).status,'stale-data');
assert.equal(evaluateHeatTransfer([], {asOf:T}).classification,null,'missing data must not become baseline');
assert.equal(evaluateHeatTransfer([obs(96,10),obs(72,10),obs(24,13),obs(1,14,'poor')],{asOf:T}).status,'partial-data');

const volcano={id:'test',name:'試験火山',latitude:35,longitude:139},earthquakes=[{timeUtc:new Date(Date.parse(T)-hour).toISOString(),latitude:35.01,longitude:139.01,magnitude:2.1},{timeUtc:new Date(Date.parse(T)+hour).toISOString(),latitude:35,longitude:139,magnitude:9}];
const seismic=evaluateVolcanoSeismicCoupling(volcano,earthquakes,{asOf:T});assert.equal(seismic.count,1);assert.equal(seismic.maximumMagnitude,2.1);
const combined=combineIndependentVolcanoSignals({thermal,seismic});assert.equal(combined.tectonicEarthquakeForecast,null);assert.equal(combined.eruptionProbability,null);assert.equal(combined.actionLevel,null);
const gate=evaluateVolcanoReleaseGate({futureLeakageBlocked:true});assert.equal(gate.released,false);assert.ok(gate.missing.includes('prospectiveValidationComplete'));
const view=volcanoPublicView({volcano,official:null,thermal,seismic,gate});assert.equal(view.official.status,'data-unavailable');assert.equal(view.eruptionProbability,null);assert.equal(view.forecastDate,null);assert.equal(view.evacuationAdvice,null);
assert.equal(VOLCANO_LAYER_DEFAULTS.enabled,false);assert.equal(VOLCANO_LAYER_DEFAULTS.research,false);assert.equal(VOLCANO_LAYER_DEFAULTS.thermal,true);assert.equal(VOLCANO_LAYER_DEFAULTS.heatMode,'confirmation');assert.equal(VOLCANO_LAYER_DEFAULTS.seismic,false);assert.equal(VOLCANO_LAYER_DEFAULTS.official,true);assert.equal(VOLCANO_LAYER_DEFAULTS.mundane,false);

const catalog=JSON.parse(await readFile(new URL('../data/world/volcano-catalog-v2.json',import.meta.url),'utf8'));assert.equal(catalog.officialStatusIncluded,false);assert.equal(catalog.volcanoes.length,1214);assert.equal(volcanoGeoJson(catalog).features.length,catalog.volcanoes.length);
const ui=await readFile(new URL('../src/world/world-map-ui.js',import.meta.url),'utf8'),layer=await readFile(new URL('../src/world/volcano/map-layer.js',import.meta.url),'utf8'),worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
for(const token of ['volcanoLayerControl','公式状態','熱移送','火山周辺地震','公開条件未達','研究レイヤーは初期OFF','マンデン占術'])assert.ok((ui+layer).includes(token),token);
for(const token of ['world-volcanoes','cluster:true','公式情報を取得できません','未取得は「安全」を意味しません','噴火確率や時期を表示しません','科学・観測モデルには一切加算しません'])assert.ok((ui+layer).includes(token),token);
for(const asset of ['src/world/volcano/heat-transfer.js','src/world/volcano/map-layer.js','data/world/volcano-catalog-v2.json'])assert.ok(worker.includes(asset),asset);
assert.ok(!/eruptionProbability\s*:\s*(?!null)/.test(layer));
console.log('Volcano heat-transfer globe safety passed');
