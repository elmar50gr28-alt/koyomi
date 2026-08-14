import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const context={};vm.runInNewContext(await readFile('src/reading/integrated-judgment-core.js','utf8'),context);const core=context.KOYOMI_INTEGRATED_JUDGMENT;
const base=[
 {id:'shichu',system:'四柱推命',score:76,confidence:90,evidence:['大運76'],supportConditions:['役割を明確にする']},
 {id:'timing',system:'大運・暦',score:72,confidence:88,evidence:['流年72'],timing:['今月']},
 {id:'astrology',system:'西洋占星術',score:68,confidence:82,evidence:['調和角'],timing:['月末']},
 {id:'tarot',system:'タロット',score:38,confidence:70,evidence:['障害 逆位置'],cautionConditions:['即決しない']},
 {id:'name',system:'姓名判断',score:50,confidence:20,evidence:['判定保留','画数未登録']}
];
const result=core.build({domain:'work',signals:base});
assert.equal(result.schemaId,'koyomi-integrated-judgment');assert.equal(result.domain,'work');assert.ok(result.score>60);assert.equal(result.contradiction,true);assert.ok(result.confidence<90);assert.ok(result.supportingSystems.includes('四柱推命'));assert.ok(result.cautionSystems.includes('タロット'));assert.equal(result.signals.find(x=>x.id==='name').available,false);assert.ok(result.evidence.length);
const relationship=core.build({domain:'relationship',signals:[{id:'sukuyo',score:80,confidence:90},{id:'shichu',score:60,confidence:90}]});assert.ok(relationship.score>65,'domain expertise must affect weighting');
const prioritized=core.build({domain:'overall',priority:['tarot'],signals:[{id:'tarot',score:20,confidence:100},{id:'shichu',score:80,confidence:100}]});assert.ok(prioritized.score<50,'explicit priority must affect the result without becoming absolute');
for(let i=0;i<90;i++){const signals=base.map((item,index)=>({...item,score:20+((i*17+index*13)%77),evidence:[`${item.system}-${i}`]})),reading=core.build({domain:core.DOMAINS[i%core.DOMAINS.length],signals});assert.ok(reading.score>=0&&reading.score<=100);assert.ok(reading.confidence>=0&&reading.confidence<=100);assert.ok(['forward','protect','test'].includes(reading.state));assert.equal(reading.evidence.length,new Set(reading.evidence.map(x=>`${x.system}:${x.text}`)).size)}
assert.equal(JSON.stringify(core.build({domain:'work',signals:base})),JSON.stringify(core.build({domain:'work',signals:base})),'same input must be deterministic');
const [app,worker]=await Promise.all([readFile('app.html','utf8'),readFile('service-worker.js','utf8')]);assert.ok(app.includes('src/reading/integrated-judgment-core.js'));assert.ok(worker.includes('./src/reading/integrated-judgment-core.js'));assert.ok(app.includes('src/reading/meaning-evidence-translator.js'));assert.ok(worker.includes('./src/reading/meaning-evidence-translator.js'));assert.ok(app.includes('function v202IntegratedJudgment'));assert.ok(app.includes("oracle:['tarot','runes']"));assert.ok(app.includes('r.integratedEvidence=judgment.evidence'));assert.ok(app.includes('r.meaningEvidence=translator?translator.translate(judgment):[]'));assert.ok(app.indexOf('v202IntegratedRenderBase=renderPersonal')<app.indexOf('v200FuriganaRenderBase=renderPersonal'),'integrated scoring must run before final rendering wrappers');
console.log('Integrated judgment core passed: 90 simulations');
