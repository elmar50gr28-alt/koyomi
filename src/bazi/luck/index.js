import { BRANCHES, STEMS } from '../data.js';
import { calculateMonthPillar, calculateSolarTerms, calculateYearPillar } from '../calendar/index.js';
import { calculateTenGod, calculateTwelveStage, getHiddenStems } from '../chart/index.js';
import { evaluateBranchRelationSet, evaluateStemRelationSet } from '../relations/index.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS_PER_TERM_DAY = 4;

export function calculateLuckCycles(chartResult, profileOrSchoolConfig = {}, maybeSchoolConfig = {}) {
  const profile = profileOrSchoolConfig?.birthData || profileOrSchoolConfig?.gender ? profileOrSchoolConfig : chartResult.input || {};
  const schoolConfig = profileOrSchoolConfig?.birthData || profileOrSchoolConfig?.gender ? maybeSchoolConfig : profileOrSchoolConfig;
  const month = chartResult.chart?.pillars?.month;
  const gender = chartResult.normalizedInput?.gender || profile.gender || chartResult.input?.gender || '';
  const yearYang = chartResult.chart?.pillars?.year?.stem?.yinYang === 'yang';
  const directionInfo = decideDirection(gender, yearYang, schoolConfig);
  const start = calculateLuckStart(chartResult, directionInfo.direction);
  const cycles = month ? Array.from({ length: 8 }, (_, index) => {
    const delta = directionInfo.direction === 'forward' ? index + 1 : -(index + 1);
    const pillar = cycleFromOrders(month.stem.order + delta, month.branch.order + delta);
    const startDate = start.startDate ? addYears(start.startDate, index * 10) : null;
    const nextStartDate = start.startDate ? addYears(start.startDate, (index + 1) * 10) : null;
    return buildLuckPeriod(chartResult, pillar, {
      scope: 'decade',
      index: index + 1,
      startAge: round(start.startAge + index * 10, 2),
      endAge: round(start.startAge + index * 10 + 9, 2),
      startDate,
      endDate: nextStartDate ? new Date(nextStartDate.getTime() - DAY_MS) : null,
      confidence: directionInfo.confidence,
      warnings: start.warnings
    });
  }) : [];
  const referenceDate = validDate(schoolConfig.referenceDate) || new Date();
  const annual = [calculateAnnualLuck(chartResult, referenceDate, schoolConfig)];
  const monthly = [calculateMonthlyLuck(chartResult, referenceDate, schoolConfig)];
  const warnings = unique([
    ...(chartResult.warnings?.filter(warning => warning.includes('time')) || []),
    ...start.warnings,
    ...annual.flatMap(period => period.warnings),
    ...monthly.flatMap(period => period.warnings)
  ]);
  return {
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    direction: directionInfo.direction,
    directionRule: directionInfo.ruleId,
    startAge: start.startAge,
    startAgeDetail: start.startAgeDetail,
    startDate: isoDate(start.startDate),
    startBoundary: start.boundary,
    cycles,
    annual,
    monthly,
    schoolResults: [{
      schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
      direction: directionInfo.direction,
      startAge: start.startAge
    }],
    confidence: chartResult.normalizedInput?.timeUnknown ? Math.min(0.55, directionInfo.confidence) : directionInfo.confidence,
    warnings,
    evidence: ['luck-direction-rule', 'luck-start-solar-term-distance', 'luck-period-shared-core']
  };
}

export function calculateLuckStart(chartResult, direction = 'forward') {
  const birthDate = birthCalculationDate(chartResult);
  if (!birthDate) {
    return {
      startAge: 0,
      startAgeDetail: { years: 0, months: 0, distanceDays: null },
      startDate: null,
      boundary: null,
      warnings: ['luck-start-birth-date-missing']
    };
  }
  const terms = surroundingSolarTerms(birthDate);
  const boundary = direction === 'reverse'
    ? [...terms].reverse().find(term => term.date <= birthDate)
    : terms.find(term => term.date >= birthDate);
  if (!boundary) {
    return {
      startAge: 0,
      startAgeDetail: { years: 0, months: 0, distanceDays: null },
      startDate: birthDate,
      boundary: null,
      warnings: ['luck-start-solar-term-missing']
    };
  }
  const distanceDays = Math.abs(boundary.date.getTime() - birthDate.getTime()) / DAY_MS;
  // The configured schools use the traditional conversion: three days to one
  // year. Expressing it as four months per day keeps boundary rounding explicit.
  const totalMonths = Math.round(distanceDays * MONTHS_PER_TERM_DAY);
  const startDate = addMonths(birthDate, totalMonths);
  const warning = boundary.precision === 'official-minute' ? null : 'luck-start-boundary-fallback';
  return {
    startAge: round(totalMonths / 12, 2),
    startAgeDetail: {
      years: Math.floor(totalMonths / 12),
      months: totalMonths % 12,
      distanceDays: round(distanceDays, 4)
    },
    startDate,
    boundary: publicBoundary(boundary),
    warnings: unique([
      ...(chartResult.normalizedInput?.timeUnknown ? ['luck-start-birth-time-unknown'] : []),
      warning
    ])
  };
}

export function calculateAnnualLuck(chartResult, date = new Date(), schoolConfig = {}) {
  const referenceDate = requireDate(date, 'calculateAnnualLuck');
  const pillar = calculateYearPillar(referenceDate);
  const terms = surroundingSolarTerms(referenceDate).filter(term => term.termId === 'risshun' || term.branchId === 'yin');
  const start = [...terms].reverse().find(term => term.date <= referenceDate);
  const endBoundary = terms.find(term => start && term.date > start.date);
  return buildLuckPeriod(chartResult, pillar, {
    scope: 'annual',
    index: pillar.pillarYear,
    startDate: start?.date || null,
    endDate: endBoundary ? new Date(endBoundary.date.getTime() - 1) : null,
    confidence: boundaryConfidence(start),
    warnings: boundaryWarnings(chartResult, start, 'annual'),
    boundary: publicBoundary(start),
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId
  });
}

export function calculateMonthlyLuck(chartResult, date = new Date(), schoolConfig = {}) {
  const referenceDate = requireDate(date, 'calculateMonthlyLuck');
  const yearPillar = calculateYearPillar(referenceDate);
  const pillar = calculateMonthPillar(referenceDate, yearPillar.stem.id);
  const terms = surroundingSolarTerms(referenceDate);
  const start = [...terms].reverse().find(term => term.date <= referenceDate);
  const endBoundary = terms.find(term => start && term.date > start.date);
  return buildLuckPeriod(chartResult, pillar, {
    scope: 'monthly',
    index: `${yearPillar.pillarYear}-${pillar.branch.id}`,
    startDate: start?.date || null,
    endDate: endBoundary ? new Date(endBoundary.date.getTime() - 1) : null,
    confidence: boundaryConfidence(start),
    warnings: boundaryWarnings(chartResult, start, 'monthly'),
    boundary: publicBoundary(start),
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId
  });
}

export function buildLuckPeriod(chartResult, pillar, options = {}) {
  const dayMaster = chartResult.chart?.dayMaster;
  const natalPillars = Object.values(chartResult.chart?.pillars || {}).filter(Boolean);
  const stemIds = natalPillars.map(item => item.stem.id);
  const branchIds = natalPillars.map(item => item.branch.id);
  const stemRelations = activatedRelations(evaluateStemRelationSet([...stemIds, pillar.stem.id]), pillar.stem.id);
  const branchRelations = activatedRelations(evaluateBranchRelationSet([...branchIds, pillar.branch.id]), pillar.branch.id);
  const hiddenStems = getHiddenStems(pillar.branch.id, options.schoolId || chartResult.chart?.schoolId);
  const elementContribution = contributionFor(pillar, hiddenStems);
  const tenGod = calculateTenGod(dayMaster, pillar.stem);
  const twelveStage = calculateTwelveStage(dayMaster, pillar.branch);
  return {
    index: options.index ?? null,
    scope: options.scope || 'period',
    startAge: options.startAge ?? null,
    endAge: options.endAge ?? null,
    startDate: isoDateTime(options.startDate),
    endDate: isoDateTime(options.endDate),
    stem: pillar.stem,
    branch: pillar.branch,
    label: pillar.label || `${pillar.stem.kanji}${pillar.branch.kanji}`,
    pillar: { stem: pillar.stem, branch: pillar.branch, label: pillar.label },
    relationToChart: { stems: stemRelations, branches: branchRelations },
    tenGod,
    twelveStage,
    hiddenStems,
    elementContribution,
    evaluationMaterials: {
      elements: elementContribution,
      tenGodId: tenGod?.id || null,
      twelveStageId: twelveStage?.stageId || null,
      relations: { stems: stemRelations, branches: branchRelations },
      natalStrength: chartResult.strength?.dayMasterStrength || null,
      natalPattern: chartResult.patterns?.primaryPattern || chartResult.patterns?.finalPattern || null,
      natalYongshen: chartResult.yongshen?.primaryYongshen || chartResult.yongshen?.primary || null
    },
    yongshenMethodEffects: [],
    patternEffects: [],
    boundary: options.boundary || null,
    confidence: options.confidence ?? 0.5,
    warnings: unique(options.warnings || []),
    evidence: ['luck-period-shared-core', 'bazi-relations-core', 'bazi-derived-info-core']
  };
}

function decideDirection(gender, yearYang, schoolConfig = {}) {
  if (!gender) return { direction: schoolConfig.defaultLuckDirection || 'forward', ruleId: 'luck-direction-unknown-gender-school-default', confidence: 0.35 };
  const male = gender === 'male' || gender === '\u7537\u6027';
  const forward = (yearYang && male) || (!yearYang && !male);
  return {
    direction: forward ? 'forward' : 'reverse',
    ruleId: forward ? 'luck-direction-yang-male-yin-female-forward' : 'luck-direction-yang-female-yin-male-reverse',
    confidence: 0.62
  };
}

function birthCalculationDate(chartResult) {
  const corrected = chartResult.calendarCalculation?.trueSolarTime?.date;
  if (validDate(corrected)) return validDate(corrected);
  const date = chartResult.normalizedInput?.date;
  if (!date) return null;
  const time = chartResult.normalizedInput?.timeUnknown ? '00:00' : chartResult.normalizedInput?.time || '00:00';
  return validDate(`${date}T${time}:00`);
}

function surroundingSolarTerms(date) {
  const year = date.getFullYear();
  return [year - 1, year, year + 1]
    .flatMap(value => calculateSolarTerms(`${value}-06-01T12:00:00+09:00`))
    .map(term => ({ ...term, date: new Date(term.datetime) }))
    .filter(term => !Number.isNaN(term.date.getTime()))
    .sort((left, right) => left.date - right.date);
}

function cycleFromOrders(stemOrder, branchOrder) {
  const stem = STEMS[((stemOrder - 1) % 10 + 10) % 10];
  const branch = BRANCHES[((branchOrder - 1) % 12 + 12) % 12];
  return { stem, branch, label: `${stem.kanji}${branch.kanji}` };
}

function activatedRelations(groups, periodId) {
  return Object.fromEntries(Object.entries(groups).map(([key, relations]) => [
    key,
    relations.filter(relation => relation.members.includes(periodId))
  ]));
}

function contributionFor(pillar, hiddenStems) {
  const scores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  scores[pillar.stem.element] += 1;
  scores[pillar.branch.element] += 1;
  hiddenStems.forEach(item => { scores[item.stem.element] += item.weight || 0; });
  return Object.entries(scores).map(([element, value]) => ({ element, value: round(value, 2) }));
}

function boundaryWarnings(chartResult, boundary, scope) {
  return unique([
    ...(chartResult.normalizedInput?.timeUnknown ? [`${scope}-birth-time-unknown`] : []),
    !boundary ? `${scope}-boundary-missing` : null,
    boundary && boundary.precision !== 'official-minute' ? `${scope}-boundary-fallback` : null
  ]);
}

function boundaryConfidence(boundary) {
  return boundary?.precision === 'official-minute' ? 0.82 : 0.58;
}

function publicBoundary(boundary) {
  if (!boundary) return null;
  const { date, ...result } = boundary;
  return result;
}

function addMonths(date, months) {
  const result = new Date(date.getTime());
  result.setMonth(result.getMonth() + months);
  return result;
}

function addYears(date, years) {
  const result = new Date(date.getTime());
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function validDate(value) {
  if (!value) return null;
  const result = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
}

function requireDate(value, functionName) {
  const result = validDate(value);
  if (!result) throw new TypeError(`${functionName} requires a valid date`);
  return result;
}

function isoDate(value) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function isoDateTime(value) {
  return value ? value.toISOString() : null;
}

function round(value, digits) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
