import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const storage=new Map(),context={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};vm.createContext(context);
for(const path of ['src/reading/daily/daily-reading-core.js','src/reading/method-reading-continuity.js','src/reading/app-narrative-engine.js','src/reading/method-interpretation.js','src/reading/reading-keepsake.js','src/persona/conversation-adapter.js'])vm.runInContext(await readFile(path,'utf8'),context);
const engine=context.KOYOMI_READING_KEEPSAKE,interpret=context.KOYOMI_METHOD_INTERPRETATION.interpret,adapter=context.KOYOMI_PERSONA_ADAPTER,planner=context.KOYOMI_METHOD_CONTINUITY;
const base={profileId:'keepsake',domain:'work',methodId:'shichu',confidence:80,score:55,evidence:['大運85','流年30','選択日70'],generatedAction:true,action:'元の行動'};
const fixtures=[['start',{...base,evidence:['大運85','流年85','選択日85']}],['boundary',base],['rest',{...base,evidence:['大運30','流年30','選択日30']}],['choice',{...base,methodId:'tarot',evidence:[],symbols:[{pos:'自分の立場',name:'正義',meaning:'思考・決断を素直に使う'}]}],['release',{...base,methodId:'runes',evidence:[],symbols:[{pos:'次の一手',name:'ハガラズ',meaning:'崩壊・刷新'}]}],['grow',{...base,methodId:'numerology',evidence:['個人年4','秩序を作り、積み上げる数']}]];
let cases=0;const metrics=[],samples=[];
for(const [axis,input] of fixtures){storage.clear();const ids=new Set();let last='',repeated=0;
 for(let day=1;day<=30;day++){
  const date=new Date(Date.UTC(2026,4,day)).toISOString().slice(0,10),current={...input,profileId:axis,date,mode:'sister'},before=JSON.stringify(current),parsed=interpret(current),story=engine.decorate(current,parsed),out=adapter.applyDivination('元資料',current);
  assert.equal(story.axis,axis);assert.equal(JSON.stringify(current),before);assert.equal(out.narrative.quality.pass,true,out.narrative.quality.issues.join(','));assert.match(out.text,/今日のお守り/);assert.match(out.text,/手元になければ/);assert.doesNotMatch(out.text,/買って|購入して|必ず|絶対/);
  const plan=planner.plan({...current,action:story.invitation,generatedAction:false,keepsakeCandidates:story.keepsakeCandidates});assert.equal(plan.keepsake.axis,axis);assert.ok(out.text.includes(plan.keepsake.name));ids.add(plan.keepsake.id);if(last===plan.keepsake.id)repeated++;last=plan.keepsake.id;
  assert.equal(out.text,adapter.applyDivination('元資料',current).text);
  const sharp={...current,mode:'zubat'},sharpStory=engine.decorate(sharp,parsed),sharpOut=adapter.applyDivination('元資料',sharp);
  assert.equal(sharpStory.axis,axis);assert.equal(sharpStory.body,story.body);assert.equal(sharpStory.evidence,story.evidence);assert.notEqual(sharpStory.title,story.title);assert.equal(sharpOut.narrative.quality.pass,true,sharpOut.narrative.quality.issues.join(','));assert.ok(sharpOut.text.includes(plan.keepsake.name),'changing voice must not reroll the keepsake');
  if(day<=2&&axis==='boundary')samples.push({date,sister:out.text,zubat:sharpOut.text});cases+=2;
 }
 assert.equal(ids.size,3);assert.equal(repeated,0);metrics.push({axis,days:30,distinctKeepsakes:ids.size,adjacentRepeated:repeated});
}
for(const special of [{confidence:20},{psychRisk:95},{risk:95},{evidence:['判定保留']},{domain:'healthrhythm',action:'必要な受診を優先する'}]){
 const out=adapter.applyDivination('元資料',{...base,date:'2026-06-01',...special});assert.doesNotMatch(out.text,/今日のお守り/);assert.notEqual(out.narrative.structure,'symbolic-story');
}
const explicit=adapter.applyDivination('元資料',{...base,date:'2026-06-02',generatedAction:false,action:'依頼者の指定行動'});assert.match(explicit.text,/依頼者の指定行動/);
assert.equal(engine.decorate({},null),null);
const starInput={...base,methodId:'tarot',evidence:[],symbols:[{pos:'自分の立場',name:'星',meaning:'希望を素直に使う'}]};assert.equal(engine.decorate(starInput,interpret(starInput)).keepsakeCandidates[0].name,'手元の青い小物');
const otherInput={...starInput,symbols:[{pos:'自分の立場',name:'月',meaning:'不安を素直に使う'}]};assert.ok(!engine.decorate(otherInput,interpret(otherInput)).keepsakeCandidates.some(x=>x.id==='blue'),'a Star-specific keepsake must not leak into another symbol');
assert.doesNotThrow(()=>planner.plan({...base,date:'2026-06-03',keepsakeCandidates:[]},{storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}}));
const app=await readFile('app.html','utf8'),worker=await readFile('service-worker.js','utf8');assert.ok(app.includes('src/reading/reading-keepsake.js'));assert.ok(worker.includes('./src/reading/reading-keepsake.js'));
if(process.env.KOYOMI_KEEPSAKE_REPORT)await writeFile(process.env.KOYOMI_KEEPSAKE_REPORT,JSON.stringify({cases,metrics,samples},null,2));
console.log(`Reading voice/keepsake passed: ${cases} cases / six axes / 30 days / both voices`);
