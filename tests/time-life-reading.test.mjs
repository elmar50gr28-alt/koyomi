import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const store=new Map(),ctx={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
for(const f of ['reading/daily/daily-reading-core.js','reading/app-narrative-engine.js','reading/method-interpretation.js','reading/reading-keepsake.js','reading/method-reading-continuity.js','persona/conversation-adapter.js'])vm.runInNewContext(await readFile('src/'+f,'utf8'),ctx);
let count=0,maxLength=0;const samples=[];
for(const methodId of ['shichu','timing'])for(const domain of ['work','relationship','money','overall'])for(const long of [30,55,85])for(const year of [30,55,85])for(const day of [30,55,85]){
 store.clear();const texts=new Set();
 for(let d=1;d<=30;d++){
  const input={methodId,domain,score:85,confidence:80,generatedAction:true,profileId:`${methodId}-${domain}-${long}-${year}-${day}`,date:`2026-01-${String(d).padStart(2,'0')}`,evidence:[`大運${long}`,`流年${year}`,`選択日${day}`]};
  const source=ctx.KOYOMI_METHOD_INTERPRETATION.interpret(input).story;
  const detail=source.presentation.timeLife;
  assert.equal(detail.mode,day===30?'protect':day===55?'test':long===30||year===30?'mixed':'forward');
  assert.equal(source.presentation.body,source.livingContext.body,'daily opening remains variable');
  assert.ok(source.presentation.background.startsWith(source.readingBody));
  const out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);
  assert.equal(out.narrative.quality.pass,true,out.narrative.quality.issues.join(','));
  assert.ok(out.text.indexOf(detail.text)>out.text.indexOf('【読みの根拠】'));
  assert.equal(out.text.split(detail.text).length-1,1);
  assert.equal(ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input).text,out.text);
  texts.add(out.text);count++;maxLength=Math.max(maxLength,out.text.length);
  if(methodId==='shichu'&&long===85&&year===30&&day===85&&d===1)samples.push({domain,text:out.text});
 }
 assert.equal(texts.size,30,'30 complete daily readings must remain distinct');
}
for(const evidence of [['選択日85','選択日30'],['流年85'],['判定保留']])assert.ok(!ctx.KOYOMI_METHOD_INTERPRETATION.interpret({methodId:'shichu',domain:'work',evidence})?.story?.presentation?.timeLife);
const fit=ctx.KOYOMI_METHOD_INTERPRETATION.interpret({methodId:'timing',domain:'work',evidence:['選択日85','日五行→用神補正-5']}).story.presentation.timeLife;
assert.equal(fit.mode,'test');assert.match(fit.text,/相性には慎重/);
for(const domain of ['health','growth','unknown'])assert.ok(!ctx.KOYOMI_METHOD_INTERPRETATION.interpret({methodId:'shichu',domain,evidence:['選択日85']}).story?.presentation?.timeLife);
if(process.env.KOYOMI_TIME_LIFE_REPORT)await writeFile(process.env.KOYOMI_TIME_LIFE_REPORT,'# 時期の違いを暮らしへつなぐ鑑定例\n\n'+samples.map(x=>'## '+x.domain+'\n\n'+x.text).join('\n\n')+`\n\n検証：${count}件、全文最大${maxLength}字。固定結果の組合せ検証であり、天文再計算ではありません。\n`);
console.log(`Time-life interpretation passed: ${count} readings, max ${maxLength} characters`);
