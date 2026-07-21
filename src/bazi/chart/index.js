import { BRANCHES, ELEMENTS, HIDDEN_STEMS, SEASON_STRENGTH, STEMS, TEN_GODS, TWELVE_STAGES } from '../data.js';
import { prepareBirthCalculation } from './birth-time.js';
import { calculatePillarFoundation } from './foundation.js';

const byStem = Object.fromEntries(STEMS.map(s => [s.id, s]));

export function tenGodFor(dayStem, targetStem) {
  if (!dayStem || !targetStem) return null;
  const relation = elementRelation(dayStem.element, targetStem.element);
  const polarity = dayStem.yinYang === targetStem.yinYang ? 'same' : 'opposite';
  return TEN_GODS.find(g => g.elementRelation === relation && g.polarity === polarity) || null;
}

export function calculateTenGod(dayStem, targetStem) {
  const day = typeof dayStem === 'string' ? byStem[dayStem] : dayStem;
  const target = typeof targetStem === 'string' ? byStem[targetStem] : targetStem;
  return tenGodFor(day, target);
}

export function calculateTwelveStage(dayStem, branch) {
  const dayStemId = typeof dayStem === 'string' ? dayStem : dayStem?.id;
  const branchId = typeof branch === 'string' ? branch : branch?.id;
  const branchIndex = BRANCHES.findIndex(b => b.id === branchId);
  const stageId = TWELVE_STAGES[dayStemId]?.[branchIndex] || null;
  return stageId ? { dayStemId, branchId, stageId } : null;
}

export function getHiddenStems(branch, schoolId = 'koyomi-integrated') {
  const branchId = typeof branch === 'string' ? branch : branch?.id;
  return (HIDDEN_STEMS[branchId] || []).map(item => ({
    branchId,
    hiddenStemId: item.hiddenStemId,
    stem: byStem[item.hiddenStemId],
    role: item.role,
    weight: item.weight,
    schoolIds: [schoolId],
    sourceIds: ['hidden-stems-phase1'],
    confidence: 0.72
  }));
}

function elementRelation(day, target) {
  if (day === target) return 'same';
  if (ELEMENTS[day].generates === target) return 'output';
  if (ELEMENTS[day].controls === target) return 'wealth';
  if (ELEMENTS[target].controls === day) return 'officer';
  if (ELEMENTS[target].generates === day) return 'resource';
  return 'unknown';
}

function seasonForBranch(branchId) {
  return Object.entries(SEASON_STRENGTH).find(([, v]) => v.branches.includes(branchId))?.[0] || 'unknown';
}

function pillarPayload(pillar, role, dayStem) {
  if (!pillar) return null;
  const hidden = getHiddenStems(pillar.branch.id).map(item => ({
    ...item.stem,
    role: item.role,
    weight: item.weight,
    tenGod: tenGodFor(dayStem, item.stem)
  }));
  return {
    role,
    label: pillar.label,
    stem: { ...pillar.stem, tenGod: tenGodFor(dayStem, pillar.stem) },
    branch: { ...pillar.branch, hiddenStems: hidden, season: seasonForBranch(pillar.branch.id), twelveStage: calculateTwelveStage(dayStem, pillar.branch) },
    index: pillar.index
  };
}

export function calculateFourPillars(normalizedBirthData, settings = {}) {
  return calculateBaziChart(normalizedBirthData, settings).chart.pillars;
}

export function calculateBaziChart(profile, schoolConfigInput = {}) {
  const {
    schoolConfig,
    normalizedInput,
    birthLocal,
    trueSolarTime,
    calculationDate,
    solarTerms,
    warnings
  } = prepareBirthCalculation(profile, schoolConfigInput);
  const { year, month, day, hour } = calculatePillarFoundation(calculationDate, {
    timeUnknown: normalizedInput.timeUnknown,
    schoolConfig
  });
  const pillars = {
    year: pillarPayload(year, 'year', day.stem),
    month: pillarPayload(month, 'month', day.stem),
    day: pillarPayload(day, 'day', day.stem),
    hour: pillarPayload(hour, 'hour', day.stem)
  };
  const elements = elementBalance(pillars);
  return {
    input: profile,
    normalizedInput,
    calendarCalculation: {
      timezone: normalizedInput.place.timezone,
      utcOffset: normalizedInput.place.utcOffset,
      trueSolarTime,
      solarTerms
    },
    chart: {
      schoolId: schoolConfig.schoolId,
      dayMaster: day.stem,
      pillars,
      monthCommand: month.branch,
      elementBalance: elements,
      emptyVoid: calculateEmptyVoid(day.index),
      tombStorage: Object.entries(HIDDEN_STEMS).filter(([, stems]) => stems.length >= 3).map(([branchId]) => branchId)
    },
    confidence: normalizedInput.date ? (normalizedInput.timeUnknown ? 0.66 : 0.82) : 0.2,
    warnings,
    evidence: ['bazi-calendar-cycle-phase1', 'bazi-hidden-stems-phase1'],
    interpretationFacts: []
  };
}

function elementBalance(pillars) {
  const score = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  Object.values(pillars).filter(Boolean).forEach(p => {
    score[p.stem.element] += 1;
    score[p.branch.element] += 1;
    p.branch.hiddenStems.forEach(h => { score[h.element] += h.weight || 0.35; });
  });
  return Object.entries(score).map(([element, value]) => ({ element, value: Math.round(value * 100) / 100, kanji: ELEMENTS[element].kanji }));
}

function calculateEmptyVoid(dayIndex) {
  if (!dayIndex) return [];
  const group = Math.floor((dayIndex - 1) / 10);
  return [[10, 11], [8, 9], [6, 7], [4, 5], [2, 3], [0, 1]][group % 6].map(i => BRANCHES[i].id);
}
