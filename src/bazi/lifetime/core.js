import {calculateBazi} from '../index.js';
import {calculateYearPillar,calculateMonthPillar,calculateDayPillar} from '../calendar/index.js';
import {calculateLuckCycles,calculateAnnualLuck,calculateMonthlyLuck,buildLuckPeriod} from '../luck/index.js';
import {toLegacySchoolConfig} from '../settings/index.js';
export const VERSION='1.0.2',DAY=86400000;
export const WEIGHTS=Object.freeze({decade:.35,annual:.25,monthly:.15,daily:.25});
const clamp=n=>Math.max(0,Math.min(100,n));
export function parseCivil(value){
 const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)throw new Error('日付を確認してください。');
 const [y,m,d]=match.slice(1).map(Number),stamp=Date.UTC(y,m-1,d),date=new Date(stamp);
 if(y<1600||y>9800||date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)throw new Error('日付を確認してください。');
 return stamp;
}
export const civil=stamp=>new Date(stamp).toISOString().slice(0,10);
export function anniversary(birth,years){const d=new Date(parseCivil(birth)),y=d.getUTCFullYear()+years,m=d.getUTCMonth();return Date.UTC(y,m,Math.min(d.getUTCDate(),new Date(Date.UTC(y,m+1,0)).getUTCDate()));}
export function ageAt(birth,date){const stamp=parseCivil(date),y=new Date(stamp).getUTCFullYear()-new Date(parseCivil(birth)).getUTCFullYear();return y-(stamp<anniversary(birth,y)?1:0);}
export function cacheKey(profile,settings={}){return JSON.stringify([VERSION,profile.birthData,profile.gender||'',settings]);}
export function ratePeriod(period,favorable,unfavorable=[]){
 const total=period.elementContribution.reduce((n,x)=>n+x.value,0)||1;
 const support=100*period.elementContribution.filter(x=>favorable.includes(x.element)).reduce((n,x)=>n+x.value,0)/total;
 const rejected=100*period.elementContribution.filter(x=>unfavorable.includes(x.element)).reduce((n,x)=>n+x.value,0)/total;
 const r=period.relationToChart,clashes=(r.stems.clashes?.length||0)+(r.branches.clashes?.length||0),other=(r.branches.harms?.length||0)+(r.branches.punishments?.length||0)+(r.branches.selfPunishments?.length||0)+(r.branches.destructions?.length||0);
 const caution=clamp(rejected+clashes*18+other*10);
 return {label:period.label,support:Math.round(support),caution:Math.round(caution),score:Math.round(clamp(50+(support-caution)/2)),clashes,other,tenGod:period.tenGod?.kanji||'',warnings:period.warnings||[]};
}
export function createCalculator(profile,settings={}){
 const birth=profile?.birthData?.date;parseCivil(birth);
 const result=calculateBazi({...profile,baziSettings:settings}),config=toLegacySchoolConfig(result.baziSettings),luck=calculateLuckCycles(result,profile,{...config,cycleCount:11}),favorable=result.favorableElements.favorable,unfavorable=result.favorableElements.unfavorable;
 const annual=new Map(),monthly=new Map(),daily=new Map(),decades=luck.cycles.map(x=>({...x,rating:ratePeriod(x,favorable,unfavorable)}));
 return {birth,end:civil(anniversary(birth,100)),meta:{version:VERSION,weights:WEIGHTS,timeBasis:'各日正午・日本時間',birthTimeUnknown:!!result.normalizedInput?.timeUnknown,direction:luck.direction,directionDefault:luck.directionBasis?.usedDefault||false,startDate:luck.startDate,confidence:luck.confidence,favorable,unfavorable,warnings:luck.warnings,model:'五行の適合割合と命式の冲・害・刑・破を重ねた参考指標。既存の総合点とは別の表示モデル。'},point(date){
  const stamp=parseCivil(date);if(stamp<parseCivil(birth)||stamp>anniversary(birth,100))throw new Error('誕生から100歳の誕生日までの日付を選んでください。');
  // Civil days are sampled at JST noon, independent of the execution host timezone.
  const instant=new Date(stamp+3*3600000);
  const yp=calculateYearPillar(instant),mp=calculateMonthPillar(instant,yp.stem.id),dp=calculateDayPillar(instant),ak=yp.pillarYear,mk=ak+'/'+mp.label;
  if(!annual.has(ak))annual.set(ak,ratePeriod(calculateAnnualLuck(result,instant,config),favorable,unfavorable));
  if(!monthly.has(mk))monthly.set(mk,ratePeriod(calculateMonthlyLuck(result,instant,config),favorable,unfavorable));
  if(!daily.has(dp.label))daily.set(dp.label,ratePeriod(buildLuckPeriod(result,dp,{scope:'daily',schoolId:config.schoolId}),favorable,unfavorable));
  const decade=decades.find(x=>instant>=new Date(x.startDate)&&instant<=new Date(x.endDate)),parts={decade:decade?.rating||null,annual:annual.get(ak),monthly:monthly.get(mk),daily:daily.get(dp.label)};
  let support=0,caution=0,weight=0;for(const [key,p]of Object.entries(parts))if(p){support+=p.support*WEIGHTS[key];caution+=p.caution*WEIGHTS[key];weight+=WEIGHTS[key];}
  support=Math.round(support/weight);caution=Math.round(caution/weight);
  return {date,age:ageAt(birth,date),support,caution,score:Math.round(clamp(50+(support-caution)/2)),preLuck:!decade,parts};
 }};
}
export async function buildSeries(profile,settings={},options={}){
 const calc=createCalculator(profile,settings),start=parseCivil(calc.birth),end=parseCivil(calc.end),rows=[],count=(end-start)/DAY+1;
 for(let i=0;i<count;i++){
  if(options.cancelled?.())throw new Error('計算を中止しました。');rows.push(calc.point(civil(start+i*DAY)));
  if(i%256===255){options.progress?.((i+1)/count);await new Promise(resolve=>setTimeout(resolve,0));}
 }
 options.progress?.(1);return {key:cacheKey(profile,settings),birth:calc.birth,end:calc.end,meta:calc.meta,rows};
}
export function aggregate(rows,maxPoints=600){
 if(!Number.isInteger(maxPoints)||maxPoints<1)throw new Error('表示点数が不正です。');
 const width=Math.max(1,Math.ceil(rows.length/maxPoints)),groups=[];
 for(let start=0;start<rows.length;start+=width){const slice=rows.slice(start,start+width),sum=key=>slice.reduce((n,x)=>n+x[key],0)/slice.length;
  groups.push({start,end:start+slice.length-1,date:slice[0].date,lastDate:slice.at(-1).date,score:sum('score'),support:sum('support'),caution:sum('caution'),min:Math.min(...slice.map(x=>x.score)),max:Math.max(...slice.map(x=>x.score))});
 }return groups;
}
export function describePoint(point){
 const names={decade:'長期',annual:'その年',monthly:'その月',daily:'その日'},parts=Object.entries(point.parts).filter(([,p])=>p);
 const lead=point.caution>=40?'後押しがある部分も、負担のある条件も、分けて見たい日。':point.support>=55?'使える準備やつながりに、目を向けたい日。':'何を選びたいか、今ある材料から考える日。';
 const action=point.age<13?'本人への行動指示ではなく、周囲の見守りや生活環境を考える参考にしてください。':point.caution>=40?'期待に応えるためだけに、引き受けるものを増やさなくて大丈夫。続けたいことのために、担える範囲を伝えてみて。':'進む量だけでなく、自分が大切にしたい方向も理由にしてみてください。未確認の条件や相手の意思は、現実の情報から確かめましょう。';
 return {title:lead,body:action,evidence:parts.map(([key,p])=>({scope:names[key],...p})),note:point.preLuck?'大運が始まる前のため、年・月・日の材料で計算しています。':'長期・年・月・日の材料を同じ計算から表示しています。'};
}
