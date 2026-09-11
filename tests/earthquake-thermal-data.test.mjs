import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { calculateThermalSignal,validateThermalDataset } from '../src/world/earthquake-forecast/thermal-data.js';
import { createSpatialGrid } from '../src/world/spatial-grid.js';
import { buildAppEearsTasks,buildJapanSampleCoordinates,downloadThermalTaskFiles,fetchThermalTaskStatuses,preflightThermalProducts,THERMAL_PRODUCTS } from '../scripts/update-earthquake-thermal-data.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8'),placeholder=validateThermalDataset(JSON.parse(await read('data/world/earthquake-thermal-research-v1.json'))),grid=createSpatialGrid();
assert.equal(placeholder.status,'awaiting-authentication');
assert.equal(placeholder.observationCount,0);
assert.equal(placeholder.provider.name,'NASA AppEEARS');
const unavailable=calculateThermalSignal(placeholder,{cellId:grid.cellForLatLng(35,139,2),asOf:'2020-02-03T00:00:00Z',grid});
assert.equal(unavailable.status,'data-unavailable');
assert.equal(unavailable.reasonCode,'awaiting-authentication');
assert.equal(unavailable.scientificProbabilityContribution,0);

const target=grid.cellForLatLng(35,139,2),neighbors=grid.neighbors(target,1).filter(id=>id!==target).slice(0,2),cells=[target,...neighbors],observationsByCell={};
for(const cell of cells){
  const rows=[];
  for(let year=2010;year<2020;year+=1)for(const day of [28,29,30])rows.push([Date.parse(`${year}-01-${day}T02:00:00Z`),300+(day-29)*.1,2,0,.5,10,.005,0,'MODIS-Terra']);
  rows.push([Date.parse('2020-01-29T02:00:00Z'),304,2,0,.5,10,.005,0,'MODIS-Terra'],[Date.parse('2020-02-01T02:00:00Z'),304.5,2,0,.5,10,.005,0,'MODIS-Terra']);
  observationsByCell[cell]=rows;
}
const observationCount=Object.values(observationsByCell).flat().length,available=validateThermalDataset({schemaId:'koyomi-earthquake-thermal-research-v1',status:'available',generatedAt:'2020-02-03T00:00:00Z',retrievedAt:'2020-02-03T00:00:00Z',coverageStartUtc:'2010-01-28T02:00:00Z',coverageEndUtc:'2020-02-01T02:00:00Z',spatialResolution:2,observationCount,sha256:'a'.repeat(64),dataQuality:'synthetic-test-only',provider:placeholder.provider,observationsByCell});
const active=calculateThermalSignal(available,{cellId:target,neighborCellIds:neighbors,asOf:'2020-02-03T00:00:00Z',grid});
assert.equal(active.status,'candidate-active');
assert.ok(active.positiveEvidence>0);
assert.equal(active.observationCellId,target);
const child=grid.children(target,3)[0],zoomed=calculateThermalSignal(available,{cellId:child,neighborCellIds:grid.neighbors(child,1).filter(id=>id!==child),asOf:'2020-02-03T00:00:00Z',grid});
assert.equal(zoomed.status,'candidate-active','higher-resolution display cells must reuse their fixed resolution-2 thermal observation cell');
assert.equal(zoomed.cellId,child);
assert.equal(zoomed.observationCellId,target);
assert.equal(zoomed.observationResolution,2);
assert.equal(calculateThermalSignal(available,{cellId:grid.parent(target,1),asOf:'2020-02-03T00:00:00Z',grid}).reasonCode,'resolution-mismatch');

const productResponse=url=>{const product=decodeURIComponent(String(url).split('/').at(-1));return Promise.resolve({ok:true,json:async()=>Object.fromEntries(THERMAL_PRODUCTS[product].map(layer=>[layer,{Layer:layer}]))})};
const preflight=await preflightThermalProducts(productResponse);
assert.deepEqual(Object.keys(preflight),Object.keys(THERMAL_PRODUCTS));
await assert.rejects(()=>preflightThermalProducts(async()=>({ok:true,json:async()=>({})})),/layers missing/);
const coordinates=buildJapanSampleCoordinates({spatialResolution:2,eventsByCell:{}},{grid,sampleResolution:3});
assert.ok(coordinates.length>100,'sampling must cover the Japan domain even when the earthquake catalog has no event cells');
assert.ok(coordinates.every(point=>point.latitude>=20&&point.latitude<=48&&point.longitude>=122&&point.longitude<=154));
assert.ok(coordinates.every(point=>grid.resolution(point.id)===3&&grid.resolution(point.category)===2));
const tasks=buildAppEearsTasks(coordinates,{start:'2015-01-01',end:'2015-12-31',maximumCoordinates:200});
assert.equal(tasks.length,Math.ceil(coordinates.length/200));
const expectedLayerCount=Object.values(THERMAL_PRODUCTS).reduce((sum,layers)=>sum+layers.length,0);
assert.ok(tasks.every(task=>task.params.layers.length===expectedLayerCount&&task.params.coordinates.length<=200));

const taskState={schemaId:'koyomi-thermal-appeears-tasks-v1',createdAt:'2020-01-01T00:00:00Z',submitted:[{taskId:'task-12345678',taskName:'thermal-1',status:'pending'}]},fileBytes=Buffer.from('ID,Category,Date,MOD11A1_061_LST_Night_1km\ncell,parent,01-01-2020,300\n'),fileSha=createHash('sha256').update(fileBytes).digest('hex'),secureFetch=async url=>{
  if(String(url).includes('/task/'))return{ok:true,json:async()=>({status:'done',updated:'2020-01-02T00:00:00Z',expires_on:'2020-02-01T00:00:00Z'})};
  if(String(url).endsWith('/bundle/task-12345678'))return{ok:true,json:async()=>({files:[{file_id:'file-12345678',file_name:'thermal.csv',file_type:'csv',sha256:fileSha}]})};
  if(String(url).includes('/bundle/task-12345678/file-12345678'))return{ok:true,arrayBuffer:async()=>fileBytes};
  throw new Error(`unexpected URL ${url}`);
};
const statuses=await fetchThermalTaskStatuses(taskState,{fetcher:secureFetch,token:'test-token'});assert.equal(statuses[0].status,'done');
const memoryFiles=[],downloaded=await downloadThermalTaskFiles(taskState,{fetcher:secureFetch,token:'test-token',sink:async file=>memoryFiles.push(file)});assert.equal(downloaded.saved.length,1);assert.equal(memoryFiles[0].fileName,'thermal.csv');assert.deepEqual(memoryFiles[0].bytes,fileBytes);
await assert.rejects(()=>downloadThermalTaskFiles(taskState,{fetcher:async url=>String(url).includes('/task/')?{ok:true,json:async()=>({status:'done'})}:String(url).endsWith('/bundle/task-12345678')?{ok:true,json:async()=>({files:[{file_id:'file-12345678',file_name:'thermal.csv',file_type:'csv',sha256:'0'.repeat(64)}]})}:{ok:true,arrayBuffer:async()=>fileBytes},token:'test-token',sink:async()=>{}}),/checksum mismatch/);

const [ui,serviceWorker,changePreview]=await Promise.all([read('src/world/world-map-ui.js'),read('service-worker.js'),read('src/world/earthquake-forecast/change-preview.js')]);
assert.match(ui,/地表熱異常（NASA）/);
assert.match(ui,/地図の予測色や地震発生確率には加算していません/);
assert.match(serviceWorker,/earthquake-thermal-research-v1\.json/);
assert.match(serviceWorker,/earthquake-forecast\/thermal-data\.js/);
assert.match(changePreview,/calculateThermalSignal/);

console.log('KOYOMI earthquake thermal data pipeline passed');
