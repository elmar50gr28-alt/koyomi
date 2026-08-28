import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui=await readFile(new URL('../src/world/world-map-ui.js',import.meta.url),'utf8');
const volcano=await readFile(new URL('../src/world/volcano/map-layer.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
for(const token of ['earth-signs-core.js','earth-signs-ledger.js','星が告げる大地の兆し','星の兆しが強い場所','この星の活性値に衛星熱・地震・公式警戒データは加算していません','persistOmenLedger','ledgerEarthquakes','map?.flyTo'])assert.ok(ui.includes(token),`${token} must be wired into the world map`);
for(const token of ['omenForVolcano','omenCard','showVolcano'])assert.ok(volcano.includes(token),`${token} must connect volcano selections to the astrology reading`);
for(const asset of ['./src/world/earth-signs-core.js','./src/world/earth-signs-ledger.js'])assert.ok(worker.includes(asset),`${asset} must be available offline`);
assert.doesNotMatch(ui,/科学的な地震予知です[。<]/);
console.log('Earth signs UI, map jump, safety separation, and offline integration passed');
