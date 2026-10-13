import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const context={};vm.createContext(context);
for(const file of ['app-narrative-engine.js','method-interpretation.js','reading-keepsake.js'])vm.runInContext(await readFile('src/reading/'+file,'utf8'),context);
vm.runInContext(await readFile('src/persona/conversation-adapter.js','utf8'),context);
const app=await readFile('app.html','utf8');
for(const name of ['V191R_PLANET_WORDS','V191R_HOUSE_THEMES'])vm.runInContext(app.split(/\r?\n/).find(x=>x.startsWith('const '+name+'=')),context);
const planets=vm.runInContext('V191R_PLANET_WORDS',context),houses=vm.runInContext('V191R_HOUSE_THEMES',context);
const expression=app.match(/transitAssets:(key==='astrology'.+?):undefined,interpretationAssets/)[1]+':undefined';
const assets=transits=>vm.runInNewContext(expression,{key:'astrology',r:{astro:{transits}},V191R_PLANET_WORDS:planets,V191R_HOUSE_THEMES:houses});
assert.equal(vm.runInNewContext(expression,{key:'astrology',r:{}}),undefined);
const scoreLine=app.split(/\r?\n/).find(x=>x.includes("if(key==='astrology'){let soft="));
const inputFor=(transits,domain='work',date='2026-09-01')=>{
 const actual=vm.runInNewContext("let score,factors;const key='astrology',a={transits};"+scoreLine+';({score,factors})',{transits,v191zEphemerisName:()=> 'local'});
 return {methodId:'astrology',domain,date,evidence:actual.factors,score:Math.max(10,Math.min(96,actual.score)),confidence:72,transitAssets:assets(transits),generatedAction:true,action:'条件を確かめてから返事をして。',mode:'sister',level:'beginner',psychRisk:0};
};
const interpret=context.KOYOMI_METHOD_INTERPRETATION.interpret,adapter=context.KOYOMI_PERSONA_ADAPTER;
let cases=0;const metrics=[],samples=[];
for(const np of Object.keys(planets))for(const name of ['合','トライン','スクエア'])for(const domain of ['work','relationship','money','health','overall']){
 const input=inputFor([{tp:'土星',np,name,orb:1,house:10}],domain),initial=interpret(input),bodies=new Set(),actions=new Set();let previous='';
 assert.ok(initial.story.profileFocus);
 for(let day=1;day<=30;day++){
  const current={...input,date:`2026-09-${String(day).padStart(2,'0')}`},before=JSON.stringify(current),parsed=interpret(current);
  assert.equal(parsed.key,initial.key);assert.equal(parsed.story.readingBody,initial.story.readingBody);
  assert.equal(parsed.story.profileFocus.transitFocus.np,np);assert.equal(parsed.story.profileFocus.transitFocus.name,name);
  assert.ok(parsed.story.body.includes(planets[np][0]));assert.ok(parsed.story.body.includes(houses[9]));
  assert.match(parsed.story.evidence,/選択日の土星・生まれた時の/);
  assert.notEqual(parsed.story.body,previous);previous=parsed.story.body;bodies.add(parsed.story.body);actions.add(parsed.story.invitation);
  for(const mode of ['sister','zubat']){
   const out=adapter.applyDivination('計算済み資料',{...current,mode});assert.equal(out.narrative.quality.pass,true,`${np}/${name}/${domain}/${day}: ${out.narrative.quality.issues}`);
   if(!/受診|医療機関|専門家/.test(parsed.story.invitation))assert.equal(out.narrative.structure,'symbolic-story');
   assert.ok(out.text.includes(parsed.story.invitation));if(out.narrative.structure==='symbolic-story'){assert.ok(out.text.includes(`選択日の土星と、生まれた時の${np}`));assert.ok(out.text.includes(`「${name}」`));assert.doesNotMatch(out.text,/出生月/);}
   assert.doesNotMatch(out.text,/undefined|必ず成功|病気になる|相手は.*思っています/);cases++;
  }
  assert.equal(JSON.stringify(current),before);
 }
 assert.equal(bodies.size,30);assert.equal(actions.size,3);metrics.push({np,name,domain,days:30,distinctBodies:30,distinctActions:3});
 if(np==='月'&&domain==='relationship')samples.push({name,text:adapter.applyDivination('計算済み資料',input).text});
}
for(const name of ['セクスタイル','オポジション'])assert.ok(interpret(inputFor([{tp:'水星',np:'金星',name,orb:2,house:7}])).story.profileFocus);
const mixed=[{tp:'土星',np:'月',name:'スクエア',orb:2,house:7},{tp:'木星',np:'水星',name:'トライン',orb:.1,house:10}];
for(const [domain,expected]of [['relationship','月'],['work','水星']]){
 const input=inputFor(mixed,domain),parsed=interpret(input);assert.equal(parsed.story.profileFocus.transitFocus.np,expected);assert.equal(parsed.story.livingContext.direction,'test');assert.match(parsed.story.body,/調和と緊張の両方/);
 assert.deepEqual(interpret(inputFor([...mixed].reverse(),domain)).story.profileFocus.transitFocus,parsed.story.profileFocus.transitFocus);
 assert.equal(adapter.applyDivination('資料',input).text,adapter.applyDivination('資料',input).text);
}
for(const patch of [{np:'未知'},{tp:'constructor'},{name:'未知'},{orb:NaN},{orb:-1},{orb:4},{house:0},{house:13},{house:1.5}]){
 const input=inputFor(mixed);input.transitAssets={...input.transitAssets,transits:[{...mixed[0],...patch},mixed[1]]};assert.equal(interpret(input).story.profileFocus,null);
}
for(const patch of [{transitAssets:undefined},{transitAssets:{transits:mixed}},{evidence:['調和トランジット強度0.0','緊張トランジット強度2.0','主要トランジット2件']}])assert.equal(interpret({...inputFor(mixed),...patch}).story.profileFocus,null);
for(const patch of [{confidence:20},{psychRisk:80},{action:'必要な受診を相談して。'}])assert.notEqual(adapter.applyDivination('資料',{...inputFor(mixed),...patch}).narrative.structure,'symbolic-story');
const explicit=adapter.applyDivination('資料',{...inputFor(mixed),generatedAction:false,action:'本人が指定した行動を保持する'});assert.ok(explicit.text.includes('本人が指定した行動を保持する'));
assert.equal(interpret(inputFor([mixed[0],mixed[0]])).story.profileFocus,null);
assert.notEqual(interpret(inputFor([{tp:'土星',np:'月',name:'トライン',orb:1,house:10}])).key,interpret(inputFor([{tp:'土星',np:'水星',name:'トライン',orb:1,house:10}])).key,'a changed actual planet pair must change the evidence key even with identical total strengths');
// Exercise the existing completely local calculation path, rather than manufactured aspect labels alone.
const model={Date,$:()=>null,settings:()=>({solar:'false'}),fmtIso:d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};vm.createContext(model);
vm.runInContext('const DAY=86400000;function mod(n,m){return((n%m)+m)%m}function jd(d){return d.getTime()/DAY+2440587.5}',model);
for(const prefix of ['const ZODIAC=','const V191R_ELEMENTS=','function solarLongitude(','function moonLongitude('])vm.runInContext(app.split(/\r?\n/).find(x=>x.startsWith(prefix)),model);
vm.runInContext(app.slice(app.indexOf('function v191rSignIndex('),app.indexOf('function v191rDominant(')),model);
let calculatedCases=0;const calculatedTexts=[];
for(const birthday of ['1990-01-01T12:00:00','1985-06-18T12:00:00']){
 const i={birthDate:new Date(birthday),birthTime:'12:00',lat:35,lon:135},natal=model.planetLongitudes(model.v191rBirthUtc(i)),texts=new Set();
 for(let day=1;day<=30;day++){
  model.selectedDate=new Date(2026,8,day);const transits=model.v191rAstroModel(i,natal).transits;assert.ok(transits.length);
  for(const domain of ['work','relationship','money','health','overall']){
   const input=inputFor(transits,domain,`2026-09-${String(day).padStart(2,'0')}`),parsed=interpret(input),out=adapter.applyDivination('資料',input);
   assert.ok(parsed.story.profileFocus);assert.equal(out.narrative.quality.pass,true);
   assert.ok(transits.some(x=>x.tp===parsed.story.profileFocus.transitFocus.tp&&x.np===parsed.story.profileFocus.transitFocus.np&&x.house===parsed.story.profileFocus.transitFocus.house));
   if(domain==='work')texts.add(out.text);calculatedCases++;
  }
 }
 assert.equal(texts.size,30);calculatedTexts.push({birthday,days:30,distinctWorkTexts:texts.size});
}
if(process.env.KOYOMI_TRANSIT_REPORT)await writeFile(process.env.KOYOMI_TRANSIT_REPORT,JSON.stringify({cases,calculatedCases,calculatedTexts,metrics,samples},null,2));
console.log(`Transit reading language: ${cases} fixed-fortune renders, ${calculatedCases} local-calculated renders; all five aspects, source score agreement and missing/safety checks passed.`);
