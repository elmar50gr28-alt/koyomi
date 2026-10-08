import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const context={};vm.createContext(context);
for(const path of ['src/reading/app-narrative-engine.js','src/reading/method-interpretation.js','src/persona/conversation-adapter.js'])vm.runInContext(await readFile(path,'utf8'),context);
const interpret=context.KOYOMI_METHOD_INTERPRETATION.interpret;
const base={domain:'work',confidence:80,score:80,system:'今日の流れ',action:'担当と期限を確認する'};
const mixed={...base,methodId:'shichu',evidence:['大運85','流年30','選択日70','日五行→用神補正-5']};
const before=JSON.stringify(mixed);const a=interpret(mixed);assert.equal(JSON.stringify(mixed),before);assert.equal(a.mixed,true);assert.match(a.text,/今年の取り組みは負担/);assert.match(a.text,/長期の方針は準備/);assert.match(a.application,/未合意/);
assert.equal(interpret({...mixed,evidence:['大運未算出']}),null);
assert.equal(interpret({...base,methodId:'astrology',evidence:['主要トランジット8件']}),null,'counts do not invent a reading');
const astro=interpret({...base,methodId:'astrology',evidence:['調和トランジット強度1.0','緊張トランジット強度6.0']});assert.equal(astro.mixed,true);assert.match(astro.text,/緊張/);
assert.equal(interpret({...base,methodId:'unknown',evidence:['良い運勢']}),null);
const card={pos:'自分の立場',name:'月',reversed:true,meaning:'不安の停滞・偏りを見直す'};
assert.match(interpret({...base,methodId:'tarot',symbols:[card]}).text,/不安の停滞・偏り/);
assert.equal(interpret({...base,methodId:'tarot',symbols:[{...card,meaning:''}]}),null);
assert.match(interpret({...mixed,confidence:20}).text,/確度が低い/);
assert.equal(interpret({...base,methodId:'name',evidence:['判定保留'],interpretationAssets:[{basis:'人格10',meaning:'解釈'}]}),null);
const safety=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...mixed,domain:'health',psychRisk:95});assert.match(safety.text,/医療機関/);assert.doesNotMatch(safety.text,/長期の方針は準備/);
const origin=[{pos:'障害',name:'塔',meaning:'崩壊を素直に使う'},{pos:'自分の立場',name:'月',meaning:'不安を素直に使う'},{pos:'最終結果',name:'世界',meaning:'完成を素直に使う'}];
const spread=interpret({...base,methodId:'tarot',symbols:origin});for(const x of origin)assert.ok(spread.text.includes(x.meaning));
assert.match(interpret({...base,methodId:'timing',evidence:['大運甲子'],interpretationAssets:[{basis:'大運85'},{basis:'流年30'}]}).text,/長期の方針/);
let count=0;for(const methodId of ['shichu','astrology','tarot','runes','numerology','sukuyo','kyusei','name','kabbalah','rokusei','timing'])for(const domain of ['overall','work','money','relationship','health','growth','timing'])for(let day=1;day<=30;day++){
 const input={...base,methodId,domain,date:`2026-01-${String(day).padStart(2,'0')}`,evidence:['shichu','timing'].includes(methodId)?mixed.evidence:methodId==='astrology'?['調和トランジット強度1.0','緊張トランジット強度6.0']:methodId==='numerology'?['個人年4','秩序を作り、積み上げる数']:methodId==='sukuyo'?['栄親：支え合いやすい距離']:methodId==='kabbalah'?['生年月日核4','名前核7','橋数3']:[],interpretationAssets:[{basis:'検証用の算出分類',meaning:'既存辞書の解釈'}],symbols:methodId==='tarot'?[card]:[{pos:'次の一手',name:'イサ',meaning:'停止・集中'}]};
 const result=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);assert.match(result.text,/そう読む理由/);assert.match(result.text,/相談では/);assert.equal(result.narrative.quality.pass,true,result.narrative.quality.issues.join(','));assert.equal(result.text,context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input).text);count++;
}
console.log(`Grounded interpretation passed: ${count} method/domain/date cases`);

// The reflection must follow the chosen action, retain opposing evidence and
// remain conditional; it must not impersonate a known personal history.
const engine=context.KOYOMI_APP_NARRATIVE;
for(const [domain,action,expected] of [['work','担当する範囲を確認する','引き受ける範囲'],['money','継続費用を確認する','今の暮らし'],['relationship','休める距離を考える','自分が休める距離'],['health','必要な受診を優先する','占いの答えを待たず'],['growth','学んだことを使う','結果を見て直せる'],['timing','期限を確認する','後で見直せる'],['overall','人に相談する','確認できる相手']]){
 const input={surface:'method',domain,confidence:80,evidence:mixed.evidence,actions:[action],interpretation:interpret({...mixed,domain})};
 const result=engine.compose(input);assert.ok(result.blocks.find(x=>x.role==='conclusion').text.includes(expected));assert.match(result.text,/もし/);assert.equal(result.meta.quality.pass,true);
 for(const special of [{confidence:20},{serious:true},{evidence:['判定保留']}])assert.doesNotMatch(engine.compose({...input,...special}).blocks.find(x=>x.role==='conclusion').text,/もし/);
}
const historyStore=new Map();context.localStorage={getItem:k=>historyStore.get(k)||null,setItem:(k,v)=>historyStore.set(k,v)};
for(const path of ['src/reading/daily/daily-reading-core.js','src/reading/method-reading-continuity.js'])vm.runInContext(await readFile(path,'utf8'),context);
const samples=[],openings=new Set(),closings=new Set();
for(let day=1;day<=30;day++){
 const input={...mixed,profileId:'reflection-review',generatedAction:true,date:`2026-01-${String(day).padStart(2,'0')}`,action:'担当と期限を確認する'};
 const result=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);
 assert.equal(result.narrative.quality.pass,true);assert.match(result.text,/長期の方針は準備/);assert.match(result.text,/今年の取り組みは負担/);assert.doesNotMatch(result.text,/あなたは.*(?:疲れ|我慢|頑張)|昨日.*(?:実行した|完了した)/);
 const conclusion=result.text.split('【結論】\n')[1]?.split('\n\n')[0]||'';openings.add(conclusion.split('\n').find(x=>x.startsWith('もし')));closings.add(result.text.split('【最後に】\n')[1]?.split('\n\n')[0]);
 if(day<=4)samples.push(result.text);
}
assert.ok(openings.size>=3);assert.ok(closings.size>=3);
const prepared=engine.compose({surface:'method',domain:'work',confidence:80,actions:['作業に必要な物を揃える'],interpretation:a,evidence:mixed.evidence});assert.match(prepared.blocks.find(x=>x.role==='conclusion').text,/足りない物や情報/);assert.doesNotMatch(prepared.blocks.find(x=>x.role==='close').text,/返事/);
if(process.env.KOYOMI_REFLECTION_REPORT)await writeFile(process.env.KOYOMI_REFLECTION_REPORT,JSON.stringify({days:30,distinctOpenings:openings.size,distinctClosings:closings.size,samples},null,2));
console.log(`Reflective continuity passed: 30 days / ${openings.size} action-linked openings / ${closings.size} endings`);
