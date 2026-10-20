import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile('src/reading/daily/daily-reading-core.js','utf8'),controllerSource=await readFile('src/reading/daily/daily-reading-controller.js','utf8');
function boot(){const context={Math:Object.assign(Object.create(Math),{random(){throw Error('random discovery');}})};vm.runInNewContext(source,context);vm.runInNewContext(controllerSource,context);return context;}
const context=boot(),core=context.KOYOMI_DAILY_READING_CORE;
const base={profileId:'discovery',date:'2026-07-01',dailyScore:55,themeCategory:'money',evidence:['固定した占術の根拠']};
const first=core.generate(base),nextInput={...base,date:'2026-07-02'};
const left=core.generate(nextInput,[{...first,discoveryId:'money-0'}]),right=core.generate(nextInput,[{...first,discoveryId:'money-1'}]);
for(const field of ['focusId','score','intensity','actionId','cautionId','sceneId','structureId'])assert.equal(left[field],right[field],`a discovery cannot alter ${field}`);
assert.notEqual(left.discoveryId,right.discoveryId);
const skewed=Array.from({length:10},(_,i)=>({...first,date:`2026-06-${String(20+i).padStart(2,'0')}`,discoveryId:'money-1'}));
assert.equal(core.generate(nextInput,[...skewed,{...first,discoveryId:'money-0'}]).discoveryId,'money-1','yesterday takes precedence over uneven older usage counts');
assert.ok(left.story.includes('昨日の着眼点'));assert.ok(left.story.includes(left.discovery.text));
assert.ok(left.review.includes(left.discovery.review));assert.equal(left.showDifference,false,'a new viewpoint is not a new fortune strength');
assert.ok(!core.toText(left).includes('【流れの変化】'));
for(const discoveryId of [undefined,null,{},['money-0'],'health-0','money-999']){
 const old=core.generate(nextInput,[{...first,discoveryId}]);assert.equal(old.connection,'','old or invalid metadata must not invent a prior viewpoint');
}
assert.equal(core.generate({...base,date:'2026-07-03'},[first]).connection,'','a gap in visits is not yesterday');
assert.equal(core.generate(nextInput,[{...first,profileId:'other-person'}]).connection,'');
const memory=new Map(),storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
context.KOYOMI_DAILY_READING.getOrCreate(base,{storage});
const restarted=boot().KOYOMI_DAILY_READING;
const second=restarted.getOrCreate(nextInput,{storage}).reading;
assert.notEqual(second.discoveryId,first.discoveryId,'the previous viewpoint survives a restart');
assert.ok(restarted.recent(base.profileId,{storage})[0].discoveryId);
assert.equal(restarted.getOrCreate(nextInput,{storage}).source,'cache');
assert.equal(JSON.stringify(restarted.getOrCreate(nextInput,{storage}).reading),JSON.stringify(second));
let full=true,stored=null;
const fullStorage={getItem:()=>stored,setItem:(_key,value)=>{if(full)throw Error('QuotaExceededError');stored=value;}};
const fallbackController=boot().KOYOMI_DAILY_READING;
const unsaved=fallbackController.getOrCreate(base,{storage:fullStorage}).reading;
assert.equal(fallbackController.getOrCreate(base,{storage:fullStorage}).source,'cache','quota failure must not regenerate the same day');
const unsavedNext=fallbackController.getOrCreate(nextInput,{storage:fullStorage}).reading;
assert.notEqual(unsavedNext.discoveryId,unsaved.discoveryId,'quota failure retains discovery history in this session');
assert.equal(fallbackController.recent(base.profileId,{storage:fullStorage}).length,2);
full=false;
fallbackController.getOrCreate({...base,date:'2026-07-03'},{storage:fullStorage});
assert.equal(boot().KOYOMI_DAILY_READING.recent(base.profileId,{storage:fullStorage}).length,3,'storage recovery persists the pending history');
full=true;fallbackController.getOrCreate({...base,date:'2026-07-04'},{storage:fullStorage});
stored='{"cache":{},"history":[]}';
assert.equal(fallbackController.recent(base.profileId,{storage:fullStorage}).length,0,'external storage replacement must discard stale session state');

let cases=0;const questions=new Set();
for(const themeCategory of ['overall','work','love','money','health','family','growth','decision'])for(const dailyScore of [25,55,85]){
 const rows=[];
 for(let day=1;day<=30;day++){
  const input={...base,themeCategory,dailyScore,date:`2026-08-${String(day).padStart(2,'0')}`};
  const row=core.generate(input,rows),yesterday=rows[0];
  assert.ok(row.discoveryId.startsWith(row.focusId+'-'));assert.ok(row.story.includes(row.discovery.text));assert.ok(row.review.includes(row.discovery.review));
  assert.deepEqual(JSON.parse(JSON.stringify(row.evidence)),base.evidence);
  assert.equal(row.intensity,dailyScore<45?'protect':dailyScore>=70?'forward':'test');
  if(yesterday?.focusId===row.focusId)assert.notEqual(row.discoveryId,yesterday.discoveryId,'the same topic must use a different observation from yesterday');
  assert.doesNotMatch(core.toText(row),/できたから|昨日.*できたので|昨日.*したので|undefined|NaN|\[object Object\]/);
  questions.add(row.discovery.text);rows.unshift(row);cases++;
 }
 assert.equal(new Set(rows.map(r=>r.story)).size,30);
 assert.ok(1-new Set(rows.map(r=>r.actionId)).size/30<=.2+Number.EPSILON,themeCategory+'/'+dailyScore+' unique actions='+new Set(rows.map(r=>r.actionId)).size);
}
assert.equal(questions.size,40,'all 20 focus-specific pairs are reachable');
console.log(`Daily discovery: ${cases} readings, ${questions.size} observations, source/strength invariance, matching reviews, honest yesterday links and restart/cache checks passed`);
