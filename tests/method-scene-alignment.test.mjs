import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const store=new Map(),ctx={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
for(const file of ['reading/daily/daily-reading-core.js','reading/app-narrative-engine.js','reading/method-interpretation.js','reading/reading-keepsake.js','reading/method-reading-continuity.js','persona/conversation-adapter.js'])vm.runInNewContext(await readFile('src/'+file,'utf8'),ctx);
let observed;
const continuity=ctx.KOYOMI_METHOD_CONTINUITY;
ctx.KOYOMI_METHOD_CONTINUITY={...continuity,plan(input){const plan=continuity.plan(input);observed={input,plan};return plan;}};
// Expectations describe the subject of each existing application scene, rather
// than reproducing the selector's keyword patterns.
const subjects={
 work:{'頼まれごと':['担当と合意','任せる範囲'],'提案':['準備と障害'],'評価':['担当と合意']},
 relationship:{'連絡':['言葉と行動','伝える内容','距離と余力','関わる時期'],'会話':['言葉と行動','伝える内容','距離と余力'],'約束':['合意していること','関わる時期','距離と余力']},
 money:{'買い物':['支出の必要性','購入以外の方法','支払いの時期'],'継続費':['続ける費用','請求の照合'],'人付き合いの出費':['付き合いの予算']},
 health:{'休息':['休息の確保','必要な受診や相談'],'生活のリズム':['睡眠の段取り','食事と水分','必要な受診や相談'],'助けを借りる':['予定の負担','必要な受診や相談']},
 overall:{'予定':['優先順位','続ける負担'],'始めたいこと':['見直す条件','続ける負担'],'人の期待':['使える支援','続ける負担']}
};
const mismatches=[],samples=[],metrics=[];
const methods=['shichu','timing','astrology','tarot','runes','numerology','sukuyo','kyusei','name','kabbalah','rokusei'];
for(const methodId of methods)for(const domain of Object.keys(subjects))for(const score of [30,55,85]){
 store.clear();const questions=new Set(),texts=new Set();
 for(let day=1;day<=30;day++){
  const input={methodId,domain,profileId:methodId+domain+score,date:`2026-01-${String(day).padStart(2,'0')}`,score,confidence:80,generatedAction:true,action:'元の助言',
   evidence:['shichu','timing'].includes(methodId)?[`大運${score}`,`流年${score}`,`選択日${score}`]:methodId==='astrology'?['調和トランジット強度1.0','緊張トランジット強度6.0']:methodId==='numerology'?['個人年4','秩序を作り、積み上げる数']:methodId==='sukuyo'?['栄親：支え合いやすい距離']:methodId==='kabbalah'?['生年月日核4','名前核7','橋数3']:[],
   interpretationAssets:[{basis:'検証用の算出分類',meaning:'既存辞書の解釈'}],symbols:[{pos:methodId==='tarot'?'自分の立場':'次の一手',name:methodId==='tarot'?'月':'イサ',meaning:'停止・集中'}]};
  const before=JSON.stringify(input);
  const interpretation=ctx.KOYOMI_METHOD_INTERPRETATION.interpret(input),scene=interpretation.story.livingContext.scene;
  const out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input),label=observed.plan.angle.label;
  assert.equal(JSON.stringify(input),before);
  if(!subjects[domain][scene].includes(label))mismatches.push({methodId,domain,score,day,scene,label,action:observed.plan.action});
  if(out.narrative.structure==='symbolic-story'){
   assert.ok(out.text.includes(interpretation.story.readingBody),'source interpretation stays intact');
   assert.ok(out.text.includes(observed.plan.angle.text));
  }
  assert.equal(out.narrative.quality.pass,true,domain+'/'+score+'/'+day+': '+out.narrative.quality.issues);
  questions.add(observed.plan.angle.text);texts.add(out.text);
  assert.equal(ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input).text,out.text);
  if(methodId==='shichu'&&domain==='money'&&score===55)samples.push({date:input.date,scene,text:out.text});
 }
 metrics.push({methodId,domain,score,questions:questions.size,texts:texts.size});
}
// Explicit user actions must not acquire an automatically selected scene.
const explicit={methodId:'shichu',domain:'work',date:'2026-02-01',confidence:80,score:55,evidence:['選択日55'],action:'同僚に分担を相談する'};
ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',explicit);
assert.equal(observed.input.readingScene,undefined);
assert.equal(observed.plan.action,explicit.action);
const cachedInput={...explicit,profileId:'scene-cache',readingScene:{domain:'work',scene:'提案',direction:'test'}};
assert.equal(continuity.plan(cachedInput).angle.label,'準備と障害');
assert.equal(continuity.plan({...cachedInput,readingScene:{domain:'work',scene:'評価',direction:'test'}}).angle.label,'担当と合意','same-day scene edits cannot reuse a mismatched cached question');
for(const [direction,phrase] of [['forward','どんな思いを込めたい'],['test','楽しみと気がかり'],['protect','断りづらいなら']]){
 const plan=continuity.plan({...cachedInput,domain:'money',score:85,readingScene:{domain:'money',scene:'人付き合いの出費',direction}});
 assert.ok(plan.angle.text.includes(phrase),'the interpreted scene direction, rather than a generic total score, chooses the social-spending question');
}
for(const overrides of [{risk:95},{evidence:['判定保留']},{action:'必要な受診を優先する'}]){
 const plan=continuity.plan({...cachedInput,...overrides});
 assert.match(plan.angle.id,/-safety$|-input$|-care$/,'scene selection cannot override factual guards');
}
for(const readingScene of [{domain:'money',scene:'人付き合いの出費',direction:'test'},{domain:'work',scene:'未知の場面',direction:'test'},{domain:'work',scene:'提案',direction:'unknown'}]){
 assert.deepEqual(continuity.plan({...explicit,readingScene}).angle,continuity.plan(explicit).angle,'unknown or mismatched scene context keeps the previous action-based path');
}
if(process.env.KOYOMI_SCENE_REPORT)await writeFile(process.env.KOYOMI_SCENE_REPORT,JSON.stringify({scope:'4950 renderings with fixed computed fixtures, not new astronomical calculations.',metrics,mismatches,samples},null,2));
assert.deepEqual(mismatches,[],'the question must discuss the scene presented in the reading');
console.log('Method scene alignment passed: 4950 daily scene/direction readings');
