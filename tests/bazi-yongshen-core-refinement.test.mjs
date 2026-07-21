import assert from 'node:assert/strict';
import { calculateBazi, calculateBaziChart, evaluatePatterns, evaluateStrength } from '../src/bazi/index.js';
import { evaluateLegacyYongshen, evaluateYongshen } from '../src/bazi/yongshen/index.js';
import { evaluateIntegratedYongshen, YONGSHEN_WEIGHTS } from '../src/bazi/yongshen/yongshen-core.js';

const profile = (date, time, timeUnknown = false) => ({ displayName: 'yongshen-test', birthData: { date, time, timeUnknown, place: { longitude: 135, utcOffset: 9, timezone: 'Asia/Tokyo' } } });
const regressions = [profile('2025-02-03', '23:09'), profile('2025-02-03', '23:11'), profile('2026-03-05', '22:58'), profile('2026-03-05', '23:00'), profile('2026-03-06', '00:00'), profile('1990-07-10', '', true)];

for (const input of regressions) {
  const currentChart = calculateBaziChart(input);
  const currentStrength = evaluateStrength(currentChart);
  const currentPatterns = evaluatePatterns(currentChart, {}, currentStrength);
  const current = evaluateYongshen(currentChart, {}, currentStrength, currentPatterns);
  assert.deepEqual(current.legacyComparison, evaluateLegacyYongshen(currentChart, {}, currentStrength, currentPatterns));
  for (const key of ['primaryYongshen', 'secondaryYongshen', 'favorableElements', 'unfavorableElements', 'avoidElements', 'neutralElements', 'methodResults', 'consensus', 'conflicts', 'scoreBreakdown', 'supportingFactors', 'opposingFactors', 'rejectedCandidates', 'confidence', 'warnings', 'evidence', 'legacyComparison']) assert.ok(Object.hasOwn(current, key), `missing structured output: ${key}`);
}

const chart = (timeUnknown = false) => ({
  normalizedInput: { timeUnknown },
  chart: { schoolId: 'koyomi-integrated', dayMaster: { id: 'jia', element: 'wood' }, monthCommand: { id: 'yin', element: 'wood' }, emptyVoid: [], pillars: { month: { stem: { id: 'bing', element: 'fire', tenGod: { id: 'shi_shen' } }, branch: { id: 'yin', hiddenStems: [] } } } },
  relations: { stems: { clashes: [], combinations: [] }, branches: { clashes: [], punishments: [], harms: [], destructions: [] } }
});

function strength(level, score, options = {}) {
  return {
    result: level, dayMasterStrength: { level, score }, monthCommand: { relationToDayMaster: options.monthRelation || 'same' }, roots: { status: options.rootStatus || 'rooted' },
    elementDistribution: { weightedCount: options.weighted || { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 }, excess: options.excess || [] },
    qiFlow: { opposingFactors: options.blocked || [] },
    climate: { climateState: options.climateState || { season: 'spring', cold: false, hot: false, dry: false, wet: true }, primaryNeed: options.primaryNeed || 'containment', candidateElements: options.climateElements || ['earth'], supportingEvidence: ['climate-season-candidate'] }
  };
}

const pattern = (patternId, status = 'established') => ({
  primaryPattern: status === 'established' ? { patternId, supportingFactors: ['month-command-main-qi'], breakingFactors: [] } : null,
  candidates: [{ patternId, supportingFactors: ['month-command-main-qi'], breakingFactors: [], confidence: 0.7 }], establishmentStatus: status, confidence: 0.7
});

for (const [level, score] of [['strong', 3.5], ['weak', -3.5], ['balanced', 0]]) {
  const result = evaluateIntegratedYongshen(chart(), {}, strength(level, score), pattern('regular-zheng_guan'));
  assert.equal(result.methodResults.supportControl.evidence[0].strengthLevel, level);
  assert.ok(Number.isFinite(result.confidence));
}

for (const patternId of ['regular-zheng_guan', 'jianlu', 'yangren', 'follow-weak']) {
  const result = evaluateIntegratedYongshen(chart(), {}, strength('strong', 3.2), pattern(patternId, patternId.startsWith('regular') ? 'established' : 'candidate'));
  assert.equal(result.methodResults.pattern.reasons[0], patternId);
  if (patternId === 'follow-weak') assert.ok(result.warnings.includes('special-pattern-treated-conservatively'));
}

const climatePriority = evaluateIntegratedYongshen(chart(), {}, strength('balanced', 0, { climateState: { season: 'winter', cold: true, hot: false, dry: false, wet: true }, primaryNeed: 'warmth', climateElements: ['fire'] }), { candidates: [], establishmentStatus: 'not-established' });
assert.equal(climatePriority.primaryYongshen, 'fire');
assert.equal(climatePriority.consensus.urgentClimateOverride, true);

const mediationPriority = evaluateIntegratedYongshen({ ...chart(), relations: { stems: { clashes: [{ members: ['jia', 'geng'] }] }, branches: { clashes: [], punishments: [], harms: [], destructions: [] } } }, { yongshenWeights: { primaryThreshold: 2.5, minimumMethods: 1 } }, strength('balanced', 0, { weighted: { wood: 25, fire: 10, earth: 25, metal: 20, water: 20 }, climateElements: [], climateState: {} }), { candidates: [], establishmentStatus: 'not-established' });
assert.ok(mediationPriority.methodResults.mediation.candidates.some(item => item.element === 'fire'));

const illnessPriority = evaluateIntegratedYongshen(chart(), { yongshenWeights: { primaryThreshold: 2, minimumMethods: 1 } }, strength('balanced', 0, { weighted: { wood: 10, fire: 10, earth: 10, metal: 10, water: 60 }, excess: ['water'], climateElements: [], climateState: {}, blocked: ['wood->fire', 'fire->earth', 'earth->metal'] }), { candidates: [], establishmentStatus: 'not-established' });
assert.ok(illnessPriority.methodResults.illnessMedicine.candidates.some(item => item.element === 'earth'));
assert.ok(illnessPriority.avoidElements.includes('water'));

const agreement = evaluateIntegratedYongshen(chart(), {}, strength('strong', 4, { climateState: { hot: true }, primaryNeed: 'cooling', climateElements: ['water'], excess: ['fire'] }), pattern('regular-zheng_guan'));
assert.ok(Object.values(agreement.scoreBreakdown).some(item => item.methodCount >= 2));

const conflict = evaluateIntegratedYongshen(chart(), { yongshenWeights: { conflictGap: 2 } }, strength('balanced', 0, { climateState: { hot: true }, primaryNeed: 'cooling', climateElements: ['wood'] }), pattern('regular-shi_shen'));
assert.equal(conflict.consensus.status, 'conflicted');
assert.equal(conflict.primaryYongshen, null);

const withheld = evaluateIntegratedYongshen(chart(), {}, strength('balanced', 0, { climateElements: [], climateState: {} }), { candidates: [], establishmentStatus: 'not-established' });
assert.equal(withheld.consensus.status, 'withheld');
assert.ok(withheld.warnings.includes('yongshen-decision-withheld'));

const known = evaluateIntegratedYongshen(chart(), {}, strength('strong', 3), pattern('regular-zheng_guan'));
const unknown = evaluateIntegratedYongshen(chart(true), {}, strength('strong', 3), pattern('regular-zheng_guan'));
assert.ok(unknown.confidence < known.confidence);

const publicResult = calculateBazi(profile('1990-07-10', '12:00'));
assert.equal(publicResult.yongshen.primary, publicResult.yongshen.legacyComparison.primary);
assert.deepEqual(publicResult.yongshen.methods, publicResult.yongshen.legacyComparison.methods);
assert.ok(YONGSHEN_WEIGHTS.method.pattern > YONGSHEN_WEIGHTS.method.supportControl);

console.log('Bazi integrated yongshen core refinement tests passed');
