import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { alertFromEntry, buildOfficialAlerts, catalogVolcanoForJmaName, parseAtomEntries } from '../scripts/update-jma-volcano-alerts.mjs';

const catalog=JSON.parse(await readFile(new URL('../data/world/volcano-catalog-v2.json',import.meta.url),'utf8'));
const xml=`<feed><entry><title>降灰予報（定時）</title><updated>2026-08-28T11:00:00Z</updated><link type="application/xml" href="https://www.data.jma.go.jp/developer/xml/data/sample_VFVO53_010000.xml"/><content type="text">【火山名　阿蘇山　降灰予報（定時）】　現在、阿蘇山は噴火警戒レベル３（入山規制）です。</content></entry><entry><title>震源・震度に関する情報</title><updated>2026-08-28T10:00:00Z</updated><link href="https://example.test/VXSE53.xml"/><content>地震情報</content></entry></feed>`;
const entries=parseAtomEntries(xml);assert.equal(entries.length,2);const item=alertFromEntry(entries[0],catalog);assert.equal(item.volcanoId,'gvp-282110');assert.equal(item.alert.level,3);assert.equal(item.alert.sourceAgency,'気象庁');assert.equal(alertFromEntry(entries[1],catalog),null);
assert.equal(catalogVolcanoForJmaName('桜島',catalog).gvpNumber,282080);assert.equal(catalogVolcanoForJmaName('霧島山（新燃岳）',catalog).gvpNumber,282090);
const payload=buildOfficialAlerts(xml,catalog,{generatedAt:'2026-08-28T12:00:00Z'});assert.equal(payload.freshness.japanConnected,true);assert.equal(Object.keys(payload.alertsByVolcano).length,1);assert.match(payload.sha256,/^[a-f0-9]{64}$/);
console.log('JMA volcano alert ingestion passed');
