import assert from 'node:assert/strict';
import {forecastLeadMonths,evaluateLeadModels,LEAD_RESEARCH_POLICY,LEAD_CANDIDATE_COUNT} from '../src/financial/market-lead-forecast.js';

function iso(d){return d.toISOString().slice(0,10);}
const prices=[];
for(let day=0;day<1600;day++){
 const date=new Date(Date.UTC(2017,0,1+day));
 if(date.getUTCDay()===0||date.getUTCDay()===6)continue;
 const i=prices.length,period=i%210;
 const close=period<95?100+period*.12:period<123?111-(period-95)*.95:84+(period-123)*.32;
 prices.push({date:iso(date),close:Math.max(35,close)});
}
const calls=[];
const readSky=key=>{
 calls.push(key);
 const n=Math.floor(Date.parse(key+'T00:00:00Z')/86400000);
 return {date:key,aspects:[{
  bodies:n%3===0?['Saturn','Mars']:['Venus','Jupiter'],
  type:n%3===0?'square':'trine',orb:0.5,
  label:'試験用の惑星',aspect:'試験用アスペクト'
 }],retrogrades:[]};
};
const asOf=prices.at(-1).date;
const forecast=forecastLeadMonths({prices,asOfDate:asOf,readSky,market:'nikkei'});
assert.equal(forecast.status,'experimental','recurrent crashes have sufficient training examples');
assert.equal(forecast.buckets.length,3);
assert.deepEqual(forecast.buckets.map(b=>b.period),['今後1〜30日','31〜60日先','61〜90日先']);
assert.ok(forecast.buckets.some(b=>Number.isFinite(b.riskScore)));
assert.ok(forecast.buckets.every(b=>b.start>asOf));
assert.ok(forecast.buckets.every(b=>b.end>b.start));
assert.ok(forecast.buckets.filter(b=>Number.isFinite(b.riskScore)).every(b=>b.riskScore>=0&&b.riskScore<=100));
assert.ok(calls.some(day=>day>asOf),'future ASTRO dates are legal and predetermined');
const audit=evaluateLeadModels({prices,readSky});
assert.equal(audit.results.length,3);
for(const row of audit.results){
 if(row.status!=='evaluated')continue;
 assert.ok(Date.parse(row.lastTrainDate+'T00:00:00Z')+90*86400000<
   Date.parse(row.firstHoldoutDate+'T00:00:00Z'),'embargo before test must prevent label leakage');
 assert.ok(row.trainN>=28);
 assert.ok(row.model.brier>=0&&row.model.brier<=1);
 assert.ok(row.priceOnly.brier>=0&&row.priceOnly.brier<=1);
}
const futureDay=new Date(Date.parse(asOf+'T00:00:00Z')+86400000);
const extended=[...prices,{date:iso(futureDay),close:1000000}];
const old=forecastLeadMonths({prices:extended,asOfDate:asOf,readSky:()=>({date:'2050-01-01',aspects:[],retrogrades:[]}),market:'nikkei'});
const original=forecastLeadMonths({prices,asOfDate:asOf,readSky:()=>({date:'2050-01-01',aspects:[],retrogrades:[]}),market:'nikkei'});
assert.deepEqual(old,original,'unseen future crash or spike must never affect previous forecasts');
assert.equal(forecastLeadMonths({prices,asOfDate:'2028-01-01',readSky}).status,'unavailable','stale market data cannot support live months');
assert.equal(LEAD_RESEARCH_POLICY.targetDropPct,-8);
assert.equal(LEAD_RESEARCH_POLICY.purgeCalendarDays,90);
assert.equal(LEAD_CANDIDATE_COUNT.price,3);
assert.equal(LEAD_CANDIDATE_COUNT.combined,6);
for(const row of audit.results){
  if(row.status!=='evaluated')continue;
  assert.ok(['inner-cv-one-standard-error','not-enough-inner-folds'].includes(row.optimization.combined.selection));
  assert.ok([.1,.5,2].includes(row.optimization.combined.regularization));
  assert.ok([7,9].includes(row.optimization.combined.featureCount));
  assert.ok(row.model.alerts>=0 && row.model.alerts<=row.testN);
  assert.ok(row.model.falseAlerts>=0 && row.model.falseAlerts<=row.model.alerts);
  assert.ok(row.model.threshold>=0 && row.model.threshold<=1,'alert cutoff calibrated only from train scores');
}
assert.ok(forecast.buckets.filter(b=>b.status==='experimental').every(b=>
  Number.isFinite(b.alertCutoff)&&b.alertCutoff>=0&&b.alertCutoff<=100));
console.log('Offline monthly crash lead model: supervised fit, chronological holdout, 90-day purge, no price future leakage passed');
