import assert from 'node:assert/strict';
import {buildSeries,describePoint,readingContext,flowFacts,findMilestones} from '../src/bazi/lifetime/core.js';
import {dominantCause,continuousFlow,periodContrast,turningPoint,supportReading} from '../src/bazi/lifetime/reading.js';
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
assert.equal(dominantCause(period({attentionBreakdown:{element:80,clash:18,friction:10}})),'element','a small clash must not displace the larger attention source');
assert.equal(dominantCause(period({attentionBreakdown:{element:0,clash:18,friction:30}})),'friction');
assert.equal(dominantCause(period({support:100,clashes:0,other:0,attentionBreakdown:{element:0,clash:0,friction:0}})),'support');
const weighted=describePoint(point(a.date,{parts:{daily:period({attentionBreakdown:{element:80,clash:18,friction:0}})}}));assert.equal(weighted.cause,'element');assert.match(weighted.body,/食い違う/);assert.match(weighted.note,/五行80・冲18/);
const sustained=[point('2026-01-01'),point('2026-01-02'),point('2026-01-03')];
const streak=continuousFlow(sustained[1],sustained)[0];assert.equal(streak.days,3);assert.equal(streak.startDate,'2026-01-01');assert.equal(streak.endDate,'2026-01-03');
assert.deepEqual(continuousFlow(sustained[0],[sustained[0],sustained[2]]),[],'do not span a missing civil day');
assert.deepEqual(continuousFlow(sustained[0],[sustained[0],sustained[0],sustained[1]]),[],'duplicate date context cannot prove a streak');
assert.ok(flowFacts(sustained[1],readingContext(sustained,1)).some(f=>f.kind==='caution-streak'));
assert.ok(continuousFlow(c,[c,point('2026-01-04',{risk:20,tone:'opportunity'})]).some(f=>f.kind==='opportunity-streak'));
assert.deepEqual(continuousFlow(a,[{...a,score:99},b]),[],'stale center values must not be used');
const dayOpen=point(a.date,{longTermScore:30,parts:{daily:period({support:100,caution:0})}});
const dayCare=point(a.date,{longTermScore:80});
assert.equal(periodContrast(dayOpen).kind,'day-open-background-caution');assert.equal(periodContrast(dayOpen).dayScore,100);
assert.equal(periodContrast(dayCare).kind,'day-caution-background-open');
assert.equal(periodContrast({...dayOpen,longTermScore:50}),null);assert.equal(periodContrast(a),null);
assert.equal(describePoint({...dayOpen,age:3}).contrast,null);
assert.match(describePoint(dayCare).body,/長期の方針まで諦める必要/);
const peak=point('2026-01-02',{score:64,risk:72}),before=point('2026-01-01',{score:40}),after=point('2026-01-03',{score:40});
assert.equal(turningPoint(peak,before,after).kind,'local-peak');assert.match(turningPoint(peak,before,after).text,/警戒度は強く残る/);
const trough=point('2026-01-02',{score:20,risk:70});
assert.equal(turningPoint(trough,point('2026-01-01',{score:40}),point('2026-01-03',{score:40,risk:75})).kind,'local-trough');
assert.match(turningPoint(trough,point('2026-01-01',{score:40}),point('2026-01-03',{score:40,risk:75})).text,/警戒の材料は強く残/);
const turnFacts=flowFacts(trough,{previous:point('2026-01-01',{score:40}),next:point('2026-01-03',{score:80,risk:20,tone:'opportunity'})});
assert.deepEqual(turnFacts.map(f=>f.kind),['local-trough'],'do not repeat the same valley as falling and easing');
assert.equal(turningPoint(peak,{...before,date:'2025-12-31'},after),null);assert.equal(turningPoint(peak,before,undefined),null);
assert.match(turningPoint({...trough,risk:10},point('2026-01-01',{score:40}),point('2026-01-03',{score:40,risk:50})).text,/警戒度も上がる/);
const elementIds=['wood','fire','earth','metal','water'];
const supportActions=new Set();
for(const id of elementIds){const material=supportReading(period({support:100,supportElements:[{element:id,share:100}]}),'役割と約束');assert.deepEqual(material.elements,[id]);supportActions.add(material.action);}
assert.equal(supportActions.size,5,'the five symbolic supports must produce different practical guidance');
for(let i=0;i<5;i++)for(let j=i+1;j<5;j++){const readings=supportReading(period({support:100,supportElements:[{element:elementIds[j],share:50},{element:elementIds[i],share:50}]}),'役割と約束');assert.deepEqual(readings.elements,[elementIds[i],elementIds[j]]);assert.doesNotMatch(readings.action,/undefined/);}
assert.equal(supportReading(period({support:20,supportElements:[{element:'fire',share:20}]}),'役割と約束'),null);
assert.equal(supportReading(period({support:100}),'役割と約束'),null,'missing element materials must not produce invented support');
const materials=[{element:'water',share:10},{element:'fire',share:90}],originalMaterials=JSON.stringify(materials);
assert.deepEqual(supportReading(period({support:100,supportElements:materials}),'意見の伝え方').elements,['fire']);assert.equal(JSON.stringify(materials),originalMaterials);
const supportive=point(a.date,{tone:'opportunity',risk:0,parts:{daily:period({support:100,caution:0,clashes:0,other:0,attentionBreakdown:{element:0,clash:0,friction:0},supportElements:[{element:'metal',share:100}]})}});
assert.match(describePoint(supportive).body,/決めたい条件/);
assert.equal(describePoint({...supportive,age:4}).supportReading,null);
assert.match(describePoint({...supportive,tone:'caution',risk:80}).body,/言いたいこと/,'overall warning still takes priority over a supported element');
const report=[];
for(const [date,gender,baseline]of [['2000-02-29','male',.10],['1995-11-23','female',4/30],['1982-07-15','male',.10],['1970-01-01','female',2/30]]){
 const series=await buildSeries({gender,birthData:{date,time:'12:00',timeUnknown:false,place:{longitude:135,latitude:35,utcOffset:9,timezone:'Asia/Tokyo'}}});
 const allEvents=findMilestones(series.rows);
 for(const event of allEvents){assert.ok(event.start<=event.end);assert.equal(event.date,series.rows[event.start].date);if(event.kind==='opportunity')for(let i=event.start;i<=event.end;i++)assert.equal(series.rows[i].tone,'opportunity');if(event.kind==='caution')for(let i=event.start;i<=event.end;i++)assert.ok(series.rows[i].risk>=70);}
 const bodies=new Set(),readings=new Set(),titles=new Set(),supportKinds=new Set();let flowCount=0,contrastCount=0,turnCount=0,maxBodyLength=0;
 for(let i=0;i<series.rows.length;i++){
  const r=series.rows[i];if(r.date<'2026-10-01'||r.date>'2026-10-30')continue;
  const result=describePoint(r,readingContext(series.rows,i,series.meta));const full=result.body+result.flow.map(f=>f.text).join(' ');
  bodies.add(result.body);readings.add(full);titles.add(result.title);flowCount+=result.flow.length;
  assert.equal(result.paragraphs.join('').replace(/\s/g,''),result.body.replace(/\s/g,''),'paragraph formatting must not change or omit words');
  assert.ok(result.body.length<=380,'guidance must remain readable');maxBodyLength=Math.max(maxBodyLength,result.body.length);
  const supportSum=r.parts.daily.supportElements.reduce((n,p)=>n+p.share,0);assert.ok(Math.abs(supportSum-r.parts.daily.support)<=.500001,'support shares must come from the existing score materials');
  if(result.supportReading){supportKinds.add(result.supportReading.elements.join('/'));for(const id of result.supportReading.elements)assert.ok(r.parts.daily.supportElements.some(p=>p.element===id&&p.share>0));}
  assert.ok(result.note.includes(r.parts.daily.label));
  if(result.cause==='clash')assert.ok(r.parts.daily.clashes>0);
  if(result.cause==='friction')assert.ok(r.parts.daily.other>0);
  if(result.contrast){contrastCount++;const contrast=result.contrast;if(contrast.kind==='day-open-background-caution')assert.ok(contrast.dayScore>=70&&r.longTermScore<=35);else assert.ok(contrast.dayScore<=30&&r.longTermScore>=65);}
  for(const fact of result.flow)if(fact.kind==='local-peak'||fact.kind==='local-trough'){turnCount++;const prev=series.rows[i-1],next=series.rows[i+1];assert.ok(fact.kind==='local-peak'?r.score-prev.score>=8&&r.score-next.score>=8:prev.score-r.score>=8&&next.score-r.score>=8);}
  for(const fact of result.flow){const next=series.rows[i+1];if(fact.kind==='opening')assert.equal(next.tone,'opportunity');if(fact.kind==='easing'){assert.ok(next.score-r.score>=8);assert.ok(r.risk-next.risk>=8);}if(fact.kind.endsWith('-streak')){assert.ok(fact.days>=2&&fact.days<=7);const interval=series.rows.filter(x=>x.date>=fact.startDate&&x.date<=fact.endDate);assert.equal(interval.length,fact.days);for(const day of interval)assert.ok(fact.kind==='caution-streak'?day.risk>=70:day.tone==='opportunity');}}
  assert.doesNotMatch(full,/必ず|災難が起きる|不幸になる|15分|整える日/);
 }
 const duplicate=1-bodies.size/30;
 assert.ok(duplicate<=baseline+1e-9,`body duplication regression for ${date}: ${duplicate} > ${baseline}`);
 report.push({birth:date,days:series.rows.length,previousBodyDuplicateRate:+baseline.toFixed(3),bodyDuplicateRate:+duplicate.toFixed(3),bodyWithFlowDuplicateRate:+(1-readings.size/30).toFixed(3),titles:titles.size,flowCount,contrastCount,turnCount,supportKinds:[...supportKinds],maxBodyLength,milestones:allEvents.length});
}
console.log(JSON.stringify(report,null,2));
