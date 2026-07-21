import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildBirthDateTime,
  calculateSolarTerms,
  calculateTrueSolarTime,
  normalizeProfile,
  resolveSchoolConfig
} from '../src/bazi/calendar/index.js';
import { prepareBirthCalculation } from '../src/bazi/chart/birth-time.js';

function legacyPreparation(profile, schoolConfigInput = {}) {
  const schoolConfig = resolveSchoolConfig(schoolConfigInput);
  const normalizedInput = normalizeProfile(profile);
  const birthLocal = buildBirthDateTime(normalizedInput);
  const warnings = [];
  if (!normalizedInput.date) warnings.push('birth-date-missing');
  if (normalizedInput.timeUnknown) warnings.push('birth-time-unknown-hour-pillar-partial');
  const trueSolarTime = birthLocal
    ? calculateTrueSolarTime(birthLocal, normalizedInput.place.longitude, normalizedInput.place.utcOffset)
    : null;
  if (trueSolarTime?.warning) warnings.push(trueSolarTime.warning);
  return {
    schoolConfig,
    normalizedInput,
    birthLocal,
    trueSolarTime,
    calculationDate: trueSolarTime?.date || birthLocal || null,
    solarTerms: birthLocal ? calculateSolarTerms(birthLocal, normalizedInput.place.timezone) : [],
    warnings
  };
}

const CASES = [
  {
    label: '東京・既知時刻',
    profile: { birthData: { date: '2025-02-03', time: '23:10', place: { longitude: 139.767, utcOffset: 9, timezone: 'Asia/Tokyo' } } }
  },
  {
    label: '大阪・0時付近',
    profile: { birthData: { date: '2026-03-06', time: '00:05', place: { longitude: 135.502, utcOffset: 9, timezone: 'Asia/Tokyo' } } }
  },
  {
    label: '西端補正で前日へ移る時刻',
    profile: { birthData: { date: '2026-03-06', time: '00:10', place: { longitude: 122.94, utcOffset: 9, timezone: 'Asia/Tokyo' } } }
  },
  {
    label: '経度なし',
    profile: { birthData: { date: '2026-09-07', time: '23:41', place: { longitude: null, utcOffset: 9, timezone: 'Asia/Tokyo' } } }
  },
  {
    label: '出生時刻不明',
    profile: { birthData: { date: '2026-02-04', time: '12:34', timeUnknown: true, place: { longitude: 135.502, utcOffset: 9, timezone: 'Asia/Tokyo' } } }
  }
];

for (const testCase of CASES) {
  for (const dayBoundary of ['midnight', 'late-zi-next-day']) {
    const settings = { dayBoundary, ziHour: dayBoundary === 'midnight' ? 'split' : 'late-zi-next-day' };
    const current = prepareBirthCalculation(testCase.profile, settings);
    const legacy = legacyPreparation(testCase.profile, settings);
    assert.deepEqual(current.schoolConfig, legacy.schoolConfig, `${testCase.label}の設定`);
    assert.deepEqual(current.normalizedInput, legacy.normalizedInput, `${testCase.label}の入力整理`);
    assert.deepEqual(current.birthLocal, legacy.birthLocal, `${testCase.label}の出生日時`);
    assert.deepEqual(current.trueSolarTime, legacy.trueSolarTime, `${testCase.label}の出生地補正`);
    assert.deepEqual(current.calculationDate, legacy.calculationDate, `${testCase.label}の計算日時`);
    assert.deepEqual(current.solarTerms, legacy.solarTerms, `${testCase.label}の節入り一覧`);
    assert.deepEqual(current.warnings, legacy.warnings, `${testCase.label}の注意情報`);
  }
}

const unknown = prepareBirthCalculation(CASES.at(-1).profile);
assert.equal(unknown.normalizedInput.time, '', '時刻不明では入力時刻を使用しないこと');
assert.ok(unknown.warnings.includes('birth-time-unknown-hour-pillar-partial'));

const missingLongitude = prepareBirthCalculation(CASES[3].profile);
assert.equal(missingLongitude.trueSolarTime.minutesOffset, -540, '現在の経度なし補正結果を維持すること');
assert.equal(missingLongitude.trueSolarTime.warning, null, '現在の経度なし警告結果を維持すること');

const crossedDate = prepareBirthCalculation(CASES[2].profile);
assert.equal(crossedDate.birthLocal.getDate(), 6);
assert.equal(crossedDate.calculationDate.getDate(), 5, '現在どおり出生地補正で前日へ移ること');

const chartSource = await readFile('src/bazi/chart/index.js', 'utf8');
assert.ok(chartSource.includes('prepareBirthCalculation(profile, schoolConfigInput)'));
assert.ok(!chartSource.includes('calculateTrueSolarTime(birthLocal'));

console.log(`Bazi birth-time core equivalence passed: cases=${CASES.length * 2}`);
