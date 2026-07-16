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
  validateBaziResult
} from '../src/bazi/index.js';

const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

const stems = await json('data/bazi/stems.json');
const branches = await json('data/bazi/branches.json');
const hiddenStems = await json('data/bazi/hidden-stems.json');
const twelveStages = await json('data/bazi/twelve-stages.json');
const testCases = await json('data/bazi/test-cases.json');

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
assert.ok(evaluateBasicStemRelations(full).evidence.length >= 1, 'basic stem relations missing evidence');
assert.ok(evaluateBasicBranchRelations(full).evidence.length >= 1, 'basic branch relations missing evidence');

for (const testCase of testCases) {
  const result = calculateBaziChart(testCase.profile);
  if (testCase.expects.yearStem) assert.equal(result.chart.pillars.year.stem.id, testCase.expects.yearStem, `${testCase.caseId} year stem`);
  if (testCase.expects.yearBranch) assert.equal(result.chart.pillars.year.branch.id, testCase.expects.yearBranch, `${testCase.caseId} year branch`);
  if (testCase.expects.hasHour === false) assert.equal(result.chart.pillars.hour, null, `${testCase.caseId} hour pillar`);
}

console.log(`Bazi engine tests passed: stems=${stems.length}, branches=${branches.length}, tenGods=${tenGodCount}, stages=${stageCount}, cases=${testCases.length}`);
