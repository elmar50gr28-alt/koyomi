import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const app=readFileSync('app.html','utf8'),lines=app.split(/\r?\n/);
const selected=['const DAY=','const STEMS=','const STEM_ELEMENT=','const BRANCH_ELEMENT=','const TERM_NAMES='].map(p=>lines.find(l=>l.startsWith(p)));
const funcs=['solarLongitude','yearPillar','monthPillar','qmdjScorePalace','qmdjEvaluate'].map(n=>lines.find(l=>l.startsWith('function '+n+'(')));
assert.ok([...selected,...funcs].every(Boolean));
const core=app.slice(app.indexOf('const QMDJ_VERSION='),app.indexOf('function qmdjScorePalace('));
const expression="QMDJ_RING[qmdjMod(QMDJ_RING.indexOf(xunPalace===5?2:xunPalace)+(dun==='陽遁'?hourStep:-hourStep),8)]";
assert.equal(core.split(expression).length,2);
const vendor=readFileSync('vendor/astronomy-engine/2.1.19/astronomy.browser.min.js');
assert.equal(createHash('sha256').update(vendor).digest('hex'),'f41139a87941ea017ab902b954c9389fa27ea72083d7fab4971756d7769d14e6');
function make(candidate){
 const ctx=vm.createContext({window:{},Date,console});
 vm.runInContext(readFileSync('src/shared/qimen-time-core.js','utf8'),ctx);
 vm.runInContext(vendor.toString('utf8'),ctx);
 const source=candidate?core.replace(expression,"qmdjMod(xunPalace-1+(dun==='陽遁'?hourStep:-hourStep),9)+1"):core;
 vm.runInContext(selected.join('\n')+'\nfunction mod(n,m){return((n%m)+m)%m}function jd(d){return d.getTime()/DAY+2440587.5}function fmtIso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}function auditClamp(n,min,max){return Math.min(max,Math.max(min,n))}\n'+funcs.join('\n').replace(/\bclamp\(/g,'auditClamp(')+'\n'+source,ctx);
 const active=lines.find(l=>l.startsWith('function v191zEphemerisActive(')),runtime=lines.find(l=>l.startsWith('solarLongitude=function(d)'));
 assert.ok(active&&runtime);
 vm.runInContext('const v191zSolarLongitudeFallback=()=>{throw Error("Unexpected astronomy fallback")};\n'+active+'\n'+runtime+'\nthis.api={chart:qmdjChart,evaluate:(c,key)=>qmdjEvaluate(c,{key,...QMDJ_PURPOSE_GROUPS[key]}),purposes:Object.keys(QMDJ_PURPOSE_GROUPS)};',ctx);
 return ctx.api;
}
const current=make(false),candidate=make(true),byPurpose={};
for(const key of current.purposes)byPurpose[key]={comparisons:0,firstBestChanged:0,bestSetChanged:0,overallChanged:0,maxDifference:0};
const bestSet=ev=>ev.directions.filter(p=>p.score===ev.best.score).map(p=>p.no).sort((a,b)=>a-b).join(',');
let charts=0;
for(let month=0;month<12;month++)for(const hour of [0,12,23])for(const basis of ['standard','local','solar'])for(const school of ['chaibu','fixed']){
 // Public synthetic schedule: 15th of each month in 2026, Tokyo, UTC+9.
 const date=new Date(Date.UTC(2026,month,15,hour-9,30));
 const input={date,tz:9,lon:139.7671,basis,boundary:23,school};
 const a=current.chart(input),b=candidate.chart(input);charts++;
 for(const key of ['term','yuan','hp','dp','yp','mp','ground'])assert.equal(JSON.stringify(a[key]),JSON.stringify(b[key]),key);
 for(const key of current.purposes){
  const before=current.evaluate(a,key),after=candidate.evaluate(b,key),r=byPurpose[key];
  r.comparisons++;
  if(before.best.no!==after.best.no)r.firstBestChanged++;
  if(bestSet(before)!==bestSet(after))r.bestSetChanged++;
  if(before.overall!==after.overall)r.overallChanged++;
  r.maxDifference=Math.max(r.maxDifference,Math.abs(before.overall-after.overall));
  assert.ok(Number.isFinite(after.overall)&&after.overall>=0&&after.overall<=100);
 }
}
console.log(JSON.stringify({scope:'real_datetime_schedule_not_classical_ground_truth',year:2026,location:'Tokyo UTC+9',charts,boundary:23,centerHosting:'5_to_2_unapproved',byPurpose},null,2));
