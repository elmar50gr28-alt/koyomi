import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EARTH_SIGNS_VERSION } from '../src/world/earth-signs-core.js';
import { CONFLICT_SIGNS_VERSION } from '../src/world/conflict/conflict-signs-core.js';
import { loadOmenLedger, persistOmenLedger, saveOmenSnapshot } from '../src/world/earth-signs-ledger.js';
import { loadConflictLedger, saveConflictSnapshot } from '../src/world/conflict/conflict-signs-ledger.js';

const blocked={getItem:()=>null,setItem:()=>{throw new DOMException('Full device storage','QuotaExceededError')}};
const omen={engineVersion:EARTH_SIGNS_VERSION,category:'earthquake',placeId:'fixture',issuedAt:'2026-09-15T00:00:00Z',horizonDays:7};
const conflict={engineVersion:CONFLICT_SIGNS_VERSION,placeId:'fixture',issuedAt:'2026-09-15T00:00:00Z',horizonDays:30};
assert.equal(saveOmenSnapshot([omen],{storage:blocked}).entries.length,1,'storage quota failure must retain the current in-memory omen');
assert.equal(persistOmenLedger([omen],{storage:blocked}).length,1,'storage quota failure must not block a reading');
assert.equal(saveConflictSnapshot([conflict],{storage:blocked}).entries.length,1,'storage quota failure must not block a World reading');
assert.deepEqual(loadOmenLedger(blocked),[]);
assert.deepEqual(loadConflictLedger(blocked),[]);

const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get:()=>{throw new DOMException('Storage blocked','SecurityError')}});
  assert.deepEqual(loadOmenLedger(),[]);
  assert.deepEqual(loadConflictLedger(),[]);
  assert.equal(saveOmenSnapshot([omen]).entries.length,1);
  assert.equal(persistOmenLedger([omen]).length,1);
  assert.equal(saveConflictSnapshot([conflict]).entries.length,1);
}finally{
  if(previous)Object.defineProperty(globalThis,'localStorage',previous);
  else delete globalThis.localStorage;
}

const [ui,app,worker]=await Promise.all(['src/world/world-map-ui.js','app.html','service-worker.js'].map(path=>readFile(new URL(`../${path}`,import.meta.url),'utf8')));
const bindings=ui.split('\n').find(line=>line.includes("const layerToggle=page.querySelector('#earthquakeForecastLayer')"));
assert.ok(bindings,'World control bindings must exist');
assert.doesNotMatch(bindings,/refreshOmens\(\)|renderOmenRanking\(\)/,'research readings must not run before the globe renderer starts');
assert.match(ui,/const completeMapStartup=.*refreshOmens\(\)/,'readings must still run when the globe is ready');
assert.match(app,/earthquake-native-v22-readable-attention-ui/,'iPhone clients must load the repaired module');
assert.match(worker,/shell-readable-attention-v1/,'offline shell must update with the repaired module');
console.log('World globe iPhone storage fallback tests passed');
