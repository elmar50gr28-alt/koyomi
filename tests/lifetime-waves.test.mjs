import assert from 'node:assert/strict';
import {buildSeries,combinePeriods,describePoint,selectElements} from '../src/bazi/lifetime/core.js';
import {chartScale,periodExtrema,validSeries} from '../src/ui/lifetime-chart.js';

const p=(support,caution)=>({support,caution,label:'甲子',tenGod:'正官'});
const parts=(s,c,bs,bc)=>({daily:p(s,c),annual:p(bs,bc),monthly:p(bs,bc),decade:p(bs,bc)});
assert.equal(combinePeriods(parts(100,0,0,100)).score,75,'good background cannot erase a difficult day, or the reverse');
assert.equal(combinePeriods(parts(0,100,100,0)).score,25);
assert.equal(combinePeriods(parts(100,0,100,0)).score,100);
assert.equal(combinePeriods(parts(0,100,0,100)).score,0);
assert.equal(combinePeriods(parts(90,90,90,90)).tone,'mixed','strong caution must survive a neutral net score');
assert.equal(combinePeriods(parts(0,100,100,0)).tone,'caution');
assert.equal(combinePeriods(parts(100,0,0,100)).tone,'opportunity');
assert.equal(combinePeriods(parts(0,60,50,20)).tone,'careful');
assert.equal(combinePeriods({...parts(100,0,0,100),decade:null}).score,75,'daily share remains 75% before luck begins');
assert.deepEqual(combinePeriods(parts(100,100,100,100)).agreement,{support:8,caution:8});
assert.deepEqual(chartScale([{score:55},{score:58}]),{min:50,max:70,ticks:[50,60,70]});
assert.deepEqual(chartScale([{score:0},{score:100}]).ticks,[0,30,60,90,100]);
assert.deepEqual(periodExtrema([{score:30},{score:90},{score:20}]),{low:2,high:1});
assert.deepEqual(chartScale([{score:55}],['score'],false),{min:0,max:100,ticks:[0,25,50,75,100]});
assert.deepEqual(selectElements({yongshen:{favorableElements:['water','regular-zheng_guan'],unfavorableElements:['water'],avoidElements:['fire']},favorableElements:{favorable:['wood','fire','earth','metal','water'],unfavorable:[]}}).favorable,[],'opposing candidates are neutral, and pattern names are not elements');
assert.equal(chartScale(Array.from({length:36526},()=>({score:60,support:100,caution:0})),['score','support','caution']).max,100,'century with three lines must avoid argument-stack overflow');

const report=[];
for(const [date,gender] of [['2000-02-29','male'],['1995-11-23','female'],['1982-07-15','male'],['1970-01-01','female']]){
 const series=await buildSeries({gender,birthData:{date,time:'12:00',timeUnknown:false,place:{longitude:135,latitude:35,utcOffset:9,timezone:'Asia/Tokyo'}}});
 assert.ok(validSeries(series,series.key));
 let min=100,max=0,delta=0,oldDelta=0,count=0;const tones={};
 const old=r=>{let s=0,c=0,w=0;for(const [k,p]of Object.entries(r.parts))if(p){const q={decade:.35,annual:.25,monthly:.15,daily:.25}[k];s+=p.support*q;c+=p.caution*q;w+=q;}return Math.round(50+(Math.round(s/w)-Math.round(c/w))/2);};
 for(let i=0;i<series.rows.length;i++){
  const r=series.rows[i];for(const k of ['score','longTermScore','opportunity','risk'])assert.ok(r[k]>=0&&r[k]<=100);
  min=Math.min(min,r.score);max=Math.max(max,r.score);tones[r.tone]=(tones[r.tone]||0)+1;
  if(i){delta+=Math.abs(r.score-series.rows[i-1].score);oldDelta+=Math.abs(old(r)-old(series.rows[i-1]));count++;}
 }
 assert.ok(delta>oldDelta*1.5,'daily contrast should increase on real material, not only artificial fixtures');
 const days=series.rows.filter(r=>r.date>='2026-10-01'&&r.date<='2026-10-30');
 assert.equal(days.length,30);
 const titles=new Set(),texts=new Set(),bodies=new Set();
 for(const day of days){
  const text=describePoint(day);titles.add(text.title);texts.add(text.body+' '+text.note);bodies.add(text.body);
  assert.ok(text.note.includes(day.parts.daily.label));
  if(day.tone==='caution')assert.match(text.title,/急がない/);
  if(day.tone==='opportunity')assert.ok(day.opportunity>=75&&day.risk<40);
  if(day.tone==='mixed')assert.ok(day.opportunity>=60&&day.risk>=60);
  assert.doesNotMatch(text.body,/必ず|災難が起きる|不幸になる/);
 }
 assert.ok(texts.size>15,'30-day explanations must retain distinct day materials');
 report.push({birth:date,days:series.rows.length,min,max,meanDailyChange:+(delta/count).toFixed(2),previousWeightMeanChange:+(oldDelta/count).toFixed(2),tones,thirtyDayTitles:titles.size,thirtyDayBodyDuplicateRate:+(1-bodies.size/30).toFixed(3),thirtyDayExactDuplicateRate:+(1-texts.size/30).toFixed(3)});
}
console.log(JSON.stringify(report,null,2));
