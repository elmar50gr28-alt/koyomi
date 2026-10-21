import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context={Math:Object.assign(Object.create(Math),{random(){throw new Error('No random readings');}})};
vm.runInNewContext(await readFile('src/reading/daily/daily-reading-core.js','utf8'),context);
const core=context.KOYOMI_DAILY_READING_CORE;
const base={profileId:'grounded-prose',date:'2026-05-02',dailyScore:25,themeCategory:'work',themeIds:['WORK_STEADY_PROGRESS'],themeEvidence:[{id:'WORK_STEADY_PROGRESS',label:'着実な前進'}]};
const recent=[{profileId:base.profileId,date:'2026-05-01',focusId:'prepare',actionId:'prepare-0'}];
const preferred=core.generate(base,recent);
assert.equal(preferred.focusId,'prepare','one recent reading cannot displace a supported theme while fresh checks remain');
assert.notEqual(preferred.actionId,'prepare-0');
assert.equal(preferred.rationale.themeId,'WORK_STEADY_PROGRESS');
const exhausted=core.FOCI.find(f=>f.id==='prepare').actions.map((_,i)=>({profileId:base.profileId,date:'2026-05-01',focusId:'prepare',actionId:`prepare-${i}`}));
const fallback=core.generate(base,exhausted);
assert.notEqual(fallback.focusId,'prepare','finite source assets may broaden within the consultation domain');
assert.equal(fallback.domain,'work');
assert.equal(fallback.rationale.themeId,null,'a broader life suggestion must not be attributed to the calculated theme');
const unrelated=core.generate({...base,themeCategory:'money'},recent);
assert.equal(unrelated.domain,'money');assert.equal(unrelated.rationale.themeId,null);

const reports=[];
for(const [themeCategory,themeId,label] of [['work','WORK_STEADY_PROGRESS','着実な前進'],['love','LOVE_OPEN_COMMUNICATION','率直な対話'],['health','HEALTH_REST_AND_RECOVERY','休息と回復'],['decision','ACTION_CAREFUL_DECISION','慎重な判断'],['money','MONEY_LONG_TERM_STABILITY','長い目で見る家計']]){
  for(const score of [25,55,85]){
    const rows=[];
    for(let day=1;day<=30;day++){
      const input={...base,themeCategory,themeIds:[themeId],themeEvidence:[{id:themeId,label}],date:`2026-06-${String(day).padStart(2,'0')}`,dailyScore:score};
      const row=core.generate(input,rows);
      assert.doesNotMatch(core.toText(row),/読み方です/);
      assert.equal(row.intensity,score<45?'protect':score>=70?'forward':'test');
      assert.ok(row.story.length>=180&&row.story.length<=950,'concrete paragraphs remain readable');
      assert.ok(!/undefined|NaN|\[object Object\]|小さく達す|15分だけ/.test(core.toText(row)));
      assert.equal(row.domain,core.requestedDomain(input));
      if(themeCategory==='money'&&/家族|共有|分担|立替|精算/.test(row.action))assert.ok(row.story.includes('お金の相談をするなら'),'shared costs receive a discussion reading, not a shopping reading');
      if(themeCategory==='health'&&/症状|経過/.test(row.action))assert.ok(row.story.includes('いつから、どんな場面で変わったか'),'symptom records receive an observation reading');
      assert.equal(JSON.stringify(row),JSON.stringify(core.generate(input,rows)),'same inputs and history reproduce the same reading');
      if(row.rationale.themeId)assert.equal(row.grounding.evidenceFit,12);
      rows.unshift(row);
    }
    const storyRepeatRate=1-new Set(rows.map(r=>r.story)).size/30;
    const actionRepeatRate=1-new Set(rows.map(r=>r.actionId)).size/30;
    assert.equal(storyRepeatRate,0);assert.ok(actionRepeatRate<=.2+Number.EPSILON);
    reports.push({themeCategory,score,storyRepeatRate,actionRepeatRate,sourceLinked:rows.filter(r=>r.rationale.themeId).length});
  }
}
for(const limits of [{confidence:.2},{contradiction:true},{longTermScore:25}])assert.equal(core.generate({...base,dailyScore:95,...limits}).intensity,'test','strong daily signal cannot override limited/conflicting conditions');
console.log('Grounded daily prose: 450 continuous readings, fresh source priority, honest exhaustion, deterministic copy and strength guards passed');
console.log(JSON.stringify(reports));
