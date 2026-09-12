import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildPowerThermalFeatures,EARTHQUAKE_POWER_THERMAL_SOURCE_IDS } from '../src/world/prediction-engine/power-thermal.js';
import { calculateThermalSignal,validateThermalDataset } from '../src/world/earthquake-forecast/thermal-data.js';
import { createSpatialGrid } from '../src/world/spatial-grid.js';
import { buildPowerCells,generatePowerThermalDataset,parseHimawariListing,parsePowerPoint,powerPointUrl } from '../scripts/update-earthquake-thermal-public-data.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8'),grid=createSpatialGrid(),target=grid.cellForLatLng(35,139,2),neighbors=grid.neighbors(target,1).filter(id=>id!==target).slice(0,2),asOf='2026-06-08T00:00:00Z';
const observations=[];
for(const cellId of [target,...neighbors]){
  for(let year=2015;year<=2025;year+=1)for(const day of [1,2,3])observations.push({cellId,timeUtc:`${year}-06-${String(day).padStart(2,'0')}T00:00:00Z`,skinTemperatureC:24+(day-2)*.1,airTemperatureC:22,relativeHumidityPercent:60,precipitationMm:0});
  observations.push({cellId,timeUtc:'2026-06-02T00:00:00Z',skinTemperatureC:28,airTemperatureC:22,relativeHumidityPercent:60,precipitationMm:0},{cellId,timeUtc:'2026-06-04T00:00:00Z',skinTemperatureC:28.5,airTemperatureC:22,relativeHumidityPercent:61,precipitationMm:0});
}
const active=buildPowerThermalFeatures(observations,{cellId:target,neighborCellIds:neighbors,asOf});
assert.equal(active.status,'candidate-active');assert.ok(active.positiveEvidence>0);assert.equal(active.scientificProbabilityContribution,0);assert.ok(active.limitations.includes('not-direct-satellite-lst'));assert.ok(!EARTHQUAKE_POWER_THERMAL_SOURCE_IDS.includes('NOAA-NODD-JMA-HIMAWARI9'));
assert.deepEqual(buildPowerThermalFeatures(observations,{cellId:target,neighborCellIds:neighbors,asOf:Date.parse(asOf)}),active,'World millisecond timestamps must match ISO evaluation');assert.deepEqual(buildPowerThermalFeatures(observations,{cellId:target,neighborCellIds:neighbors,asOf:new Date(asOf)}),active,'Date timestamps must match ISO evaluation');
assert.deepEqual(buildPowerThermalFeatures([...observations,{cellId:target,timeUtc:'2026-06-09T00:00:00Z',skinTemperatureC:99,airTemperatureC:1,relativeHumidityPercent:60,precipitationMm:0}],{cellId:target,neighborCellIds:neighbors,asOf}),active,'future data must not enter the signal');
assert.equal(buildPowerThermalFeatures(observations.filter(item=>item.cellId===target),{cellId:target,neighborCellIds:neighbors,asOf}).status,'insufficient-spatial-coverage');
assert.equal(buildPowerThermalFeatures(observations,{cellId:target,neighborCellIds:neighbors,asOf:'2026-07-01T00:00:00Z'}).status,'stale-data');

const placeholder=validateThermalDataset(JSON.parse(await read('data/world/earthquake-thermal-public-v1.json')));assert.equal(placeholder.status,'available');assert.equal(placeholder.provider.name,'NASA POWER');assert.equal(placeholder.provider.directSatelliteLst,false);assert.equal(placeholder.himawariAvailability.usedInSignal,false);assert.equal(createHash('sha256').update(JSON.stringify(placeholder.observationsByCell)).digest('hex'),placeholder.sha256);assert.equal(Object.values(placeholder.observationsByCell).flat().some(row=>row[0]>=Date.parse(placeholder.generatedAt)),false,'stored data must predate generation');
for(const rows of Object.values(placeholder.observationsByCell)){assert.equal(new Set(rows.map(row=>row[0])).size,rows.length);assert.deepEqual(rows.map(row=>row[0]),rows.map(row=>row[0]).sort((a,b)=>a-b))}
const compact={};for(const item of observations)(compact[item.cellId]||=[]).push([Date.parse(item.timeUtc),item.skinTemperatureC,item.airTemperatureC,item.relativeHumidityPercent,item.precipitationMm]);
const available=validateThermalDataset({...placeholder,status:'available',retrievedAt:asOf,coverageStartUtc:'2015-06-01T00:00:00Z',coverageEndUtc:'2026-06-04T00:00:00Z',observationCount:Object.values(compact).flat().length,sha256:'a'.repeat(64),observationsByCell:compact});
const signal=calculateThermalSignal(available,{cellId:target,neighborCellIds:neighbors,asOf,grid});assert.equal(signal.status,'candidate-active');assert.equal(signal.provider.directSatelliteLst,false);assert.equal(signal.himawariAvailability.usedInSignal,false);

const pointPayload={header:{sources:['MERRA2']},geometry:{coordinates:[139,35]},properties:{parameter:{TS:{20260901:26,20260902:27,20260903:28},T2M:{20260901:24,20260902:24,20260903:24},RH2M:{20260901:60,20260902:61,20260903:62},PRECTOTCORR:{20260901:0,20260902:1,20260903:0}}}};
assert.equal(parsePowerPoint(pointPayload,target).rows.length,3);assert.doesNotMatch(powerPointUrl({latitude:35,longitude:139,start:'2026-09-01',end:'2026-09-03'}),/token|key|secret/i);
assert.deepEqual(parseHimawariListing('<ListBucketResult><CommonPrefixes><Prefix>x/</Prefix></CommonPrefixes><Contents><Key>x/B13.dat</Key><LastModified>2026-09-03T00:00:00Z</LastModified></Contents></ListBucketResult>').prefixes,['x/']);
const cells=buildPowerCells({grid}).slice(0,1),dayPrefix='AHI-L1b-Japan/2026/09/04/',timePrefix=`${dayPrefix}0000/`,fakeFetch=async url=>{
  const value=String(url);if(value.startsWith('https://power.larc.nasa.gov/'))return{ok:true,status:200,json:async()=>pointPayload};
  if(value.includes('delimiter='))return{ok:true,status:200,text:async()=>`<ListBucketResult><CommonPrefixes><Prefix>${timePrefix}</Prefix></CommonPrefixes></ListBucketResult>`};
  return{ok:true,status:200,text:async()=>`<ListBucketResult><Contents><Key>${timePrefix}HS_H09_B13_JP01.DAT.bz2</Key><LastModified>2026-09-04T00:10:00Z</LastModified></Contents><Contents><Key>${timePrefix}HS_H09_B15_JP01.DAT.bz2</Key><LastModified>2026-09-04T00:10:00Z</LastModified></Contents></ListBucketResult>`};
};
const generated=await generatePowerThermalDataset({fetcher:fakeFetch,grid,cells,start:'2026-09-01',end:new Date('2026-09-03T00:00:00Z'),asOf:new Date('2026-09-04T00:00:00Z')});assert.equal(generated.status,'available');assert.equal(generated.observationCount,3);assert.equal(generated.himawariAvailability.usedInSignal,false);assert.deepEqual(generated.himawariAvailability.availableBands,['13','15']);assert.match(generated.sha256,/^[a-f0-9]{64}$/);
const incremental=await generatePowerThermalDataset({existing:generated,fetcher:fakeFetch,grid,cells,start:'2026-09-01',end:new Date('2026-09-03T00:00:00Z'),asOf:new Date('2026-09-04T00:00:00Z')});assert.equal(incremental.observationCount,3,'overlap refresh must not duplicate daily rows');assert.equal(incremental.sha256,generated.sha256);

const [script,ui,worker,workflow]=await Promise.all([read('scripts/update-earthquake-thermal-public-data.mjs'),read('src/world/world-map-ui.js'),read('service-worker.js'),read('.github/workflows/update-earthquake-thermal-public-data.yml')]);
assert.doesNotMatch(script,/EARTHDATA_USERNAME|APPEEARS_TOKEN/);assert.match(ui,/日次解析値（直接衛星LSTではない）/);assert.match(ui,/数値計算には未使用/);assert.match(worker,/earthquake-thermal-public-v1\.json/);assert.match(worker,/prediction-engine\/power-thermal\.js/);assert.match(workflow,/schedule:/);assert.doesNotMatch(workflow,/secrets\./);

console.log('KOYOMI authentication-free earthquake thermal research pipeline passed');
