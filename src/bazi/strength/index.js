import { ELEMENTS, SEASON_STRENGTH } from '../data.js';

const elementOrder = ['wood', 'fire', 'earth', 'metal', 'water'];

export function evaluateMonthCommand(chartResult, schoolConfig = {}) {
  const chart = chartResult.chart || {};
  const monthBranch = chart.monthCommand;
  const seasonEntry = Object.entries(SEASON_STRENGTH).find(([, value]) => value.branches.includes(monthBranch?.id));
  const seasonalPhase = seasonEntry?.[0] || 'unknown';
  const monthCommandElement = seasonEntry?.[1]?.dominant || monthBranch?.element || 'unknown';
  const dayElement = chart.dayMaster?.element;
  const relationToDayMaster = relationOf(dayElement, monthCommandElement);
  return {
    monthBranch,
    monthCommandElement,
    commandingStemCandidates: chart.pillars?.month?.branch?.hiddenStems?.map(h => h.id) || [],
    daysFromSolarTerm: null,
    seasonalPhase,
    relationToDayMaster,
    schoolResults: [{ schoolId: schoolConfig.schoolId || chart.schoolId, result: relationToDayMaster }],
    sourceIds: ['src-yuanhai-ziping-biblio'],
    confidence: monthBranch ? 0.66 : 0.2,
    warnings: ['phase2-fixed-solar-term-boundary']
  };
}

export function evaluateRoots(chartResult, schoolConfig = {}) {
  const chart = chartResult.chart || {};
  const dayElement = chart.dayMaster?.element;
  const roots = [];
  for (const [pillarRole, pillar] of Object.entries(chart.pillars || {})) {
    if (!pillar) continue;
    for (const hidden of pillar.branch.hiddenStems || []) {
      if (hidden.element !== dayElement) continue;
      const rawStrength = hidden.weight || 0.35;
      const positionWeight = pillarRole === 'month' ? 1.2 : pillarRole === 'day' ? 1 : 0.8;
      roots.push({
        stemId: hidden.id,
        branchId: pillar.branch.id,
        hiddenStemRole: hidden.role || 'unknown',
        rawStrength,
        adjustedStrength: Math.round(rawStrength * positionWeight * 100) / 100,
        affectingRelations: [],
        schoolIds: [schoolConfig.schoolId || chart.schoolId],
        confidence: 0.62
      });
    }
  }
  const scoreCandidate = roots.reduce((n, r) => n + r.adjustedStrength, 0);
  return {
    status: roots.length ? 'rooted' : 'unrooted',
    scoreCandidate: Math.round(scoreCandidate * 100) / 100,
    qualitativeLevel: scoreCandidate >= 1.5 ? 'strong-root' : scoreCandidate > 0 ? 'weak-root' : 'no-root',
    factors: roots,
    opposingFactors: [],
    schoolResults: [{ schoolId: schoolConfig.schoolId || chart.schoolId, result: roots.length ? 'rooted' : 'unrooted' }],
    confidence: roots.length ? 0.64 : 0.52
  };
}

export function evaluateExposedStems(chartResult, schoolConfig = {}) {
  const chart = chartResult.chart || {};
  const dayElement = chart.dayMaster?.element;
  const factors = Object.values(chart.pillars || {}).filter(Boolean).map(pillar => {
    const relation = relationOf(dayElement, pillar.stem.element);
    const score = relation === 'same' ? 1 : relation === 'resource' ? 0.55 : relation === 'output' ? -0.25 : relation === 'wealth' || relation === 'officer' ? -0.35 : 0;
    return { stemId: pillar.stem.id, element: pillar.stem.element, relation, scoreCandidate: score, tenGodId: pillar.stem.tenGod?.id || null };
  });
  const total = factors.reduce((n, f) => n + f.scoreCandidate, 0);
  return {
    status: total > 0.75 ? 'supporting' : total < -0.75 ? 'draining' : 'mixed',
    scoreCandidate: Math.round(total * 100) / 100,
    qualitativeLevel: total > 0.75 ? 'support' : total < -0.75 ? 'pressure' : 'mixed',
    factors,
    opposingFactors: factors.filter(f => f.scoreCandidate < 0),
    schoolResults: [{ schoolId: schoolConfig.schoolId || chart.schoolId, result: 'exposed-stems-candidate' }],
    confidence: 0.58
  };
}

export function evaluateElementDistribution(chartResult, schoolConfig = {}) {
  const balance = chartResult.chart?.elementBalance || [];
  const raw = Object.fromEntries(elementOrder.map(element => [element, balance.find(x => x.element === element)?.value || 0]));
  const total = Object.values(raw).reduce((n, v) => n + v, 0) || 1;
  const weighted = Object.fromEntries(elementOrder.map(element => [element, Math.round((raw[element] / total) * 1000) / 10]));
  const dayElement = chartResult.chart?.dayMaster?.element;
  const excess = elementOrder.filter(element => weighted[element] >= 30);
  const deficiency = elementOrder.filter(element => weighted[element] <= 10);
  return {
    rawCount: raw,
    weightedCount: weighted,
    seasonalAdjustment: evaluateMonthCommand(chartResult, schoolConfig).monthCommandElement,
    rootAdjustment: evaluateRoots(chartResult, schoolConfig).scoreCandidate,
    exposedAdjustment: evaluateExposedStems(chartResult, schoolConfig).scoreCandidate,
    relationAdjustment: 0,
    finalCandidate: weighted[dayElement] >= 26 ? 'day-element-heavy' : weighted[dayElement] <= 14 ? 'day-element-light' : 'day-element-balanced',
    excess,
    deficiency,
    blocked: [],
    flowing: elementOrder.filter(element => raw[element] > 0 && raw[ELEMENTS[element].generates] > 0),
    schoolResults: [{ schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId, result: 'distribution-candidate' }],
    confidence: 0.6
  };
}

export function evaluateClimate(chartResult, schoolConfig = {}) {
  const command = evaluateMonthCommand(chartResult, schoolConfig);
  const climateState = {
    season: command.seasonalPhase,
    cold: command.seasonalPhase === 'winter',
    hot: command.seasonalPhase === 'summer',
    dry: command.seasonalPhase === 'autumn' || command.seasonalPhase === 'summer',
    wet: command.seasonalPhase === 'winter' || command.seasonalPhase === 'spring'
  };
  const candidateElements = climateState.cold ? ['fire'] : climateState.hot ? ['water'] : climateState.dry ? ['water'] : climateState.wet ? ['earth'] : [];
  return {
    climateState,
    primaryNeed: climateState.cold ? 'warmth' : climateState.hot ? 'cooling' : climateState.dry ? 'moisture' : climateState.wet ? 'containment' : null,
    secondaryNeed: null,
    candidateElements,
    candidateStems: [],
    supportingEvidence: candidateElements.length ? ['climate-season-candidate'] : [],
    conflictingEvidence: [],
    schoolIds: ['qiongtong-baojian', schoolConfig.schoolId || chartResult.chart?.schoolId],
    confidence: candidateElements.length ? 0.58 : 0.42
  };
}

export function evaluateQiFlow(chartResult, schoolConfig = {}) {
  const distribution = evaluateElementDistribution(chartResult, schoolConfig);
  const flowPairs = elementOrder.map(element => ({ from: element, to: ELEMENTS[element].generates, present: distribution.rawCount[element] > 0 && distribution.rawCount[ELEMENTS[element].generates] > 0 }));
  const blocked = flowPairs.filter(pair => !pair.present).map(pair => `${pair.from}->${pair.to}`);
  return {
    status: blocked.length <= 1 ? 'flowing' : blocked.length <= 3 ? 'partially-blocked' : 'blocked',
    scoreCandidate: Math.round(((5 - blocked.length) / 5) * 100) / 100,
    qualitativeLevel: blocked.length <= 1 ? 'smooth' : 'mixed',
    factors: flowPairs,
    opposingFactors: blocked,
    schoolResults: [{ schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId, result: 'qi-flow-candidate' }],
    confidence: 0.52
  };
}

export function evaluateDayMasterStrength(chartResult, schoolConfig = {}) {
  const monthCommand = evaluateMonthCommand(chartResult, schoolConfig);
  const roots = evaluateRoots(chartResult, schoolConfig);
  const exposedStems = evaluateExposedStems(chartResult, schoolConfig);
  const elementDistribution = evaluateElementDistribution(chartResult, schoolConfig);
  const qiFlow = evaluateQiFlow(chartResult, schoolConfig);
  const support = roots.scoreCandidate + Math.max(exposedStems.scoreCandidate, 0) + (monthCommand.relationToDayMaster === 'same' ? 1 : monthCommand.relationToDayMaster === 'resource' ? 0.7 : 0);
  const pressure = Math.abs(Math.min(exposedStems.scoreCandidate, 0)) + (monthCommand.relationToDayMaster === 'officer' || monthCommand.relationToDayMaster === 'wealth' ? 0.8 : 0);
  const delta = support - pressure;
  const level = delta >= 2.2 ? 'extremely-strong' : delta >= 1.2 ? 'strong' : delta >= 0.45 ? 'slightly-strong' : delta <= -2.2 ? 'extremely-weak' : delta <= -1.2 ? 'weak' : delta <= -0.45 ? 'slightly-weak' : 'balanced';
  return {
    level,
    reasons: ['month-command', 'roots', 'exposed-stems', 'element-distribution', 'qi-flow'],
    supportingFactors: [monthCommand, roots, exposedStems].filter(x => x.scoreCandidate > 0 || x.relationToDayMaster === 'same' || x.relationToDayMaster === 'resource'),
    opposingFactors: [exposedStems, monthCommand].filter(x => x.scoreCandidate < 0 || x.relationToDayMaster === 'officer' || x.relationToDayMaster === 'wealth'),
    unresolvedFactors: chartResult.normalizedInput?.timeUnknown ? ['hour-pillar-unknown'] : [],
    methodResults: { monthCommand, roots, exposedStems, elementDistribution, qiFlow },
    schoolResults: [{ schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId, level }],
    confidence: chartResult.normalizedInput?.timeUnknown ? 0.5 : 0.64
  };
}

export function evaluateStrength(chartResult, schoolConfig = {}) {
  const monthCommand = evaluateMonthCommand(chartResult, schoolConfig);
  const seasonalState = { phase: monthCommand.seasonalPhase, commandElement: monthCommand.monthCommandElement };
  const roots = evaluateRoots(chartResult, schoolConfig);
  const exposedStems = evaluateExposedStems(chartResult, schoolConfig);
  const elementDistribution = evaluateElementDistribution(chartResult, schoolConfig);
  const climate = evaluateClimate(chartResult, schoolConfig);
  const dayMasterStrength = evaluateDayMasterStrength(chartResult, schoolConfig);
  const qiFlow = evaluateQiFlow(chartResult, schoolConfig);
  return {
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    method: schoolConfig.strengthMethod || 'phase2-structured',
    monthCommand,
    seasonalState,
    roots,
    exposedStems,
    elementDistribution,
    climate,
    dayMasterStrength,
    qiFlow,
    result: dayMasterStrength.level,
    candidates: {
      extremeStrong: dayMasterStrength.level === 'extremely-strong',
      extremeWeak: dayMasterStrength.level === 'extremely-weak',
      follow: ['extremely-weak', 'weak'].includes(dayMasterStrength.level) && roots.status === 'unrooted',
      transform: false
    },
    dimensions: {
      monthCommand: monthCommand.relationToDayMaster,
      season: monthCommand.monthCommandElement,
      roots: roots.scoreCandidate,
      throughRoot: roots.status === 'rooted',
      stemSupport: exposedStems.scoreCandidate,
      drain: Math.abs(Math.min(exposedStems.scoreCandidate, 0)),
      climate: climate.climateState
    },
    confidence: dayMasterStrength.confidence,
    evidence: ['strength-month-root-support', ...climate.supportingEvidence]
  };
}

function relationOf(day, target) {
  if (!day || !target) return 'unknown';
  if (day === target) return 'same';
  if (ELEMENTS[target]?.generates === day) return 'resource';
  if (ELEMENTS[day]?.generates === target) return 'output';
  if (ELEMENTS[day]?.controls === target) return 'wealth';
  if (ELEMENTS[target]?.controls === day) return 'officer';
  return 'unknown';
}
