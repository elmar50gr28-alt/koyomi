import assert from 'node:assert/strict';
import {calculateBazi,buildBaziReading} from '../src/bazi/index.js';

const profile={birthData:{date:'1990-06-15',timeUnknown:true,place:{longitude:139.75,latitude:35.69,utcOffset:9}}};
const source=calculateBazi(profile),original=structuredClone(source);
const altered=values=>{const result=structuredClone(source);result.integratedReadingData.analysis.favorableElements=values;return result};
const read=result=>buildBaziReading(result,{locale:'ja'});
const missing=read(altered([]));
assert.deepEqual(missing.calculationSummary.favorable,[]);
assert.match(missing.executiveSummary.centralTheme,/用神候補.*保留/);
assert.match(missing.sections.overall.evidenceSummary,/日主は辛.*身弱.*特定しません/);
for(const id of ['overall','talent','creation','advice']){
 const section=missing.sections[id];assert.match(section.conclusion,/未確定.*保留/);
 assert.match(section.action,/判定は保留/);
 assert.ok(section.unresolvedFactors.includes('favorable-elements-undetermined'));
 assert.doesNotMatch(section.conclusion,/保留するを|状態を示|undefined|null/);
}
assert.doesNotMatch(missing.executiveSummary.integratedGuidance.pressure,/整理・判断・境界線|に偏る/,'no cautionary element may be invented from the day master');
assert.match(missing.sections.health.avoidance,/医療|専門家/,'missing favorable elements must preserve health guidance');
assert.match(missing.sections.finance.action,/支出/,'independent practical guidance remains available');
assert.equal(missing.calculationSummary.strengthLabel,'身弱','missing favorable elements do not erase natal facts');

const invalid=read(altered(['regular-shang_guan','invalid']));
assert.deepEqual(invalid.calculationSummary.favorable,[]);assert.match(invalid.sections.overall.conclusion,/保留/);
const mixed=read(altered(['regular-shang_guan','water','wood','water']));
assert.deepEqual(mixed.calculationSummary.favorable,['water','wood']);
assert.match(mixed.sections.overall.evidenceSummary,/水が重視/,'skip non-element IDs before choosing the primary candidate');
assert.doesNotMatch(mixed.sections.overall.evidenceSummary,/土が重視/);

const english=buildBaziReading(altered([]),{locale:'en'});
assert.match(english.sections.advice.conclusion,/undetermined/);
assert.doesNotMatch(english.sections.advice.conclusion,/earth|daily routine|schedule|money/);
assert.doesNotMatch(english.professionalText,/yongshen=null|favorable=null|undefined/);

// Legacy results can supply an explicit candidate, but cannot borrow the natal element.
const legacy=structuredClone(source);delete legacy.integratedReadingData;
delete legacy.favorableElements.favorable;delete legacy.yongshen.favorable;delete legacy.yongshen.favorableElements;
legacy.yongshen.primary={element:'wood'};
assert.deepEqual(read(legacy).calculationSummary.favorable,['wood']);
delete legacy.yongshen.primary;
assert.deepEqual(read(legacy).calculationSummary.favorable,[]);
assert.match(read(legacy).sections.overall.conclusion,/保留/);

// Switching between valid and missing candidates must not retain yesterday's advice.
let cases=0;
for(let day=1;day<=30;day++){
 const result=calculateBazi(profile,undefined,{referenceDate:new Date(Date.UTC(2026,9,day,3))}),before=structuredClone(result);
 const valid=read(result);assert.ok(valid.calculationSummary.favorable.length>0);
 result.integratedReadingData.analysis.favorableElements=[];
 for(const locale of ['ja','en']){
  const reading=buildBaziReading(result,{locale});assert.deepEqual(reading.calculationSummary.favorable,[]);
  assert.match(reading.sections.advice.action,locale==='ja'?/判定は保留/:/undetermined/);
  assert.deepEqual(reading.calculationSummary.elementBalance,valid.calculationSummary.elementBalance);
  cases++;
 }
 result.integratedReadingData.analysis.favorableElements=before.integratedReadingData.analysis.favorableElements;
 assert.equal(read(result).sections.advice.action,valid.sections.advice.action);
 assert.deepEqual(result,before,'rendering does not alter source results');
}
assert.deepEqual(source,original);
console.log(`Bazi element evidence passed: missing/invalid/mixed/legacy candidates, preserved independent guidance and ${cases} daily locale cases`);
