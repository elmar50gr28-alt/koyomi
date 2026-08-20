import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createWorldContext, consensusOf, createSpatialGrid, EqualAreaBandGrid, H3SpatialGrid, MundaneEarthquakeAdapter, MUNDANE_EARTHQUAKE_VERSION, WorldEvaluationCache, relateEventToCell, validateWorldEvent } from '../src/world/index.js';

const context=createWorldContext({datetimeUtc:'2026-08-20T00:00:00+09:00',latitude:35.68,longitude:139.77,themeId:'earthquake',mode:'forecast'});
assert.equal(context.datetimeUtc,'2026-08-19T15:00:00.000Z');
assert.throws(()=>createWorldContext({datetimeUtc:'bad',themeId:'earthquake',mode:'forecast'}),/valid date/);
assert.throws(()=>createWorldContext({datetimeUtc:new Date(),latitude:91,themeId:'earthquake',mode:'forecast'}),/latitude/);

const grid=createSpatialGrid();assert.ok(grid instanceof H3SpatialGrid);assert.equal(grid.systemId,'h3');assert.equal(grid.version,'4.5.0');
for(const [lat,lon] of [[0,0],[35.6812,139.7671],[80,20],[-80,-20],[0,179.999],[0,-180],[89.9,0],[-89.9,0]]){
  const id=grid.cellForLatLng(lat,lon,3);assert.equal(id,grid.cellForLatLng(lat,lon,3));assert.equal(grid.resolution(id),3);
  const boundary=grid.boundary(id);assert.ok(boundary.length>=6);assert.ok(boundary.flat().every(Number.isFinite));assert.ok(grid.cellAreaKm2(id)>0);
  assert.equal(grid.parent(id,2),grid.parent(id,2));assert.ok(grid.children(grid.parent(id,2),3).includes(id));assert.ok(grid.neighbors(id,1).includes(id));
}
assert.notEqual(grid.cellForLatLng(0,179.9,5),grid.cellForLatLng(0,-179.9,5));
assert.deepEqual([grid.resolutionForZoom(1),grid.resolutionForZoom(3),grid.resolutionForZoom(5),grid.resolutionForZoom(7),grid.resolutionForZoom(10)],[1,2,3,4,5]);
const worldCells=grid.viewportCells({south:-89,north:89,west:-180,east:180},0,500);assert.ok(worldCells.length>=100&&worldCells.length<=500);assert.ok(worldCells.some(id=>grid.isPentagon(id)),'world cells must include H3 pentagons');
const datelineCells=grid.viewportCells({south:-10,north:10,west:170,east:-170},2,500);assert.ok(datelineCells.some(id=>grid.center(id).longitude>160));assert.ok(datelineCells.some(id=>grid.center(id).longitude< -160));

const fallback=new EqualAreaBandGrid();assert.equal(fallback.systemId,'koyomi-equal-area-band');assert.match(fallback.cellForLatLng(35,139,2),/^kea1:/);

const ephemeris={id:'world-test',planetLongitudes(){return{Sun:0,Moon:180,Mars:0,Saturn:90,Uranus:180,Pluto:270}}},adapter=new MundaneEarthquakeAdapter(ephemeris),cellId=grid.cellForLatLng(context.latitude,context.longitude,2),resultContext={...context,spatialCellId:cellId,gridSystemId:grid.systemId,gridVersion:grid.version,resolution:2};
const result=adapter.evaluate(resultContext);assert.equal(result.version,MUNDANE_EARTHQUAKE_VERSION);assert.equal(result.gridSystemId,'h3');assert.equal(result.gridVersion,'4.5.0');assert.equal(result.resolution,2);assert.equal(result.contributors.length,3);assert.equal(result.confidence,'experimental');
assert.deepEqual(consensusOf([result],70),{matched:1,total:1,threshold:70});assert.equal(adapter.evaluate(resultContext).score,result.score);
const cache=new WorldEvaluationCache(2);assert.strictEqual(cache.evaluate(resultContext,adapter),cache.evaluate(resultContext,adapter));assert.equal(cache.size,1);cache.clear();assert.equal(cache.size,0);

const eventData=JSON.parse(await readFile(new URL('../data/world/validation-events.json',import.meta.url),'utf8'));assert.equal(eventData.schemaId,'koyomi-world-validation-events-v1');assert.ok(eventData.events.length>=3);
for(const event of eventData.events){validateWorldEvent(event);const eventCell=grid.cellForLatLng(event.latitude,event.longitude,3),relation=relateEventToCell(event,eventCell,grid);assert.equal(relation.sameCell,true);assert.equal(relation.ring,0);assert.ok(relation.centerDistanceKm>=0)}
assert.throws(()=>validateWorldEvent({}),/identity/);

const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');for(const asset of ['vendor/h3-js/4.5.0/h3-js.es.js','vendor/h3-js/4.5.0/LICENSE','data/world/validation-events.json'])assert.ok(worker.includes(asset),`${asset} must be cached offline`);
for(const asset of ['vendor/maplibre-gl/5.24.0/maplibre-gl.js','vendor/maplibre-gl/5.24.0/maplibre-gl.css','data/map/natural-earth-50m-countries.geojson','data/map/natural-earth-50m-lakes.geojson'])assert.ok(worker.includes(asset),`${asset} must be in the map core cache`);
for(const token of ['MAP_CORE_CACHE','MAP_REGION_CACHE','Promise.allSettled','cacheFirstMapCore'])assert.ok(worker.includes(token),`${token} must protect offline map caching`);
const mapUi=await readFile(new URL('../src/world/world-map-ui.js',import.meta.url),'utf8');assert.ok(mapUi.includes('MAX_VISIBLE_CELLS=500'));assert.ok(mapUi.includes('while(ids.length>=MAX_VISIBLE_CELLS'));assert.ok(mapUi.includes("map.on('moveend',scheduleUpdate)"));assert.ok(mapUi.includes('setTimeout(update,180)'));assert.ok(mapUi.includes("MAPLIBRE_JS='./vendor/maplibre-gl/5.24.0/maplibre-gl.js'"));assert.ok(!/unpkg|demotiles\.maplibre/.test(mapUi),'world map must not depend on map CDNs');
const offlineStyle=await readFile(new URL('../src/world/offline-map-style.js',import.meta.url),'utf8');assert.ok(offlineStyle.includes('Natural Earth 1:50m'));assert.ok(offlineStyle.includes("projection:{type:'globe'}"),'offline world map must retain the globe presentation');assert.ok(!/https?:\/\//.test(offlineStyle));assert.ok(!/glyphs|sprite/.test(offlineStyle));
const countries=JSON.parse(await readFile(new URL('../data/map/natural-earth-50m-countries.geojson',import.meta.url),'utf8'));assert.equal(countries.type,'FeatureCollection');assert.ok(countries.features.length>200);const japan=countries.features.find(feature=>feature.properties.ADMIN==='Japan');assert.ok(japan);assert.equal(japan.geometry.type,'MultiPolygon');assert.ok(japan.geometry.coordinates.length>=20,'offline base map must retain Japanese islands');assert.equal(countries.koyomiSource.license,'Public Domain');
const lakes=JSON.parse(await readFile(new URL('../data/map/natural-earth-50m-lakes.geojson',import.meta.url),'utf8'));assert.equal(lakes.type,'FeatureCollection');assert.ok(lakes.features.length>100);
console.log('World forecast H3 and validation foundation passed');
