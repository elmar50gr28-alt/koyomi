import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const store=new Map(),ctx={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
for(const f of ['reading/daily/daily-reading-core.js','reading/app-narrative-engine.js','reading/method-interpretation.js','reading/reading-keepsake.js','reading/method-reading-continuity.js','persona/conversation-adapter.js'])vm.runInNewContext(await readFile('src/'+f,'utf8'),ctx);
let count=0,maxLength=0;const samples=[],variants=new Map();
for(const methodId of ['shichu','timing'])for(const domain of ['work','relationship','money','overall'])for(const long of [30,55,85])for(const year of [30,55,85])for(const day of [30,55,85]){
 store.clear();const texts=new Set(),details=new Set(),spokenBodies=new Set();
 for(let d=1;d<=30;d++){
  const input={methodId,domain,score:85,confidence:80,generatedAction:true,profileId:`${methodId}-${domain}-${long}-${year}-${day}`,date:`2026-01-${String(d).padStart(2,'0')}`,evidence:[`大運${long}`,`流年${year}`,`選択日${day}`]};
  const source=ctx.KOYOMI_METHOD_INTERPRETATION.interpret(input).story;
  const detail=source.presentation.timeLife;
  spokenBodies.add(source.presentation.conversation.body);
  assert.doesNotMatch(source.presentation.conversation.body,/読みです|進める材料|条件確認の材料|時期の違いを重ね/);
  assert.ok(source.presentation.conversation.body.length<400,'the main reading should be readable without stacked commentary');
  if(long===85&&year===85&&day===30)assert.match(detail.text,/長期と今年には進める材料/);
  if(day===85&&(long===30||year===30))assert.match(detail.text,/長く続ける約束を分ける/);
  if(day===55&&(long===30||year===30))assert.match(detail.text,/長く背負う負担は増やさず/);
  assert.equal(detail.domain,domain);assert.equal(detail.scene,source.livingContext.scene);
  assert.deepEqual(JSON.parse(JSON.stringify(detail.signals)),JSON.parse(JSON.stringify(ctx.KOYOMI_METHOD_INTERPRETATION.interpret(input).items.filter(x=>['選択日','流年','大運','day-fit'].includes(x.id)).map(({id,basis,kind})=>({id,basis,kind})))));
  details.add(detail.text);variants.set(detail.variantId,detail);
  assert.equal(detail.mode,day===30?'protect':day===55?'test':long===30||year===30?'mixed':'forward');
  assert.equal(source.presentation.body,source.livingContext.body,'daily opening remains variable');
  assert.ok(source.presentation.background.startsWith(source.readingBody));
  const out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);
  assert.equal(out.narrative.quality.pass,true,out.narrative.quality.issues.join(','));
  assert.ok(out.text.length<900,'standard readings must not accumulate the full source commentary');
  assert.ok(out.text.includes(detail.spoken));assert.ok(out.text.includes(detail.explanation));
  assert.equal(out.text.split(detail.spoken).length-1,1);
  assert.ok(out.text.indexOf(detail.explanation)<out.text.indexOf('【今日の一歩】'));
  assert.equal(ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input).text,out.text);
  texts.add(out.text);count++;maxLength=Math.max(maxLength,out.text.length);
  if(methodId==='shichu'&&long===85&&year===30&&day===85&&d===1)samples.push({domain,text:out.text});
 }
 assert.equal(texts.size,30,'30 complete daily readings must remain distinct');
 assert.equal(spokenBodies.size,9,'all nine concrete situations must vary the spoken reading');
 assert.equal(details.size,3,'the explanation must follow all three daily application scenes');
}
for(const evidence of [['選択日85','選択日30'],['流年85'],['判定保留']])assert.ok(!ctx.KOYOMI_METHOD_INTERPRETATION.interpret({methodId:'shichu',domain:'work',evidence})?.story?.presentation?.timeLife);
const fit=ctx.KOYOMI_METHOD_INTERPRETATION.interpret({methodId:'timing',domain:'work',evidence:['選択日85','日五行→用神補正-5']}).story.presentation.timeLife;
assert.equal(fit.mode,'test');assert.match(fit.text,/相性には慎重/);
for(const domain of ['health','growth','unknown'])assert.ok(!ctx.KOYOMI_METHOD_INTERPRETATION.interpret({methodId:'shichu',domain,evidence:['選択日85']}).story?.presentation?.timeLife);
assert.equal(variants.size,48,'four fields, four modes, three grounded scenes');
for(const [alias,domain] of [['career','work'],['changejob','work'],['love','relationship'],['marriage','relationship'],['reconcile','relationship'],['family','relationship'],['income','money'],['purchase','money'],['identity','overall'],['study','overall'],['life','overall'],['choice','overall']]){
 const a=ctx.KOYOMI_METHOD_INTERPRETATION.interpret({methodId:'shichu',domain:alias,evidence:['選択日85'],date:'2026-01-01'}).story.presentation.timeLife;
 const b=ctx.KOYOMI_METHOD_INTERPRETATION.interpret({methodId:'shichu',domain,evidence:['選択日85'],date:'2026-01-01'}).story.presentation.timeLife;
 assert.deepEqual(a,b,'canonical and alias domains must use the same interpretation');
}
for(const value of [0,44,45,67,68,100])for(const correction of [-5,0,5]){
 const story=ctx.KOYOMI_METHOD_INTERPRETATION.interpret({methodId:'timing',domain:'work',evidence:[`選択日${value}`,`日五行→用神補正${correction}`]}).story;
 assert.equal(story.presentation.timeLife.mode,value<45?'protect':value<68||correction<0?'test':'forward');
 if(correction<0)assert.match(story.presentation.timeLife.text,/相性には慎重/);
}
// Exercise the shipped daily calculator and the production score/evidence adapter.
// Long/year values here are explicit fixtures, not newly calculated natal luck.
const app=await readFile('app.html','utf8'),lines=app.split(/\r?\n/),model={Date};vm.createContext(model);
for(const prefix of ['const DAY=','const STEMS=','const TERM_NAMES=','const TERM_NOTES=','function solarLongitude(','function moonLongitude(','function moonData(','function solarTerm(','function dayPillar(','function dailySignal(']){
 const line=lines.find(x=>x.startsWith(prefix));assert.ok(line,prefix);vm.runInContext(line,model);
}
for(const name of ['mod','jd','jdn']){const fn=app.match(new RegExp('function '+name+'\\([^)]*\\)\\{[^}]+\\}'));assert.ok(fn);vm.runInContext(fn[0],model);}
const productionAssets=app.match(/key==='timing'&&r.luck\?(\[.+?\]):key==='kyusei'/)[1];
let actualDailyCases=0;const actualModes=new Set();
for(const start of ['2024-02-15','2026-09-15','2026-12-15'])for(let day=0;day<30;day++){
 model.stamp=Date.parse(start+'T00:00:00Z')+day*86400000;
 const daily=vm.runInContext('dailySignal(new Date(stamp))',model),date=new Date(model.stamp).toISOString().slice(0,10);
 for(const methodId of ['shichu','timing']){
  const luck={current:{score:85,text:'甲子'},annual:{score:30,text:'乙丑'}},useRel=day%2?-5:5;
  const scoreLine=lines.find(x=>x.trimStart().startsWith(`if(key==='${methodId}'){score=`));assert.ok(scoreLine);
  const calculated=vm.runInNewContext("let score,factors;"+scoreLine+';({score,factors})',{key:methodId,c:{luck},daily,useRel});
  const interpretationAssets=methodId==='timing'?vm.runInNewContext(productionAssets,{r:{luck},dailySignal:()=>daily,selectedDate:new Date(model.stamp)}):undefined;
  for(const domain of ['work','relationship','money','overall']){
   const input={methodId,domain,date,score:calculated.score,evidence:calculated.factors,interpretationAssets,confidence:80,generatedAction:true,profileId:'actual-'+methodId+domain};
   const original=JSON.stringify(input),parsed=ctx.KOYOMI_METHOD_INTERPRETATION.interpret(input),detail=parsed.story.presentation.timeLife;
   assert.equal(detail.basis,'選択日'+daily.score);
   assert.equal(detail.mode,daily.score<45?'protect':daily.score<68?'test':'mixed');
   assert.equal(detail.scene,parsed.story.presentation.example.scene);
   const out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);
   assert.equal(out.narrative.quality.pass,true,out.narrative.quality.issues.join(','));assert.ok(out.text.includes(detail.spoken));assert.ok(out.text.includes(detail.explanation));
   assert.equal(JSON.stringify(input),original);actualModes.add(detail.mode);actualDailyCases++;
  }
 }
}
assert.equal(actualModes.size,3,'the actual daily calculator must exercise changing strengths');
if(process.env.KOYOMI_TIME_LIFE_REPORT)await writeFile(process.env.KOYOMI_TIME_LIFE_REPORT,'# 場面と算出結果をそろえた48の読み\n\n'+[...variants.values()].map(x=>'## '+x.variantId+'：'+x.scene+'\n\n'+x.text).join('\n\n')+'\n\n# 表示例\n\n'+samples.map(x=>'## '+x.domain+'\n\n'+x.text).join('\n\n')+`\n\n検証：${count}件、全文最大${maxLength}字。固定結果の組合せ検証。別途${actualDailyCases}件で実日次計算からの連動を検証（大運・流年は固定入力）。\n`);
console.log(`Time-life interpretation passed: ${count} readings, max ${maxLength} characters, ${variants.size} variants, ${actualDailyCases} production daily renders`);
