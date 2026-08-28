import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LEGACY_VOLCANO_ID_MAP, normalizeObservationIds, retainedThermal } from '../src/world/volcano/observation-compat.js';
import { observationRing } from '../src/world/volcano/alert-level.js';
import { volcanoGeoJson } from '../src/world/volcano/map-layer.js';

const catalog=JSON.parse(await readFile(new URL('../data/world/volcano-catalog-v2.json',import.meta.url),'utf8')),legacy=JSON.parse(await readFile(new URL('../data/world/volcano-observations-v1.json',import.meta.url),'utf8')),normalized=normalizeObservationIds(legacy,catalog),catalogIds=new Set(catalog.volcanoes.map(item=>item.id));
assert.equal(Object.keys(LEGACY_VOLCANO_ID_MAP).length,10);assert.equal(Object.keys(normalized.thermalByVolcano).length,1214);assert.equal(Object.keys(normalized.seismicByVolcano).length,1214);assert.equal(normalized.migration.unresolvedIds.length,0);assert.equal(normalized.migration.migratedIds.length,10);
for(const legacyId of Object.keys(LEGACY_VOLCANO_ID_MAP)){assert.equal(normalized.thermalByVolcano[legacyId],undefined);assert.equal(normalized.seismicByVolcano[legacyId],undefined)}
assert.ok(Object.keys(normalized.thermalByVolcano).every(id=>catalogIds.has(id)));assert.ok(Object.keys(normalized.seismicByVolcano).every(id=>catalogIds.has(id)));
const active=Object.entries(normalized.thermalByVolcano).filter(([,item])=>(Number(item.detectionCount)||0)>0);assert.equal(active.length,5,'the five existing thermal observations must become visible on GVP points');
assert.ok((Number(normalized.thermalByVolcano['gvp-282110'].detectionCount)||0)>0,'Aso legacy heat must map to GVP Aso');
const retained=retainedThermal(normalized.thermalByVolcano['gvp-282110'],{generatedAt:'2026-08-28T12:00:00Z',failedSources:['VIIRS_NOAA20_NRT']});assert.equal(retained.status,'stale-data');assert.equal(retained.retainedAfterProviderFailure,true);assert.equal(observationRing(retained,null).band,4);assert.match(observationRing(retained,null).label,/古い/);
const geo=volcanoGeoJson(catalog,normalized);assert.equal(geo.features.length,1214);assert.equal(geo.features.filter(item=>item.properties.observationRingBand>=2).length,5);
const script=await readFile(new URL('../scripts/update-volcano-observations.mjs',import.meta.url),'utf8'),ui=await readFile(new URL('../src/world/volcano/map-layer.js',import.meta.url),'utf8'),worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
for(const token of ['normalizeObservationIds','retainedThermal','retainedPreviousData','publicationSafe','publishable:publicationSafe'])assert.ok(script.includes(token),token);for(const token of ['最終成功観測','古い観測・参考表示'])assert.ok(ui.includes(token),token);assert.ok(worker.includes('observation-compat.js'));
console.log('Volcano observation legacy-to-GVP migration passed');
