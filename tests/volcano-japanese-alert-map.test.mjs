import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { localizedVolcanoName, katakanaFallback, volcanoSearchText } from '../src/world/volcano/localization.js';
import { normalizeOfficialAlert, observationRing } from '../src/world/volcano/alert-level.js';
import { volcanoGeoJson } from '../src/world/volcano/map-layer.js';

const catalog=JSON.parse(await readFile(new URL('../data/world/volcano-catalog-v2.json',import.meta.url),'utf8'));
const alerts=JSON.parse(await readFile(new URL('../data/world/volcano-official-alerts-v1.json',import.meta.url),'utf8'));
assert.equal(alerts.freshness.complete,false,'unconnected official feeds must not imply safety');
assert.ok(!/[A-Za-z]/.test(katakanaFallback('Mount St. Helens')));
const fuji=catalog.volcanoes.find(item=>item.gvpNumber===283030);assert.equal(localizedVolcanoName(fuji).nameJa,'富士山');assert.match(volcanoSearchText(fuji),/fujisan/);
for(const volcano of catalog.volcanoes){const localized=localizedVolcanoName(volcano);assert.ok(localized.nameJa);assert.ok(!/[A-Za-z]/.test(localized.nameJa),`${volcano.name} must have a Japanese-script display fallback`);assert.equal(localized.nameEn,volcano.name)}

const asOf=new Date('2026-08-28T12:00:00Z');
const jma=normalizeOfficialAlert({system:'JMA',level:3,issuedAt:'2026-08-28T10:00:00Z',sourceAgency:'気象庁',summaryJa:'入山規制'},{asOf});assert.equal(jma.band,3);assert.equal(jma.labelJa,'警戒');assert.equal(jma.color,'#e27622');
const usgs=normalizeOfficialAlert({system:'USGS',level:'WARNING',issuedAt:'2026-08-28T10:00:00Z'},{asOf});assert.equal(usgs.band,4);assert.equal(usgs.symbol,'!');
const stale=normalizeOfficialAlert({system:'JMA',level:5,issuedAt:'2026-08-20T10:00:00Z'},{asOf});assert.equal(stale.band,0);assert.equal(stale.status,'stale');assert.notEqual(stale.color,'#26845b');
const unknown=normalizeOfficialAlert(null,{asOf});assert.equal(unknown.band,0);assert.equal(unknown.labelJa,'公式評価なし');
assert.equal(observationRing({multiSensorConfirmed:true},null).color,'#8139a8');assert.equal(observationRing({detectionCount:2},null).color,'#31a7c9');assert.equal(observationRing(null,{eventCount:1}).color,'#3678c8');

const observations={thermalByVolcano:{[fuji.id]:{status:'available',detectionCount:2,multiSensorConfirmed:false,totalFrpMw:20}},seismicByVolcano:{[fuji.id]:{status:'available',eventCount:0}}},official={alertsByVolcano:{[fuji.id]:{system:'JMA',level:2,issuedAt:'2026-08-28T10:00:00Z'}}};
const feature=volcanoGeoJson({volcanoes:[fuji]},observations,'confirmation',official,{asOf}).features[0];assert.equal(feature.properties.name,'富士山');assert.equal(feature.properties.alertBand,2);assert.equal(feature.properties.alertColor,'#d5ad22');assert.equal(feature.properties.observationRingBand,2);assert.notEqual(feature.properties.alertColor,feature.properties.observationRingColor,'official danger and observations must remain visually separate');

const layer=await readFile(new URL('../src/world/volcano/map-layer.js',import.meta.url),'utf8'),ui=await readFile(new URL('../src/world/world-map-ui.js',import.meta.url),'utf8'),worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
for(const token of ['maxAlertBand','observationRingColor','alertColor','nameJaStatus','公的警戒色を変更しません'])assert.ok(layer.includes(token),token);
for(const token of ['世界の火山・公的警戒レイヤー','? 評価なし','○ 通常','△ 注意','▲ 警戒','! 重大警戒','中心色は公的警戒情報、外周は観測変化'])assert.ok(ui.includes(token),token);
for(const asset of ['src/world/volcano/alert-level.js','src/world/volcano/localization.js','data/world/volcano-official-alerts-v1.json'])assert.ok(worker.includes(asset),asset);
console.log('Volcano Japanese names and official alert map passed');
