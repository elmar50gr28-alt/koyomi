import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context={};
for(const path of ['src/reading/calculation-readiness.js','src/reading/integrated-judgment-core.js','src/reading/meaning-evidence-translator.js'])vm.runInNewContext(readFileSync(path,'utf8'),context);
const core=context.KOYOMI_INTEGRATED_JUDGMENT,readiness=context.KOYOMI_CALCULATION_READINESS;
const valid={id:'shichu',system:'四柱推命',score:80,confidence:80,evidence:['確認した命式'],timing:['確認できた時期'],supportConditions:['条件を確認して提出する']};
const missing={id:'name',system:'姓名判断',score:8,confidence:{score:95,available:false},evidence:['判定保留'],timing:['使えない時期'],cautionConditions:['使えない注意']};
const clean=core.build({signals:[valid]}),mixed=core.build({signals:[valid,missing],priority:['name']});
for(const key of ['score','state','confidence','coverage','contradiction','spread','evidence','timing','supportConditions','cautionConditions','supportingSystems','cautionSystems'])assert.equal(JSON.stringify(mixed[key]),JSON.stringify(clean[key]),`withheld reading must not alter ${key}`);
assert.equal(mixed.signals.find(s=>s.id==='name').weight,0);
assert.ok(mixed.withheldSystems.includes('姓名判断'));
for(const input of [[],[missing],[{...valid,confidence:0}],[{...valid,confidence:null}],[{...valid,score:NaN}]]){
 const result=core.build({signals:input});assert.equal(result.status,'insufficient');assert.equal(result.scoreAvailable,false);assert.equal(result.score,50,'neutral compatibility value, never a calculated fortune');assert.equal(result.confidence,0);assert.equal(result.coverage,0);assert.equal(result.evidence.length,0);assert.equal(result.supportingSystems.length,0);assert.equal(result.cautionSystems.length,0);
 assert.match(context.KOYOMI_MEANING_EVIDENCE.translate(result).join(''),/材料が揃っていません/);
}
assert.equal(core.build({signals:[{...valid,evidence:['出生時刻未入力のため時柱は参考'],confidence:{score:55,available:true}}]}).scoreAvailable,true,'missing optional data must not suppress an otherwise available calculation');
const legacyValid={key:'shichu',label:'四柱推命',score:80,conf:{score:80,available:true},factors:['確認した命式']},legacyMissing={key:'name',label:'姓名判断',score:0,conf:{score:95,available:false},factors:['判定保留']};
assert.equal(core.summarizeLegacy([legacyValid,legacyMissing],m=>m.key==='name'?100:1).score,80);
assert.equal(core.summarizeLegacy([legacyValid,legacyMissing]).spread,0);
assert.equal(core.summarizeLegacy([legacyMissing]).scoreAvailable,false);
for(const [method,input]of [['sukuyo',{}],['kyusei',{}],['name',{}],['kabbalah',{hasRomanName:false}]]){
 const result=readiness.assess(method,{validDate:true,...input});assert.equal(result.available,false,method);
}
assert.equal(readiness.assess('shichu',{validDate:true,timeAccuracy:'unknown'}).available,true,'missing optional time is a partial reading, not a withheld method');
let previous;for(let day=1;day<=30;day++){
 const signals=[{...valid,score:30+day}];const expected=core.build({domain:'work',signals});
 const actual=core.build({domain:'work',priority:['name'],signals:[...signals,{...missing,score:day%2?0:100,evidence:[day%2?'判定保留':'画数未登録']}]});
 assert.equal(actual.score,expected.score);assert.equal(actual.spread,0);assert.equal(actual.contradiction,false);if(previous)assert.equal(actual.score-previous,1);previous=actual.score;
}
const app=readFileSync('app.html','utf8'),cells=new Map(),box={querySelector:key=>{if(!cells.has(key))cells.set(key,{textContent:''});return cells.get(key)}};
context.$=id=>id==='summary'?box:{};
context.v191zMethodScore=()=>({score:50,available:false,grade:readiness.unavailableGrade(),factors:['判定保留'],conf:{label:'要確認',notes:['未登録文字があります']}});
context.v191zMethodPlan=()=>['使ってはいけない前進案','','','使ってはいけない注意案'];
const summaryStart=app.indexOf('function v196RenderMethodSummary(');
vm.runInNewContext(app.slice(summaryStart,app.indexOf('function v196RenderSukuyoSummary(',summaryStart)),context);
context.v196RenderMethodSummary({},'name','reading','summary');
assert.doesNotMatch(cells.get('[data-method-summary="conclusion"]').textContent,/50|平|吉|凶/);
assert.match(cells.get('[data-method-summary="conclusion"]').textContent,/判定保留/);
assert.doesNotMatch(cells.get('[data-method-summary="action"]').textContent,/前進案/);
context.v191zMode=()=> 'zubat';
vm.runInNewContext(app.split(/\r?\n/).find(row=>row.startsWith('function v191zDirectVoice(')),context);
assert.doesNotMatch(context.v191zDirectVoice(context.v191zMethodScore(),{}),/50|やってください|吉なら/);
vm.runInNewContext(app.split(/\r?\n/).find(row=>row.startsWith('function v191zConcreteLayer(')),context);
const withheldDetails=context.v191zConcreteLayer('name',{});
assert.match(withheldDetails,/判定保留/);assert.doesNotMatch(withheldDetails,/50|24時間|前進案|注意案/);
const nodes=Object.fromEntries(['personalScore','precisionSummary','overallReading'].map(id=>[id,{textContent:''}]));
context.window=context;context.$=id=>nodes[id];context.KOYOMI_MEANING_EVIDENCE=context.KOYOMI_MEANING_EVIDENCE;
context.v202IntegratedJudgment=()=>core.build({signals:[missing]});context.v202IntegratedRenderBase=()=>{nodes.personalScore.textContent='50';nodes.overallReading.textContent='進める日です。'};
context.v191zGrade=()=>({label:'平'});
vm.runInNewContext(app.split(/\r?\n/).find(row=>row.startsWith('renderPersonal=function(r){if(!r)return v202IntegratedRenderBase(r);')),context);
const personal={};context.renderPersonal(personal);assert.equal(nodes.personalScore.textContent,'—');assert.equal(personal.grade.label,'判定保留');assert.match(nodes.overallReading.textContent,/材料が揃っていません/);assert.doesNotMatch(nodes.overallReading.textContent,/進める日/);assert.equal(context.KOYOMI_ACTIVE_JUDGMENT,undefined);
console.log('Unavailable readings: exclusion from scores/evidence/agreement, all-missing state and 30-day transitions passed');

// The final persona layer must not replace withheld text with advice or a review date.
const personaStart=app.indexOf("const method=v191zMethodScore(key,r);if(method.available===false");
assert.ok(personaStart>0);
const personaGuard=app.slice(personaStart,app.indexOf('const plan=v191zMethodPlan(key,r)',personaStart));
const methodNode={textContent:''};context.$=()=>methodNode;
context.r={divinations:{kabbalah:'old advice'}};context.key='kabbalah';
vm.runInNewContext('(function(){'+personaGuard+'})()',context);
assert.equal(context.r.divinations.kabbalah,methodNode.textContent);
assert.match(methodNode.textContent,/判定保留/);assert.doesNotMatch(methodNode.textContent,/14日後|前日との違い|お守り|前進案/);
