import { ELEMENTS } from '../data.js';

const round = value => Math.round(value * 100) / 100;

/**
 * Weight meanings:
 * - Month command is the seasonal environment and therefore has the largest
 *   single influence.
 * - Root position weights express proximity and stability: month and day are
 *   closest to the day master, while year and hour are more indirect.
 * - Hidden-stem weights already encode main/middle/residual qi; coefficients
 *   below only express whether that qi supports or consumes the day master.
 * - Exposed stems are visible influences. The day stem itself is excluded so
 *   the subject is not counted as its own support.
 * - Distribution and flow are balancing evidence, not substitutes for season
 *   and roots, so their possible contribution is deliberately smaller.
 */
export const STRENGTH_WEIGHTS = Object.freeze({
  monthCommand: Object.freeze({
    same: 3,
    resource: 2.4,
    output: -1.4,
    wealth: -1.8,
    officer: -2.4,
    unknown: 0
  }),
  rootPosition: Object.freeze({
    month: 1.5,
    day: 1.25,
    hour: 0.9,
    year: 0.75
  }),
  hiddenRelation: Object.freeze({
    resource: 0.7,
    output: -0.45,
    wealth: -0.6,
    officer: -0.8,
    unknown: 0
  }),
  exposedRelation: Object.freeze({
    same: 0.9,
    resource: 0.65,
    output: -0.45,
    wealth: -0.6,
    officer: -0.75,
    unknown: 0
  }),
  exposedPosition: Object.freeze({
    month: 1.1,
    hour: 0.9,
    year: 0.9
  }),
  distributionScale: 2,
  flowScale: 1,
  unknownHourRange: 1.35
});

const LEVEL_THRESHOLDS = Object.freeze({
  extremelyStrong: 5,
  strong: 3,
  slightlyStrong: 1.2,
  slightlyWeak: -1.2,
  weak: -3,
  extremelyWeak: -5
});

export function relationToDayMaster(dayElement, targetElement) {
  if (!dayElement || !targetElement) return 'unknown';
  if (dayElement === targetElement) return 'same';
  if (ELEMENTS[targetElement]?.generates === dayElement) return 'resource';
  if (ELEMENTS[dayElement]?.generates === targetElement) return 'output';
  if (ELEMENTS[dayElement]?.controls === targetElement) return 'wealth';
  if (ELEMENTS[targetElement]?.controls === dayElement) return 'officer';
  return 'unknown';
}

export function classifyStrengthScore(score) {
  if (score >= LEVEL_THRESHOLDS.extremelyStrong) return 'extremely-strong';
  if (score >= LEVEL_THRESHOLDS.strong) return 'strong';
  if (score >= LEVEL_THRESHOLDS.slightlyStrong) return 'slightly-strong';
  if (score <= LEVEL_THRESHOLDS.extremelyWeak) return 'extremely-weak';
  if (score <= LEVEL_THRESHOLDS.weak) return 'weak';
  if (score <= LEVEL_THRESHOLDS.slightlyWeak) return 'slightly-weak';
  return 'balanced';
}

function scoreMonthCommand(monthCommand) {
  return STRENGTH_WEIGHTS.monthCommand[monthCommand.relationToDayMaster] || 0;
}

function scoreRoots(chart) {
  const dayElement = chart.dayMaster?.element;
  const factors = [];
  for (const [pillarRole, pillar] of Object.entries(chart.pillars || {})) {
    if (!pillar) continue;
    for (const hidden of pillar.branch?.hiddenStems || []) {
      if (hidden.element !== dayElement) continue;
      const qiWeight = Number(hidden.weight) || 0.35;
      const positionWeight = STRENGTH_WEIGHTS.rootPosition[pillarRole] || 0;
      factors.push({
        pillarRole,
        branchId: pillar.branch.id,
        stemId: hidden.id,
        hiddenStemRole: hidden.role || 'unknown',
        qiWeight,
        positionWeight,
        score: round(qiWeight * positionWeight)
      });
    }
  }
  return { score: round(factors.reduce((sum, factor) => sum + factor.score, 0)), factors };
}

function scoreHiddenStems(chart) {
  const dayElement = chart.dayMaster?.element;
  const factors = [];
  for (const [pillarRole, pillar] of Object.entries(chart.pillars || {})) {
    if (!pillar) continue;
    for (const hidden of pillar.branch?.hiddenStems || []) {
      const relation = relationToDayMaster(dayElement, hidden.element);
      if (relation === 'same') continue;
      const qiWeight = Number(hidden.weight) || 0.35;
      const relationWeight = STRENGTH_WEIGHTS.hiddenRelation[relation] || 0;
      factors.push({
        pillarRole,
        branchId: pillar.branch.id,
        stemId: hidden.id,
        hiddenStemRole: hidden.role || 'unknown',
        relation,
        qiWeight,
        relationWeight,
        score: round(qiWeight * relationWeight)
      });
    }
  }
  return { score: round(factors.reduce((sum, factor) => sum + factor.score, 0)), factors };
}

function scoreExposedStems(chart) {
  const dayElement = chart.dayMaster?.element;
  const factors = [];
  for (const [pillarRole, pillar] of Object.entries(chart.pillars || {})) {
    if (!pillar || pillarRole === 'day') continue;
    const relation = relationToDayMaster(dayElement, pillar.stem?.element);
    const relationWeight = STRENGTH_WEIGHTS.exposedRelation[relation] || 0;
    const positionWeight = STRENGTH_WEIGHTS.exposedPosition[pillarRole] || 0;
    factors.push({
      pillarRole,
      stemId: pillar.stem?.id || null,
      relation,
      relationWeight,
      positionWeight,
      score: round(relationWeight * positionWeight)
    });
  }
  return { score: round(factors.reduce((sum, factor) => sum + factor.score, 0)), factors };
}

function scoreElementDistribution(chart, distribution) {
  const dayElement = chart.dayMaster?.element;
  const weighted = distribution.weightedCount || {};
  let support = 0;
  let pressure = 0;
  for (const [element, percentage] of Object.entries(weighted)) {
    const relation = relationToDayMaster(dayElement, element);
    if (relation === 'same') support += percentage;
    if (relation === 'resource') support += percentage * 0.7;
    if (relation === 'output') pressure += percentage * 0.35;
    if (relation === 'wealth') pressure += percentage * 0.5;
    if (relation === 'officer') pressure += percentage * 0.65;
  }
  return {
    score: round(((support - pressure) / 100) * STRENGTH_WEIGHTS.distributionScale),
    supportPercentage: round(support),
    pressurePercentage: round(pressure)
  };
}

function scoreQiFlow(qiFlow) {
  const coverage = Number(qiFlow.scoreCandidate) || 0;
  return {
    score: round((coverage - 0.5) * STRENGTH_WEIGHTS.flowScale),
    coverage,
    status: qiFlow.status
  };
}

function reasonDetail(factor, score, detail) {
  return {
    factor,
    score,
    direction: score > 0 ? 'support' : score < 0 ? 'pressure' : 'neutral',
    detail
  };
}

export function evaluatePreciseDayMasterStrength(
  chartResult,
  methodResults,
  schoolConfig = {}
) {
  const chart = chartResult.chart || {};
  const monthCommandScore = scoreMonthCommand(methodResults.monthCommand);
  const roots = scoreRoots(chart);
  const hiddenStems = scoreHiddenStems(chart);
  const exposedStems = scoreExposedStems(chart);
  const elementDistribution = scoreElementDistribution(chart, methodResults.elementDistribution);
  const qiFlow = scoreQiFlow(methodResults.qiFlow);
  const total = round(
    monthCommandScore +
    roots.score +
    hiddenStems.score +
    exposedStems.score +
    elementDistribution.score +
    qiFlow.score
  );
  const timeUnknown = Boolean(chartResult.normalizedInput?.timeUnknown);
  const uncertainty = timeUnknown ? STRENGTH_WEIGHTS.unknownHourRange : 0;
  const scoreRange = {
    minimum: round(total - uncertainty),
    maximum: round(total + uncertainty)
  };
  const level = classifyStrengthScore(total);
  const possibleLevels = [...new Set([
    classifyStrengthScore(scoreRange.minimum),
    level,
    classifyStrengthScore(scoreRange.maximum)
  ])];
  const scoreBreakdown = {
    monthCommand: monthCommandScore,
    roots: roots.score,
    hiddenStems: hiddenStems.score,
    exposedStems: exposedStems.score,
    elementDistribution: elementDistribution.score,
    qiFlow: qiFlow.score,
    total
  };
  const reasonDetails = [
    reasonDetail('month-command', monthCommandScore, methodResults.monthCommand.relationToDayMaster),
    reasonDetail('roots', roots.score, `${roots.factors.length} roots`),
    reasonDetail('hidden-stems', hiddenStems.score, `${hiddenStems.factors.length} non-root hidden stems`),
    reasonDetail('exposed-stems', exposedStems.score, `${exposedStems.factors.length} external visible stems`),
    reasonDetail('element-distribution', elementDistribution.score, `support=${elementDistribution.supportPercentage}, pressure=${elementDistribution.pressurePercentage}`),
    reasonDetail('qi-flow', qiFlow.score, qiFlow.status)
  ];

  return {
    level,
    score: total,
    scoreBreakdown,
    scoreRange,
    possibleLevels,
    reasons: reasonDetails.map(reason => reason.factor),
    reasonDetails,
    factorDetails: {
      roots: roots.factors,
      hiddenStems: hiddenStems.factors,
      exposedStems: exposedStems.factors,
      elementDistribution,
      qiFlow
    },
    supportingFactors: reasonDetails.filter(reason => reason.score > 0),
    opposingFactors: reasonDetails.filter(reason => reason.score < 0),
    unresolvedFactors: timeUnknown ? ['hour-pillar-unknown'] : [],
    methodResults,
    schoolResults: [{ schoolId: schoolConfig.schoolId || chart.schoolId, level, score: total }],
    confidence: timeUnknown ? 0.55 : possibleLevels.length > 1 ? 0.68 : 0.76
  };
}

export function evaluateLegacyDayMasterStrength(
  chartResult,
  methodResults,
  schoolConfig = {}
) {
  const { monthCommand, roots, exposedStems, elementDistribution, qiFlow } = methodResults;
  const support = roots.scoreCandidate + Math.max(exposedStems.scoreCandidate, 0) +
    (monthCommand.relationToDayMaster === 'same' ? 1 : monthCommand.relationToDayMaster === 'resource' ? 0.7 : 0);
  const pressure = Math.abs(Math.min(exposedStems.scoreCandidate, 0)) +
    (monthCommand.relationToDayMaster === 'officer' || monthCommand.relationToDayMaster === 'wealth' ? 0.8 : 0);
  const delta = support - pressure;
  const level = delta >= 2.2 ? 'extremely-strong' : delta >= 1.2 ? 'strong' : delta >= 0.45 ? 'slightly-strong' : delta <= -2.2 ? 'extremely-weak' : delta <= -1.2 ? 'weak' : delta <= -0.45 ? 'slightly-weak' : 'balanced';
  return {
    level,
    score: round(delta),
    method: 'legacy-candidate-comparison',
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    elementDistributionCandidate: elementDistribution.finalCandidate,
    qiFlowCandidate: qiFlow.status
  };
}
