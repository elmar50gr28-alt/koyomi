import assert from 'node:assert/strict';
import { observationRing } from '../src/world/volcano/alert-level.js';
const thermal = { status: 'no-detection', detectionCount: 0 };
const seismic = { status: 'available', eventCount: 0 };
for (const [t,s] of [[null,null],[thermal,null],[{...thermal,partial:true},seismic],[{...thermal,stale:true},seismic],[{status:'unconfigured'},seismic]]) {
  assert.match(observationRing(t,s).label, /判断保留/);
  assert.equal(observationRing(t,s).band, 0);
}
assert.equal(observationRing(thermal,seismic).label,'顕著な観測変化なし');
assert.match(observationRing({...thermal,stale:true,detectionCount:2},seismic).label,/古い/);
assert.match(observationRing(null,{...seismic,eventCount:1}).label,/周辺地震あり/);
console.log('Unavailable volcano observations remain distinct from observed quiet conditions');
