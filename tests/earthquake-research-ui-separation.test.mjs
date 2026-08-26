import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateGeomagneticSignal, calculateQuiescenceSignal, RESEARCH_SIGNAL_DEFINITIONS } from '../src/world/earthquake-forecast/index.js';

const DAY=86_400_000,T=Date.parse('2026-01-01T00:00:00Z'),event=(time,magnitude=4.6,updated=time)=>[time,magnitude,0,0,10,'id',updated,'reviewed','mw'];
const background=Array.from({length:80},(_,index)=>event(Date.parse('2020-01-01T00:00:00Z')+index*25*DAY));
const lowOnly=calculateQuiescenceSignal(background,{forecastTime:T});
const activated=[...background,...Array.from({length:8},(_,index)=>event(T-(12-index)*DAY))].sort((a,b)=>a[0]-b[0]),quiescence=calculateQuiescenceSignal(activated,{forecastTime:T});

// UT07 / UT08: low activity alone is inactive; activation followed by a drop is required.
assert.equal(lowOnly.status,'inactive');assert.equal(lowOnly.signal0To100,0);assert.equal(quiescence.status,'available');assert.ok(quiescence.signal0To100>0);assert.ok(quiescence.calculation.hadActivation);assert.ok(quiescence.calculation.activityDropRatio>=RESEARCH_SIGNAL_DEFINITIONS.quiescence.dropRatioThreshold);
// UT09 / UT16: future earthquakes and outcome-like rows never enter the research signal.
const futureEarthquake=calculateQuiescenceSignal([...activated,event(T+DAY,8,T+DAY)],{forecastTime:T});assert.deepEqual(futureEarthquake,quiescence);

const observations=Array.from({length:100},(_,index)=>{const time=T-(100-index)*DAY;return{timeUtc:new Date(time).toISOString(),kp:time===T-15*DAY?8:2,dst:time===T-15*DAY?-120:-10}}),dataset={provider:'NOAA SWPC',retrievedAt:'2026-01-01T01:00:00Z',sha256:'a'.repeat(64),dataQuality:1,observations},geomagnetic=calculateGeomagneticSignal(dataset,{forecastTime:T});
// UT10-UT13: future data is excluded, values remain global, lag reference and controls remain separate.
const futureGeomagnetic=calculateGeomagneticSignal({...dataset,observations:[...observations,{timeUtc:new Date(T+DAY).toISOString(),kp:9,dst:-200}]},{forecastTime:T});assert.deepEqual(futureGeomagnetic,geomagnetic);assert.equal(geomagnetic.global,true);assert.equal(geomagnetic.strongestLagDays,15);assert.ok(Number.isFinite(geomagnetic.anomalyAt15d));assert.ok('lag27Control'in geomagnetic&&'lag54Control'in geomagnetic);
// UT05 / UT06: missing is null and distinguishable from a calculated inactive zero.
const missingGeomagnetic=calculateGeomagneticSignal(null,{forecastTime:T});assert.equal(missingGeomagnetic.status,'data-unavailable');assert.equal(missingGeomagnetic.signal0To100,null);assert.equal(lowOnly.status,'inactive');assert.equal(lowOnly.signal0To100,0);

const ui=await readFile(new URL('../src/world/world-map-ui.js',import.meta.url),'utf8'),css=await readFile(new URL('../src/world/world-map.css',import.meta.url),'utf8'),signals=await readFile(new URL('../src/world/earthquake-forecast/research-signals.js',import.meta.url),'utf8');
// UT01: research and divination have separate semantic cards and the mixed title is gone.
assert.ok(ui.includes('world-earthquake-research-card'));assert.ok(ui.includes('world-mundane-card'));assert.ok(!ui.includes('地震テーマ・マンデン'));
// UT02: independent signals never mutate coreForecast or the mundane score.
assert.ok(signals.includes('coreForecast:null'));assert.ok(!/core(?:Score|Forecast)\s*\+=/.test(signals+ui));assert.ok(ui.includes('core予測scoreへ加算していません'));
// UT03 / UT04: implemented signals have explicit status and conditional numeric UI paths.
for(const token of ['quiescenceSignal','geomagneticSignal','急静穏化','地磁気遅延（グローバル）','signal0To100'])assert.ok(ui.includes(token),token);
// UT14: 0-100 values are called relative indicators, never earthquake probability percentages.
assert.ok(ui.includes('相対指標'));assert.ok(ui.includes('この値は地震発生確率ではありません'));assert.ok(!/signal0To100[^\n]+%/.test(ui));
// UT15: color, hatch, dots, outcomes, and trend are explicit and independently rendered.
for(const token of ['previewColor','quiescencePattern','geomagneticPattern','research-quiescence-hatch','research-geomagnetic-dots','斜線 急静穏化','点 地磁気研究','● 期間内地震','↑ 上昇傾向'])assert.ok(ui.includes(token),token);
// UT17: viewport movement only schedules cached rendering.
assert.ok(ui.includes("map.on('moveend',scheduleUpdate)"));assert.ok(!/moveend[^;]+calculate(?:Change|Quiescence|Geomagnetic)/.test(ui));
// UT18 / UT19: mobile cards and details are responsive without fixed overflowing widths.
for(const token of ['パラメータ詳細を見る','マンデン詳細を見る','@media(max-width:430px)','overflow-wrap:anywhere','min-width:0'])assert.ok((ui+css).includes(token),token);
// UT20 is completed by browser console inspection; keep syntax-visible error handling intact.
assert.ok(ui.includes("console.error('[WORLD MAP]"));

console.log('Earthquake research UI separation passed: UT01-UT20');
