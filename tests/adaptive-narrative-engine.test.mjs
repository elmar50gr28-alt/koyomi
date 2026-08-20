import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const context={};
vm.runInNewContext(await readFile('src/reading/adaptive-narrative-engine.js','utf8'),context);
const engine=context.KOYOMI_ADAPTIVE_NARRATIVE;
const structures=new Set(),texts=new Set();
for(let i=0;i<210;i++){
 const state=['forward','test','protect'][i%3],domain=['overall','work','money','relationship','health'][i%5],contradiction=i%7===0;
 const out=engine.compose({domain,state,score:state==='forward'?78:state==='protect'?34:56,contradiction,seed:`case-${i}`,date:`2026-08-${String(i%28+1).padStart(2,'0')}`,variant:i,reasons:i%2?[`四柱推命：大運${i}`,'条件を整理すれば判断しやすくなります']:['相手の反応を見てから次を決められます'],action:'今日中に一つだけ確かめてください',history:[]});
 assert.equal(out.meta.quality.pass,true,`case ${i}: ${out.meta.quality.issues.join(',')}`);
 assert.doesNotMatch(out.text,engine.BANNED);
 assert.doesNotMatch(out.text,/必ず|絶対|確実に|間違いなく/);
 assert.match(out.text,/今日|いま|先に|進めて|代わりに/);
 structures.add(out.meta.structure);texts.add(out.text);
}
assert.equal(structures.size,7,`all structures must be reachable: ${[...structures]}`);
assert.ok(texts.size>=100,`expected rich variation, got ${texts.size}`);
const first=engine.compose({domain:'work',state:'test',seed:'repeat',history:[]});
const second=engine.compose({domain:'work',state:'test',seed:'repeat',history:[{narrative:{structure:first.meta.structure}}]});
assert.notEqual(second.meta.structure,first.meta.structure,'recent structure must be avoided when alternatives exist');
const unsafe=engine.audit('【今日の一手】\n必ず成功する。\n【止めること】\n四柱推命：大運76',{serious:false});
assert.equal(unsafe.pass,false);assert.ok(unsafe.issues.includes('technical-term'));assert.ok(unsafe.issues.includes('unsupported-certainty'));
const catalog=JSON.parse(await readFile('data/reading/adaptive_narrative_catalog.json','utf8'));
assert.equal(engine.register(catalog),true);
const app=await readFile('app.html','utf8'),worker=await readFile('service-worker.js','utf8');
for(const path of ['src/reading/adaptive-narrative-engine.js','data/reading/adaptive_narrative_catalog.json']){assert.ok(app.includes(path));assert.ok(worker.includes(`./${path}`))}
assert.ok(app.includes('adaptive?.compose'));
assert.ok(app.includes('finalQuality=adaptive?.audit'));
assert.ok(app.includes('reasons:narrative?[safeReason]:input.reasons'));
console.log(`Adaptive narrative engine passed: ${texts.size} texts / ${structures.size} structures`);
