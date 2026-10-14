import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {writeCache} from '../src/bazi/lifetime/cache.js';
import {createCalculator,buildSeries,parseCivil,civil,ageAt,anniversary,aggregate,cacheKey,describePoint,DAY} from '../src/bazi/lifetime/core.js';
import {nearestIndex,validSeries,plotGeometry} from '../src/ui/lifetime-chart.js';
const profile={displayName:'fixture',gender:'male',birthData:{date:'2000-02-29',time:'12:00',timeUnknown:false,place:{longitude:135,latitude:35,utcOffset:9,timezone:'Asia/Tokyo'}}};
const calc=createCalculator(profile);assert.equal(calc.end,'2100-02-28');
if(process.env.KOYOMI_LIFE_TZ_PROBE){console.log(JSON.stringify({start:calc.meta.startDate,points:['2026-02-03','2026-02-04','2100-02-28'].map(date=>calc.point(date))}));process.exit(0);}
assert.equal(ageAt('2000-02-29','2001-02-27'),0);assert.equal(ageAt('2000-02-29','2001-02-28'),1);
assert.equal(civil(anniversary('2000-02-29',4)),'2004-02-29');
for(const value of ['2026-02-30','2026-13-01','bad','0000-01-01'])assert.throws(()=>parseCivil(value));
const before=JSON.stringify(profile),series=await buildSeries(profile);
assert.equal(JSON.stringify(profile),before);assert.equal(series.rows.length,(parseCivil(calc.end)-parseCivil(calc.birth))/DAY+1);assert.ok(series.rows.length>36500);
assert.equal(series.rows[0].age,0);assert.equal(series.rows.at(-1).age,100);assert.ok(series.rows[0].preLuck);assert.ok(!series.rows.at(-1).preLuck,'the calculation must extend beyond the previous eight cycles');
for(const row of series.rows){for(const key of ['score','support','caution'])assert.ok(Number.isFinite(row[key])&&row[key]>=0&&row[key]<=100);}
for(const date of ['2000-02-29','2004-02-29','2026-02-03','2026-02-04','2099-12-31','2100-02-28'])assert.deepEqual(series.rows[(parseCivil(date)-parseCivil(calc.birth))/DAY],calc.point(date));
const boundary=new Date(calc.meta.startDate),stamp=Date.UTC(boundary.getUTCFullYear(),boundary.getUTCMonth(),boundary.getUTCDate());
assert.ok(calc.point(civil(stamp-2*DAY)).preLuck);assert.ok(!calc.point(civil(stamp+2*DAY)).preLuck);
const monthBefore=calc.point('2026-02-03'),monthAfter=calc.point('2026-02-05');assert.notEqual(monthBefore.parts.annual.label,monthAfter.parts.annual.label);assert.notEqual(monthBefore.parts.monthly.label,monthAfter.parts.monthly.label);
const groups=aggregate(series.rows,300);assert.ok(groups.length<=300);assert.equal(groups[0].start,0);assert.equal(groups.at(-1).end,series.rows.length-1);
for(const g of groups){const rows=series.rows.slice(g.start,g.end+1);assert.equal(g.min,Math.min(...rows.map(r=>r.score)));assert.equal(g.max,Math.max(...rows.map(r=>r.score)));assert.equal(g.score,rows.reduce((n,r)=>n+r.score,0)/rows.length);}
assert.equal(aggregate(series.rows.slice(0,7),100).length,7);assert.throws(()=>aggregate([],0));
assert.equal(nearestIndex(0,900,0,100),0);assert.equal(nearestIndex(900,900,0,100),100);assert.equal(nearestIndex(450,900,3,9),6);assert.equal(nearestIndex(-10,900,0,10),0);
for(const width of [308,1024]){const plot=plotGeometry(width,210);assert.equal(nearestIndex(plot.left-plot.left,plot.width,3,33),3);assert.equal(nearestIndex(plot.right-plot.left,plot.width,3,33),33);assert.ok(plot.bottom-plot.top>150);}
const probes=['UTC','Asia/Tokyo','America/New_York','Pacific/Auckland'].map(TZ=>execFileSync(process.execPath,['tests/lifetime-chart.test.mjs'],{env:{...process.env,TZ,KOYOMI_LIFE_TZ_PROBE:'1'},encoding:'utf8'}));for(const probe of probes)assert.equal(probe,probes[0],'host timezone cannot change daily values or decade boundaries');
assert.ok(validSeries(series,cacheKey(profile)));assert.equal(validSeries(series,'wrong'),false);assert.notEqual(cacheKey(profile),cacheKey({...profile,gender:'female'}));
assert.match(describePoint(series.rows[0]).body,/見守り/);assert.equal(describePoint(series.rows.at(-1)).evidence.length,4);
const unknown=createCalculator({...profile,gender:'',birthData:{...profile.birthData,time:'',timeUnknown:true}});assert.ok(unknown.meta.birthTimeUnknown);assert.ok(unknown.meta.directionDefault);assert.ok(unknown.point('2026-01-01'));
await assert.rejects(buildSeries(profile,{}, {cancelled:()=>true}),/中止/);
const app=await readFile('app.html','utf8'),sw=await readFile('service-worker.js','utf8');assert.match(app,/mountLifetimeChart/);
const mount=app.split(/\r?\n/).find(line=>line.startsWith('window.KOYOMI_LIFETIME_CHART=mountLifetimeChart('));let captured;
const freshProfile={...profile,displayName:'latest',birthData:{...profile.birthData,date:'1995-11-23'}};
const sandbox={document:{getElementById:id=>id==='gender'?{value:'male'}:{}},window:{},LedgerState:{currentProfileId:'primary',selectedPrimary:'primary',locked:false},ledgerCollectProfile:()=>freshProfile,koyomiBaziReadingProfile:()=>profile,mountLifetimeChart:options=>{captured=options;}};vm.runInNewContext(mount,sandbox);
assert.equal(captured.getProfile(),freshProfile,'editing the primary profile must not reuse stale main-form values');sandbox.LedgerState.currentProfileId='other';assert.equal(captured.getProfile().birthData.date,profile.birthData.date);sandbox.LedgerState.locked=true;assert.equal(captured.getProfile(),null);
assert.equal(captured.canPersist(),true);sandbox.LedgerState.lockConfig={enabled:true};assert.equal(captured.canPersist(),false,'encrypted profile mode must not create a separate plaintext cache');
let hidden=false;sandbox.window.KOYOMI_LIFETIME_CHART={hide:()=>{hidden=true;}};sandbox.$=()=>({classList:{add(){}},value:'',focus(){}});sandbox.setTimeout=()=>{};sandbox.ledgerUpdateStatus=()=>{};vm.runInNewContext(app.split(/\r?\n/).find(line=>line.startsWith('function ledgerShowLock()')),sandbox);sandbox.ledgerShowLock();assert.ok(hidden,'locking the existing ledger must hide the lifetime chart');
let request,allowed=true,closed=false;globalThis.indexedDB={open(){request={result:{close(){closed=true;},transaction(){throw new Error('a protected cache cannot begin a write');}}};return request;}};
const saving=writeCache(series,()=>allowed);allowed=false;request.onsuccess();await saving;assert.ok(closed,'a changed privacy condition must be checked after the asynchronous DB open');delete globalThis.indexedDB;
for(const file of ['src/ui/lifetime-chart.js','src/ui/lifetime-chart.css','src/bazi/lifetime/core.js','src/bazi/lifetime/reading.js','src/bazi/lifetime/cache.js','src/bazi/lifetime/worker.js','src/bazi/luck/index.js','src/bazi/calendar/index.js','src/bazi/index.js'])assert.ok(sw.includes("'./"+file+"'"),'offline preload: '+file);
console.log(`Lifetime daily chart passed: ${series.rows.length} daily points, leap/age/period boundaries, 100-year cycles, aggregation extrema, selection, partial birth and offline dependencies.`);
