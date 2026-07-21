import assert from 'node:assert/strict';

import { calculateBazi, calculateBaziChart } from '../src/bazi/index.js';
import { evaluateStrength } from '../src/bazi/strength/index.js';
import { evaluatePatterns } from '../src/bazi/patterns/index.js';
import { evaluateLegacyPatterns, evaluateStructuredPatterns, PATTERN_WEIGHTS } from '../src/bazi/patterns/pattern-core.js';

const profile = (date, time, timeUnknown = false) => ({
  displayName: 'pattern-test',
  birthData: { date, time, timeUnknown, place: { longitude: 135, utcOffset: 9, timezone: 'Asia/Tokyo' } }
});

function oldPatternDecision(chartResult, schoolConfig = {}, strengthResult = null) {
  const monthTenGod = chartResult.chart?.pillars?.month?.stem?.tenGod;
  const schoolId = schoolConfig.schoolId || chartResult.chart?.schoolId;
  const candidates = [];
  if (monthTenGod) {
    const known = strengthResult?.dayMasterStrength?.level && strengthResult.dayMasterStrength.level !== 'indeterminate';
    candidates.push({ patternId: `regular-${monthTenGod.id}`, candidate: true, established: false, broken: false, rescued: false, purity: 'mixed', conditionsMet: ['month-stem-ten-god-present'], conditionsFailed: known ? ['human-review-required-before-establishment'] : ['strength-indeterminate'], rescueFactors: [], breakingFactors: [], conflictingPatterns: [], schoolResults: [{ schoolId, result: 'candidate' }], sourceIds: ['src-yuanhai-ziping-biblio'], confidence: 0.52 });
  }
  return { candidates, established: [], broken: [], rescued: [], finalPattern: null };
}

const REGRESSION_CASES = [
  profile('2025-02-03', '23:09'), // Risshun before
  profile('2025-02-03', '23:11'), // Risshun after
  profile('2026-03-05', '22:58'), // monthly term before
  profile('2026-03-05', '23:00'), // monthly term and 23:00
  profile('2026-03-06', '00:00'), // 00:00
  profile('1990-07-10', '', true)  // unknown hour
];

for (const input of REGRESSION_CASES) {
  const chart = calculateBaziChart(input);
  const strength = evaluateStrength(chart);
  const result = evaluatePatterns(chart, {}, strength);
  assert.deepEqual(result.legacyComparison, oldPatternDecision(chart, {}, strength));
  assert.deepEqual(evaluateLegacyPatterns(chart, {}, strength), result.legacyComparison);
  for (const key of ['primaryPattern', 'secondaryPatterns', 'candidates', 'rejectedCandidates', 'establishmentStatus', 'breakingFactors', 'supportingFactors', 'scoreBreakdown', 'schoolResults', 'confidence', 'warnings', 'evidence']) {
    assert.ok(Object.hasOwn(result, key), `missing structured output: ${key}`);
  }
}

const STEM_BY_GOD = {
  zheng_guan: ['geng', 'metal'], qi_sha: ['xin', 'metal'],
  zheng_yin: ['ren', 'water'], pian_yin: ['gui', 'water'],
  shi_shen: ['bing', 'fire'], shang_guan: ['ding', 'fire'],
  zheng_cai: ['wu', 'earth'], pian_cai: ['ji', 'earth']
};

const hidden = (god, role = 'main', weight = role === 'main' ? 0.6 : 0.3) => ({
  id: STEM_BY_GOD[god][0], element: STEM_BY_GOD[god][1], role, weight, tenGod: { id: god }
});

function fixture(monthHidden, options = {}) {
  const main = monthHidden[0];
  const branch = (id, stems = []) => ({ id, hiddenStems: stems, twelveStage: { stageId: options.stage || 'muyu' } });
  const stem = (id, element) => ({ id, element, tenGod: { id: options.monthStemGod || main.tenGod.id } });
  return {
    normalizedInput: { timeUnknown: Boolean(options.timeUnknown) },
    chart: {
      schoolId: 'koyomi-integrated', dayMaster: { id: 'jia', element: 'wood' },
      monthCommand: { id: options.monthBranch || 'yin', element: options.seasonElement || 'wood' },
      emptyVoid: options.emptyVoid || [],
      pillars: {
        year: options.yearStem ? { stem: stem(options.yearStem.id, options.yearStem.element), branch: branch('zi') } : null,
        month: { stem: stem(options.monthStemId || main.id, options.monthStemElement || main.element), branch: branch(options.monthBranch || 'yin', monthHidden) },
        day: { stem: stem('jia', 'wood'), branch: branch('mao') },
        hour: options.timeUnknown ? null : { stem: stem('yi', 'wood'), branch: branch('chen') }
      }
    },
    relations: {
      stems: { combinations: options.stemCombinations || [], clashes: options.stemClashes || [] },
      branches: { clashes: options.branchClashes || [], punishments: options.punishments || [], harms: options.harms || [], destructions: options.destructions || [] }
    }
  };
}

const strong = { dayMasterStrength: { level: 'strong' }, roots: { status: 'rooted' } };
const weak = { dayMasterStrength: { level: 'weak' }, roots: { status: 'rooted' } };

for (const god of Object.keys(STEM_BY_GOD)) {
  const strength = /yin/.test(god) ? weak : strong;
  const result = evaluateStructuredPatterns(fixture([hidden(god)]), {}, strength);
  assert.equal(result.candidates[0].patternId, `regular-${god}`, `${god} representative chart`);
  assert.equal(result.candidates[0].establishmentStatus, 'established', `${god} establishment`);
  assert.ok(result.candidates[0].scoreBreakdown.monthCommand >= PATTERN_WEIGHTS.monthHiddenRole.main);
}

for (const [stage, expected] of [['jianlu', 'jianlu'], ['diwang', 'yangren']]) {
  const result = evaluateStructuredPatterns(fixture([hidden('zheng_guan')], { stage }), {}, strong);
  assert.ok(result.candidates.some(item => item.patternId === expected), `${expected} candidate`);
}

const mixed = evaluateStructuredPatterns(fixture([
  hidden('zheng_guan', 'main', 0.6),
  hidden('zheng_yin', 'middle', 0.3)
], { monthStemId: 'ren', monthStemElement: 'water', monthStemGod: 'zheng_yin' }), {}, { dayMasterStrength: { level: 'balanced' }, roots: { status: 'rooted' } });
assert.equal(mixed.establishmentStatus, 'mixed');

const broken = evaluateStructuredPatterns(fixture([hidden('zheng_guan')], {
  branchClashes: [{ members: ['yin', 'shen'] }], punishments: [{ members: ['yin', 'si', 'shen'] }]
}), {}, strong);
assert.equal(broken.establishmentStatus, 'broken');
assert.ok(broken.breakingFactors.includes('month-branch-clash'));

const none = evaluateStructuredPatterns(fixture([{ id: 'jia', element: 'wood', role: 'main', weight: 1, tenGod: { id: 'bijian' } }]), {}, strong);
assert.equal(none.establishmentStatus, 'not-established');

const follow = evaluateStructuredPatterns(fixture([hidden('zheng_guan')], { monthStemId: 'yi', monthStemElement: 'wood' }), {}, { dayMasterStrength: { level: 'extremely-weak' }, roots: { status: 'unrooted' } });
const followWeak = follow.candidates.find(item => item.patternId === 'follow-weak');
assert.equal(followWeak.establishmentStatus, 'candidate');
assert.equal(followWeak.established, false, 'follow patterns stay conservative by default');

const transformed = evaluateStructuredPatterns(fixture([hidden('zheng_guan')], {
  seasonElement: 'earth', stemCombinations: [{ members: ['jia', 'ji'], resultElement: 'earth', established: true }]
}), {}, strong);
assert.equal(transformed.transformationPatterns[0].establishmentStatus, 'candidate');
assert.equal(transformed.transformationPatterns[0].established, false, 'transformation stays conservative by default');
const schoolEnabledTransformation = evaluateStructuredPatterns(fixture([hidden('zheng_guan')], {
  seasonElement: 'earth', stemCombinations: [{ members: ['jia', 'ji'], resultElement: 'earth', established: true }]
}), { allowTransformationPatternEstablishment: true, patternWeights: { monthHiddenRole: { main: 4.5 } } }, strong);
assert.equal(schoolEnabledTransformation.transformationPatterns[0].established, true, 'schoolConfig can opt into transformation establishment');
assert.equal(schoolEnabledTransformation.scoreBreakdown['regular-zheng_guan'].monthCommand, 4.5, 'schoolConfig can override a named weight');

const known = evaluateStructuredPatterns(fixture([hidden('zheng_guan')]), {}, strong);
const unknown = evaluateStructuredPatterns(fixture([hidden('zheng_guan')], { timeUnknown: true }), {}, strong);
assert.ok(unknown.confidence < known.confidence);
assert.ok(unknown.warnings.includes('hour-pillar-unknown-confidence-reduced'));

const publicResult = calculateBazi(profile('1990-07-10', '12:00'));
assert.equal(publicResult.patterns.legacyComparison.finalPattern, null);
assert.deepEqual(
  publicResult.yongshen.patternMethod.secondaryCandidates,
  publicResult.patterns.legacyComparison.candidates.map(item => item.patternId),
  'yongshen continues to consume the legacy pattern comparison'
);
assert.ok(Array.isArray(publicResult.patterns.evidence));
assert.ok(publicResult.patterns.evidence.every(item => typeof item === 'string'));

console.log('Bazi structured pattern core refinement tests passed');
