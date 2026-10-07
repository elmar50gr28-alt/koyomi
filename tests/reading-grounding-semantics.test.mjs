import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const context={Math:Object.assign(Object.create(Math),{random(){throw Error('random forbidden');}})};
for(const file of ['src/reading/app-narrative-engine.js','src/persona/conversation-adapter.js','src/reading/daily/daily-reading-core.js','src/reading/daily/daily-reading-controller.js'])vm.runInNewContext(await readFile(file,'utf8'),context);
const engine=context.KOYOMI_APP_NARRATIVE,core=context.KOYOMI_DAILY_READING_CORE,adapter=context.KOYOMI_PERSONA_ADAPTER,controller=context.KOYOMI_DAILY_READING;

for(const [raw,expected] of [['大運65','長期の指標65'],['流年42','年ごとの指標42'],['調和トランジット強度3.2','調和を示す配置の強さ3.2'],['自分の立場愚者逆位置','自分の立場愚者（反転）']]){
 assert.equal(engine.publicEvidence(raw),expected);
 const result=engine.compose({domain:'work',score:60,evidence:[raw],confidence:80});
 assert.ok(result.blocks.find(b=>b.role==='conclusion').text.includes(expected));
 assert.ok(result.blocks.find(b=>b.role==='reason')?.text.includes(expected)||result.text.includes(expected));
 assert.doesNotMatch(result.text,/複数の材料が同じ方向/,'one fact must not be presented as independent corroboration');
 assert.doesNotMatch(result.text,engine.FORBIDDEN);
}
const unsupported=engine.compose({domain:'work',score:88,evidence:['入力条件を確認済み']});
assert.doesNotMatch(unsupported.blocks.find(b=>b.role==='conclusion').text,/入力条件を確認済み/);
const missing=engine.compose({score:88,evidence:['四柱推命の用神']});
assert.match(missing.blocks.find(b=>b.role==='conclusion').text,/今回の判定/);
assert.doesNotMatch(missing.text,/複数の材料が同じ方向|準備と状況がかみ合っているため/);
for(const flag of [{confidence:30},{contradiction:true},{risk:95}]){
 const result=engine.compose({domain:'work',score:88,evidence:['長期の指標80'],...flag});
 assert.match(result.blocks.find(b=>b.role==='conclusion').text,/限られる|異なる傾向|安全上/);
}

const expected={work:/担当|期限/,money:/総額|継続費/,relationship:/約束|距離/,health:/悪化|医療機関/,growth:/教材|理解/,timing:/準備|合意/};
for(const [domain,pattern] of Object.entries(expected))for(const system of Object.keys(adapter.DOMAINS)){
 const fallback=adapter.concreteScenario({system,domain,score:60});
 assert.match(fallback.stop,pattern);
 assert.equal(fallback.stop,engine.boundary({domain}),'common and fallback boundaries agree');
 const rendered=adapter.applyDivination('元の専門資料',{system,domain,score:60,action:'明示された必要な対応を確認する',level:'standard'});
 assert.match(rendered.text,pattern);
 assert.match(rendered.text,/明示された必要な対応を確認する/);
 if(domain==='work')assert.doesNotMatch(fallback.stop,/支払い|体調/);
}
for(const [alias,domain] of [['career','work'],['income','money'],['love','relationship'],['healthrhythm','health'],['identity','growth']]){
 assert.equal(adapter.concreteScenario({domain:alias}).stop,engine.boundary({domain}));
}
for(const domain of ['constructor','toString','__proto__']){
 assert.equal(adapter.concreteScenario({domain}).stop,engine.boundary({domain:'overall'}));
 assert.equal(engine.compose({domain}).frame.domain,'overall');
}
assert.match(engine.compose({domain:'health',risk:95,score:99}).text,/受診や休息を遅らせる/);
assert.match(engine.compose({domain:'relationship',risk:95,score:99}).text,/暴言・脅し・監視/);
assert.match(engine.compose({domain:'work',caution:'危険な作業は中止して責任者へ相談してください。'}).text,/危険な作業は中止/);

assert.equal(core.actionKind('睡眠時間を記録して確かめる'),'verify','a sleep observation is not a rest action');
assert.equal(core.actionKind('依頼の期限を確認する'),'verify','a dependency check is not delegation');
assert.equal(core.actionKind('急がない仕事を人に依頼する'),'delegate');
assert.equal(core.actionKind('休む時間を確保する'),'rest');
const base={profileId:'semantic',date:'2026-01-15',dayKey:'甲子',dailyScore:60,themeCategory:'work'};
const label='仕事の着実な進展';
const grounded=core.generate({...base,themeIds:['WORK_STEADY_PROGRESS'],themeEvidence:[{id:'WORK_STEADY_PROGRESS',label}]});
if(grounded.rationale.themeId)assert.match(grounded.story,/仕事の着実な進展/);
const unrelated=core.generate({...base,themeIds:['WORK_STEADY_PROGRESS'],themeEvidence:[{id:'MONEY_LONG_TERM_STABILITY',label:'お金だけの根拠'}]});
assert.doesNotMatch(unrelated.story,/お金だけの根拠/);
const mixed=core.generate({...base,dailyScore:90,longTermScore:30});
assert.equal(mixed.intensity,'test');
assert.match(mixed.story,/日運は強めでも長期の判定は慎重/);
const prior=core.generate({...base,date:'2026-01-14'});
const oldHistory=JSON.parse(JSON.stringify([prior]));delete oldHistory[0].actionKind;
assert.equal(JSON.stringify(core.generate(base,oldHistory)),JSON.stringify(core.generate(base,[prior])),'old stored IDs recover the same semantic category');
assert.equal(JSON.stringify(core.generate(base,[{...prior,profileId:'someone-else'}])),JSON.stringify(core.generate(base,[])),'other profiles cannot affect repetition suppression');

const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
const first=controller.getOrCreate(base,{storage}).reading;
assert.equal(controller.recent('semantic',{storage})[0].actionKind,first.actionKind);
assert.equal(controller.getOrCreate(base,{storage}).source,'cache');
const changed=controller.getOrCreate({...base,themeIds:['WORK_STEADY_PROGRESS'],themeEvidence:[{id:'WORK_STEADY_PROGRESS',label}]},{storage});
assert.equal(changed.source,'generated','new grounding must invalidate the cached text');

let baseline;
if(process.env.KOYOMI_SEMANTIC_BASELINE){const ctx={};vm.runInNewContext(await readFile(process.env.KOYOMI_SEMANTIC_BASELINE,'utf8'),ctx);baseline=ctx.KOYOMI_DAILY_READING_CORE;}
const metrics=[],samples=[];
function sequence(module,themeCategory,dailyScore){const history=[],rows=[];for(let day=1;day<=90;day++){
 const date=new Date(Date.UTC(2026,0,day)).toISOString().slice(0,10),input={...base,date,themeCategory,dailyScore,themeIds:['WORK_STEADY_PROGRESS'],themeEvidence:[{id:'WORK_STEADY_PROGRESS',label}]};
 const row=module.generate(input,history);rows.push(row);history.unshift(row);
 if(module===core){assert.equal(JSON.stringify(module.generate(input,history.filter(r=>r.date!==date))),JSON.stringify(row));assert.equal(row.intensity,dailyScore<45?'protect':dailyScore>=70?'forward':'test');assert.equal(row.actionKind,core.actionKind(row.action,row.focusId));}
 }return rows;}
function measure(rows){const kinds=rows.map(r=>core.actionKind(r.action,r.focusId));return {adjacentKindRepeats:kinds.slice(1).filter((kind,i)=>kind===kinds[i]).length,distinctKinds:new Set(kinds).size,exactRepeatRate30:Number((1-new Set(rows.slice(0,30).map(r=>r.actionId)).size/30).toFixed(3))};}
// Frozen pre-change bounds from the same 90-day signals, measured with this classifier.
const beforeBounds={overall:[18,10,16],work:[42,12,26],love:[23,30,36],money:[22,22,22],health:[14,14,14],family:[23,30,36],decision:[20,20,20],future:[20,20,20]};
for(const theme of ['overall','work','love','money','health','family','decision','future'])for(const score of [0,60,90]){
 const rows=sequence(core,theme,score),metric={theme,score,after:measure(rows)};
 assert.ok(metric.after.exactRepeatRate30<=0.2);
 assert.ok(metric.after.adjacentKindRepeats<beforeBounds[theme][[0,60,90].indexOf(score)],`${theme}/${score}: meaning repetition should improve over the reviewed baseline`);
 if(baseline)metric.before=measure(sequence(baseline,theme,score));
 metrics.push(metric);if(score===60)samples.push({theme,readings:rows.slice(0,3).map(r=>({date:r.date,actionKind:r.actionKind,text:core.toText(r)}))});
}
if(baseline){const before=metrics.reduce((n,m)=>n+m.before.adjacentKindRepeats,0),after=metrics.reduce((n,m)=>n+m.after.adjacentKindRepeats,0);assert.ok(after<before,`semantic repetition must improve overall: ${before} -> ${after}`);}
if(process.env.KOYOMI_SEMANTIC_REPORT)await writeFile(process.env.KOYOMI_SEMANTIC_REPORT,JSON.stringify({cases:2160,metrics,samples,scope:'Fixed daily signals stress history selection. Action kinds are conservative authored-text rules, not an embedding similarity or user satisfaction score.'},null,2));
console.log('Reading grounding / semantic history / domain boundaries passed: 2160 readings; 24 fixed-signal contexts improve over the reviewed baseline');
