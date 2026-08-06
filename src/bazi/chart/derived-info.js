import {
  BRANCHES,
  ELEMENTS,
  HIDDEN_STEMS,
  SEASON_STRENGTH,
  STEMS,
  TEN_GODS,
  TWELVE_STAGES
} from '../data.js';

const byStem = Object.fromEntries(
  STEMS.map(stem => [stem.id, stem])
);

function elementRelation(day, target) {
  if (day === target) return 'same';
  if (ELEMENTS[day].generates === target) return 'output';
  if (ELEMENTS[day].controls === target) return 'wealth';
  if (ELEMENTS[target].controls === day) return 'officer';
  if (ELEMENTS[target].generates === day) return 'resource';
  return 'unknown';
}

export function tenGodFor(dayStem, targetStem) {
  if (!dayStem || !targetStem) return null;
  const relation = elementRelation(dayStem.element, targetStem.element);
  const polarity = dayStem.yinYang === targetStem.yinYang ? 'same' : 'opposite';
  return TEN_GODS.find(god => god.elementRelation === relation && god.polarity === polarity) || null;
}

export function calculateTenGod(dayStem, targetStem) {
  const day = typeof dayStem === 'string' ? byStem[dayStem] : dayStem;
  const target = typeof targetStem === 'string' ? byStem[targetStem] : targetStem;
  return tenGodFor(day, target);
}

export function calculateTwelveStage(dayStem, branch) {
  const dayStemId = typeof dayStem === 'string' ? dayStem : dayStem?.id;
  const branchId = typeof branch === 'string' ? branch : branch?.id;
  const branchIndex = BRANCHES.findIndex(item => item.id === branchId);
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

export function seasonForBranch(branchId) {
  return Object.entries(SEASON_STRENGTH)
    .find(([, value]) => value.branches.includes(branchId))?.[0] || 'unknown';
}

export function buildDerivedPillar(pillar, role, dayStem) {
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
    branch: {
      ...pillar.branch,
      hiddenStems: hidden,
      season: seasonForBranch(pillar.branch.id),
      twelveStage: calculateTwelveStage(dayStem, pillar.branch)
    },
    index: pillar.index
  };
}

export function calculateElementBalance(pillars) {
  const score = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  Object.values(pillars).filter(Boolean).forEach(pillar => {
    score[pillar.stem.element] += 1;
    score[pillar.branch.element] += 1;
    pillar.branch.hiddenStems.forEach(hidden => {
      score[hidden.element] += hidden.weight || 0.35;
    });
  });
  return Object.entries(score).map(([element, value]) => ({
    element,
    value: Math.round(value * 100) / 100,
    kanji: ELEMENTS[element].kanji
  }));
}

export function calculateEmptyVoid(dayIndex) {
  if (!dayIndex) return [];
  const group = Math.floor((dayIndex - 1) / 10);
  return [[10, 11], [8, 9], [6, 7], [4, 5], [2, 3], [0, 1]][group % 6]
    .map(index => BRANCHES[index].id);
}

export function buildDerivedChartInfo({ year, month, day, hour }) {
  const pillars = {
    year: buildDerivedPillar(year, 'year', day.stem),
    month: buildDerivedPillar(month, 'month', day.stem),
    day: buildDerivedPillar(day, 'day', day.stem),
    hour: buildDerivedPillar(hour, 'hour', day.stem)
  };

  return {
    pillars,
    elementBalance: calculateElementBalance(pillars),
    emptyVoid: calculateEmptyVoid(day.index),
    tombStorage: Object.entries(HIDDEN_STEMS)
      .filter(([, stems]) => stems.length >= 3)
      .map(([branchId]) => branchId)
  };
}
