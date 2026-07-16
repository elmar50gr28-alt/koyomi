import { BRANCHES, ELEMENTS, HIDDEN_STEMS, SEASON_STRENGTH, STEMS, TEN_GODS } from '../data.js';
import { buildBirthDateTime, calculateDayPillar, calculateHourPillar, calculateMonthPillar, calculateSolarTerms, calculateTrueSolarTime, calculateYearPillar, normalizeProfile, resolveSchoolConfig } from '../calendar/index.js';

const byStem = Object.fromEntries(STEMS.map(s => [s.id, s]));

export function tenGodFor(dayStem, targetStem) {
  if (!dayStem || !targetStem) return null;
  const relation = elementRelation(dayStem.element, targetStem.element);
  const polarity = dayStem.yinYang === targetStem.yinYang ? 'same' : 'opposite';
  return TEN_GODS.find(g => g.elementRelation === relation && g.polarity === polarity) || null;
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
  const hidden = (HIDDEN_STEMS[pillar.branch.id] || []).map(id => ({ ...byStem[id], tenGod: tenGodFor(dayStem, byStem[id]) }));
  return {
    role,
    label: pillar.label,
    stem: { ...pillar.stem, tenGod: tenGodFor(dayStem, pillar.stem) },
    branch: { ...pillar.branch, hiddenStems: hidden, season: seasonForBranch(pillar.branch.id) },
    index: pillar.index
  };
}

export function calculateBaziChart(profile, schoolConfigInput = {}) {
  const schoolConfig = resolveSchoolConfig(schoolConfigInput);
  const normalizedInput = normalizeProfile(profile);
  const birthLocal = buildBirthDateTime(normalizedInput);
  const warnings = [];
  if (!normalizedInput.date) warnings.push('birth-date-missing');
  if (normalizedInput.timeUnknown) warnings.push('birth-time-unknown-hour-pillar-partial');
  const trueSolar = birthLocal ? calculateTrueSolarTime(birthLocal, normalizedInput.place.longitude, normalizedInput.place.utcOffset) : null;
  if (trueSolar?.warning) warnings.push(trueSolar.warning);
  const calcDate = trueSolar?.date || birthLocal || new Date();
  const year = calculateYearPillar(calcDate);
  const month = calculateMonthPillar(calcDate, year.stem.id);
  const day = calculateDayPillar(calcDate);
  const hour = normalizedInput.timeUnknown ? null : calculateHourPillar(calcDate, day.stem.id, schoolConfig);
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
      trueSolarTime: trueSolar,
      solarTerms: birthLocal ? calculateSolarTerms(birthLocal, normalizedInput.place.timezone) : []
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
    p.branch.hiddenStems.forEach(h => { score[h.element] += 0.35; });
  });
  return Object.entries(score).map(([element, value]) => ({ element, value: Math.round(value * 100) / 100, kanji: ELEMENTS[element].kanji }));
}

function calculateEmptyVoid(dayIndex) {
  if (!dayIndex) return [];
  const group = Math.floor((dayIndex - 1) / 10);
  return [[10, 11], [8, 9], [6, 7], [4, 5], [2, 3], [0, 1]][group % 6].map(i => BRANCHES[i].id);
}
