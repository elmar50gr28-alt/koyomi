import assert from 'node:assert/strict';
import {buildSeries,describePoint,readingContext,flowFacts,findMilestones} from '../src/bazi/lifetime/core.js';
const period=(extras={})=>({label:'甲子',tenGod:'傷官',support:0,caution:90,clashes:1,other:0,...extras});
const point=(date,extras={})=>({date,age:30,score:20,risk:80,opportunity:20,tone:'caution',parts:{daily:period(),annual:period(),monthly:period(),decade:period()},...extras});
const a=point('2026-01-01'),b=point('2026-01-02',{score:40,risk:60}),c=point('2026-01-03',{score:80,risk:20,tone:'opportunity'});
assert.match(describePoint(a).body,/言いたいこと/);
assert.equal(describePoint(a).cause,'clash');
assert.match(describePoint(a).note,/冲/);
assert.match(describePoint(point(a.date,{parts:{daily:period({clashes:0,other:2})}})).note,/害・刑・破/);
assert.equal(describePoint(a,{meta:{birthTimeUnknown:true}}).uncertain,true);
assert.doesNotMatch(describePoint(a,{meta:{elementConfidence:.25}}).title,/結論を急がない/);
assert.equal(describePoint(a,{meta:{elementConfidence:.7}}).uncertain,false);
assert.notEqual(describePoint(a,{meta:{birthTimeUnknown:true}}).title,describePoint({...a,tone:'opportunity'},{meta:{birthTimeUnknown:true}}).title,'reference readings still distinguish fortune intensity');
assert.ok(flowFacts(b,{previous:a,next:c}).some(f=>f.kind==='opening'&&f.date===c.date));
assert.ok(flowFacts(a,{next:b}).some(f=>f.kind==='easing'));
assert.deepEqual(flowFacts(a,{next:point('2026-01-04',{score:90,risk:0,tone:'opportunity'})}),[],'skip nonadjacent context');
assert.deepEqual(flowFacts(a),[],'do not fabricate a preceding/following day at lifetime endpoints');
const stillRisk=point('2026-01-02',{score:40,risk:72});
assert.match(flowFacts(stillRisk,{previous:a})[0].text,/まだ警戒/);
assert.deepEqual(describePoint({...b,age:3},{next:c}).flow,[],'children do not receive adult scheduling advice');
const unchanged=JSON.stringify(a);describePoint(a,{next:b});assert.equal(JSON.stringify(a),unchanged);
const boundaryRows=[a,b,c,point('2026-01-04',{risk:20,tone:'opportunity',parts:{...c.parts,decade:period({label:'乙丑'})}})];
const events=findMilestones(boundaryRows);
assert.ok(events.some(e=>e.kind==='opportunity'&&e.start===2&&e.end===3));
assert.ok(events.some(e=>e.kind==='decade'&&e.date==='2026-01-04'));
assert.ok(!events.some(e=>e.kind==='caution'),'isolated warning day is not described as a sustained period');
assert.deepEqual(readingContext(boundaryRows,0).previous,undefined);
const report=[];
for(const [date,gender,baseline]of [['2000-02-29','male',.30],['1995-11-23','female',13/30],['1982-07-15','male',4/30],['1970-01-01','female',.20]]){
 const series=await buildSeries({gender,birthData:{date,time:'12:00',timeUnknown:false,place:{longitude:135,latitude:35,utcOffset:9,timezone:'Asia/Tokyo'}}});
 const allEvents=findMilestones(series.rows);
 for(const event of allEvents){assert.ok(event.start<=event.end);assert.equal(event.date,series.rows[event.start].date);if(event.kind==='opportunity')for(let i=event.start;i<=event.end;i++)assert.equal(series.rows[i].tone,'opportunity');if(event.kind==='caution')for(let i=event.start;i<=event.end;i++)assert.ok(series.rows[i].risk>=70);}
 const bodies=new Set(),readings=new Set(),titles=new Set();let flowCount=0;
 for(let i=0;i<series.rows.length;i++){
  const r=series.rows[i];if(r.date<'2026-10-01'||r.date>'2026-10-30')continue;
  const result=describePoint(r,readingContext(series.rows,i,series.meta));const full=result.body+result.flow.map(f=>f.text).join(' ');
  bodies.add(result.body);readings.add(full);titles.add(result.title);flowCount+=result.flow.length;
  assert.ok(result.note.includes(r.parts.daily.label));
  if(result.cause==='clash')assert.ok(r.parts.daily.clashes>0);
  if(result.cause==='friction')assert.ok(r.parts.daily.other>0);
  for(const fact of result.flow){const next=series.rows[i+1];if(fact.kind==='opening')assert.equal(next.tone,'opportunity');if(fact.kind==='easing'){assert.ok(next.score-r.score>=8);assert.ok(r.risk-next.risk>=8);}}
  assert.doesNotMatch(full,/必ず|災難が起きる|不幸になる|15分|整える日/);
 }
 const duplicate=1-bodies.size/30;
 assert.ok(duplicate<=baseline+1e-9,`body duplication regression for ${date}: ${duplicate} > ${baseline}`);
 report.push({birth:date,days:series.rows.length,previousBodyDuplicateRate:+baseline.toFixed(3),bodyDuplicateRate:+duplicate.toFixed(3),bodyWithFlowDuplicateRate:+(1-readings.size/30).toFixed(3),titles:titles.size,flowCount,milestones:allEvents.length});
}
console.log(JSON.stringify(report,null,2));
