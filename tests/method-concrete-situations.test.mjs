import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const store=new Map(),ctx={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
for(const file of ['reading/daily/daily-reading-core.js','reading/app-narrative-engine.js','reading/method-interpretation.js','reading/reading-keepsake.js','reading/method-reading-continuity.js','persona/conversation-adapter.js'])vm.runInNewContext(await readFile('src/'+file,'utf8'),ctx);
const methods=['shichu','timing','astrology','tarot','runes','numerology','sukuyo','kyusei','name','kabbalah','rokusei'];
const metrics=[],samples=[];let maxLength=0;
for(const methodId of methods)for(const domain of ['work','relationship','money','overall'])for(const score of [30,55,85]){
 store.clear();const situations=new Map(),texts=new Set();
 for(let day=1;day<=30;day++){
  const input={methodId,domain,score,confidence:80,generatedAction:true,action:'元の助言',profileId:methodId+domain+score,date:`2026-01-${String(day).padStart(2,'0')}`,
   evidence:['shichu','timing'].includes(methodId)?[`大運${score}`,`流年${score}`,`選択日${score}`]:methodId==='astrology'?['調和トランジット強度1.0','緊張トランジット強度6.0']:methodId==='numerology'?['個人年4','秩序を作り、積み上げる数']:methodId==='sukuyo'?['栄親：支え合いやすい距離']:methodId==='kabbalah'?['生年月日核4','名前核7','橋数3']:[],
   interpretationAssets:[{basis:'検証用の算出分類',meaning:'既存辞書の解釈'}],symbols:[{pos:methodId==='tarot'?'自分の立場':'次の一手',name:methodId==='tarot'?'月':'イサ',meaning:'停止・集中'}]};
  const before=JSON.stringify(input),source=ctx.KOYOMI_METHOD_INTERPRETATION.interpret(input).story,example=source.presentation?.example;
  assert.ok(example,'concrete situations are missing');
  assert.equal(example.scene,source.livingContext.scene);
  assert.equal(example.direction,source.livingContext.direction,'the example must follow the interpreted strength');
  assert.match(example.text,/なら、/,'examples must be conditional, not invented events');
  assert.match(example.text,/「[^」]+」/,'examples should give something concrete to say or look for');
  assert.doesNotMatch(example.text,/必ず|絶対|15分|小さく試|相手は.*思っています/);
  const out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);
  assert.equal(JSON.stringify(input),before);
  assert.equal(out.narrative.quality.pass,true,methodId+'/'+domain+'/'+score+'/'+day+': '+out.narrative.quality.issues);
  assert.ok(out.text.includes(example.text));
  assert.equal(out.text.split(example.text).length-1,1);
  assert.ok(out.text.includes(source.presentation?.conversation?.reason||source.readingBody));
  assert.ok(out.text.includes(source.invitation));
  assert.equal(ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input).text,out.text);
  const seen=situations.get(example.scene)||new Set();seen.add(example.id);situations.set(example.scene,seen);
  texts.add(out.text);maxLength=Math.max(maxLength,out.text.length);
  if(methodId==='shichu'&&score===55)samples.push({domain,date:input.date,scene:example.scene,situation:example.label,text:out.text});
 }
 for(const ids of situations.values())assert.equal(ids.size,3,'each high-level scene needs three distinct situations over 30 days');
 assert.equal(texts.size,30);
 metrics.push({methodId,domain,score,scenes:situations.size,situations:[...situations.values()].reduce((n,s)=>n+s.size,0),distinctTexts:texts.size});
}
const base={methodId:'shichu',domain:'work',score:55,confidence:80,generatedAction:true,action:'元の助言',date:'2026-02-01',evidence:['選択日55']};
for(const special of [{confidence:20},{confidence:undefined},{risk:95},{domain:'health'},{evidence:['判定保留']},{action:'必要な受診を優先する'},{generatedAction:false,action:'本人が指定した対応を保つ'}]){
 const out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...base,...special});
 assert.doesNotMatch(out.text,/【たとえば、こんな時】/,'examples cannot displace explicit action or guarded guidance');
 if(special.generatedAction===false)assert.ok(out.text.includes(special.action));
}
if(process.env.KOYOMI_SITUATION_REPORT)await writeFile(process.env.KOYOMI_SITUATION_REPORT,JSON.stringify({scope:'3960 fixed-result renderings, not astronomical recalculation.',metrics,maxLength,samples},null,2));
console.log('Concrete situations passed: 3960 readings, nine situations per field, source and guards retained');
