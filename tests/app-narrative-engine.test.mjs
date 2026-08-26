import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const context={};
for(const file of ['app-narrative-engine.js','universal-reading-engine.js','adaptive-narrative-engine.js'])vm.runInNewContext(await readFile(`src/reading/${file}`,'utf8'),context);
const engine=context.KOYOMI_APP_NARRATIVE,universal=context.KOYOMI_UNIVERSAL_READING,adaptive=context.KOYOMI_ADAPTIVE_NARRATIVE;
assert.equal(engine.VERSION,'2.0.0');
assert.ok(engine.CONCEPTS.length>=30);

const surfaces=['personal','compatibility','timeline','oracle','qimen','mundane','today','method'];
const domains=['overall','work','money','relationship','health','growth','timing'];
const directions=['forward','test','protect'];
const structures=new Set(),texts=new Set();
let cases=0;
for(const surface of surfaces)for(const domain of domains)for(const direction of directions)for(let variant=0;variant<4;variant++){
 const result=engine.compose({surface,domain,direction,score:direction==='forward'?79:direction==='protect'?31:56,confidence:40+variant*15,risk:surface==='compatibility'&&variant===3?80:10,contradiction:variant===2,subject:'今回の相談',evidence:variant%2?['確認できる変化があります','負担も残っています']:['四柱推命の用神','西洋占星術の第10室'],seed:`${surface}-${domain}-${direction}-${variant}`,variant});
 assert.equal(result.meta.quality.pass,true,`${surface}/${domain}/${direction}/${variant}: ${result.meta.quality.issues}`);
 assert.doesNotMatch(result.text,engine.FORBIDDEN);
 assert.doesNotMatch(result.text,/必ず|絶対|確実に|間違いなく/);
 assert.ok(result.blocks.length>=3);
 assert.equal(result.frame.surface,surface);
 assert.ok(result.meta.attempt<9);
 structures.add(result.meta.structure);texts.add(result.text);cases++;
}
assert.equal(cases,672);
assert.ok(structures.size>=8,`structure diversity: ${structures.size}`);
assert.ok(texts.size>=400,`text diversity: ${texts.size}`);

const serious=engine.compose({surface:'compatibility',domain:'relationship',direction:'forward',score:88,risk:95,actions:['今すぐ復縁する'],seed:'serious'});
assert.equal(serious.frame.direction,'protect');
assert.doesNotMatch(serious.text,/冗談|笑って|景気よく/);
assert.match(serious.text,/信頼できる人や相談窓口/);
assert.match(serious.text,/暴言・脅し・監視/);

const contradiction=engine.compose({surface:'personal',domain:'work',contradiction:true,seed:'contradiction'});
assert.ok(contradiction.blocks.some(block=>block.role==='contrast'));
const lowConfidence=engine.compose({surface:'personal',domain:'timing',confidence:30,seed:'low-confidence'});
assert.match(lowConfidence.text,/可能性の一つ/);
assert.match(lowConfidence.text,/進み具合・負担・条件の変化/);

const ordinary=engine.compose({surface:'personal',domain:'overall',subject:'人格を尊重する選択',evidence:'運命を考える',seed:'ordinary'});
assert.match(ordinary.text,/人格を尊重する選択/);

const answer=universal.build({type:'today',domain:'work',subject:'今日の仕事',score:64,evidence:['作業の準備が整っています'],actions:['重要な連絡を一件送る'],seed:'universal'});
assert.ok(answer.narrative);
assert.equal(answer.narrative.frame.surface,'today');
assert.match(answer.directAnswer,/仕事|準備|進め|試す|状態/);
assert.ok(answer.actionPlan[0].action);

const delegated=adaptive.compose({domain:'money',state:'test',score:55,action:'総額を確認する',seed:'delegate'});
assert.ok(delegated.meta.semanticFrame);
assert.equal(delegated.meta.domain,'money');

const methodContext={};
vm.runInNewContext(await readFile('src/reading/app-narrative-engine.js','utf8'),methodContext);
vm.runInNewContext(await readFile('src/persona/conversation-adapter.js','utf8'),methodContext);
const publicMethod=methodContext.KOYOMI_PERSONA_ADAPTER.applyDivination('【専門資料】\n日主・用神・空亡',{system:'四柱推命',domain:'work',score:58,confidence:72,evidence:['担当を整理できる'],action:'期限を確認する',level:'beginner'});
assert.ok(publicMethod.narrative);
assert.doesNotMatch(publicMethod.text,/日主|用神|空亡|専門資料/);
const detailedMethod=methodContext.KOYOMI_PERSONA_ADAPTER.applyDivination('【専門資料】\n日主・用神・空亡',{system:'四柱推命',domain:'work',score:58,evidence:['担当を整理できる'],action:'期限を確認する',level:'detailed'});
assert.match(detailedMethod.text,/【詳しい鑑定資料】/);
assert.match(detailedMethod.text,/日主・用神・空亡/);

const [app,today,worker]=await Promise.all([readFile('app.html','utf8'),readFile('today.html','utf8'),readFile('service-worker.js','utf8')]);
for(const source of [app,today,worker])assert.ok(source.includes('src/reading/app-narrative-engine.js'));
assert.ok(app.indexOf('app-narrative-engine.js')<app.indexOf('universal-reading-engine.js'));
assert.ok(today.indexOf('app-narrative-engine.js')<today.indexOf('universal-reading-engine.js'));
assert.ok(app.includes("domain:r.i?.qFocus||r.i?.theme||'overall'"));
console.log(`App narrative engine passed: ${cases} cases / ${texts.size} texts / ${structures.size} structures`);
