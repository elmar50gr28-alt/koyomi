import { BRANCHES, STEMS } from '../data.js';
import { calculateMonthPillar, calculateSolarTerms, calculateYearPillar } from '../calendar/index.js';
import { calculateTenGod, calculateTwelveStage, getHiddenStems } from '../chart/index.js';
import { evaluateBranchRelationSet, evaluateStemRelationSet } from '../relations/index.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const TRADITIONAL_DAYS_PER_YEAR = 3;
const TROPICAL_YEAR_DAYS = 365.2425;

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
      startAge: round(start.startAge + index * 10, 4),
      endAge: round(start.startAge + (index + 1) * 10, 4),
      startDate,
      endDate: nextStartDate ? new Date(nextStartDate.getTime() - 1) : null,
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
    directionBasis: directionInfo.basis,
    startAge: start.startAge,
    startAgeDetail: start.startAgeDetail,
    startDate: isoDateTime(start.startDate),
    startBoundary: start.boundary,
    startMethod: start.method,
    startAgeRange: start.startAgeRange,
    startConversion: start.conversion,
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
  const boundary = selectLuckStartBoundary(
    birthDate,
    terms,
    direction
  );
  if (!boundary) {
    return {
      startAge: 0,
      startAgeDetail: { years: 0, months: 0, distanceDays: null },
      startDate: birthDate,
      boundary: null,
      warnings: ['luck-start-solar-term-missing']
    };
  }
  const resolved = resolveLuckStart(
    birthDate,
    boundary
  );
  const warning = boundary.precision === 'official-minute' ? null : 'luck-start-boundary-fallback';
  const startAgeRange = chartResult.normalizedInput?.timeUnknown
    ? calculateUnknownTimeRange(
        chartResult,
        direction
      )
    : null;
  return {
    startAge: resolved.startAge,
    startAgeDetail: resolved.startAgeDetail,
    startDate: resolved.startDate,
    startAgeRange,
    method: 'solar-term-distance-three-days-one-year',
    conversion: resolved.conversion,
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
  const male = gender === 'male' || gender === '\u7537\u6027';
  const female = gender === 'female' || gender === '\u5973\u6027';
  if (!male && !female) {
    const direction = schoolConfig.defaultLuckDirection || 'forward';
    return {
      direction,
      ruleId: 'luck-direction-unknown-gender-school-default',
      confidence: 0.35,
      basis: {
        gender: gender || 'unknown',
        yearStemYinYang: yearYang ? 'yang' : 'yin',
        usedDefault: true
      }
    };
  }
  const forward = (yearYang && male) || (!yearYang && female);
  return {
    direction: forward ? 'forward' : 'reverse',
    ruleId: forward ? 'luck-direction-yang-male-yin-female-forward' : 'luck-direction-yang-female-yin-male-reverse',
    confidence: 0.82,
    basis: {
      gender: male ? 'male' : 'female',
      yearStemYinYang: yearYang ? 'yang' : 'yin',
      usedDefault: false
    }
  };
}

function selectLuckStartBoundary(birthDate, terms, direction) {
  return direction === 'reverse'
    ? [...terms].reverse().find(term => term.date <= birthDate)
    : terms.find(term => term.date >= birthDate);
}

function resolveLuckStart(birthDate, boundary) {
  const distanceMilliseconds = Math.abs(
    boundary.date.getTime() -
    birthDate.getTime()
  );
  const distanceDays =
    distanceMilliseconds / DAY_MS;
  const startAgeExact =
    distanceDays /
    TRADITIONAL_DAYS_PER_YEAR;
  const startOffsetDays =
    startAgeExact *
    TROPICAL_YEAR_DAYS;
  const startDate = new Date(
    birthDate.getTime() +
    startOffsetDays * DAY_MS
  );
  const years = Math.floor(startAgeExact);
  const totalMonths =
    (startAgeExact - years) * 12;
  const months = Math.floor(totalMonths);
  const daysExact =
    (totalMonths - months) *
    TROPICAL_YEAR_DAYS / 12;
  const totalMinutes = Math.round(
    daysExact * 24 * 60
  );
  const days = Math.floor(
    totalMinutes / (24 * 60)
  );
  const remainingMinutes =
    totalMinutes - days * 24 * 60;
  const hours = Math.floor(
    remainingMinutes / 60
  );
  const minutes = remainingMinutes % 60;

  return {
    startAge: round(startAgeExact, 4),
    startAgeDetail: {
      years,
      months,
      days,
      hours,
      minutes,
      distanceDays: round(distanceDays, 6)
    },
    startDate,
    conversion: {
      distanceMilliseconds,
      distanceDays: round(distanceDays, 6),
      traditionalDaysPerYear: TRADITIONAL_DAYS_PER_YEAR,
      startOffsetDays: round(startOffsetDays, 4),
      calendarYearDays: TROPICAL_YEAR_DAYS
    }
  };
}

function calculateUnknownTimeRange(
  chartResult,
  direction
) {
  const input = chartResult.normalizedInput || {};
  if (!input.date) return null;
  const offset = Number(input.place?.utcOffset ?? 9);
  const candidates = [
    localDateTime(input.date, '00:00:00', offset),
    localDateTime(input.date, '23:59:59', offset)
  ].map(moment => {
    const terms = surroundingSolarTerms(moment);
    const boundary = selectLuckStartBoundary(
      moment,
      terms,
      direction
    );
    if (!boundary) return null;
    const resolved = resolveLuckStart(moment, boundary);
    return {
      startAge: resolved.startAge,
      startDate: isoDateTime(resolved.startDate),
      boundary: publicBoundary(boundary)
    };
  }).filter(Boolean);
  if (!candidates.length) return null;
  const dates = candidates
    .map(value => value.startDate)
    .sort();
  return {
    minimum: Math.min(...candidates.map(value => value.startAge)),
    maximum: Math.max(...candidates.map(value => value.startAge)),
    earliestDate: dates[0],
    latestDate: dates.at(-1),
    candidates
  };
}

function localDateTime(date, time, offset) {
  return new Date(
    `${date}T${time}${formatOffset(offset)}`
  );
}

function birthCalculationDate(chartResult) {
  const boundaryDate = validDate(
    chartResult.calendarCalculation?.boundaryDate
  );
  if (boundaryDate) return boundaryDate;
  const date = chartResult.normalizedInput?.date;
  if (!date) return null;
  const time = chartResult.normalizedInput?.timeUnknown ? '00:00' : chartResult.normalizedInput?.time || '00:00';
  const offset = Number(chartResult.normalizedInput?.place?.utcOffset ?? 9);
  const base = validDate(`${date}T${time}:00${formatOffset(offset)}`);
  const solarMinutes = Number(chartResult.calendarCalculation?.trueSolarTime?.minutesOffset || 0);
  return base ? new Date(base.getTime() + solarMinutes * 60000) : null;
}

function formatOffset(value) {
  const totalMinutes = Math.round(Math.abs(value) * 60);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${value < 0 ? '-' : '+'}${hours}:${minutes}`;
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
