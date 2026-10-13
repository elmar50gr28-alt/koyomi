import {calculateBazi} from '../index.js';
import {calculateYearPillar,calculateMonthPillar,calculateDayPillar} from '../calendar/index.js';
import {calculateLuckCycles,calculateAnnualLuck,calculateMonthlyLuck,buildLuckPeriod} from '../luck/index.js';
import {toLegacySchoolConfig} from '../settings/index.js';
export const VERSION='2.0.0',DAY=86400000;
export const WEIGHTS=Object.freeze({decade:.10,annual:.0875,monthly:.0625,daily:.75});
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
// Background is normalized separately so a missing decade never changes the daily share.
export function combinePeriods(parts){
 let support=0,caution=0,weight=0;
 for(const key of ['decade','annual','monthly']){const p=parts[key];if(p){support+=p.support*WEIGHTS[key];caution+=p.caution*WEIGHTS[key];weight+=WEIGHTS[key];}}
 const background={support:support/weight,caution:caution/weight};
 const d=parts.daily;
 // Reinforce agreement once per direction; multiple copies of the same relation are not added.
 const supportAgreement=d.support>=60&&background.support>=60?8:0;
 const cautionAgreement=d.caution>=60&&background.caution>=60?8:0;
 support=Math.round(clamp(d.support*.75+background.support*.25+supportAgreement));
 caution=Math.round(clamp(d.caution*.75+background.caution*.25+cautionAgreement));
 const opportunity=support,risk=caution,score=Math.round(clamp(50+(support-caution)/2));
 const tone=opportunity>=60&&risk>=60?'mixed':risk>=70?'caution':opportunity>=75&&risk<40?'opportunity':risk>=45?'careful':opportunity>=55&&risk<45?'rising':'steady';
 return {support,caution,opportunity,risk,score,longTermScore:Math.round(clamp(50+(background.support-background.caution)/2)),tone,agreement:{support:supportAgreement,caution:cautionAgreement}};
}
export function selectElements(result){
 const elements=['wood','fire','earth','metal','water'],y=result.yongshen||{};
 const favorable=(Array.isArray(y.favorableElements)?y.favorableElements:result.favorableElements.favorable).filter(x=>elements.includes(x));
 const rejected=[...(Array.isArray(y.unfavorableElements)?y.unfavorableElements:result.favorableElements.unfavorable),...(y.avoidElements||[])].filter(x=>elements.includes(x));
 const conflicts=favorable.filter(x=>rejected.includes(x));
 return {favorable:[...new Set(favorable.filter(x=>!conflicts.includes(x)))],unfavorable:[...new Set(rejected.filter(x=>!conflicts.includes(x)))],elementConflicts:conflicts,elementConfidence:y.confidence??null,elementProvisional:!y.primaryYongshen};
}
export function createCalculator(profile,settings={}){
 const birth=profile?.birthData?.date;parseCivil(birth);
 const result=calculateBazi({...profile,baziSettings:settings}),config=toLegacySchoolConfig(result.baziSettings),luck=calculateLuckCycles(result,profile,{...config,cycleCount:11}),selection=selectElements(result),{favorable,unfavorable}=selection;
 const annual=new Map(),monthly=new Map(),daily=new Map(),decades=luck.cycles.map(x=>({...x,rating:ratePeriod(x,favorable,unfavorable)}));
 return {birth,end:civil(anniversary(birth,100)),meta:{version:VERSION,weights:WEIGHTS,...selection,timeBasis:'各日正午・日本時間',birthTimeUnknown:!!result.normalizedInput?.timeUnknown,direction:luck.direction,directionDefault:luck.directionBasis?.usedDefault||false,startDate:luck.startDate,confidence:luck.confidence,warnings:luck.warnings,model:'精密用神判定の五行候補と命式の冲・害・刑・破を重ねた参考指標。既存の総合点とは別の表示モデル。'},point(date){
  const stamp=parseCivil(date);if(stamp<parseCivil(birth)||stamp>anniversary(birth,100))throw new Error('誕生から100歳の誕生日までの日付を選んでください。');
  // Civil days are sampled at JST noon, independent of the execution host timezone.
  const instant=new Date(stamp+3*3600000);
  const yp=calculateYearPillar(instant),mp=calculateMonthPillar(instant,yp.stem.id),dp=calculateDayPillar(instant),ak=yp.pillarYear,mk=ak+'/'+mp.label;
  if(!annual.has(ak))annual.set(ak,ratePeriod(calculateAnnualLuck(result,instant,config),favorable,unfavorable));
  if(!monthly.has(mk))monthly.set(mk,ratePeriod(calculateMonthlyLuck(result,instant,config),favorable,unfavorable));
  if(!daily.has(dp.label))daily.set(dp.label,ratePeriod(buildLuckPeriod(result,dp,{scope:'daily',schoolId:config.schoolId}),favorable,unfavorable));
  const decade=decades.find(x=>instant>=new Date(x.startDate)&&instant<=new Date(x.endDate)),parts={decade:decade?.rating||null,annual:annual.get(ak),monthly:monthly.get(mk),daily:daily.get(dp.label)};
  return {date,age:ageAt(birth,date),...combinePeriods(parts),preLuck:!decade,parts};
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
  groups.push({start,end:start+slice.length-1,date:slice[0].date,lastDate:slice.at(-1).date,score:sum('score'),longTermScore:sum('longTermScore'),longMin:Math.min(...slice.map(x=>x.longTermScore)),longMax:Math.max(...slice.map(x=>x.longTermScore)),support:sum('support'),caution:sum('caution'),min:Math.min(...slice.map(x=>x.score)),max:Math.max(...slice.map(x=>x.score))});
 }return groups;
}
export function describePoint(point){
 const names={decade:'長期',annual:'その年',monthly:'その月',daily:'その日'},parts=Object.entries(point.parts).filter(([,p])=>p);
 const tone=point.tone||'steady',d=point.parts.daily;
 const readings={
  opportunity:['今日は、準備してきたことを前へ。','温めていた提案や連絡があるなら、自分から声をかけてみて。進めたい気持ちを大切にしつつ、相手の返事と実際の条件は確かめてください。'],
  caution:['今日は、大きな約束を急がないこと。','期待に応えようとして、抱えきれないものまで引き受けないで。返事をする前に、期限と負担を確認してください。待つ判断も、自分を守る力です。'],
  mixed:['進める力はある。けれど、条件を飛ばさないで。','話を持ちかけることと、その場で約束することは分けましょう。手応えがあっても、期限や役割まで確かめてから決めて。'],
  steady:['今日は、いつもの歩みを大切に。','大きな結果を急いで作らなくても大丈夫。すでに続けていることに目を向けて、無理なく取り組める範囲を選んでください。']
 };
 readings.careful=['今日は、引き受ける前に一呼吸。','すぐに返事をするより、期限と自分の余力を確認して。気がかりな条件を一つでも言葉にできれば、無理を重ねずに済みます。'];
 readings.rising=['今日は、気になっていたことへ手を伸ばして。','今ある準備を使って、話を聞く、連絡する、提案をまとめるところから動いてみて。まだ決めきれない条件は、先に確認しておきましょう。'];
 const [lead,adult]=readings[tone];
 const action=point.age<13?'本人への行動指示ではなく、周囲の見守りや生活環境を考える参考にしてください。安心して過ごせる余裕を、周囲の大人が用意してあげて。':adult;
 const scenes={比肩:'自分の役割と、譲りたくない条件',劫財:'共同作業での分担や、お金の負担',食神:'日々の暮らしの楽しみや、自分らしい表現',傷官:'伝えたい意見と、その伝え方',偏財:'人とのやり取りや、出入りするお金',正財:'日々の支出や、続けている仕事',七殺:'急な依頼や、責任の重い用事',偏官:'急な依頼や、責任の重い用事',正官:'役割と約束、守るべき手順',偏印:'調べたいことや、新しい見方',印綬:'学びや、支えてくれる人とのつながり',正印:'学びや、支えてくれる人とのつながり'};
 const scene=point.age>=13&&scenes[d.tenGod]?` 今日の${d.tenGod}は、${scenes[d.tenGod]}を考える象徴です。実際の予定に当てはめてみてください。`:'';
 const reason=`その日（${d.label}）の後押し${d.support}・注意${d.caution}を主役に、年・月${point.preLuck?'':'・長期'}の背景を合わせた読みです。`;
 const agreement=point.agreement?.caution?'注意の材料が背景にも重なっています。':point.agreement?.support?'後押しの材料が背景にも重なっています。':'背景との重なりによる加点はありません。';
 return {title:point.age<13?'この日の環境と見守りの目安':lead,body:action+scene,evidence:parts.map(([key,p])=>({scope:names[key],...p})),note:reason+' '+agreement+(point.preLuck?' 大運が始まる前のため、背景は年・月で計算しています。':'')};
}
