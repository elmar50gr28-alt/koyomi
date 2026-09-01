import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildUsgsQueryUrl,liveEventsInWindow,loadLiveEarthquakes,normalizeUsgsEarthquakeFeed} from '../src/world/earthquake-live-data.js';

const now=new Date('2026-09-01T00:00:00Z'),feature=(id,time,mag=5)=>({id,type:'Feature',geometry:{type:'Point',coordinates:[140,35,10]},properties:{time:Date.parse(time),mag,place:'test',url:'https://earthquake.usgs.gov/test'}});
const normalized=normalizeUsgsEarthquakeFeed({type:'FeatureCollection',features:[feature('a','2026-08-31T00:00:00Z'),feature('a','2026-08-31T01:00:00Z',6),{id:'bad'}]});
assert.equal(normalized.length,1);assert.equal(normalized[0].magnitude,6);assert.match(buildUsgsQueryUrl({now}),/^https:\/\/earthquake\.usgs\.gov\/fdsnws\/event\/1\/query\?/);
assert.equal(liveEventsInWindow({events:normalized},{startTime:'2026-08-31T00:30:00Z',endTime:'2026-09-01T00:00:00Z',minimumMagnitude:5.5}).length,1);

const memory=new Map(),storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
const network=await loadLiveEarthquakes({now,storage,fetchImpl:async()=>({ok:true,json:async()=>({type:'FeatureCollection',features:[feature('net','2026-08-31T05:00:00Z')]})})});
assert.equal(network.source,'network');assert.equal(network.events.length,1);
const fallback=await loadLiveEarthquakes({now:new Date('2026-09-02T00:00:00Z'),storage,fetchImpl:async()=>{throw new Error('offline')}});
assert.equal(fallback.source,'saved');assert.equal(fallback.events[0].id,'net');assert.match(fallback.error,/offline/);
const unavailable=await loadLiveEarthquakes({now,storage:{getItem:()=>null},fetchImpl:async()=>{throw new Error('offline')}});
assert.equal(unavailable.source,'unavailable');assert.deepEqual(unavailable.events,[]);

const ui=await readFile(new URL('../src/world/world-map-ui.js',import.meta.url),'utf8'),css=await readFile(new URL('../src/world/world-map.css',import.meta.url),'utf8'),worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
for(const token of ['loadLiveEarthquakes','liveEventsInWindow','USGS速報','保存済みUSGS速報','visibilitychange','earthquakeLiveLayer','live-earthquake-halo','live-earthquake-dots','直近30日の観測地震','予測とは別表示','depthKm','これは発生済みの観測地震です'])assert.ok(ui.includes(token),token);
assert.ok(worker.includes('./src/world/earthquake-live-data.js'),'live updater must remain available after offline installation');
assert.ok(worker.includes('live-earthquake-v8-dom-markers'),'service worker cache must be invalidated when the visible DOM markers change');
assert.ok(!ui.includes('calculateDatedPreview(activeCatalogWithLive'),'unverified live events must not silently enter the research calculation');
for(const token of ["4.5,7,5,10,6,14,7,19,8,25",'#ffe600','#ff8a00','#ff2d20','#ff2db2'])assert.ok(ui.includes(token),token);
assert.ok(!ui.includes("'live-earthquakes',{type:'geojson',data,cluster:true"),'globe markers must use the verified direct-render path');
for(const token of ['world-live-earthquake-marker','syncLiveEarthquakeDomMarkers','地球儀に${liveEarthquakeMarkers.length}件表示','new maplibreApi.Marker'])assert.ok(ui.includes(token),token);
for(const token of ['--earthquake-marker-size','.world-live-earthquake-marker[data-magnitude="7"]'])assert.ok(css.includes(token),token);
assert.ok(css.includes('world-live-earthquake-legend'));assert.ok(css.includes('outline:1px solid #fff'));

console.log('earthquake live data tests passed');
