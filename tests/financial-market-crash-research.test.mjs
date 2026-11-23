import assert from 'node:assert/strict';
import {
  priceRiskAt,studyHistoricalCrashes,CRASH_RISK_RULES,HISTORICAL_CRASH_WINDOWS
} from '../src/financial/market-crash-research.js';

const makeRows=()=>{
  const rows=[];
  for(let i=0;i<105;i++){
    const d=new Date(Date.UTC(2026,0,1+i));
    if(d.getUTCDay()===0||d.getUTCDay()===6)continue;
    const n=rows.length;
    // Gradual slide beginning at business day 35, followed by a steep fall.
    const close=n<35?100+n*.05:Math.max(55,102-n*.68);
    rows.push({date:d.toISOString().slice(0,10),close});
  }
  return rows;
};
const rows=makeRows();
const safeDate=rows[29].date,warningDate=rows[58].date;
assert.equal(priceRiskAt(rows,safeDate).level,'normal');
assert.ok(['high','caution'].includes(priceRiskAt(rows,warningDate).level));
assert.equal(priceRiskAt(rows,rows[0].date).level,'unavailable');
assert.equal(priceRiskAt(rows,'2027-06-01').level,'unavailable','stale closes must not imply current safety');
const exact=priceRiskAt(rows,safeDate), extended=rows.concat([{date:'2027-01-01',close:1}]);
assert.deepEqual(priceRiskAt(extended,safeDate),exact,'future price must never affect prior risk!');
const shocked=rows.slice(0,30).map(x=>({...x}));
shocked.push({date:'2026-03-01',close:70});
assert.equal(priceRiskAt(shocked,safeDate).level,'normal','an unseen crash must not be predicted in hindsight');
assert.equal(CRASH_RISK_RULES.thresholds.cautionDrawdown,-8);
assert.deepEqual(HISTORICAL_CRASH_WINDOWS.map(x=>x.id),[
  'nikkei-2008','nikkei-2011','nasdaq-2020','nasdaq-2022'
]);
const downReading=(date,count)=>Array.from({length:count},(_,i)=>({
  date:new Date(date.getTime()+i*86400000).toISOString().slice(0,10),
  aspects:[{bodies:['Saturn','Mars'],type:'square',orb:0.2,label:'土星×火星',aspect:'スクエア'}],
  retrogrades:[]
}));
const testWindow={id:'synthetic',market:'nikkei',title:'Synthetic Crash',
  from:rows[22].date,to:rows[66].date,checkpoint:rows[35].date};
const result=studyHistoricalCrashes({prices:rows,market:'nikkei',readWindow:downReading,
  windows:[testWindow]});
const e=result.events[0];
assert.equal(e.status,'evaluated');
assert.ok(e.crashCases>0,'future -8% outcomes must be observed');
assert.ok(e.nonCrashCases>0,'include quiet days as controls');
assert.ok(e.priceGuard.trueAlerts>0,'the price guard eventually recognizes observed declines');
assert.ok(e.priceGuard.missed>=0);
assert.ok(e.astro.trueAlerts>=e.priceGuard.trueAlerts,'always-bearish astrology catches all crash outcomes');
assert.ok(e.astro.falseAlerts>0,'always-bearish astrology also generates false alarms');
assert.ok(e.checkpoint);
assert.ok(e.firstCrisisDate);
assert.ok(result.warning.includes('予言ではありません'));
assert.equal(studyHistoricalCrashes({prices:rows,market:'nasdaq',readWindow:downReading}).events.length,2);
assert.throws(()=>studyHistoricalCrashes({prices:rows,market:'nikkei',readWindow:downReading,horizon:7}),/固定/);
console.log('Historical crash windows, pre-event leakage prevention, old-price exclusion and early-vs-late warning guard passed');
