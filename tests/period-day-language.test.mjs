import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const context={};vm.createContext(context);
for(const file of ['app-narrative-engine.js','method-interpretation.js','reading-keepsake.js'])vm.runInContext(await readFile('src/reading/'+file,'utf8'),context);
vm.runInContext(await readFile('src/persona/conversation-adapter.js','utf8'),context);
const interpret=context.KOYOMI_METHOD_INTERPRETATION.interpret,adapter=context.KOYOMI_PERSONA_ADAPTER;
const inputFor=(long,year,today,methodId='shichu',domain='work',fit=0)=>({methodId,domain,date:'2026-09-01',evidence:[`大運${long}`,`流年${year}`,`選択日${today}`,`日五行→用神補正${fit}`],score:55,confidence:80,action:'条件を確かめてから返事をして。',generatedAction:true,psychRisk:0,mode:'sister',level:'beginner'});
let cases=0;const metrics=[],samples=[];
for(const methodId of ['shichu','timing'])for(const long of [30,55,85])for(const year of [30,55,85])for(const today of [30,55,85])for(const domain of ['work','relationship','money','health','overall']){
 const initial=interpret(inputFor(long,year,today,methodId,domain)),bodies=new Set(),actions=new Set();let previous='';
 const direction=today<45?'protect':today<68||long<45||year<45?'test':'forward';
 for(let day=1;day<=30;day++){
  const input={...inputFor(long,year,today,methodId,domain),date:`2026-09-${String(day).padStart(2,'0')}`},before=JSON.stringify(input),parsed=interpret(input);
  assert.equal(parsed.story.timeFocus.direction,direction);assert.equal(parsed.story.livingContext.direction,direction);
  assert.equal(parsed.story.readingBody,initial.story.readingBody);assert.equal(parsed.key,initial.key);
  assert.ok(parsed.story.readingBody.includes(parsed.story.timeFocus.body));assert.notEqual(parsed.story.body,previous);previous=parsed.story.body;
  assert.ok(parsed.story.readingBody.startsWith(parsed.story.timeFocus.body));assert.equal(parsed.story.title,parsed.story.timeFocus.title);
  bodies.add(parsed.story.body);actions.add(parsed.story.invitation);
  for(const mode of ['sister','zubat']){const out=adapter.applyDivination('資料',{...input,mode});assert.equal(out.narrative.quality.pass,true,`${methodId}/${long}/${year}/${today}/${domain}: ${out.narrative.quality.issues}`);assert.ok(out.text.includes(parsed.story.invitation));cases++;}
  assert.equal(JSON.stringify(input),before);
 }
 assert.equal(bodies.size,30);assert.equal(actions.size,3);metrics.push({methodId,long,year,today,domain,distinctBodies:30,distinctActions:3});
 if(methodId==='shichu'&&long===85&&year===30&&domain==='work')samples.push({today,text:adapter.applyDivination('資料',inputFor(long,year,today)).text});
}
for(const today of [0,44,45,67,68,100])for(const fit of [-5,0,5]){
 const parsed=interpret(inputFor(85,85,today,'shichu','work',fit));assert.equal(parsed.story.timeFocus.direction,today<45?'protect':today<68||fit<0?'test':'forward');
 assert.equal(adapter.applyDivination('資料',inputFor(85,85,today,'shichu','work',fit)).narrative.quality.pass,true);
}
for(const patch of [{evidence:['大運85','流年30']},{evidence:['大運85','流年30','選択日101']},{evidence:['大運85','流年30','選択日55','選択日30']}])assert.equal(interpret({...inputFor(85,30,55),...patch}).story.timeFocus,null);
const missing=interpret({...inputFor(85,30,55),evidence:['選択日55']});assert.deepEqual(Array.from(missing.story.timeFocus.backgroundCautions),[]);assert.doesNotMatch(missing.story.timeFocus.body,/今年に後押しがあります|長期には前/);
const fromAssets=interpret({...inputFor(85,30,55,'timing'),evidence:['大運甲子','流年乙丑','選択日55'],interpretationAssets:[{basis:'大運85'},{basis:'流年30'}]});assert.equal(fromAssets.story.timeFocus.direction,'test');
const app=await readFile('app.html','utf8'),expression=app.match(/key==='timing'&&r.luck\?(\[.+?\]):key==='kyusei'/)[1];
for(const today of [30,55,85]){
 const productionAssets=vm.runInNewContext(expression,{r:{luck:{current:{score:85},annual:{score:30}}},dailySignal:()=>({score:today}),selectedDate:new Date(2026,8,1)});
 const production=interpret({...inputFor(85,30,today,'timing'),evidence:['大運甲子','流年乙丑',`日付の表示${today}`],interpretationAssets:productionAssets});
 assert.ok(production.story.timeFocus);assert.equal(production.story.timeFocus.basis,'選択日'+today);assert.equal(production.story.timeFocus.direction,today===30?'protect':'test');
}
for(const patch of [{confidence:20},{psychRisk:80},{action:'必要な受診を相談して。'}])assert.notEqual(adapter.applyDivination('資料',{...inputFor(85,30,55),...patch}).narrative.structure,'symbolic-story');
assert.ok(adapter.applyDivination('資料',{...inputFor(85,30,55),generatedAction:false,action:'指定した行動を保持する'}).text.includes('指定した行動を保持する'));
const dayReadings=[30,55,85].map(today=>interpret(inputFor(85,30,today)).story.readingBody);assert.equal(new Set(dayReadings).size,3,'the same long/year contrast must not hide a changed day');
if(process.env.KOYOMI_PERIOD_REPORT)await writeFile(process.env.KOYOMI_PERIOD_REPORT,JSON.stringify({cases,metrics,samples},null,2));
console.log(`Period/day language: ${cases} renders; 270 sequences × 30 days; daily priority, boundaries, corrections, missing/safety checks passed.`);
