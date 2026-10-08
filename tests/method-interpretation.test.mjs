import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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
