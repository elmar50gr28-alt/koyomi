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
let fallbackCases=0;
for(const registered of [false,true]){
 const isolated={};vm.runInNewContext(await readFile('src/reading/adaptive-narrative-engine.js','utf8'),isolated);
 const fallback=isolated.KOYOMI_ADAPTIVE_NARRATIVE;if(registered)fallback.register(catalog);
 for(const domain of ['overall','work','money','relationship','health'])for(const state of ['forward','test','protect'])for(let day=1;day<=30;day++){
  const input={domain,state,score:state==='forward'?85:state==='protect'?30:55,date:`2026-01-${String(day).padStart(2,'0')}`,seed:domain+day};
  const out=fallback.compose(input);
  assert.equal(out.meta.quality.pass,true,`${registered}/${domain}/${state}/${day}: ${out.meta.quality.issues}`);
  assert.equal(out.meta.state,state);
  assert.equal(out.text.split(out.meta.action).length-1,1,'the primary action must not be repeated as a scene');
  assert.match(out.text,/具体的な根拠の説明がない/);
  assert.doesNotMatch(out.text,/準備と状況がかみ合い|動いた分だけ反応を確かめやすいから/);
  assert.doesNotMatch(out.text,/【今日、起こりやすいこと】/);
  assert.equal(fallback.compose(input).text,out.text);
  if(domain==='work')assert.doesNotMatch(out.text,/残高|維持費|不安を埋めるための連絡・買い物/);
  if(state==='protect'&&domain==='relationship')assert.doesNotMatch(out.meta.action,/話す機会/);
  if(domain==='health')assert.match(out.text,/医療機関への相談/);
  fallbackCases++;
 }
 for(let variant=0;variant<70;variant++){
  const action=catalog.scenes.work[0],out=fallback.compose({domain:'work',state:'test',seed:'equal-'+variant,action});
  assert.equal(out.text.split(action).length-1,1,'an explicit action equal to a scene appears only once');
  assert.equal(out.meta.action,action);
 }
 const explicit=fallback.compose({domain:'work',evidence:'確認すべき担当と期限があります',caution:'期限の合意が崩れたら引き受けないで。',action:'合意した担当を確認する'});
 assert.match(explicit.text,/確認すべき担当と期限があります/);assert.match(explicit.text,/期限の合意が崩れたら/);
 for(const domain of ['constructor','__proto__','toString'])assert.equal(fallback.compose({domain}).meta.domain,'overall');
 const unavailable=fallback.compose({domain:'work',score:90,evidence:'用神が未算出'});
 assert.match(unavailable.text,/揃っていない|不足している情報/);assert.match(unavailable.meta.action,/不足|補える/);
 for(const domain of ['relationship','health'])for(const risk of [70,74,95]){
  const urgent=fallback.compose({domain,score:90,risk,evidence:['判定保留'],action:'次の約束を増やす'});
  assert.equal(urgent.meta.state,'protect');assert.match(urgent.meta.action,/相談窓口|医療機関/);
  assert.doesNotMatch(urgent.text,/次の約束を増やす|迷いは半分|追い風/);
  assert.match(urgent.text,/情報が揃うのを待たず/);
 }
}
assert.equal(fallbackCases,900);
const app=await readFile('app.html','utf8'),worker=await readFile('service-worker.js','utf8');
for(const path of ['src/reading/adaptive-narrative-engine.js','data/reading/adaptive_narrative_catalog.json']){assert.ok(app.includes(path));assert.ok(worker.includes(`./${path}`))}
assert.ok(app.includes('adaptive?.compose'));
assert.ok(app.includes('finalQuality=adaptive?.audit'));
assert.ok(app.includes('reasons:narrative?[safeReason]:input.reasons'));
console.log(`Adaptive narrative engine passed: ${texts.size} texts / ${structures.size} structures / ${fallbackCases} standalone cases`);
