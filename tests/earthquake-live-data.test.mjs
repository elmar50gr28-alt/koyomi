import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildUsgsQueryUrl,liveEventsInWindow,loadLiveEarthquakes,normalizeUsgsEarthquakeFeed} from '../src/world/earthquake-live-data.js';
import {createLiveMarkerRenderGate} from '../src/world/live-marker-render-gate.js';
import {EARTHQUAKE_DEPTH_3D_MIN_ZOOM,earthquakeDepth3dVisible,earthquakeDepthBand,earthquakeDepthBandLabel,earthquakeDepthLengthPx} from '../src/world/earthquake-depth-presentation.js';

const now=new Date('2026-09-01T00:00:00Z'),feature=(id,time,mag=5)=>({id,type:'Feature',geometry:{type:'Point',coordinates:[140,35,10]},properties:{time:Date.parse(time),mag,place:'test',url:'https://earthquake.usgs.gov/test'}});
const normalized=normalizeUsgsEarthquakeFeed({type:'FeatureCollection',features:[feature('a','2026-08-31T00:00:00Z'),feature('a','2026-08-31T01:00:00Z',6),{id:'bad'}]});
assert.equal(normalized.length,1);assert.equal(normalized[0].magnitude,6);assert.match(buildUsgsQueryUrl({now}),/^https:\/\/earthquake\.usgs\.gov\/fdsnws\/event\/1\/query\?/);
assert.equal(liveEventsInWindow({events:normalized},{startTime:'2026-08-31T00:30:00Z',endTime:'2026-09-01T00:00:00Z',minimumMagnitude:5.5}).length,1);
assert.equal(earthquakeDepthBand(0),'shallow');assert.equal(earthquakeDepthBand(69.9),'shallow');assert.equal(earthquakeDepthBand(70),'intermediate');assert.equal(earthquakeDepthBand(300),'deep');assert.equal(earthquakeDepthBand(500),'very-deep');
assert.equal(earthquakeDepthBandLabel(650),'非常に深い地震');assert.equal(earthquakeDepth3dVisible(true,EARTHQUAKE_DEPTH_3D_MIN_ZOOM),true);assert.equal(earthquakeDepth3dVisible(true,EARTHQUAKE_DEPTH_3D_MIN_ZOOM-.01),false);assert.equal(earthquakeDepth3dVisible(false,9),false);
assert.ok(earthquakeDepthLengthPx(650,5)>earthquakeDepthLengthPx(300,5));assert.ok(earthquakeDepthLengthPx(300,5)>earthquakeDepthLengthPx(20,5));assert.ok(earthquakeDepthLengthPx(650,7)>earthquakeDepthLengthPx(650,3.5));

const memory=new Map(),storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
const network=await loadLiveEarthquakes({now,storage,fetchImpl:async()=>({ok:true,json:async()=>({type:'FeatureCollection',features:[feature('net','2026-08-31T05:00:00Z')]})})});
assert.equal(network.source,'network');assert.equal(network.events.length,1);
const fallback=await loadLiveEarthquakes({now:new Date('2026-09-02T00:00:00Z'),storage,fetchImpl:async()=>{throw new Error('offline')}});
assert.equal(fallback.source,'saved');assert.equal(fallback.events[0].id,'net');assert.match(fallback.error,/offline/);
const unavailable=await loadLiveEarthquakes({now,storage:{getItem:()=>null},fetchImpl:async()=>{throw new Error('offline')}});
assert.equal(unavailable.source,'unavailable');assert.deepEqual(unavailable.events,[]);

let mapReady=false,renderCount=0,waitingCount=0;
const dataFirstGate=createLiveMarkerRenderGate({isReady:()=>mapReady,render:()=>{renderCount+=1;return true},onWaiting:()=>{waitingCount+=1}});
assert.equal(dataFirstGate.request(),false,'data-first request waits for the map');
assert.equal(dataFirstGate.isPending(),true);assert.equal(waitingCount,1);assert.equal(renderCount,0);
mapReady=true;assert.equal(dataFirstGate.flush(),true,'map load flushes the pending data');
assert.equal(dataFirstGate.isPending(),false);assert.equal(renderCount,1);
assert.equal(dataFirstGate.flush(),false,'completed work is not duplicated');assert.equal(renderCount,1);

let firstAttempt=true,mapFirstRenderCount=0;
const mapFirstGate=createLiveMarkerRenderGate({isReady:()=>true,render:()=>{mapFirstRenderCount+=1;if(firstAttempt){firstAttempt=false;return false}return true}});
assert.equal(mapFirstGate.request(),false,'an incomplete render remains pending');assert.equal(mapFirstGate.isPending(),true);
assert.equal(mapFirstGate.flush(),true,'the next ready event completes the render');assert.equal(mapFirstGate.isPending(),false);assert.equal(mapFirstRenderCount,2);
assert.equal(mapFirstGate.request(),true,'map-first data renders immediately');assert.equal(mapFirstRenderCount,3);

const ui=await readFile(new URL('../src/world/world-map-ui.js',import.meta.url),'utf8'),css=await readFile(new URL('../src/world/world-map.css',import.meta.url),'utf8'),worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
for(const token of ['loadLiveEarthquakes','liveEventsInWindow','USGS速報','保存済みUSGS速報','visibilitychange','earthquakeLiveLayer','直近30日の観測地震','予測とは別表示','depthKm','これは発生済みの観測地震です'])assert.ok(ui.includes(token),token);
assert.ok(worker.includes('./src/world/earthquake-live-data.js'),'live updater must remain available after offline installation');
assert.ok(worker.includes('./src/world/live-marker-render-gate.js'),'ready-state gate must remain available after offline installation');
assert.ok(worker.includes('./src/world/earthquake-depth-presentation.js'),'depth presentation must remain available after offline installation');
assert.ok(worker.includes('live-earthquake-v19-depth-3d'),'service worker cache must be invalidated for the depth presentation');
assert.ok(!ui.includes('calculateDatedPreview(activeCatalogWithLive'),'unverified live events must not silently enter the research calculation');
for(const token of ['#ffe600','#ff8a00','#ff2d20','#ff2db2'])assert.ok(css.includes(token),token);
for(const token of ['world-live-earthquake-marker','createLiveEarthquakeNativeMarkers','syncLiveEarthquakeDomMarkers','createLiveMarkerRenderGate','dataset.renderState','ready-native-markers','new maplibreApi.Marker','地震の丸を描画できません','表示 ${liveEarthquakeMarkers.length}/${events.length}件',"theme==='earthquake'&&liveLayerOn"])assert.ok(ui.includes(token),token);
for(const token of ['earthquakeBacksideToggle','裏側を透かす：OFF','showCoveredEarthquakeMarkers','coveredEarthquakeOpacity','marker.setOpacity(1,coveredEarthquakeOpacity())'])assert.ok(ui.includes(token),token);
for(const token of ['earthquakeDepth3dToggle','震源の深さ3D：OFF','showEarthquakeDepth3d','syncEarthquakeDepthPresentation','earthquakeDepthLengthPx','earthquakeDepthBandLabel','ON（拡大で表示）'])assert.ok(ui.includes(token),token);
for(const removed of ['live-earthquake-halo','live-earthquake-dots','liveRenderTimer',"map.once('idle',restoreLiveMarkers)",'setTimeout(restoreLiveMarkers,500)','setTimeout(()=>{liveMarkerSignature='])assert.ok(!ui.includes(removed),`ready-state renderer must not retain the race-prone path: ${removed}`);
assert.ok(ui.includes('const syncLiveEarthquakeDomMarkers=()=>liveMarkerGate.request()'),'every trigger must enter the ready-state gate');
assert.ok(ui.includes("liveEarthquakes.source!=='loading'"),'markers must wait for both map and feed readiness');
for(const removed of ['queryRenderedFeatures({layers:[\'live-earthquake-dots\']','marker-fallback','slice(0,360)'])assert.ok(!ui.includes(removed),`markers must not disappear through path switching or selection: ${removed}`);
for(const removed of ['positionLiveEarthquakeMarkers','map.project','world-live-earthquake-overlay'])assert.ok(!ui.includes(removed),`manual positioning must be removed: ${removed}`);
for(const token of ['--earthquake-marker-size','.world-live-earthquake-marker[data-magnitude="7"]'])assert.ok(css.includes(token),token);assert.ok(!css.includes('.world-live-earthquake-overlay'),'manual overlay CSS must be removed');
assert.ok(css.includes('#worldMapShell:not([data-earthquake-backside="visible"]) .world-live-earthquake-marker.maplibregl-marker-covered{opacity:0!important;pointer-events:none}'),'covered markers must be non-interactive while hidden');
for(const token of ['[data-earthquake-depth3d="visible"]','--earthquake-depth-length','data-depth-band="very-deep"','world-earthquake-depth-legend'])assert.ok(css.includes(token),token);
const app=await readFile(new URL('../app.html',import.meta.url),'utf8');assert.ok(app.includes("world-map-ui.js?v=earthquake-native-v19-depth-3d"),'app must bypass stale cached map modules');assert.ok(app.includes('world-map.css?v=earthquake-native-v19-depth-3d'),'app must bypass stale cached map styles');
assert.ok(css.includes('world-live-earthquake-legend'));assert.ok(css.includes('outline:1px solid #fff'));

console.log('earthquake live data tests passed');
