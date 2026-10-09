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
for(const domain of ['healthrhythm','overall']){const out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...mixed,domain,generatedAction:true,action:'必要な受診を優先する'});assert.notEqual(out.narrative.structure,'symbolic-story');assert.match(out.text,/受診/)}
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
 const bodies=new Set(),readingBodies=new Set(),titles=new Set(),draws=new Set();
 for(let day=1;day<=30;day++){
  const date=new Date(Date.UTC(2026,3,day)).toISOString().slice(0,10),symbols=methodId==='tarot'?context.tarotSpread('検証用|'+date):context.runeSpread('検証用|'+date),input={...base,methodId,profileId:'oracle-story-'+methodId,date,symbols,evidence:[],generatedAction:true};
  const parsed=interpret(input),out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);assert.equal(out.narrative.quality.pass,true,methodId+'/'+date+': '+out.narrative.quality.issues);
  assert.match(out.text,/読みの根拠/);assert.doesNotMatch(out.text,/担当・期限・完了条件|相談では|必ず|絶対/);assert.ok(out.text.includes(parsed.story.invitation));
  const used=methodId==='tarot'?symbols.filter(x=>['自分の立場','障害','最終結果'].includes(x.pos)):symbols;for(const x of used){assert.ok(out.text.includes(x.name));assert.ok(out.text.includes(x.meaning))}draws.add(JSON.stringify(used));
  bodies.add(parsed.story.body);readingBodies.add(parsed.story.readingBody);titles.add(parsed.story.title);if(day<=2)oracleSamples.push({methodId,date,text:out.text});
 }
 assert.equal(readingBodies.size,draws.size,methodId+': distinct used symbol sets must stay distinct in the factual reading');oracleMetrics.push({methodId,days:30,distinctUsedDraws:draws.size,distinctReadingBodies:readingBodies.size,distinctBodies:bodies.size,distinctTitles:titles.size});
}
const lifeMetrics=[],lifeSamples=[];
const symbolicSamples=[];
let symbolicCases=0;
for(const [name,meaning,intent,direction]of [
 ['イサ','停止・集中','rest','protect'],['ハガラズ','崩壊・刷新','release','protect'],
 ['アルギズ','守護・境界','boundary','test'],['ライド','転機・旅','start','forward'],
 ['アンスズ','言葉・伝達','grow','test'],['ケン','思考・決断','choice','test']
])for(const domain of ['work','relationship','money','health','overall'])for(let day=1;day<=30;day++) {
 const input={...base,methodId:'runes',domain,date:`2026-06-${String(day).padStart(2,'0')}`,symbols:[{pos:'次の一手',name,meaning}],generatedAction:true};
 const original=JSON.stringify(input),parsed=interpret(input);
 assert.equal(parsed.story.symbolicFocus.intent,intent);assert.equal(parsed.story.livingContext.direction,direction);
 if(intent==='release'&&domain!=='health'){
  assert.match(parsed.story.invitation,/なら、/,'ending a commitment is conditional on the reader’s own choice');
  const resting=interpret({...input,symbols:[{pos:'次の一手',name:'イサ',meaning:'停止・集中'}]});
  assert.notEqual(parsed.story.invitation,resting.story.invitation,'resting and releasing must not collapse into one generic stop instruction');
 }
 assert.ok(parsed.story.symbolicFocus.bridge.includes(name));assert.ok(parsed.story.readingBody.includes(meaning));
 assert.equal(JSON.stringify(input),original);
 for(const mode of ['sister','zubat']) {
  const out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...input,mode});
  assert.equal(out.narrative.quality.pass,true,name+'/'+domain+'/'+day+': '+out.narrative.quality.issues);
  if(out.narrative.structure==='symbolic-story')assert.ok(out.text.includes(parsed.story.symbolicFocus.bridge));
  assert.ok(out.text.includes(parsed.story.invitation));symbolicCases++;
 }
 if(day===1&&domain==='relationship'&&['rest','release','start'].includes(intent))symbolicSamples.push({intent,text:context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input).text});
}
const starting={pos:'自分の立場',name:'愚者',meaning:'始まり・冒険を素直に使う'};
assert.equal(interpret({...base,methodId:'tarot',symbols:[starting]}).story.livingContext.direction,'forward');
for(const pos of ['障害','最終結果']) {
 const reading=interpret({...base,methodId:'tarot',symbols:[starting,{pos,name:'塔',meaning:'崩壊・刷新'}]});
 assert.equal(reading.story.symbolicFocus.caution,true);assert.equal(reading.story.livingContext.direction,'test');
 assert.match(reading.story.symbolicFocus.bridge,/注意.*確かめる/,'a beginning symbol does not override a warning elsewhere in the spread');
}
const reversed=interpret({...base,methodId:'tarot',symbols:[{...starting,reversed:true,meaning:'始まり・冒険の停滞・内省'}]});
assert.equal(reversed.story.livingContext.direction,'protect');
assert.doesNotMatch(reversed.story.symbolicFocus.bridge,/実際に始める/);
const noSelf=interpret({...base,methodId:'tarot',symbols:[{pos:'障害',name:'塔',meaning:'崩壊・刷新'}]});
assert.equal(noSelf.story.symbolicFocus,null,'a missing self position cannot be filled with an obstacle');
assert.equal(noSelf.story.livingContext.direction,'test');
for(const domain of ['constructor','toString','__proto__','unknown']) {
 const parsed=interpret({...mixed,domain});
 assert.equal(parsed.story.livingContext.domain,'overall','unrecognized domains use daily-life copy without accessing inherited object properties');
}
let lifeCases=0;
for(const domain of ['work','relationship','money','health','overall'])for(const [direction,evidence]of [
 ['forward',['大運85','流年85','選択日85']],['test',['大運85','流年30','選択日85']],['protect',['大運85','流年85','選択日30']]
]) {
 const bodies=new Set(),scenes=new Set();let previous='';
 const input={...base,methodId:'shichu',profileId:'life-'+domain+direction,domain,evidence,generatedAction:true,action:'従来の自動助言'};
 const invariant=interpret(input);const before=JSON.stringify(input);
 for(let day=1;day<=30;day++) {
  const current={...input,date:new Date(Date.UTC(2026,5,day)).toISOString().slice(0,10)};
  const parsed=interpret(current),story=parsed.story;
  assert.equal(story.readingBody,invariant.story.readingBody,'daily application never changes the calculated reading');
  assert.equal(story.evidence,invariant.story.evidence);assert.equal(parsed.key,invariant.key);
  assert.equal(story.livingContext.direction,direction);assert.equal(story.livingContext.kind,'application');
  assert.match(story.livingContext.body.split('。')[0],/なら、/,'a life scene is conditional, not an invented fact about the reader');
  assert.doesNotMatch(story.body,/見抜|必ず|絶対|誰より|ずっと一人で|頑張った分|あなたは.*に違いない/);
  assert.notEqual(story.body,previous,'adjacent application paragraphs must differ');previous=story.body;
  bodies.add(story.body);scenes.add(story.livingContext.scene);
  for(const mode of ['sister','zubat']) {
   const out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...current,mode});
   assert.equal(out.narrative.quality.pass,true,domain+'/'+direction+'/'+day+': '+out.narrative.quality.issues);
   if(out.narrative.structure==='symbolic-story')assert.ok(out.text.includes(story.readingBody+'\n\n'+story.livingContext.body),'paragraph breaks survive rendering');
   else {assert.equal(domain,'health');assert.match(story.invitation,/医療機関|専門家|受診/);assert.doesNotMatch(out.text,/たとえば、/);}
   assert.ok(out.text.includes(story.invitation));
   assert.equal(out.text,context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...current,mode}).text);
   lifeCases++;
  }
  if(day===1&&domain==='relationship')lifeSamples.push({direction,date:current.date,text:context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',current).text});
 }
 assert.equal(JSON.stringify(input),before);assert.equal(bodies.size,30);assert.equal(scenes.size,3);
 lifeMetrics.push({domain,direction,days:30,distinctBodies:bodies.size,scenes:scenes.size});
}
for(const input of [{confidence:20},{psychRisk:95},{action:'医療機関へ相談する'}]) {
 const out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...base,methodId:'shichu',evidence:['大運85','流年85','選択日85'],...input});
 assert.notEqual(out.narrative.structure,'symbolic-story','low confidence, serious risk, and explicit medical action retain guarded rendering');
 assert.doesNotMatch(out.text,/たとえば、/);
}
vm.runInContext(appLines.find(x=>x.startsWith('const NUM_FULL=')),context);
const numberMeanings=vm.runInContext('NUM_FULL',context);
const distanceLine=appLines.find(x=>x.startsWith('function sukuyo(d)'));
const distances=[...distanceLine.matchAll(/return '([^']+)'/g)].map(x=>x[1]);
assert.equal(Object.keys(numberMeanings).length,12);assert.equal(distances.length,7);
const profileFixtures=[...Object.entries(numberMeanings).map(([number,meaning])=>({methodId:'numerology',evidence:['個人年'+number,meaning],meaning})),...distances.map(basis=>({methodId:'sukuyo',evidence:[basis],meaning:basis.split('：')[1]}))];
let profileCases=0;const profileSamples=[],profileMetrics=[];
for(const fixture of profileFixtures)for(const domain of ['work','relationship','money','health','overall']) {
 const input={...base,...fixture,domain,generatedAction:true},invariant=interpret(input),bodies=new Set(),actions=new Set();
 assert.ok(invariant.story.profileFocus,'each shipped interpretation has a source-linked lens');
 for(let day=1;day<=30;day++) {
  const current={...input,date:`2026-07-${String(day).padStart(2,'0')}`},before=JSON.stringify(current),parsed=interpret(current);
  assert.equal(parsed.key,invariant.key);assert.equal(parsed.story.readingBody,invariant.story.readingBody);
  assert.equal(parsed.story.title,invariant.story.title,'a date change cannot replace an unchanged annual theme or supplied distance');
  assert.ok(parsed.story.readingBody.includes(fixture.meaning));assert.equal(JSON.stringify(current),before);
  bodies.add(parsed.story.body);actions.add(parsed.story.invitation);
  for(const mode of ['sister','zubat']) {
   const out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...current,mode});
   assert.equal(out.narrative.quality.pass,true,fixture.evidence[0]+'/'+domain+'/'+day+': '+out.narrative.quality.issues);
   assert.ok(out.text.includes(parsed.story.invitation));
   if(out.narrative.structure==='symbolic-story'){
    assert.ok(out.text.includes(fixture.meaning));assert.ok(out.text.includes(parsed.story.profileFocus.reading));
    if(fixture.methodId==='numerology')assert.match(out.text,/一年の取り組み方.*今日だけの吉凶ではありません/);
    else assert.match(out.text,/相手との相性や相手の意思を判定した結果ではありません/);
   }
   assert.equal(out.text,context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...current,mode}).text);profileCases++;
  }
  if(day===1&&domain==='relationship'&&['個人年4','個人年9','栄親：支え合いやすい距離','安壊：惹かれるが揺れも出やすい距離'].includes(fixture.evidence[0]))profileSamples.push({basis:fixture.evidence[0],text:context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',current).text});
 }
 assert.equal(bodies.size,30);assert.equal(actions.size,3,'three application angles must not collapse into one repeated instruction');
 profileMetrics.push({basis:fixture.evidence[0],domain,days:30,distinctBodies:bodies.size,distinctActions:actions.size});
}
for(const evidence of [['個人年777','秩序を作り、積み上げる数'],['個人年4','未知の解釈を持つ数'],['個人年4',numberMeanings[7]]])assert.equal(interpret({...base,methodId:'numerology',evidence}).story.profileFocus,null,'unknown or mismatched supplied meanings keep the generic reading');
assert.equal(interpret({...base,methodId:'sukuyo',evidence:['栄親：未検証の解釈']}).story.profileFocus,null);
for(const [domain,canonical]of [['career','work'],['changejob','work'],['income','money'],['purchase','money'],['love','relationship'],['marriage','relationship'],['reconcile','relationship'],['family','relationship'],['healthrhythm','health']]) {
 const input={...base,methodId:'numerology',domain,evidence:['個人年4',numberMeanings[4]],date:'2026-07-01'};
 assert.deepEqual(interpret(input).story,interpret({...input,domain:canonical}).story,'actual consultation choices use the same life scenes as their canonical domain: '+domain);
}
vm.runInContext(appLines.find(x=>x.startsWith('const NINE_STAR_FULL=')),context);
const starDictionary=vm.runInContext('NINE_STAR_FULL',context),starNames=Object.keys(starDictionary);
assert.equal(starNames.length,9);
context.window=context;
const assetExpression=appSource.match(/key==='kyusei'\?\[([\s\S]*?)\]:key==='name'/)[1];
const starFixtures=starNames.map((name,index)=>{
 const basis='本命'+(index+1)+'紫白';context.method={factors:[basis]};
 const asset=vm.runInContext('['+assetExpression+']',context)[0];
 assert.equal(asset.meaning,starDictionary[name].join('／'),'real rendering integration uses the shipped dictionary for '+basis);
 assert.equal(context.KOYOMI_METHOD_INTERPRETATION.nineStarMeaning((index+1)+'紫白',starDictionary),asset.meaning);
 assert.equal(context.KOYOMI_METHOD_INTERPRETATION.nineStarMeaning(name,starDictionary),asset.meaning);
 return {methodId:'kyusei',evidence:[basis],interpretationAssets:[{basis,meaning:asset.meaning}],meaning:asset.meaning};
});
context.mod=(value,divisor)=>((value%divisor)+divisor)%divisor;
vm.runInContext(appLines.find(x=>x.startsWith('function gridMeaning(')),context);
const nameFixtures=Array.from({length:10},(_,index)=>{const number=10+index,meaning=context.gridMeaning(number),basis='人格'+number;return{methodId:'name',evidence:[basis],interpretationAssets:[{basis,meaning}],meaning};});
let assetCases=0;const assetSamples=[];
for(const fixture of [...starFixtures,...nameFixtures])for(const domain of ['work','relationship','money']) {
 const input={...base,...fixture,domain,generatedAction:true},invariant=interpret(input),bodies=new Set(),actions=new Set();
 assert.ok(invariant.story.profileFocus,'the shipped asset has a source-linked lens: '+fixture.evidence[0]);
 for(let day=1;day<=30;day++) {
  const current={...input,date:`2026-08-${String(day).padStart(2,'0')}`},before=JSON.stringify(current),parsed=interpret(current);
  assert.equal(parsed.key,invariant.key);assert.equal(parsed.story.readingBody,invariant.story.readingBody);assert.equal(parsed.story.title,invariant.story.title);
  for(const part of fixture.meaning.split('／'))assert.ok(parsed.story.readingBody.includes(part));assert.equal(JSON.stringify(current),before);bodies.add(parsed.story.body);actions.add(parsed.story.invitation);
  for(const mode of ['sister','zubat']) {
   const out=context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',{...current,mode});
   assert.equal(out.narrative.quality.pass,true,fixture.evidence[0]+'/'+domain+'/'+day+': '+out.narrative.quality.issues);
   for(const part of fixture.meaning.split('／'))assert.ok(out.text.includes(part));assert.ok(out.text.includes(parsed.story.profileFocus.reading));assert.ok(out.text.includes(parsed.story.invitation));
   if(fixture.methodId==='kyusei')assert.match(out.text,/生まれた年から得たテーマ.*今日の出来事や性格を決めつけるものではありません/);
   if(fixture.evidence[0]==='本命7紫白'&&domain==='work')assert.doesNotMatch(parsed.story.invitation,/支出|お金|予算/,'a work scene cannot silently turn into a shopping recommendation');assetCases++;
  }
  if(day===1&&domain==='work'&&['本命2紫白','本命7紫白','人格14','人格19'].includes(fixture.evidence[0]))assetSamples.push({basis:fixture.evidence[0],text:context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',current).text});
 }
 assert.equal(bodies.size,30);assert.equal(actions.size,3);
}
for(const role of ['人格','地格','外格','総格']) {
 const input={...base,methodId:'name',evidence:[role+'11'],interpretationAssets:[{basis:role+'11',meaning:context.gridMeaning(11)}]};
 assert.equal(interpret(input).story.profileFocus.basis,role+'11');assert.ok(interpret(input).story.profileFocus.reading.includes('「'+role+'」'));
}
const repeatedName={...base,methodId:'name',generatedAction:true,evidence:['人格11','地格21','外格31','総格41'],interpretationAssets:['人格11','地格21','外格31','総格41'].map(basis=>({basis,meaning:context.gridMeaning(11)}))};
const grouped=interpret(repeatedName);for(const basis of repeatedName.evidence)assert.ok(grouped.story.readingBody.includes(basis));
assert.equal(grouped.story.readingBody.split('独立と開始').length-1,1,'identical meanings share one explanation while keeping every calculated basis');
assert.equal(context.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',repeatedName).narrative.quality.pass,true);
for(const label of ['0紫白','10紫白','本命0紫白','1紫白余分','constructor','__proto__'])assert.equal(context.KOYOMI_METHOD_INTERPRETATION.nineStarMeaning(label,starDictionary),'');
assert.equal(context.KOYOMI_METHOD_INTERPRETATION.nineStarMeaning('1紫白',{一白水星:['説明不足']}),'');
assert.equal(interpret({...base,methodId:'name',interpretationAssets:[{basis:'人格11',meaning:'探究と専門'}]}).story.profileFocus,null);
assert.equal(interpret({...base,methodId:'kyusei',interpretationAssets:[{basis:'本命1紫白',meaning:'未知の解釈'}]}).story.profileFocus,null);
if(process.env.KOYOMI_REFLECTION_REPORT)await writeFile(process.env.KOYOMI_REFLECTION_REPORT,JSON.stringify({days:30,samples,oracleMetrics,oracleSamples,lifeMetrics,lifeSamples,symbolicCases,symbolicSamples,profileCases,profileSamples,profileMetrics,assetCases,assetSamples},null,2));
console.log('Source-linked name/star language: '+assetCases+' rendered cases, real nine-star dictionary integration and grouped name readings');
console.log('Source-linked number/distance language: '+profileCases+' rendered cases, 19 shipped meanings, annual/daily/person scope preserved');
console.log('Symbol-linked application: '+symbolicCases+' rendered cases, reversed/mixed/missing-position checks passed');
console.log('Living language: '+lifeCases+' rendered cases, 30 distinct application bodies per fixed fortune, unchanged evidence');
console.log('Existing spread story verification: '+JSON.stringify(oracleMetrics));
