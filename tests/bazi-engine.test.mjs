import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  calculateBazi,
  calculateBaziChart,
  calculateFourPillars,
  calculateTenGod,
  calculateTwelveStage,
  evaluateBasicBranchRelations,
  evaluateBasicStemRelations,
  getHiddenStems,
  validateBaziPhase3Result,
  validateBaziPhase2Result,
  buildBaziReading,
  validateBaziReading,
  validateBaziResult
} from '../src/bazi/index.js';

const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

const stems = await json('data/bazi/stems.json');
const branches = await json('data/bazi/branches.json');
const hiddenStems = await json('data/bazi/hidden-stems.json');
const twelveStages = await json('data/bazi/twelve-stages.json');
const testCases = await json('data/bazi/test-cases.json');
const phase2TestCases = await json('data/bazi/phase2-test-cases.json');
const exampleCases = await json('data/bazi/example-cases.json');
const classicalIndex = await json('data/bazi/classical-index.json');
const interpretationRules = await json('data/bazi/interpretation-rules.json');
const qualityAudit = await json('data/bazi/quality-audit.json');
const phase4TestCases = await json('data/bazi/phase4-test-cases.json');
const caseClassification = await json('data/bazi/case-classification.json');
const sourceCoverageReport = await json('data/bazi/source-coverage-report.json');
const lowConfidenceReport = await json('data/bazi/low-confidence-report.json');
const reviewStatusReport = await json('data/bazi/review-status-report.json');
const finalRuleAudit = await json('data/bazi/final-rule-audit.json');
const finalClassicalAudit = await json('data/bazi/final-classical-audit.json');
const finalExampleCases = await json('data/bazi/final-example-cases.json');
const finalTestCases = await json('data/bazi/final-test-cases.json');
const finalQualityScore = await json('data/bazi/final-quality-score.json');
const finalAiReview = await json('data/bazi/final-ai-review.json');
const practicalAuditCases = await json('data/bazi/practical-audit-cases.json');

assert.equal(stems.length, 10, 'stems data must include 10 heavenly stems');
assert.equal(branches.length, 12, 'branches data must include 12 earthly branches');
assert.equal(Object.keys(hiddenStems).length, 12, 'hidden stems must cover all branches');

for (const branch of branches) {
  const entries = hiddenStems[branch.id];
  assert.ok(Array.isArray(entries) && entries.length >= 1, `hidden stems missing for ${branch.id}`);
  for (const entry of entries) {
    assert.equal(entry.branchId, branch.id, `hidden stem branchId mismatch for ${branch.id}`);
    assert.ok(['main', 'middle', 'residual'].includes(entry.role), `invalid hidden stem role for ${branch.id}`);
    assert.ok(entry.weight > 0 && entry.weight <= 1, `invalid hidden stem weight for ${branch.id}`);
    assert.ok(Array.isArray(entry.schoolIds), `schoolIds missing for ${branch.id}`);
    assert.ok(Array.isArray(entry.sourceIds), `sourceIds missing for ${branch.id}`);
  }
}

let tenGodCount = 0;
for (const dayStem of stems) {
  for (const targetStem of stems) {
    const tenGod = calculateTenGod(dayStem.id, targetStem.id);
    assert.ok(tenGod?.id, `ten god missing for ${dayStem.id} -> ${targetStem.id}`);
    tenGodCount += 1;
  }
}
assert.equal(tenGodCount, 100, 'ten god matrix must cover 100 combinations');

let stageCount = 0;
for (const dayStem of stems) {
  assert.equal(twelveStages.tables[dayStem.id].length, 12, `twelve stages table missing for ${dayStem.id}`);
  for (const branch of branches) {
    const stage = calculateTwelveStage(dayStem.id, branch.id);
    assert.ok(stage?.stageId, `twelve stage missing for ${dayStem.id} -> ${branch.id}`);
    stageCount += 1;
  }
}
assert.equal(stageCount, 120, 'twelve stage matrix must cover 120 combinations');

assert.equal(getHiddenStems('zi').length, 1, 'zi hidden stem count');
assert.ok(getHiddenStems('chou').some(x => x.role === 'main'), 'chou hidden stem main role');

const profile = {
  displayName: 'Phase1',
  birthData: {
    date: '1984-02-04',
    time: '12:00',
    place: { label: 'Tokyo', longitude: 139.767, utcOffset: 9, timezone: 'Asia/Tokyo' }
  }
};
const chart = calculateBaziChart(profile);
assert.equal(chart.chart.pillars.year.stem.id, 'jia', '1984 spring boundary year stem');
assert.equal(chart.chart.pillars.year.branch.id, 'zi', '1984 spring boundary year branch');
assert.ok(chart.chart.pillars.hour, 'known birth time should produce hour pillar');
assert.ok(validateBaziResult(chart).ok, 'chart validation should pass');

const pillars = calculateFourPillars(profile);
assert.ok(pillars.year && pillars.month && pillars.day && pillars.hour, 'calculateFourPillars result incomplete');

const unknown = {
  displayName: 'Unknown',
  birthData: {
    date: '1990-07-10',
    timeUnknown: true,
    place: { label: 'Osaka', longitude: 135.502, utcOffset: 9, timezone: 'Asia/Tokyo' }
  }
};
const partial = calculateBaziChart(unknown);
assert.equal(partial.chart.pillars.hour, null, 'unknown birth time must not force noon');
assert.ok(partial.warnings.includes('birth-time-unknown-hour-pillar-partial'), 'unknown time warning missing');

const full = calculateBazi(profile);
assert.ok(full.relations && full.strength && full.patterns && full.yongshen && full.luckCycles, 'full result domains missing');
assert.ok(full.strength.monthCommand && full.strength.roots && full.strength.dayMasterStrength, 'phase2 strength domains missing');
assert.ok(full.patterns.followPatterns && full.patterns.transformationPatterns, 'phase2 pattern domains missing');
assert.ok(full.yongshen.methods && full.yongshen.favorableElements, 'phase2 yongshen domains missing');
assert.ok(full.luckCycles.directionRule && full.luckCycles.cycles.length >= 8, 'phase2 luck cycles missing');
assert.ok(validateBaziPhase2Result(full).ok, 'phase2 validation should pass');
assert.ok(validateBaziPhase3Result(full).ok, 'phase3 validation should pass');
assert.ok(full.interpretation?.tendencies?.career, 'career interpretation missing');
assert.ok(full.interpretation?.tendencies?.finance, 'finance interpretation missing');
assert.ok(full.interpretation?.tendencies?.relationship, 'relationship interpretation missing');
assert.ok(full.interpretation?.tendencies?.family, 'family interpretation missing');
assert.ok(full.interpretation?.tendencies?.health, 'health interpretation missing');
assert.ok(Array.isArray(full.beginnerExplanation) && full.beginnerExplanation.length >= 5, 'beginner explanation missing');
assert.ok(Array.isArray(full.professionalEvidence) && full.professionalEvidence.length >= 1, 'professional evidence missing');
assert.ok(full.mitsunomeInput?.sourcePolicy?.aiGeneratedTextIsNotSource, 'mitsunome source policy missing');
assert.ok(full.reading?.sections?.overall, 'bazi reading overall section missing');
assert.ok(full.reading?.sections?.personality, 'bazi reading personality section missing');
assert.ok(full.reading?.sections?.talent, 'bazi reading talent section missing');
assert.ok(full.reading?.sections?.career, 'bazi reading career section missing');
assert.ok(full.reading?.sections?.finance, 'bazi reading finance section missing');
assert.ok(full.reading?.sections?.relationship, 'bazi reading relationship section missing');
assert.ok(full.reading?.sections?.family, 'bazi reading family section missing');
assert.ok(full.reading?.sections?.health, 'bazi reading health section missing');
assert.ok(full.reading?.sections?.decadeLuck, 'bazi reading decade luck section missing');
assert.ok(full.reading?.sections?.annualLuck, 'bazi reading annual luck section missing');
assert.ok(full.reading?.sections?.monthlyLuck, 'bazi reading monthly luck section missing');
assert.ok(full.reading?.sections?.advice, 'bazi reading advice section missing');
assert.ok(full.reading?.sections?.essence, 'bazi practical reading essence section missing');
assert.ok(full.reading?.sections?.weakness, 'bazi practical reading weakness section missing');
assert.ok(full.reading?.sections?.love, 'bazi practical reading love section missing');
assert.ok(full.reading?.sections?.marriage, 'bazi practical reading marriage section missing');
assert.ok(full.reading?.sections?.learning, 'bazi practical reading learning section missing');
assert.ok(full.reading?.sections?.creation, 'bazi practical reading creation section missing');
assert.ok(full.reading?.sections?.importantTiming, 'bazi practical reading important timing section missing');
assert.ok(full.reading?.executiveSummary?.centralTheme, 'practical reading executive summary missing');
assert.ok(full.reading?.executiveSummary?.doNow, 'practical reading action missing');
assert.ok(full.reading?.executiveSummary?.avoid, 'practical reading avoidance missing');
assert.ok(full.reading?.timingReading?.longTermTheme, 'integrated timing long term missing');
assert.ok(full.reading?.timingReading?.annualTheme, 'integrated timing annual missing');
assert.ok(full.reading?.timingReading?.monthlyTheme, 'integrated timing monthly missing');
assert.ok(full.reading?.timingReading?.schoolDifferences?.length >= 2, 'school differences must be visible');
assert.equal(full.reading?.locale, 'ja', 'default reading locale must be Japanese');
assert.ok(full.reading?.glossary?.strongDayMaster?.beginner, 'strong day master beginner explanation missing');
assert.ok(full.reading?.glossary?.weakDayMaster?.beginner, 'weak day master beginner explanation missing');
assert.ok(full.reading?.glossary?.yongshen?.beginner, 'yongshen beginner explanation missing');
assert.ok(full.reading?.uiModel?.mobileFirst, 'mobile-first reading UI model missing');
assert.ok(full.reading?.uiModel?.collapsedDetails?.includes('professional'), 'professional detail must be collapsed');
for (const section of Object.values(full.reading.sections)) {
  assert.ok(section.conclusion, `${section.id} conclusion missing`);
  assert.ok(section.evidence?.length >= 1, `${section.id} evidence missing`);
  assert.ok(section.opposingFactors?.length >= 1, `${section.id} opposing factors missing`);
  assert.ok(section.conditions?.length >= 1, `${section.id} conditions missing`);
  assert.ok(section.timing, `${section.id} timing missing`);
  assert.ok(section.action, `${section.id} action missing`);
  assert.ok(section.caution, `${section.id} caution missing`);
  assert.ok(section.avoidance, `${section.id} avoidance missing`);
  assert.ok(section.sourceIds?.length >= 1, `${section.id} sourceIds missing`);
  assert.ok(section.schoolIds?.length >= 1, `${section.id} schoolIds missing`);
  assert.ok(section.reviewStatus, `${section.id} reviewStatus missing`);
}
assert.ok(full.reading?.beginnerText.includes('\u3010\u7dcf\u5408\u7d50\u8ad6\u3011'), 'Japanese beginner reading text missing');
assert.ok(full.reading?.beginnerText.indexOf('\u3010\u7dcf\u5408\u7d50\u8ad6\u3011') < full.reading?.beginnerText.indexOf('\u3010\u672c\u8cea\u30fb\u6027\u683c\u3011'), 'overall conclusion must appear first');
assert.ok(full.reading?.professionalText.includes('\u51fa\u5178ID'), 'Japanese professional reading text missing evidence');
assert.equal(full.reading?.quality?.englishDisplayHits?.length, 0, 'Japanese reading must not expose English templates');
assert.ok(!/day[- ]master|Overall Conclusion|Current flow|Do now|Recovery path|Plain meaning/.test(full.reading.beginnerText), 'Japanese reading must not expose English template words');
assert.ok(full.reading?.mitsunomeInput?.sourcePolicy?.noNewCalculationByAi, 'reading mitsunome source policy missing');
assert.ok(full.reading?.mitsunomeInput?.voiceDrafts?.normal?.text, 'mitsunome normal mode missing');
assert.ok(full.reading?.mitsunomeInput?.voiceDrafts?.zubat?.text, 'mitsunome zubat mode missing');
assert.ok(full.reading?.mitsunomeInput?.voiceDrafts?.zubat?.escapeRoute, 'mitsunome zubat escape route missing');
assert.equal(full.reading?.quality?.emptySectionIds?.length, 0, 'practical reading must not have empty sections');
assert.equal(full.reading?.quality?.bannedExpressionHits?.length, 0, 'practical reading must avoid banned health/fate expressions');
assert.ok(validateBaziReading(full.reading).ok, 'bazi reading validation should pass');
assert.ok(evaluateBasicStemRelations(full).evidence.length >= 1, 'basic stem relations missing evidence');
assert.ok(evaluateBasicBranchRelations(full).evidence.length >= 1, 'basic branch relations missing evidence');

const lowConfidenceReading = buildBaziReading({ ...full, confidence: 0.42 });
assert.ok(/\u78ba\u5ea6|\u9650\u5b9a\u7684|\u50be\u5411|\u53ef\u80fd\u6027|\u30ec\u30d3\u30e5\u30fc/.test(lowConfidenceReading.sections.monthlyLuck.conclusion + lowConfidenceReading.sections.monthlyLuck.caution), 'low confidence Japanese reading must use soft language');
assert.ok(!/diagnose|death|pregnancy|fatal/i.test(full.reading.sections.health.conclusion + full.reading.sections.health.caution), 'health reading must not become diagnosis or prediction');

const emergencyReading = buildBaziReading(full, { occupation: 'emergency' });
assert.ok(emergencyReading.sections.career.action.includes('\u73fe\u5834\u5224\u65ad'), 'occupation wording must translate career advice without changing calculation');
const noOccupationReading = buildBaziReading(full);
assert.ok(noOccupationReading.sections.career.action.length > 0, 'missing occupation must still produce career action');
const englishReading = buildBaziReading(full, { locale: 'en', occupation: 'emergency' });
assert.equal(englishReading.locale, 'en', 'English locale must be available when explicitly requested');
assert.ok(englishReading.beginnerText.includes('[Overall Conclusion]'), 'English display must remain available for English locale');
assert.ok(englishReading.sections.career.action.includes('field judgement'), 'English occupation wording must remain available');

const partialReading = calculateBazi(unknown).reading;
assert.ok(partialReading.sections.overall.warnings.includes('birth-time-unknown-hour-pillar-partial'), 'unknown birth time warning must be preserved');
assert.ok(partialReading.sections.importantTiming.unresolvedFactors.includes('birth-time-unknown'), 'unknown birth time must lower timing certainty');

for (const testCase of testCases) {
  const result = calculateBaziChart(testCase.profile);
  if (testCase.expects.yearStem) assert.equal(result.chart.pillars.year.stem.id, testCase.expects.yearStem, `${testCase.caseId} year stem`);
  if (testCase.expects.yearBranch) assert.equal(result.chart.pillars.year.branch.id, testCase.expects.yearBranch, `${testCase.caseId} year branch`);
  if (testCase.expects.hasHour === false) assert.equal(result.chart.pillars.hour, null, `${testCase.caseId} hour pillar`);
}

for (const testCase of phase2TestCases) {
  const result = calculateBazi(testCase.profile);
  if (testCase.expects.hasStrength) assert.ok(result.strength.dayMasterStrength, `${testCase.caseId} strength`);
  if (testCase.expects.hasClimate) assert.ok(result.strength.climate, `${testCase.caseId} climate`);
  if (testCase.expects.hasLuckCycles) assert.ok(result.luckCycles.cycles.length >= 8, `${testCase.caseId} luck cycles`);
  if (testCase.expects.hourUnknown) assert.equal(result.chart.pillars.hour, null, `${testCase.caseId} hour unknown`);
  if (testCase.expects.hasYongshenMethods) assert.ok(Object.keys(result.yongshen.methods).length >= 5, `${testCase.caseId} yongshen methods`);
}

assert.equal(classicalIndex.length, 5, 'classical index count');
assert.equal(exampleCases.length, 3, 'example cases count');
assert.equal(interpretationRules.length, 5, 'interpretation category rules count');
for (const source of classicalIndex) {
  assert.ok(source.sourceId && source.reviewStatus, `classical source review status missing: ${source.sourceId}`);
}
for (const rule of interpretationRules) {
  assert.ok(rule.sourceIds?.length >= 1, `interpretation rule sourceIds missing: ${rule.ruleId}`);
  assert.ok(rule.reviewStatus, `interpretation rule reviewStatus missing: ${rule.ruleId}`);
}
for (const testCase of exampleCases) {
  const result = calculateBazi(testCase.input);
  if (testCase.expectedResults.hasBeginnerExplanation) assert.ok(result.beginnerExplanation.length >= 5, `${testCase.caseId} beginner`);
  if (testCase.expectedResults.hasProfessionalEvidence) assert.ok(result.professionalEvidence.length >= 1, `${testCase.caseId} evidence`);
  if (testCase.expectedResults.hasMitsunomeSchema) assert.ok(result.mitsunomeInput.schemaId, `${testCase.caseId} mitsunome`);
  if (testCase.expectedResults.hourUnknown) assert.equal(result.chart.pillars.hour, null, `${testCase.caseId} hour unknown`);
}

assert.ok(phase4TestCases.length >= 100, 'phase4 test cases must be 100 or more');
assert.equal(qualityAudit.summary.sourceMissingRuleCount, 0, 'phase4 sourceId missing items must be zero');
assert.ok(qualityAudit.summary.ruleTotal >= 23, 'phase4 rule total must cover phase2 and phase3 rules');
assert.ok(qualityAudit.summary.reviewPendingCount >= 1, 'phase4 must retain human review pending visibility');
assert.equal(caseClassification.categories['real-case'].count, 0, 'real cases must not be adopted without consent policy');
assert.equal(sourceCoverageReport.sourceMissingRuleCount, 0, 'source coverage report must have no missing sourceIds');
assert.ok(lowConfidenceReport.items.length >= 1, 'low confidence items must be listed');
assert.equal(reviewStatusReport.counts['human-review-required'], qualityAudit.summary.reviewPendingCount, 'review pending count mismatch');

for (const testCase of phase4TestCases) {
  assert.ok(testCase.caseId && testCase.profile && testCase.expected, `phase4 case incomplete: ${testCase.caseId}`);
  assert.ok(['typical-pattern', 'edge-case'].includes(testCase.classification), `phase4 classification invalid: ${testCase.caseId}`);
  assert.equal(testCase.caseType, 'synthetic-regression', `phase4 case type invalid: ${testCase.caseId}`);
}

const totalCases = testCases.length + phase2TestCases.length + exampleCases.length + phase4TestCases.length;
assert.equal(finalRuleAudit.version, '1.0-rc', 'final rule audit must mark 1.0 rc');
assert.equal(finalRuleAudit.summary.ruleTotal, 23, 'final rule total mismatch');
assert.equal(finalRuleAudit.summary.unusedRules, 0, 'final audit must not leave unused rules');
assert.equal(finalRuleAudit.summary.circularReferences, 0, 'final audit must not leave circular references');
assert.equal(finalRuleAudit.summary.unreferencedSourceIds, 0, 'final audit must not leave unreferenced sourceIds');
assert.equal(finalRuleAudit.summary.unusedJson, 0, 'final audit must not leave unused JSON files');
assert.equal(finalClassicalAudit.classicalSourceCount, 5, 'final classical source count mismatch');
assert.equal(finalClassicalAudit.rules.length, finalRuleAudit.summary.ruleTotal, 'every final rule must have classical audit');
assert.ok(finalExampleCases.length >= 200, 'final example cases must be 200 or more');
assert.ok(finalTestCases.length >= 300, 'final test cases must be 300 or more');
assert.ok(finalQualityScore.qualityScore >= 0.85, 'final quality score must be release-candidate level');
assert.equal(finalQualityScore.counts.exampleCaseTotal, exampleCases.length + finalExampleCases.length, 'final example total mismatch');
assert.equal(finalQualityScore.counts.testCaseTotal, testCases.length + phase2TestCases.length + exampleCases.length + phase4TestCases.length + finalTestCases.length, 'final test total mismatch');
assert.ok(finalAiReview.humanReviewRecommended.length >= 5, 'final AI review must include human review recommendations');
assert.ok(practicalAuditCases.length >= 20, 'practical audit must cover 20 representative cases');

for (const auditCase of practicalAuditCases) {
  const result = calculateBazi(auditCase.profile);
  const reading = buildBaziReading(result, { occupation: auditCase.occupation });
  assert.ok(reading.executiveSummary.centralTheme, `${auditCase.caseId} conclusion missing`);
  assert.ok(reading.executiveSummary.doNow, `${auditCase.caseId} action missing`);
  assert.ok(reading.executiveSummary.avoid, `${auditCase.caseId} avoid missing`);
  assert.ok(reading.timingReading.longTermTheme, `${auditCase.caseId} long-term timing missing`);
  assert.ok(reading.timingReading.annualTheme, `${auditCase.caseId} annual timing missing`);
  assert.ok(reading.timingReading.monthlyTheme, `${auditCase.caseId} monthly timing missing`);
  assert.ok(reading.timingReading.schoolDifferences.length >= 2, `${auditCase.caseId} school differences missing`);
  assert.equal(reading.quality.emptySectionIds.length, 0, `${auditCase.caseId} has empty section`);
  assert.equal(reading.quality.bannedExpressionHits.length, 0, `${auditCase.caseId} has banned expression`);
  assert.ok(validateBaziReading(reading).ok, `${auditCase.caseId} practical reading validation failed`);
  if (auditCase.classification === 'unknown-birth-time') {
    assert.ok(reading.sections.overall.warnings.includes('birth-time-unknown-hour-pillar-partial'), `${auditCase.caseId} unknown time warning missing`);
  }
  if (auditCase.occupation) {
    assert.ok(reading.sections.career.conditions.includes('occupation-used-for-wording-only'), `${auditCase.caseId} occupation condition missing`);
  }
}

for (const testCase of finalTestCases) {
  assert.ok(testCase.caseId && testCase.domain && testCase.profile && testCase.expected, `final test case incomplete: ${testCase.caseId}`);
  assert.ok(['chart-generation','solar-term-boundary','true-solar-time','month-command','strength','pattern','yongshen','luck-cycle','school-comparison','api'].includes(testCase.domain), `final test domain invalid: ${testCase.caseId}`);
}

for (const example of finalExampleCases) {
  assert.ok(example.caseId && example.classification && example.reviewStatus, `final example incomplete: ${example.caseId}`);
  assert.ok(example.sourceIds?.length >= 1, `final example sourceIds missing: ${example.caseId}`);
}

const finalTotalCases = totalCases + finalTestCases.length;
console.log(`Bazi engine tests passed: stems=${stems.length}, branches=${branches.length}, tenGods=${tenGodCount}, stages=${stageCount}, cases=${finalTotalCases}, finalExamples=${finalExampleCases.length}, finalTests=${finalTestCases.length}, sources=${classicalIndex.length}`);
