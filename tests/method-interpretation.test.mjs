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
 const result=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);assert.match(result.text,/読みの根拠/);assert.match(result.text,/今日の一歩/);assert.equal(result.narrative.quality.pass,true,result.narrative.quality.issues.join(','));assert.equal(result.text,context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input).text);assert.ok(result.text.startsWith('【今日の読み】\n'));assert.equal(result.narrative.structure,'symbolic-story');assert.doesNotMatch(result.text,/【判断の分け方】|【現実で確かめること】/);count++;
}
console.log(`Grounded interpretation passed: ${count} method/domain/date cases`);

// New ordinary readings center the symbols; protective/uncertain inputs retain
// the explicit factual path instead of acquiring poetic reassurance.
for(const special of [{confidence:20},{psychRisk:95},{evidence:['判定保留']}]){
 const out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...mixed,...special});
 assert.notEqual(out.narrative.structure,'symbolic-story');assert.doesNotMatch(out.text,/【今日の読み】/);
}
const care=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...mixed,domain:'health',action:'必要な受診を優先する'});assert.notEqual(care.narrative.structure,'symbolic-story');assert.match(care.text,/受診/);
const spreadInput={...base,methodId:'tarot',evidence:[],symbols:[{pos:'自分の立場',name:'月',meaning:'不安を素直に使う',reversed:false},{pos:'障害',name:'皇帝',meaning:'統率を素直に使う',reversed:false},{pos:'最終結果',name:'世界',meaning:'完成を素直に使う',reversed:false}]};
const story=interpret(spreadInput).story;assert.match(story.title,/輪郭が見えない/);assert.match(story.body,/葛藤/);for(const x of spreadInput.symbols)assert.ok(story.body.includes(x.meaning));
assert.doesNotMatch(interpret({...spreadInput,symbols:spreadInput.symbols.map(x=>({...x,reversed:true}))}).story.title,/輪郭が見えない/,'reversed cards must not reuse an upright pair reading');
const store=new Map();context.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
for(const path of ['src/reading/daily/daily-reading-core.js','src/reading/method-reading-continuity.js'])vm.runInContext(await readFile(path,'utf8'),context);
const samples=[];
for(let day=1;day<=30;day++){
 const input={...mixed,generatedAction:true,profileId:'new-reading',date:new Date(Date.UTC(2026,2,day)).toISOString().slice(0,10)};
 const out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input),plan=context.KOYOMI_METHOD_CONTINUITY.plan({...input,action:interpret(input).story.invitation,generatedAction:false});
 assert.equal(out.narrative.quality.pass,true);assert.ok(out.text.includes(plan.action));for(const value of ['長期の判定は85点','年ごとの判定は30点','選択日の判定は70点','相性補正-5'])assert.ok(out.text.includes(value));
 assert.doesNotMatch(out.text,/相談では|担当・期限・完了条件|今回扱うのは|今日の確認点|【見直す時】/);if(day>1)assert.match(out.text,/昨日との違い/);
 assert.equal(out.text,context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input).text);if(day<=3)samples.push(out.text);
}
if(process.env.KOYOMI_REFLECTION_REPORT)await writeFile(process.env.KOYOMI_REFLECTION_REPORT,JSON.stringify({days:30,samples},null,2));
console.log('Symbolic reading continuity passed: 30 days, story-linked advice and preserved evidence');

const combinations=[
 [['大運85','流年30','選択日70'],'長期には前へ進む材料','今年は負担を見直す'],
 [['大運30','流年85','選択日70'],'今年には前へ進む材料','長期には負担を見直す'],
 [['大運55','流年85','選択日30'],'今年の取り組みには後押し','今日は条件を見直す'],
 [['大運55','流年30','選択日85'],'今日は前へ進む材料','今年の負担への注意']
];
for(const [evidence,support,caution] of combinations){const result=interpret({...mixed,evidence});assert.ok(result.connection.includes(support));assert.ok(result.connection.includes(caution));assert.doesNotMatch(result.text,/後押しと注意の両方があります/,'do not repeat a generic summary after a specific connection');}
assert.equal(interpret({...mixed,evidence:['大運85']}).connection,'','a missing comparison must not be invented');
assert.equal(interpret({...mixed,evidence:['大運85','流年85','選択日85']}).connection,'','consistent signals must not invent conflicting periods');
assert.match(spread.connection,/最終結果だけを結論にせず/);
assert.equal(interpret({...base,methodId:'tarot',symbols:[card]}).connection,'','missing positions must not be filled in');
assert.match(astro.connection,/調和と緊張/);
let connectionCases=0;const storyTitles=new Set();
for(const long of [30,55,85])for(const year of [30,55,85])for(const today of [30,55,85])for(let day=1;day<=30;day++){
 const input={...mixed,score:55,evidence:[`大運${long}`,`流年${year}`,`選択日${today}`],date:new Date(Date.UTC(2026,2,day)).toISOString().slice(0,10)};
 const parsed=interpret(input),out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);
 storyTitles.add(parsed.story.title);
 assert.equal(out.narrative.quality.pass,true);assert.match(out.text,new RegExp(`長期の判定は${long}点`));assert.match(out.text,new RegExp(`年ごとの判定は${year}点`));assert.match(out.text,new RegExp(`選択日の判定は${today}点`));
 for(const item of parsed.items){const value=Number(item.basis.replace(/^(大運|流年|選択日)/,''));assert.equal(item.kind,value>=68?'support':value<45?'caution':'neutral')}
 assert.equal(parsed.connection,interpret({...input,date:'2026-12-01'}).connection,'the date must not change the meaning of identical computed evidence');connectionCases++;
}
assert.ok(storyTitles.size>=5,'different computed combinations must produce different central readings');
const explicit=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...mixed,action:'依頼者が指定した行動を保持する'});assert.match(explicit.text,/依頼者が指定した行動を保持する/);
const quote=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...spreadInput,generatedAction:true,action:'旧来の確認作業'});assert.doesNotMatch(quote.text,/旧来の確認作業/);assert.match(quote.text,/まだ決められない理由/);assert.equal(quote.narrative.quality.pass,true);
console.log(`Evidence connection passed: ${connectionCases} opposing/neutral/aligned period cases`);

// Exercise the existing local spreads rather than only manually authored cards.
const appSource=await readFile('app.html','utf8'),appLines=appSource.split(/\r?\n/);
for(const name of ['RUNES','RUNE_MEAN','TAROT_MAJOR','SUITS','TAROT'])vm.runInContext(appLines.find(x=>x.startsWith('const '+name+'=')),context);
const hashLine=appLines.find(x=>x.includes('function hash(s)'));vm.runInContext(hashLine.slice(hashLine.indexOf('function hash(s)'),hashLine.indexOf('function mod(')),context);
for(const name of ['tarotSpread','runeSpread'])vm.runInContext(appLines.find(x=>x.startsWith('function '+name+'(')),context);
const oracleMetrics=[],oracleSamples=[];
for(const methodId of ['tarot','runes']){
 const bodies=new Set(),titles=new Set(),draws=new Set();
 for(let day=1;day<=30;day++){
  const date=new Date(Date.UTC(2026,3,day)).toISOString().slice(0,10),symbols=methodId==='tarot'?context.tarotSpread('検証用|'+date):context.runeSpread('検証用|'+date),input={...base,methodId,profileId:'oracle-story-'+methodId,date,symbols,evidence:[],generatedAction:true};
  const parsed=interpret(input),out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);assert.equal(out.narrative.quality.pass,true,methodId+'/'+date+': '+out.narrative.quality.issues);
  assert.match(out.text,/読みの根拠/);assert.doesNotMatch(out.text,/担当・期限・完了条件|相談では|必ず|絶対/);assert.ok(out.text.includes(parsed.story.invitation));
  const used=methodId==='tarot'?symbols.filter(x=>['自分の立場','障害','最終結果'].includes(x.pos)):symbols;for(const x of used){assert.ok(out.text.includes(x.name));assert.ok(out.text.includes(x.meaning))}draws.add(JSON.stringify(used));
  bodies.add(parsed.story.body);titles.add(parsed.story.title);if(day<=2)oracleSamples.push({methodId,date,text:out.text});
 }
 assert.equal(bodies.size,draws.size,methodId+': distinct used symbol sets must stay distinct in the reading');oracleMetrics.push({methodId,days:30,distinctUsedDraws:draws.size,distinctBodies:bodies.size,distinctTitles:titles.size});
}
if(process.env.KOYOMI_REFLECTION_REPORT)await writeFile(process.env.KOYOMI_REFLECTION_REPORT,JSON.stringify({days:30,samples,oracleMetrics,oracleSamples},null,2));
console.log('Existing spread story verification: '+JSON.stringify(oracleMetrics));
