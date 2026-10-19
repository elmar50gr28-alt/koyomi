import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import vm from 'node:vm';
const store=new Map(),ctx={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
for(const file of ['reading/daily/daily-reading-core.js','reading/app-narrative-engine.js','reading/method-interpretation.js','reading/reading-keepsake.js','reading/method-reading-continuity.js','persona/conversation-adapter.js'])vm.runInNewContext(await readFile('src/'+file,'utf8'),ctx);
let baseline;if(process.env.KOYOMI_VOICE_BASELINE){baseline={KOYOMI_APP_NARRATIVE:ctx.KOYOMI_APP_NARRATIVE};vm.runInNewContext(await readFile(process.env.KOYOMI_VOICE_BASELINE,'utf8'),baseline);}
const app=await readFile('app.html','utf8'),dictionary={};vm.createContext(dictionary);
for(const prefix of ['const NUM_FULL=','const NINE_STAR_FULL=','const ROKUSEI_MEAN=','const V191R_PLANET_WORDS=','const V191R_HOUSE_THEMES='])vm.runInContext(app.split(/\r?\n/).find(x=>x.startsWith(prefix)),dictionary);
const bank=vm.runInContext('({numbers:NUM_FULL,stars:NINE_STAR_FULL,cycles:ROKUSEI_MEAN,planets:V191R_PLANET_WORDS,houses:V191R_HOUSE_THEMES})',dictionary);
const fixtures=[
 {methodId:'shichu',evidence:['大運85','流年30','選択日85']},
 {methodId:'timing',evidence:['大運甲子','流年乙丑'],interpretationAssets:[{basis:'大運85'},{basis:'流年30'},{basis:'選択日85'}]},
 {methodId:'astrology',evidence:['調和トランジット強度0.0','緊張トランジット強度3.5','主要トランジット1件'],transitAssets:{transits:[{tp:'土星',np:'水星',name:'スクエア',orb:.5,house:10}],planetMeanings:bank.planets,houseMeanings:bank.houses}},
 {methodId:'tarot',symbols:[{pos:'自分の立場',name:'月',meaning:'不安・直感'},{pos:'障害',name:'皇帝',meaning:'統率・責任'},{pos:'最終結果',name:'星',meaning:'希望・回復'}]},
 {methodId:'runes',symbols:[{pos:'現在の核',name:'フェオ',meaning:'資産・価値'},{pos:'越える課題',name:'ハガル',meaning:'変化・刷新'},{pos:'次の一手',name:'イサ',meaning:'停止・集中'}]},
 {methodId:'numerology',evidence:['個人年4',bank.numbers[4]]},
 {methodId:'sukuyo',evidence:['安壊：惹かれるが揺れも出やすい距離']},
 {methodId:'kyusei',interpretationAssets:[{basis:'本命1紫白',meaning:bank.stars['一白水星'].join('／')}]},
 {methodId:'name',interpretationAssets:[{basis:'人格31',meaning:'独立と開始'},{basis:'総格32',meaning:'協調と受容'}]},
 {methodId:'kabbalah',evidence:['生年月日核4','名前核7','橋数3'],interpretationAssets:[{basis:'生年月日核4',meaning:bank.numbers[4]},{basis:'名前核7',meaning:bank.numbers[7]}]},
 {methodId:'rokusei',interpretationAssets:[{basis:'年運停止',meaning:bank.cycles['停止']},{basis:'月運達成',meaning:bank.cycles['達成']}]}
];
let count=0,maxLength=0;const samples=[],metrics=[];
for(const fixture of fixtures)for(const domain of ['work','relationship','money','overall']){
 store.clear();const bodies=new Set(),texts=new Set();
 for(let day=1;day<=30;day++){
  const input={...fixture,domain,score:85,confidence:80,generatedAction:true,profileId:fixture.methodId+domain,date:`2026-01-${String(day).padStart(2,'0')}`},before=JSON.stringify(input);
  const parsed=ctx.KOYOMI_METHOD_INTERPRETATION.interpret(input),story=parsed.story,conversation=story.presentation.conversation;
  assert.ok(conversation,fixture.methodId+' needs an authored concrete reading');
  if(baseline){const prior=baseline.KOYOMI_METHOD_INTERPRETATION.interpret(input);for(const key of ['key','mixed','connection','text','application'])assert.equal(parsed[key],prior[key]);for(const key of ['readingBody','evidence','invitation'])assert.equal(story[key],prior.story[key]);for(const key of ['domain','scene','direction'])assert.equal(story.livingContext[key],prior.story.livingContext[key]);}

  const out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('保存された元資料',input);
  assert.equal(JSON.stringify(input),before);assert.equal(out.narrative.quality.pass,true,fixture.methodId+': '+out.narrative.quality.issues);
  assert.ok(out.text.includes(conversation.body));assert.ok(out.text.includes(conversation.reason));assert.ok(out.text.includes(story.evidence));assert.ok(out.text.includes(story.invitation));
  assert.equal(out.text.split(story.presentation.example.text).length-1,1);
  assert.doesNotMatch(out.text,/【今日重ねたい問い】|【たとえば、こんな時】/);
  assert.ok(out.text.indexOf(conversation.reason)<out.text.indexOf('【今日の一歩】'));
  if(story.symbolicFocus)for(const symbol of fixture.symbols){assert.ok(out.text.includes(symbol.name));assert.ok(out.text.includes(symbol.meaning));assert.ok(out.text.includes(symbol.pos));}
  if(story.profileFocus)assert.ok(out.text.includes(story.readingBody),'full source meanings retained for profile methods');
  if(fixture.methodId==='rokusei')assert.match(out.text,/年の負担への注意は残る/);
  assert.equal(ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('保存された元資料',input).text,out.text);
  bodies.add(conversation.body);texts.add(out.text);maxLength=Math.max(maxLength,out.text.length);count++;
  if(domain==='work'&&day===1)samples.push({methodId:fixture.methodId,text:out.text});
 }
 assert.equal(bodies.size,9,'nine concrete situations must appear during a fixed-result month');
 assert.equal(texts.size,30);metrics.push({methodId:fixture.methodId,domain,bodies:bodies.size,texts:texts.size});
}
// Cover the shipped themes against every daily scene/example combination.
const names=['転換','独立と開始','協調と受容','表現と成長','基礎と試練','中心と変化','責任と調和','探究と専門','成果と管理','完成と手放し'];
const distances=[...app.split(/\r?\n/).find(x=>x.startsWith('function sukuyo(d)')).matchAll(/return '([^']+)'/g)].map(x=>x[1]);
const themes=[...Object.entries(bank.numbers).map(([n,meaning])=>({methodId:'numerology',evidence:['個人年'+n,meaning]})),...distances.map(basis=>({methodId:'sukuyo',evidence:[basis]})),...Object.entries(bank.stars).map(([star,row],i)=>({methodId:'kyusei',interpretationAssets:[{basis:'本命'+(i+1)+'紫白',meaning:row.join('／')}]})),...names.map((meaning,i)=>({methodId:'name',interpretationAssets:[{basis:'人格'+(i||10),meaning}]})),...Object.entries(bank.cycles).map(([stage,meaning])=>({methodId:'rokusei',interpretationAssets:[{basis:'年運'+stage,meaning},{basis:'月運'+stage,meaning}]})),...Object.keys(bank.planets).map(np=>({...fixtures.find(x=>x.methodId==='astrology'),transitAssets:{transits:[{tp:'土星',np,name:'スクエア',orb:.5,house:10}],planetMeanings:bank.planets,houseMeanings:bank.houses}}))];
let themeCases=0;
for(const fixture of themes)for(const domain of ['work','relationship','money','overall'])for(let day=1;day<=9;day++){
 const input={...fixture,domain,score:55,confidence:80,generatedAction:true,date:`2026-01-${String(day).padStart(2,'0')}`};
 const out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);
 assert.equal(out.narrative.quality.pass,true,JSON.stringify(fixture)+'/'+domain+'/'+day+': '+out.narrative.quality.issues);themeCases++;
}
for(const fixture of fixtures)for(const patch of [{confidence:20},{risk:95},{domain:'health',action:'必要な受診を優先する'},{generatedAction:false,action:'本人が指定した相談を保持する'}]){
 const input={...fixture,domain:'work',confidence:80,score:85,generatedAction:true,date:'2026-02-01',...patch};
 const out=ctx.KOYOMI_PERSONA_ADAPTER.applyDivination('元資料',input);
 if(patch.generatedAction===false)assert.ok(out.text.includes(patch.action));
 else assert.notEqual(out.narrative.structure,'symbolic-story');
}
if(process.env.KOYOMI_METHOD_VOICE_REPORT)await writeFile(process.env.KOYOMI_METHOD_VOICE_REPORT,'# 各占術の具体的な鑑定例\n\n'+samples.map(x=>'## '+x.methodId+'\n\n'+x.text).join('\n\n')+`\n\n検証：${count}件、全文最長${maxLength}字。固定された算出結果を使う表示検証。\n`);
console.log(`Clear method voices: ${count} renderings, all 11 methods, nine concrete bodies per 30 days, max ${maxLength} characters, ${themeCases} theme/scene checks`);
