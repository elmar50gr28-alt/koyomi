import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const store=new Map(),ctx={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
for(const file of ['reading/daily/daily-reading-core.js','reading/app-narrative-engine.js','reading/method-interpretation.js','reading/reading-keepsake.js','reading/method-reading-continuity.js','persona/conversation-adapter.js'])vm.runInNewContext(await readFile('src/'+file,'utf8'),ctx);
const methods=['shichu','timing','astrology','tarot','runes','numerology','sukuyo','kyusei','name','kabbalah','rokusei'];
const metrics=[],samples=[];
for(const methodId of methods)for(const domain of ['work','relationship','money','health','overall'])for(const score of [30,55,85]){
 store.clear();const openings=new Set(),texts=new Set();let ordinaryDays=0;
 for(let day=1;day<=30;day++){
  const input={methodId,domain,score,confidence:80,generatedAction:true,action:'元の助言',profileId:methodId+domain+score,date:`2026-01-${String(day).padStart(2,'0')}`,
   evidence:['shichu','timing'].includes(methodId)?[`大運${score}`,`流年${score}`,`選択日${score}`]:methodId==='astrology'?['調和トランジット強度1.0','緊張トランジット強度6.0']:methodId==='numerology'?['個人年4','秩序を作り、積み上げる数']:methodId==='sukuyo'?['栄親：支え合いやすい距離']:methodId==='kabbalah'?['生年月日核4','名前核7','橋数3']:[],
   interpretationAssets:[{basis:'検証用の算出分類',meaning:'既存辞書の解釈'}],symbols:[{pos:methodId==='tarot'?'自分の立場':'次の一手',name:methodId==='tarot'?'月':'イサ',meaning:'停止・集中'}]};
  const inputBefore=JSON.stringify(input),parsed=ctx.KOYOMI_METHOD_INTERPRETATION.interpret(input),source=parsed.story;
  const before=JSON.stringify(source),out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);
  assert.equal(JSON.stringify(source),before);
  assert.equal(JSON.stringify(input),inputBefore);
  assert.equal(out.narrative.quality.pass,true,methodId+'/'+domain+'/'+score+'/'+day+': '+out.narrative.quality.issues);
  if(out.narrative.structure==='symbolic-story'){
   ordinaryDays++;
   const opening=out.text.split('\n\n【')[0];openings.add(opening);texts.add(out.text);
   const firstBody=opening.split('\n\n').slice(1).join('\n\n');
   assert.ok(firstBody.startsWith(source.livingContext.body),'the variable application scene must appear before the stable explanation');
   if(parsed.mixed)assert.match(firstBody,/後押しと注意の両方/,'opposing signals must stay visible before the action');
   assert.ok(out.text.includes(source.readingBody),methodId+'/'+domain+'/'+score+'/'+day+': calculated interpretation must remain readable');
   assert.ok(out.text.includes(source.evidence));
   assert.equal(out.text.split(source.livingContext.body).length-1,1,'application text must not be duplicated');
   assert.ok(out.text.indexOf(source.readingBody)>out.text.indexOf('【読みの根拠】'));
   assert.equal(ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input).text,out.text);
   if(methodId==='shichu'&&domain==='work'&&score===55)samples.push({date:input.date,text:out.text});
  }else assert.equal(domain,'health','medical guidance keeps the factual rendering');
 }
 assert.ok(openings.size>=3||domain==='health'&&ordinaryDays===0,methodId+'/'+domain+': reading openings must visibly change');
 metrics.push({methodId,domain,score,ordinaryDays,distinctOpenings:openings.size,distinctTexts:texts.size});
}
const fixture={methodId:'shichu',domain:'work',score:55,confidence:80,date:'2026-02-01',generatedAction:true,action:'元の助言',evidence:['大運55','流年55','選択日55']};
for(const special of [{confidence:20},{risk:95},{evidence:['判定保留']},{action:'必要な受診を優先する'}]){
 const out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...fixture,...special});
 assert.notEqual(out.narrative.structure,'symbolic-story','safety and uncertainty keep the guarded path');
}
const legacy={surface:'method',domain:'work',confidence:80,score:55,actions:['担当を確かめる'],story:{title:'既存の見出し',body:'受け渡された元の本文です。',evidence:'元の根拠'}};
const legacyText=ctx.KOYOMI_APP_NARRATIVE.compose(legacy).text;
for(const presentation of [null,{}, {title:'未完成',body:'一部の文'}, {title:'見出し',body:42,background:'背景'}])assert.equal(ctx.KOYOMI_APP_NARRATIVE.compose({...legacy,story:{...legacy.story,presentation}}).text,legacyText,'legacy or incomplete structured data must keep its existing content');
if(process.env.KOYOMI_OPENING_REPORT)await writeFile(process.env.KOYOMI_OPENING_REPORT,JSON.stringify({scope:'4950 renderings with fixed computed fixtures, not astronomical recalculations.',metrics,samples},null,2));
console.log('Method opening passed: 4950 scene-first readings, source text and guards retained');
