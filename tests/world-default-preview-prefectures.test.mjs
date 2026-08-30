import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';

const ui=await readFile('src/world/world-map-ui.js','utf8'),style=await readFile('src/world/offline-map-style.js','utf8'),worker=await readFile('service-worker.js','utf8'),assetText=await readFile('data/map/japan-prefectures-2026.geojson','utf8'),asset=JSON.parse(assetText),metadata=await readFile('data/map/JAPAN_PREFECTURE_BOUNDARIES.md','utf8');

for(const token of ["MAX_VISIBLE_CELLS=1000","FORECAST_LAYER_PREFERENCE","saved===null?true","forecastLayerOn=forecastLayerDefault","saveForecastLayerPreference","forecastLayerDefault?'checked'",'researchResolutionForZoom',"<2.5?1","<4.5?2","<6.5?3:4",'catalogForResolution','grid.cellForLatLng(event[2],event[3],resolution)','spatialResolution:resolution','currentResearchResolution','currentDisplayResolution=1','calculationResolution=Math.max(2,resolution)',"viewportIds=resolution>2","allowed.has(id)","viewportKey!==currentResearchViewportKey"])assert.ok(ui.includes(token),token);
assert.ok(!ui.includes('forecastLayerOn?2:null'),'forecast layer must not stay locked to H3 resolution 2');
for(const token of ['japanPrefectures','japan-prefectures-2026.geojson','japan-prefecture-border-halo','japan-prefecture-borders','minzoom:3.5','国土数値情報（行政区域データ）'])assert.ok(style.includes(token),token);
assert.ok(style.includes("maxzoom:15"),'base land must remain visible at detailed zoom');
assert.ok(ui.includes('raiseMapReferenceLayers'),'prefecture lines must be raised above grid fills');
assert.ok(worker.includes('japan-prefectures-2026.geojson')&&worker.includes('JAPAN_PREFECTURE_BOUNDARIES.md'),'prefecture assets must work offline');
assert.equal(asset.type,'FeatureCollection');assert.equal(asset.features.length,47);assert.equal(new Set(asset.features.map(feature=>feature.properties.N03_001)).size,47);assert.ok(asset.features.every(feature=>['Polygon','MultiPolygon'].includes(feature.geometry.type)));
assert.ok((await stat('data/map/japan-prefectures-2026.geojson')).size<250_000,'prefecture asset must stay mobile-friendly');
// Git may check this text asset out with CRLF on Windows; verify canonical LF bytes.
assert.equal(createHash('sha256').update(assetText.replace(/\r\n/g,'\n')).digest('hex'),'6d31ec2b2f6e29bfabac5da6badca3067556922538c948d5d1c0d6795ecb6d94');
for(const token of ['2026-01-01','CC BY 4.0','47','2 km²','Survey Act'])assert.ok(metadata.includes(token),token);
console.log('World default preview and Japan prefecture boundary tests passed');
