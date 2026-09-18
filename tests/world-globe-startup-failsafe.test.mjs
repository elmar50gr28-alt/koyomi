import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [ui,app,worker]=await Promise.all(['src/world/world-map-ui.js','app.html','service-worker.js'].map(path=>readFile(new URL(`../${path}`,import.meta.url),'utf8')));
const bootstrap=ui.slice(ui.indexOf('export async function initWorldMap'),ui.indexOf("page.insertAdjacentHTML('afterbegin',shell(events,forecastLayerDefault))"));
assert.doesNotMatch(bootstrap,/\bawait\b/,'no optional data may delay creation of the globe shell');
assert.ok(ui.indexOf('const mapLibrePromise=loadMapLibre()')<ui.indexOf('const loadWorldData=()=>'),'the renderer must start before optional network requests');
assert.match(ui,/const researchCatalogPromise=loadResearchCatalog\(\)/,'research catalog must start with the other optional data');
assert.match(ui,/const volcanoDataPromise=loadVolcanoCatalog\(\)/,'volcano data must not block the globe');
assert.match(ui,/maplibre=await mapLibrePromise/,'only the map renderer may delay MapLibre construction');
assert.match(ui,/researchCatalogPromise\.then\(data=>/,'research must be applied after loading');
assert.match(ui,/if\(mapReady\)\{recalculatePreview\(\);refreshOmens\(\);scheduleUpdate\(\)\}/,'late research data must refresh the visible map');
assert.match(ui,/update\(\);syncLiveEarthquakeDomMarkers\(\);loadWorldData\(\);refreshLiveData/,'optional data must begin after the base globe has rendered');
assert.match(ui,/研究データ取得中・地球儀は表示中/,'a missing research catalog must not be reported as zero anomalies');
assert.match(ui,/const startupWatchdog=setTimeout/,'a renderer that never becomes ready must not leave the original loading message forever');
assert.match(app,/const status=page\.querySelector\('#worldMapStatus'\)/,'post-shell bootstrap errors must be visible');
assert.match(app,/earthquake-native-v22-readable-attention-ui/,'clients must fetch a new World module generation');
assert.match(worker,/shell-readable-attention-v1/,'the offline shell must receive a new cache generation');

const loaderSource=ui.slice(ui.indexOf('function loadMapLibre(){'),ui.indexOf('\nasync function loadEvents(){'));
function loaderHarness(){
  const appended=[],timers=new Map();let nextTimer=1;
  const document={querySelector:()=>null,createElement:()=>({}),head:{append:node=>appended.push(node)}};
  const context={window:{},document,MAPLIBRE_CSS:'map.css',MAPLIBRE_JS:'map.js',setTimeout(callback,delay){assert.equal(delay,20_000);const id=nextTimer++;timers.set(id,callback);return id},clearTimeout:id=>timers.delete(id),Promise};
  vm.runInNewContext(`${loaderSource}\nthis.loadMapLibre=loadMapLibre`,context);
  return {context,appended,timers};
}
{
  const {context,appended,timers}=loaderHarness(),result=context.loadMapLibre();
  assert.equal(appended[1].src,'map.js');
  context.window.maplibregl={Map:class {}};appended[1].onload();
  assert.equal(await result,context.window.maplibregl);assert.equal(timers.size,0);
}
{
  const {context,appended}=loaderHarness(),result=context.loadMapLibre();
  appended[1].onerror();await assert.rejects(result,/map library unavailable/);
}
{
  const {context,appended}=loaderHarness(),result=context.loadMapLibre();
  appended[1].onload();await assert.rejects(result,/map library did not initialize/);
}
{
  const {context,timers}=loaderHarness(),result=context.loadMapLibre();
  [...timers.values()][0]();await assert.rejects(result,/map library load timed out/);
}
console.log('World globe startup failsafe tests passed');
