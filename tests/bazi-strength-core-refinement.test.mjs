import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { calculateBazi, calculateBaziChart } from '../src/bazi/index.js';
import {
  classifyStrengthScore,
  evaluateLegacyDayMasterStrength,
  evaluatePreciseDayMasterStrength,
  STRENGTH_WEIGHTS
} from '../src/bazi/strength/day-master-core.js';
import {
  evaluateDayMasterStrength,
  evaluateElementDistribution,
  evaluateExposedStems,
  evaluateMonthCommand,
  evaluateQiFlow,
  evaluateRoots,
  evaluateStrength
} from '../src/bazi/strength/index.js';

function oldSimpleDecision(chartResult, schoolConfig = {}) {
  const monthCommand = evaluateMonthCommand(chartResult, schoolConfig);
  const roots = evaluateRoots(chartResult, schoolConfig);
  const exposedStems = evaluateExposedStems(chartResult, schoolConfig);
  const elementDistribution = evaluateElementDistribution(chartResult, schoolConfig);
  const qiFlow = evaluateQiFlow(chartResult, schoolConfig);
  const support = roots.scoreCandidate + Math.max(exposedStems.scoreCandidate, 0) +
    (monthCommand.relationToDayMaster === 'same' ? 1 : monthCommand.relationToDayMaster === 'resource' ? 0.7 : 0);
  const pressure = Math.abs(Math.min(exposedStems.scoreCandidate, 0)) +
    (monthCommand.relationToDayMaster === 'officer' || monthCommand.relationToDayMaster === 'wealth' ? 0.8 : 0);
  const delta = support - pressure;
  const level = delta >= 2.2 ? 'extremely-strong' : delta >= 1.2 ? 'strong' : delta >= 0.45 ? 'slightly-strong' : delta <= -2.2 ? 'extremely-weak' : delta <= -1.2 ? 'weak' : delta <= -0.45 ? 'slightly-weak' : 'balanced';
  return {
    level,
    score: Math.round(delta * 100) / 100,
    methodResults: { monthCommand, roots, exposedStems, elementDistribution, qiFlow }
  };
}

const profile = (date, time, longitude = 135, timeUnknown = false) => ({
  displayName: 'strength-test',
  birthData: {
    date,
    time,
    timeUnknown,
    place: { longitude, utcOffset: 9, timezone: 'Asia/Tokyo' }
  }
});

const REGRESSION_CASES = [
  ['立春直前', profile('2025-02-03', '23:09', 135)],
  ['立春直後', profile('2025-02-03', '23:11', 135)],
  ['月節入り直前', profile('2026-03-05', '22:58', 135)],
  ['月節入り直後', profile('2026-03-05', '23:00', 135)],
  ['23時境界', profile('2026-03-05', '23:00', 135)],
  ['0時境界', profile('2026-03-06', '00:00', 135)],
  ['出生時刻不明', profile('1990-07-10', '', 135, true)]
];

for (const [label, input] of REGRESSION_CASES) {
  const chart = calculateBaziChart(input);
  const oldDecision = oldSimpleDecision(chart);
  const current = evaluateDayMasterStrength(chart);
  assert.equal(current.legacyComparison.level, oldDecision.level, `${label}の旧レベル比較`);
  assert.equal(current.legacyComparison.score, oldDecision.score, `${label}の旧点数比較`);
  assert.deepEqual(
    evaluateLegacyDayMasterStrength(chart, oldDecision.methodResults),
    current.legacyComparison,
    `${label}の旧処理再現`
  );
  const { legacyComparison, ...preciseCurrent } = current;
  assert.deepEqual(
    evaluatePreciseDayMasterStrength(chart, oldDecision.methodResults),
    preciseCurrent,
    `${label}の精密コア呼び出し`
  );
  assert.equal(
    Object.values(current.scoreBreakdown).every(Number.isFinite),
    true,
    `${label}の各点数`
  );
  assert.equal(current.scoreBreakdown.total, current.score);
}

const unknownChart = calculateBaziChart(profile('1990-07-10', '', 135, true));
const unknownStrength = evaluateStrength(unknownChart).dayMasterStrength;
assert.deepEqual(unknownStrength.unresolvedFactors, ['hour-pillar-unknown']);
assert.equal(unknownStrength.scoreRange.minimum, unknownStrength.score - STRENGTH_WEIGHTS.unknownHourRange);
assert.equal(unknownStrength.scoreRange.maximum, unknownStrength.score + STRENGTH_WEIGHTS.unknownHourRange);
assert.ok(unknownStrength.possibleLevels.length >= 1);
assert.ok(unknownStrength.confidence < evaluateStrength(calculateBaziChart(profile('1990-07-10', '12:00'))).confidence);

const LEVEL_CASES = [
  [5, 'extremely-strong'],
  [3, 'strong'],
  [1.2, 'slightly-strong'],
  [0, 'balanced'],
  [-1.2, 'slightly-weak'],
  [-3, 'weak'],
  [-5, 'extremely-weak']
];
for (const [score, level] of LEVEL_CASES) {
  assert.equal(classifyStrengthScore(score), level);
}

const REPRESENTATIVE_CASES = [
  ['春生まれ', profile('1984-02-04', '12:00', 139.767), 'extremely-strong'],
  ['夏生まれ', profile('1990-07-10', '14:30', 135.502), 'weak'],
  ['秋生まれ', profile('2001-09-07', '23:41', 139.767), 'extremely-strong'],
  ['冬生まれ', profile('1975-12-20', '06:00', 130.4), 'weak']
];
for (const [label, input, expectedLevel] of REPRESENTATIVE_CASES) {
  const result = calculateBazi(input);
  const strength = result.strength.dayMasterStrength;
  assert.equal(strength.level, expectedLevel, `${label}の代表命式判定`);
  assert.equal(strength.reasonDetails.length, 6, `${label}の理由内訳`);
  assert.equal(strength.factorDetails.exposedStems.some(factor => factor.pillarRole === 'day'), false, `${label}で日主自身を透干扶助に数えない`);
  assert.equal(result.patterns.finalPattern, null, `${label}の格局最終判定を変更しない`);
  assert.ok(result.yongshen.integratedComparison.reviewStatus.includes('human-review-required'), `${label}の用神最終判定を変更しない`);
  assert.ok(
    result.yongshen.supportControl.reasons.includes(`day-master-${strength.legacyComparison.level}`),
    `${label}の用神規則には旧比較レベルを渡す`
  );
}

const source = await readFile('src/bazi/strength/day-master-core.js', 'utf8');
assert.ok(source.includes('Weight meanings:'));
assert.ok(source.includes('monthCommand'));
assert.ok(source.includes('rootPosition'));

console.log(`Bazi strength refinement passed: regressions=${REGRESSION_CASES.length}, levels=${LEVEL_CASES.length}, representative=${REPRESENTATIVE_CASES.length}`);
