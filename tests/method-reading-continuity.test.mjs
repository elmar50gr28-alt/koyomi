import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const context={localStorage:storage,Math:Object.assign(Object.create(Math),{random(){throw Error('random forbidden')}})};
for(const file of ['src/reading/daily/daily-reading-core.js','src/reading/method-reading-continuity.js','src/reading/app-narrative-engine.js','src/persona/conversation-adapter.js'])vm.runInNewContext(await readFile(file,'utf8'),context);
const planner=context.KOYOMI_METHOD_CONTINUITY,adapter=context.KOYOMI_PERSONA_ADAPTER;
const methods=['shichu','sukuyo','kyusei','astrology','tarot','runes','name','numerology','kabbalah','rokusei','timing'],rows=[],metrics=[];
let cases=0;
for(const methodId of methods)for(const domain of ['overall','work','money','relationship','health','growth','timing'])for(const score of [30,55,85]){
 store.clear();
 const texts=[],actions=new Set(),angles=new Set();
 for(let day=1;day<=30;day++){
  const input={methodId,profileId:methodId+domain+score,system:'今日の流れ',domain,score,date:`2026-01-${String(day).padStart(2,'0')}`,evidence:['流年65'],generatedAction:true,action:'必要な条件を確認する',level:'standard'};
  const before=JSON.stringify(input),result=adapter.applyDivination('元の占術資料',input),plan=planner.plan(input);
  assert.equal(JSON.stringify(input),before);assert.equal(adapter.applyDivination('元の占術資料',input).text,result.text);
  assert.equal(result.scenario.state,score>=68?'前進':score<45?'防御':'試行');
  assert.equal(result.narrative.quality.pass,true,methodId+'/'+domain+'/'+day+': '+result.narrative.quality.issues);
  if(day>1)assert.match(result.text,/昨日との違い/);
  assert.doesNotMatch(result.text,/昨日.*完了した|昨日.*実行した/,'a stored reading is not evidence of completed activity');
  if(score===30)assert.doesNotMatch(plan.action,/会う日時|会う予定|提出|試作/);
  texts.push(result.text);actions.add(plan.action);angles.add(plan.angle.id);cases++;
  if(methodId==='shichu'&&domain==='work'&&score===55&&day<=3)rows.push({date:input.date,text:result.text});
 }
 metrics.push({methodId,domain,score,distinctTexts:new Set(texts).size,distinctActions:actions.size,distinctAngles:angles.size});
 assert.ok(new Set(texts).size>=3,methodId+'/'+domain+'/'+score+': visible content cannot remain one fixed paragraph');
}
const base={methodId:'shichu',profileId:'explicit',date:'2026-02-01',domain:'work',score:55,action:'入力された行動を保持する',evidence:['流年65']};
assert.equal(planner.plan(base).action,base.action);
const first=planner.plan(base),second=planner.plan({...base,date:'2026-02-02',score:70});assert.match(second.note,/55点.*70点/);
assert.equal(planner.plan({...base,profileId:'other',date:'2026-02-02'}).note,'');
assert.equal(planner.plan({...base,question:'別の相談',date:'2026-02-02'}).note,'');
const edited={...base,profileId:'edited-history'};planner.plan(edited);planner.plan({...edited,date:'2026-02-02'});planner.plan({...edited,score:30});
assert.match(planner.plan({...edited,date:'2026-02-02'}).note,/30点.*55点/,'editing the previous day cannot leave a false cached comparison');
const material={...base,profileId:'changed-evidence'};planner.plan(material);
assert.match(planner.plan({...material,date:'2026-02-02',evidence:['流年66']}).note,/判断材料は昨日と異なり/);
const unknown=planner.plan({...base,generatedAction:true,evidence:['判定保留']});assert.match(unknown.action,/不足/);
const symbolic=adapter.applyDivination('カードの元資料',{...base,methodId:'tarot',generatedAction:true,action:'テーマ「新しい計画と準備」を現実の条件と照らし合わせる'});
assert.match(symbolic.text,/新しい計画と準備/,'daily application cannot erase the calculated symbolic theme');
const balanced=adapter.applyDivination('天文の元資料',{...base,methodId:'astrology',generatedAction:true,evidence:['天文計算 local','調和トランジット強度1.0','緊張トランジット強度6.0']});
assert.match(balanced.text,/緊張を示す配置の強さ6.0/,'opposing evidence cannot be clipped by a two-item limit');
const riskAlias=adapter.applyDivination('元資料',{...base,domain:'relationship',risk:95,action:'新しい約束を増やす'});
assert.match(riskAlias.text,/相談窓口/);assert.doesNotMatch(riskAlias.text,/新しい約束を増やす/);
for(const risk of [70,95]){
 const input={...base,date:'2026-03-01',domain:'health',generatedAction:true,psychRisk:risk,action:'必要な受診を優先する'};
 assert.equal(planner.plan(input).action,input.action);assert.match(planner.plan(input).angle.text,/安全/);
}
assert.doesNotThrow(()=>planner.plan({...base,profileId:'broken'},{storage:{getItem(){return '{broken'},setItem(){throw Error('quota')}}}));
const unavailableStorage={};Object.defineProperty(unavailableStorage,'localStorage',{get(){throw Error('blocked')}});
vm.runInNewContext(await readFile('src/reading/method-reading-continuity.js','utf8'),unavailableStorage);
assert.doesNotThrow(()=>unavailableStorage.KOYOMI_METHOD_CONTINUITY.plan(base));
assert.equal(planner.plan({...base,date:'2026-99-01'}),null);
const app=await readFile('app.html','utf8');assert.ok(app.includes('evidence:method.factors,methodId:key'));assert.ok(app.includes('generatedAction:true'));assert.ok(app.includes('method-reading-continuity.js'));
const calls=[],ui={value:'standard'},integration={selectedDate:new Date('2026-01-02T00:00:00Z'),V191Z_METHOD_LABEL:Object.fromEntries(methods.map(k=>[k,k])),THEMES:{work:'仕事'},v196RenderPersonalBase(){},v195History:()=>[],v195Psych:()=>({risk:0}),v191zMethodScore:key=>({score:55,conf:{score:75},factors:[key+'の実際の根拠']}),v191zMethodPlan:()=>['原案の行動'],v191zMode:()=> 'sister',fmtIso:()=> '2026-01-02',v196Generate:()=>({text:'overall'}),v195PersonalReasons:()=>[],$:id=>id==='readingModeSetting'?ui:null};
integration.window={KOYOMI_PERSONA_ADAPTER:{DOMAINS:{},applyDivination:(text,input)=>{calls.push(input);return{text:'rendered'}}}};
for(const name of ['Sukuyo','Kyusei','Astrology','Tarot','Runes','Name','Numerology','Kabbalah','Rokusei','Timing'])integration['v196Render'+name+'Summary']=()=>{};
vm.createContext(integration);const start=app.indexOf('renderPersonal=function(r){v196RenderPersonalBase(r)'),end=app.indexOf('\n',start);assert.ok(start>=0);
vm.runInContext(app.slice(start,end),integration);
integration.renderPersonal({i:{name:'検証用',birthDate:'1990-01-01',theme:'work'},score:55,divinations:Object.fromEntries(methods.map(k=>[k,'元の資料']))});
assert.equal(calls.length,11);for(const call of calls){assert.equal(call.evidence[0],call.methodId+'の実際の根拠');assert.equal(call.generatedAction,true);assert.ok(call.profileId);assert.equal(call.date,'2026-01-02');}
if(process.env.KOYOMI_METHOD_REPORT)await writeFile(process.env.KOYOMI_METHOD_REPORT,JSON.stringify({cases,metrics,samples:rows,scope:'Fixed computed-result fixtures stress 30-day method-specific continuity; these are not thousands of astronomical recalculations.'},null,2));
console.log('Method continuity passed: '+cases+' method/date cases');
