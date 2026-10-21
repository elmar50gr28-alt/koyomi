import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const context={};vm.createContext(context);
for(const file of ['app-narrative-engine.js','method-interpretation.js','reading-keepsake.js'])vm.runInContext(await readFile('src/reading/'+file,'utf8'),context);
vm.runInContext(await readFile('src/persona/conversation-adapter.js','utf8'),context);
const app=await readFile('app.html','utf8');
vm.runInContext(app.split(/\r?\n/).find(x=>x.startsWith('const ROKUSEI_MEAN=')),context);
const meanings=vm.runInContext('ROKUSEI_MEAN',context),stages=Object.keys(meanings);
assert.equal(stages.length,12);
const expression=app.match(/key==='rokusei'\?(method\.factors\.slice\(0,2\)\.map\(.+?\)):undefined/)[1];
const scoreMap=vm.runInContext('('+app.match(/if\(key==='rokusei'\).*?,map=(\{[^}]+\})/)[1]+')',context);
const expected={種子:['test','choice'],緑生:['forward','grow'],立花:['forward','grow'],健弱:['protect','rest'],達成:['forward','start'],乱気:['protect','choice'],再会:['test','grow'],財成:['forward','grow'],安定:['forward','grow'],陰影:['protect','choice'],停止:['protect','rest'],減退:['protect','release']};
function inputFor(year,month,domain='work',date='2026-10-13'){
 context.method={factors:[...(year?['年運'+year]:[]),...(month?['月運'+month]:[])]};
 return {methodId:'rokusei',domain,confidence:80,score:year&&month?scoreMap[year]*.7+scoreMap[month]*.3:scoreMap[year||month],date,evidence:[...context.method.factors],interpretationAssets:vm.runInContext(expression,context),generatedAction:true,action:'従来の自動助言'};
}
const interpret=context.KOYOMI_METHOD_INTERPRETATION.interpret,adapter=context.KOYOMI_PERSONA_ADAPTER,keepsake=context.KOYOMI_READING_KEEPSAKE;
let combinationCases=0,continuousCases=0;const samples=[],metrics=[];
for(const year of stages)for(const month of stages){
 const input=inputFor(year,month),before=JSON.stringify(input),parsed=interpret(input),period=parsed.story.periodFocus;
 const direction=expected[month][0]==='protect'?'protect':expected[year][0]==='protect'&&expected[month][0]==='forward'?'test':expected[month][0];
 assert.equal(period.direction,direction);assert.equal(period.year,year);assert.equal(period.month,month);
 assert.equal(parsed.story.livingContext.direction,direction);
 assert.equal(parsed.items.find(x=>x.basis==='年運'+year).kind,{forward:'support',test:'neutral',protect:'caution'}[expected[year][0]]);
 assert.equal(parsed.items.find(x=>x.basis==='月運'+month).kind,{forward:'support',test:'neutral',protect:'caution'}[expected[month][0]]);
 for(const mode of ['sister','zubat']){
  const out=adapter.applyDivination('計算済み資料',{...input,mode}),story=keepsake.decorate({...input,mode},parsed);
  assert.equal(out.narrative.quality.pass,true,year+'/'+month+': '+out.narrative.quality.issues);
  assert.equal(out.narrative.structure,'symbolic-story');assert.equal(story.axis,period.axis);
  for(const word of [year,month,meanings[year],meanings[month]])assert.ok(out.text.includes(word));
  assert.match(out.text,/本アプリ独自の近似周期による参考読みです/);
  assert.ok(out.text.includes(parsed.story.invitation));
  assert.equal(out.text,adapter.applyDivination('計算済み資料',{...input,mode}).text);
  assert.equal(JSON.stringify(input),before);combinationCases++;
 }
 if((year==='達成'&&month==='停止')||(year==='停止'&&month==='達成'))samples.push({year,month,text:adapter.applyDivination('計算済み資料',input).text});
}
for(const stage of stages)for(const domain of ['work','relationship','money']){
 const bodies=new Set(),actions=new Set(),initial=interpret(inputFor(stage,stage,domain));let last='';
 for(let day=1;day<=30;day++){
  const input=inputFor(stage,stage,domain,`2026-09-${String(day).padStart(2,'0')}`),parsed=interpret(input);
  assert.equal(parsed.key,initial.key);assert.equal(parsed.story.readingBody,initial.story.readingBody);
  assert.equal(parsed.story.title,initial.story.title);assert.notEqual(parsed.story.body,last);last=parsed.story.body;
  bodies.add(parsed.story.body);actions.add(parsed.story.invitation);
  for(const mode of ['sister','zubat']){
   const out=adapter.applyDivination('計算済み資料',{...input,mode});
   assert.equal(out.narrative.quality.pass,true,stage+'/'+domain+'/'+day+': '+out.narrative.quality.issues);
   assert.ok(out.text.includes(parsed.story.invitation));continuousCases++;
  }
 }
 assert.equal(bodies.size,30);assert.equal(actions.size,3);
 metrics.push({stage,domain,days:30,distinctBodies:bodies.size,distinctActions:actions.size});
}
for(const [year,month]of [['達成','停止'],['停止','達成'],['減退','安定'],['安定','陰影']])for(let day=1;day<=30;day++){
 const input=inputFor(year,month,'relationship',`2026-09-${String(day).padStart(2,'0')}`),out=adapter.applyDivination('計算済み資料',input);
 assert.equal(out.narrative.quality.pass,true);assert.doesNotMatch(out.text,/必ず戻|必ず成功|退職しなさい|別れなさい|病気になる/);
}
for(const period of ['年運','月運'])for(const stage of stages){
 const input=inputFor(period==='年運'?stage:'',period==='月運'?stage:''),parsed=interpret(input);
 assert.ok(parsed.story.periodFocus);assert.equal(parsed.story.periodFocus[period==='年運'?'month':'year'],'','missing periods cannot be invented');
 assert.equal(parsed.story.periodFocus.direction,expected[stage][0]);
}
for(const assets of [[{basis:'月運停止',meaning:'未知の意味'}],[{basis:'月運constructor',meaning:'未知'}],[{basis:'月運停止',meaning:meanings.停止},{basis:'月運達成',meaning:meanings.達成}]]){
 const parsed=interpret({...inputFor('達成','停止'),interpretationAssets:assets});assert.equal(parsed.story.periodFocus,null);assert.equal(parsed.story.profileFocus,null);
}
const explicit=adapter.applyDivination('計算済み資料',{...inputFor('停止','停止'),generatedAction:false,action:'本人が指定した相談を保持する'});assert.ok(explicit.text.includes('本人が指定した相談を保持する'));
const editable=interpret(inputFor('停止','停止')),unchanged=editable.story.invitation;editable.story.periodFocus.row[5][0]='出力側で変更';
assert.equal(interpret(inputFor('停止','停止')).story.invitation,unchanged,'editing a returned model cannot change the source bank');
for(const extra of [{confidence:20},{psychRisk:95},{generatedAction:false,action:'医療機関へ相談する'}])assert.notEqual(adapter.applyDivination('計算済み資料',{...inputFor('達成','達成'),...extra}).narrative.structure,'symbolic-story');
context.$=()=>null;context.clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
context.v191zEphemerisActive=()=>false;
vm.runInContext(await readFile('src/reading/calculation-readiness.js','utf8'),context);
vm.runInContext(app.slice(app.indexOf('function v191zConfidence('),app.indexOf('function v191zElementRelation(')),context);
const actualConfidence=context.v191zConfidence({i:{birthDate:new Date(1990,5,15)}},'rokusei');assert.equal(actualConfidence.score,35);assert.equal(actualConfidence.label,'独自参考');assert.equal(actualConfidence.predictiveAccuracy,null);
let referenceCases=0;const referenceTexts=new Map();
for(const stage of stages)for(const domain of ['work','relationship','money'])for(let day=1;day<=30;day++){
 const input={...inputFor(stage,stage,domain,`2026-09-${String(day).padStart(2,'0')}`),confidence:actualConfidence.score},before=JSON.stringify(input),parsed=interpret(input);
 for(const mode of ['sister','zubat']){
  const out=adapter.applyDivination('計算済み資料',{...input,mode});
  assert.notEqual(out.narrative.structure,'symbolic-story','the actual low confidence cannot be upgraded to ordinary poetic rendering');
  assert.equal(out.narrative.quality.pass,true,stage+'/'+domain+'/'+day+': '+out.narrative.quality.issues);
  assert.ok(out.text.includes(parsed.story.title));assert.ok(out.text.includes(parsed.cycleGuidance.action));
  assert.match(out.text,/確定した見通しではなく/);assert.match(out.text,/本アプリ独自の近似周期/);
  assert.equal(out.narrative.vocabulary.direction,expected[stage][0]==='protect'?'protect':'test');
  assert.equal(out.keepsake,null);assert.equal(JSON.stringify(input),before);referenceCases++;
  const key=stage+'|'+domain+'|'+mode,texts=referenceTexts.get(key)||new Set();texts.add(out.text);referenceTexts.set(key,texts);
 }
}
for(const [key,texts]of referenceTexts)assert.equal(texts.size,30,'actual-confidence consecutive readings remain distinct: '+key);
for(const year of stages)for(const month of stages){
 const input={...inputFor(year,month),confidence:actualConfidence.score},parsed=interpret(input),out=adapter.applyDivination('計算済み資料',input);
 assert.equal(out.narrative.quality.pass,true);assert.ok(out.text.includes(parsed.cycleGuidance.action));
 assert.equal(out.narrative.vocabulary.direction,parsed.story.periodFocus.direction==='protect'?'protect':'test');
}
const objectConfidence=adapter.applyDivination('計算済み資料',{...inputFor('達成','達成'),confidence:{score:38}});
assert.equal(objectConfidence.narrative.vocabulary.direction,'test');assert.notEqual(objectConfidence.narrative.structure,'symbolic-story');
const referenceExplicit=adapter.applyDivination('計算済み資料',{...inputFor('停止','停止'),confidence:38,generatedAction:false,action:'本人の指定した行動を保持する'});assert.ok(referenceExplicit.text.includes('本人の指定した行動を保持する'));
samples.push({year:'達成',month:'停止',confidence:38,text:adapter.applyDivination('計算済み資料',{...inputFor('達成','停止'),confidence:38}).text});
if(process.env.KOYOMI_CYCLE_REPORT)await writeFile(process.env.KOYOMI_CYCLE_REPORT,JSON.stringify({combinationCases,continuousCases,referenceCases,actualConfidence,metrics,samples},null,2));
console.log(`Cycle language: ${combinationCases} mixed-period renders, ${continuousCases} continuous renders, ${referenceCases} actual-confidence renders, missing/unknown/safety/explicit-action checks`);
