import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  BRANCHES,
  ELEMENTS,
  HIDDEN_STEMS,
  SEASON_STRENGTH,
  STEMS,
  TEN_GODS,
  TWELVE_STAGES
} from '../src/bazi/data.js';
import { calculatePillarFoundation } from '../src/bazi/chart/foundation.js';
import {
  buildDerivedChartInfo,
  buildDerivedPillar,
  calculateElementBalance,
  calculateEmptyVoid,
  calculateTenGod,
  calculateTwelveStage,
  getHiddenStems,
  seasonForBranch,
  tenGodFor
} from '../src/bazi/chart/derived-info.js';

const byStem = Object.fromEntries(STEMS.map(stem => [stem.id, stem]));

function legacyElementRelation(day, target) {
  if (day === target) return 'same';
  if (ELEMENTS[day].generates === target) return 'output';
  if (ELEMENTS[day].controls === target) return 'wealth';
  if (ELEMENTS[target].controls === day) return 'officer';
  if (ELEMENTS[target].generates === day) return 'resource';
  return 'unknown';
}

function legacyTenGodFor(dayStem, targetStem) {
  if (!dayStem || !targetStem) return null;
  const relation = legacyElementRelation(dayStem.element, targetStem.element);
  const polarity = dayStem.yinYang === targetStem.yinYang ? 'same' : 'opposite';
  return TEN_GODS.find(god => god.elementRelation === relation && god.polarity === polarity) || null;
}

function legacyCalculateTenGod(dayStem, targetStem) {
  const day = typeof dayStem === 'string' ? byStem[dayStem] : dayStem;
  const target = typeof targetStem === 'string' ? byStem[targetStem] : targetStem;
  return legacyTenGodFor(day, target);
}

function legacyCalculateTwelveStage(dayStem, branch) {
  const dayStemId = typeof dayStem === 'string' ? dayStem : dayStem?.id;
  const branchId = typeof branch === 'string' ? branch : branch?.id;
  const branchIndex = BRANCHES.findIndex(item => item.id === branchId);
  const stageId = TWELVE_STAGES[dayStemId]?.[branchIndex] || null;
  return stageId ? { dayStemId, branchId, stageId } : null;
}

function legacyGetHiddenStems(branch, schoolId = 'koyomi-integrated') {
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

function legacySeasonForBranch(branchId) {
  return Object.entries(SEASON_STRENGTH)
    .find(([, value]) => value.branches.includes(branchId))?.[0] || 'unknown';
}

function legacyPillarPayload(pillar, role, dayStem) {
  if (!pillar) return null;
  const hidden = legacyGetHiddenStems(pillar.branch.id).map(item => ({
    ...item.stem,
    role: item.role,
    weight: item.weight,
    tenGod: legacyTenGodFor(dayStem, item.stem)
  }));
  return {
    role,
    label: pillar.label,
    stem: { ...pillar.stem, tenGod: legacyTenGodFor(dayStem, pillar.stem) },
    branch: {
      ...pillar.branch,
      hiddenStems: hidden,
      season: legacySeasonForBranch(pillar.branch.id),
      twelveStage: legacyCalculateTwelveStage(dayStem, pillar.branch)
    },
    index: pillar.index
  };
}

function legacyElementBalance(pillars) {
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

function legacyEmptyVoid(dayIndex) {
  if (!dayIndex) return [];
  const group = Math.floor((dayIndex - 1) / 10);
  return [[10, 11], [8, 9], [6, 7], [4, 5], [2, 3], [0, 1]][group % 6]
    .map(index => BRANCHES[index].id);
}

function legacyDerivedChartInfo({ year, month, day, hour }) {
  const pillars = {
    year: legacyPillarPayload(year, 'year', day.stem),
    month: legacyPillarPayload(month, 'month', day.stem),
    day: legacyPillarPayload(day, 'day', day.stem),
    hour: legacyPillarPayload(hour, 'hour', day.stem)
  };
  return {
    pillars,
    elementBalance: legacyElementBalance(pillars),
    emptyVoid: legacyEmptyVoid(day.index),
    tombStorage: Object.entries(HIDDEN_STEMS)
      .filter(([, stems]) => stems.length >= 3)
      .map(([branchId]) => branchId)
  };
}

for (const dayStem of STEMS) {
  for (const targetStem of STEMS) {
    assert.deepEqual(tenGodFor(dayStem, targetStem), legacyTenGodFor(dayStem, targetStem));
    assert.deepEqual(calculateTenGod(dayStem.id, targetStem.id), legacyCalculateTenGod(dayStem.id, targetStem.id));
  }
  for (const branch of BRANCHES) {
    assert.deepEqual(calculateTwelveStage(dayStem.id, branch.id), legacyCalculateTwelveStage(dayStem.id, branch.id));
  }
}

for (const branch of BRANCHES) {
  assert.deepEqual(getHiddenStems(branch.id), legacyGetHiddenStems(branch.id));
  assert.equal(seasonForBranch(branch.id), legacySeasonForBranch(branch.id));
}

const CASES = [
  ['立春直前', '2025-02-03T23:09:00+09:00', {}],
  ['立春直後', '2025-02-03T23:11:00+09:00', {}],
  ['節入り直前', '2026-03-05T22:58:00+09:00', {}],
  ['23時境界', '2026-03-05T23:00:00+09:00', { schoolConfig: { ziHour: '23' } }],
  ['0時境界', '2026-03-06T00:00:00+09:00', { schoolConfig: { ziHour: '0' } }],
  ['出生時刻不明', '1990-07-10T12:00:00+09:00', { timeUnknown: true }]
];

for (const [label, datetime, options] of CASES) {
  const foundation = calculatePillarFoundation(datetime, options);
  const current = buildDerivedChartInfo(foundation);
  const legacy = legacyDerivedChartInfo(foundation);
  assert.deepEqual(current, legacy, `${label}の派生情報が旧処理と一致すること`);
  assert.deepEqual(current.elementBalance, calculateElementBalance(current.pillars));
  assert.deepEqual(current.emptyVoid, calculateEmptyVoid(foundation.day.index));
  assert.deepEqual(
    current.pillars.year,
    buildDerivedPillar(foundation.year, 'year', foundation.day.stem)
  );
}

const chartSource = await readFile('src/bazi/chart/index.js', 'utf8');
assert.ok(chartSource.includes('buildDerivedChartInfo({ year, month, day, hour })'));
assert.ok(!chartSource.includes('function pillarPayload'));
assert.ok(!chartSource.includes('function elementBalance'));
assert.ok(!chartSource.includes('function calculateEmptyVoid'));

console.log(`Bazi derived-info equivalence passed: tenGods=${STEMS.length ** 2}, stages=${STEMS.length * BRANCHES.length}, charts=${CASES.length}`);
