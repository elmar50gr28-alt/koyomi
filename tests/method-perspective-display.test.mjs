import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';

const store=new Map(),context={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
for(const file of ['daily/daily-reading-core.js','app-narrative-engine.js','method-interpretation.js','method-reading-continuity.js','../persona/conversation-adapter.js'])vm.runInNewContext(await readFile('src/reading/'+file,'utf8'),context);
const methods=['shichu','timing','astrology','tarot','runes','numerology','sukuyo','kyusei','name','kabbalah','rokusei'];
const samples=[],metrics=[];
for(const methodId of methods)for(const domain of ['overall','work','money','relationship','health','growth','timing']){
 store.clear();const questions=new Set(),continuities=new Set(),texts=new Set();let medicalDays=0;
 for(let day=1;day<=30;day++){
  const input={methodId,domain,profileId:'perspective-'+methodId+domain,date:`2026-01-${String(day).padStart(2,'0')}`,confidence:80,score:55,generatedAction:true,action:'担当と期限を確認する',
   evidence:['shichu','timing'].includes(methodId)?['大運55','流年55','選択日55']:methodId==='astrology'?['調和トランジット強度1.0','緊張トランジット強度6.0']:methodId==='numerology'?['個人年4','秩序を作り、積み上げる数']:methodId==='sukuyo'?['栄親：支え合いやすい距離']:methodId==='kabbalah'?['生年月日核4','名前核7','橋数3']:[],
   interpretationAssets:[{basis:'検証用の算出分類',meaning:'既存辞書の解釈'}],symbols:[{pos:methodId==='tarot'?'自分の立場':'次の一手',name:methodId==='tarot'?'月':'イサ',meaning:'停止・集中'}]};
  const before=JSON.stringify(input),out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);
  assert.equal(JSON.stringify(input),before);
  texts.add(out.text);
  if(out.narrative.structure!=='symbolic-story'){
   assert.equal(domain,'health',methodId+'/'+domain+'/'+day);
   assert.match(out.text,/受診|医療機関|専門家/,'medical guidance retains factual rendering');
   medicalDays++;
   continue;
  }
  assert.equal(out.narrative.quality.pass,true,`${methodId}/${domain}/${day}: ${out.narrative.quality.issues}`);
  const source=context.KOYOMI_METHOD_INTERPRETATION.interpret(input).story;
  if(!source.presentation?.conversation)assert.ok(out.text.includes(source.title));
  assert.ok(out.text.includes(source.presentation?.conversation?.reason||source.readingBody),'the daily lens cannot replace the source interpretation');
  const question=source.presentation?.conversation?.body||out.text.match(/【今日重ねたい問い】\n([\s\S]*?)(?=\n\n【)/)?.[1];
  assert.ok(question,`${methodId}/${domain}/${day} lost its daily lens`);
  questions.add(question);
  if(day>1){
   const continuation=out.text.split('【昨日との違い】\n')[1];
   assert.ok(continuation);continuities.add(continuation);
   assert.doesNotMatch(continuation,/今日も、この読みを今の状況と重ねて/);
   assert.match(continuation,/点数は昨日と同じ|同じ論点/,'a changed lens must not claim changed astrology');
  }
  assert.doesNotMatch(out.text,/昨日.*(?:完了した|実行した)|必ず成功|絶対に/);
  assert.equal(context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input).text,out.text);
  if(methodId==='shichu'&&domain==='work')samples.push({date:input.date,text:out.text});
 }
 assert.ok(questions.size>=3||(domain==='health'&&medicalDays>0),`${methodId}/${domain}: daily lens collapsed to one paragraph`);
 metrics.push({methodId,domain,days:30,questions:questions.size,continuities:continuities.size,medicalDays,distinctTexts:texts.size});
}
const changing={methodId:'shichu',domain:'work',profileId:'changing',confidence:80,generatedAction:true,action:'担当を確認する',date:'2026-03-01',score:55,evidence:['大運55','流年55','選択日55']};
context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',changing);
const changed=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...changing,date:'2026-03-02',evidence:['大運55','流年55','選択日56']});
assert.match(changed.text,/判断材料は昨日と異なります/);
assert.match(changed.text,/選択日の判定は56点/);
const stronger=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...changing,date:'2026-03-03',score:75});
assert.match(stronger.text,/昨日は55点、今日は75点/);
for(const special of [{confidence:20},{risk:95},{action:'医療機関へ相談する'},{evidence:['判定保留']}]){
 const out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{methodId:'shichu',profileId:'guard',date:'2026-02-01',domain:'health',confidence:80,score:55,evidence:['流年55'],action:'休息を確保する',...special});
 assert.notEqual(out.narrative.structure,'symbolic-story');
 assert.doesNotMatch(out.text,/【今日重ねたい問い】/);
}
if(process.env.KOYOMI_PERSPECTIVE_REPORT)await writeFile(process.env.KOYOMI_PERSPECTIVE_REPORT,JSON.stringify({scope:'Fixed computed-result fixtures; not astronomical recalculations.',metrics,samples},null,2));
console.log('Method perspective display passed: 2310 integrated readings, preserved lenses and guards');
