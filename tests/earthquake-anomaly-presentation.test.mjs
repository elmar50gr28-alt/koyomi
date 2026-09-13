import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSpatialGrid } from '../src/world/index.js';
import { researchAnomalies,buildResearchAnomalyGeoJson,updateResearchAnomalyLayers,RESEARCH_ANOMALY_LAYER_IDS } from '../src/world/earthquake-anomaly-presentation.js';

const grid=createSpatialGrid(),id=grid.cellForLatLng(35.68,139.76,2);
const row={cell_id:id,status:'available',change_percentile:95,quiescenceSignal:{status:'available',signal0To100:80},thermalSignal:{status:'candidate-active',positiveEvidence:.8,negativeEvidence:.4,scientificProbabilityContribution:0}};
const original=JSON.stringify(row);
assert.deepEqual(researchAnomalies(row).map(item=>item.kind),['change','quiescence','heat','cold']);
assert.equal(JSON.stringify(row),original,'presentation must not mutate model values');
assert.deepEqual(researchAnomalies(null),[]);
assert.deepEqual(researchAnomalies({status:'available',change_percentile:101,quiescenceSignal:{status:'available',signal0To100:101},thermalSignal:{status:'candidate-active',positiveEvidence:1.1}}),[],'invalid out-of-range values must not be highlighted');
assert.deepEqual(researchAnomalies({status:'available',change_percentile:94.9}),[]);
for(const status of ['data-unavailable','stale-data','insufficient-history','insufficient-spatial-coverage','inactive']){
  assert.deepEqual(researchAnomalies({status,change_percentile:99,quiescenceSignal:{status,signal0To100:99},thermalSignal:{status,positiveEvidence:1}}),[],status);
}
assert.deepEqual(researchAnomalies({status:'available',change_percentile:null,thermalSignal:{status:'candidate-active',positiveEvidence:NaN,negativeEvidence:0}}),[]);
assert.deepEqual(researchAnomalies({geomagneticSignal:{status:'available',signal0To100:100}}),[],'global geomagnetic data must not be a local anomaly');
assert.deepEqual(buildResearchAnomalyGeoJson(grid,[row]).features,[],'layer disabled by default');
const data=buildResearchAnomalyGeoJson(grid,[row],{active:true});
assert.equal(data.features.length,1);
assert.equal(data.features[0].properties.cellId,id,'retain exact calculation cell, not coarse display median');
assert.equal(data.features[0].properties.anomalyKind,'heat');
assert.equal(data.features[0].properties.anomalyCount,4);
assert.equal(data.features[0].geometry.type,'Polygon');
const childA=grid.cellForLatLng(35.68,139.76,3),childB=grid.neighbors(childA,1).find(cell=>grid.parent(cell,2)===grid.parent(childA,2)&&cell!==childA),parent=grid.parent(childA,2);
const thermalRows=[childA,childB].map(cell=>({cell_id:cell,thermalSignal:{status:'candidate-active',observationCellId:parent,positiveEvidence:.8}}));
const thermalData=buildResearchAnomalyGeoJson(grid,thermalRows,{active:true});
assert.equal(thermalData.features.length,1,'inherited thermal anomalies must not duplicate every child polygon');
assert.equal(thermalData.features[0].properties.cellId,parent,'thermal outline must retain observation resolution');
assert.equal(buildResearchAnomalyGeoJson(grid,[{...row,change_percentile:10,quiescenceSignal:null,thermalSignal:null}],{active:true}).features.length,0);

const sources=new Map(),layers=new Map(),map={getSource:id=>sources.get(id),getLayer:id=>layers.get(id),addSource:(id,source)=>sources.set(id,{...source,setData(data){this.data=data}}),addLayer:layer=>layers.set(layer.id,layer)};
updateResearchAnomalyLayers(map,data);updateResearchAnomalyLayers(map,data);
assert.equal(sources.size,1);assert.equal(layers.size,2,'updates must not duplicate layers');
assert.ok(layers.get(RESEARCH_ANOMALY_LAYER_IDS[0]).paint['line-width']>layers.get(RESEARCH_ANOMALY_LAYER_IDS[1]).paint['line-width'],'dark halo surrounds the colored outline');
assert.equal(layers.get(RESEARCH_ANOMALY_LAYER_IDS[1]).paint['line-opacity'],1);
updateResearchAnomalyLayers(map,buildResearchAnomalyGeoJson(grid,[row],{active:false}));
assert.equal(sources.get('earthquake-research-anomalies').data.features.length,0,'OFF/current/outcomes must clear research highlights');

const ui=await readFile(new URL('../src/world/world-map-ui.js',import.meta.url),'utf8'),worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8'),css=await readFile(new URL('../src/world/world-map.css',import.meta.url),'utf8');
assert.match(ui,/buildResearchAnomalyGeoJson\(grid,changeRows.values\(\),\{active:forecastLayerOn&&previewMode==='change'\}\)/);
assert.match(ui,/\.\.\.RESEARCH_ANOMALY_LAYER_IDS/,'other themes must hide the outline layers');
assert.match(ui,/\$\{anomalySummary\}\$\{omenCard/,'abnormal values must be visible before collapsed parameter details');
assert.match(ui,/spatialCellMatches\(grid,cellId,row.cell_id,currentResearchResolution\)/,'coarse cell details collect all child anomalies');
assert.match(ui,/summary.dataset.researchContext!==/,'previous date/magnitude/horizon anomaly details must not remain visible');
assert.match(ui,/地震発生確率や確定した前兆ではありません/);
assert.match(worker,/earthquake-anomaly-presentation\.js/,'new dependency must be included in the offline shell');
assert.match(css,/world-anomaly-summary/);assert.match(css,/@media\(max-width:430px\)/);
console.log('Earthquake anomaly emphasis passed: criteria, missing data, exact cells, layers, UI and offline dependency');
