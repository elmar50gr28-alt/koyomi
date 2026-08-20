import assert from 'node:assert/strict';
import { createWorldContext, consensusOf, EqualAreaBandGrid, MundaneEarthquakeAdapter, MUNDANE_EARTHQUAKE_VERSION } from '../src/world/index.js';

const context=createWorldContext({datetimeUtc:'2026-08-20T00:00:00+09:00',latitude:35.68,longitude:139.77,themeId:'earthquake',mode:'forecast'});
assert.equal(context.datetimeUtc,'2026-08-19T15:00:00.000Z');
assert.throws(()=>createWorldContext({datetimeUtc:'bad',themeId:'earthquake',mode:'forecast'}),/valid date/);
assert.throws(()=>createWorldContext({datetimeUtc:new Date(),latitude:91,themeId:'earthquake',mode:'forecast'}),/latitude/);

const grid=new EqualAreaBandGrid();
for(const [lat,lon] of [[0,0],[35.6812,139.7671],[80,20],[-80,-20],[0,179.999],[0,-180],[89.9,0],[-89.9,0]]){
  const id=grid.cellForLatLng(lat,lon,3);assert.equal(id,grid.cellForLatLng(lat,lon,3));
  const boundary=grid.boundary(id);assert.equal(boundary.length,5);assert.ok(boundary.flat().every(Number.isFinite));
}
assert.notEqual(grid.cellForLatLng(0,179.9,2),grid.cellForLatLng(0,-179.9,2));
assert.equal(grid.resolutionForZoom(1),0);assert.equal(grid.resolutionForZoom(12),5);

const ephemeris={id:'world-test',planetLongitudes(){return{Sun:0,Moon:180,Mars:0,Saturn:90,Uranus:180,Pluto:270}}};
const adapter=new MundaneEarthquakeAdapter(ephemeris);
const result=adapter.evaluate({...context,spatialCellId:grid.cellForLatLng(context.latitude,context.longitude,2)});
assert.equal(result.version,MUNDANE_EARTHQUAKE_VERSION);assert.equal(result.themeId,'earthquake');assert.equal(result.contributors.length,3);assert.equal(result.confidence,'experimental');
assert.deepEqual(consensusOf([result],70),{matched:1,total:1,threshold:70});
assert.equal(adapter.evaluate({...context,spatialCellId:result.cellId}).score,result.score,'same input must be deterministic');

console.log('World forecast foundation passed');
