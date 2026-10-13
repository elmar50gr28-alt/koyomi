import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const context={};vm.createContext(context);
for(const file of ['app-narrative-engine.js','method-interpretation.js','reading-keepsake.js'])vm.runInContext(await readFile('src/reading/'+file,'utf8'),context);
vm.runInContext(await readFile('src/persona/conversation-adapter.js','utf8'),context);
const app=await readFile('app.html','utf8');
vm.runInContext(app.split(/\r?\n/).find(x=>x.startsWith('const NUM_FULL=')),context);
const meanings=vm.runInContext('NUM_FULL',context);
context.$=()=>null;context.clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
vm.runInContext(app.slice(app.indexOf('function v191zConfidence('),app.indexOf('function v191zElementRelation(')),context);
const actualConfidence=context.v191zConfidence({i:{romaji:'KOYOMI'}},'kabbalah').score;
assert.equal(actualConfidence,55);
const expression=app.match(/key==='kabbalah'\?(method\.factors\.slice\(0,2\)\.map\(.+?\)):key==='rokusei'/)[1];
const assets=evidence=>vm.runInNewContext(expression,{method:{factors:evidence},NUM_FULL:meanings});
const interpret=context.KOYOMI_METHOD_INTERPRETATION.interpret,adapter=context.KOYOMI_PERSONA_ADAPTER;
assert.ok(adapter);
const inputFor=(birth,name,domain,date='2026-09-01')=>{
 const evidence=[`生年月日核${birth}`,`名前核${name}`,`橋数${Math.abs(birth-name)}`];
 return {methodId:'kabbalah',domain,date,evidence,interpretationAssets:assets(evidence),score:72-Math.abs(birth-name)*5,confidence:actualConfidence,generatedAction:true,action:'条件を確かめてから返事をして。',mode:'sister',level:'detailed',psychRisk:0};
};
let cases=0;const metrics=[],samples=[];
for(let birth=1;birth<=9;birth++)for(let name=1;name<=9;name++)for(const domain of ['work','relationship','money','health','overall']){
 const initial=interpret(inputFor(birth,name,domain)),bodies=new Set(),actions=new Set();let previous='';
 assert.ok(initial.story.profileFocus);
 for(let day=1;day<=30;day++){
  const input=inputFor(birth,name,domain,`2026-09-${String(day).padStart(2,'0')}`),before=JSON.stringify(input),parsed=interpret(input);
  assert.equal(parsed.key,initial.key);assert.equal(parsed.story.readingBody,initial.story.readingBody);
  assert.ok(parsed.story.readingBody.includes(meanings[birth]));assert.ok(parsed.story.readingBody.includes(meanings[name]));
  assert.notEqual(parsed.story.body,previous);previous=parsed.story.body;bodies.add(parsed.story.body);actions.add(parsed.story.invitation);
  for(const mode of ['sister','zubat']){
   const out=adapter.applyDivination('計算済み資料',{...input,mode});
   assert.equal(out.narrative.quality.pass,true,`${birth}/${name}/${domain}/${day}: ${out.narrative.quality.issues}`);
   assert.equal(out.text,adapter.applyDivination('計算済み資料',{...input,mode}).text);
   assert.ok(out.text.includes(parsed.story.invitation));
   assert.doesNotMatch(out.text,/undefined|調整量が|性格が一致|必ず成功|必ず戻る/);cases++;
  }
  assert.equal(JSON.stringify(input),before);
  if(day===1&&domain==='work'&&[[1,6],[7,3],[4,4]].some(x=>x[0]===birth&&x[1]===name))samples.push({birth,name,text:adapter.applyDivination('計算済み資料',input).text});
 }
 assert.equal(bodies.size,30);assert.equal(actions.size,3);metrics.push({birth,name,domain,days:30,distinctBodies:bodies.size,distinctActions:actions.size});
}
for(const patch of [{interpretationAssets:[]},{interpretationAssets:[{basis:'生年月日核1',meaning:'未知'}]},{evidence:['生年月日核1','名前核6','橋数0']},{evidence:['生年月日核1','生年月日核2','名前核6','橋数5']},{evidence:['生年月日核0','名前核6','橋数6']}])assert.equal(interpret({...inputFor(1,6,'work'),...patch}).story.profileFocus,null);
assert.equal(interpret({...inputFor(1,6,'work'),evidence:['判定保留','ローマ字名が未入力']}),null);
for(const patch of [{confidence:15},{psychRisk:80},{action:'必要な受診を相談して。'}]){
 const out=adapter.applyDivination('計算済み資料',{...inputFor(1,6,'health'),...patch});assert.notEqual(out.narrative.structure,'symbolic-story');assert.equal(out.narrative.quality.pass,true);
}
const legacy=app.split(/\r?\n/).find(x=>x.startsWith('buildKabbalahReading=function'));
assert.doesNotMatch(legacy,/補いにくく|調整量として|比較的つながっています|内面を分けるのが今回の答え/);
assert.match(legacy,/算術的な差/);
if(process.env.KOYOMI_ROLE_REPORT)await writeFile(process.env.KOYOMI_ROLE_REPORT,JSON.stringify({cases,metrics,samples},null,2));
console.log(`Kabbalah reading language: ${cases} rendered cases; 405 sequences × 30 days; source meanings and stable facts verified.`);
