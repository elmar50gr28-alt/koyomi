import assert from 'node:assert/strict';
import {
  DEFAULT_BAZI_SETTINGS, calculateBazi, calculatePillarFoundation, inspectBaziSettings,
  normalizeBaziSettings, toLegacySchoolConfig
} from '../src/bazi/index.js';

const profile = {
  displayName: 'settings regression', gender: 'male',
  birthData: { date: '1990-06-15', time: '08:20', place: { longitude: 139.767, latitude: 35.681, timezone: 'Asia/Tokyo', utcOffset: 9 } }
};

assert.deepEqual(normalizeBaziSettings(), DEFAULT_BAZI_SETTINGS);
assert.equal(normalizeBaziSettings({ boundary: '23' }).calendar.dayBoundary, 'late-zi-next-day');
assert.equal(normalizeBaziSettings({ boundary: '0' }).calendar.dayBoundary, 'midnight');
for (const basis of ['standard', 'local', 'true']) {
  assert.equal(normalizeBaziSettings({ solar: basis }).calendar.timeBasis, basis);
}
assert.equal(calculateBazi({ ...profile, birthData: { ...profile.birthData, place: { ...profile.birthData.place, longitude: null } } }).warnings.includes('longitude-missing'), true);
const unknown = calculateBazi({ ...profile, birthData: { ...profile.birthData, time: '', timeUnknown: true } });
assert.equal(unknown.chart.pillars.hour, null);
assert.equal(normalizeBaziSettings({ hidden: 'main' }).derived.hiddenStems, 'main');

const passed = normalizeBaziSettings({
  strength: { weights: { monthCommand: { same: 9 } } },
  patterns: { weights: { monthVoid: -2 }, thresholds: { candidate: 3 } },
  yongshen: { weights: { primaryThreshold: 5 } },
  luck: { defaultDirection: 'reverse', startMethod: 'solar-term-distance', annualBoundary: 'risshun', monthlyBoundary: 'solar-term' }
});
const legacy = toLegacySchoolConfig(passed);
assert.equal(legacy.strengthWeights.monthCommand.same, 9);
assert.equal(legacy.patternWeights.monthVoid, -2);
assert.equal(legacy.patternThresholds.candidate, 3);
assert.equal(legacy.yongshenWeights.primaryThreshold, 5);
assert.equal(legacy.defaultLuckDirection, 'reverse');
assert.equal(legacy.luckStart, 'solar-term-distance');
assert.equal(legacy.annualBoundary, 'risshun');
assert.equal(legacy.monthlyBoundary, 'solar-term');

const invalid = normalizeBaziSettings({ schoolId: 'missing', boundary: 'bad', solar: 'bad', hidden: 'bad', kuubo: 'bad', term: 'bad', defaultLuckDirection: 'sideways' });
assert.equal(invalid.schoolId, DEFAULT_BAZI_SETTINGS.schoolId);
assert.equal(invalid.calendar.dayBoundary, DEFAULT_BAZI_SETTINGS.calendar.dayBoundary);
assert.equal(invalid.calendar.timeBasis, DEFAULT_BAZI_SETTINGS.calendar.timeBasis);
assert.equal(invalid.derived.hiddenStems, DEFAULT_BAZI_SETTINGS.derived.hiddenStems);

const oldProfile = { ...profile, school: { dayBoundary: '23', hidden: 'equal' } };
assert.doesNotThrow(() => calculateBazi(oldProfile, oldProfile.school));
const restoredBackupSettings = JSON.parse(JSON.stringify({ boundary: 0, hidden: 'weighted', kuubo: 'jun', solar: 'true', term: 'longitude' }));
assert.equal(normalizeBaziSettings(restoredBackupSettings).calendar.dayBoundary, 'midnight');

const oldResult = calculateBazi(profile, {});
const newResult = calculateBazi(profile, normalizeBaziSettings({}));
assert.deepEqual(oldResult.chart, newResult.chart);
assert.deepEqual(oldResult.strength, newResult.strength);
assert.deepEqual(oldResult.patterns, newResult.patterns);
assert.deepEqual(oldResult.yongshen, newResult.yongshen);
assert.equal(oldResult.luckCycles.direction, newResult.luckCycles.direction);
assert.deepEqual(inspectBaziSettings({}).settings, DEFAULT_BAZI_SETTINGS);

const beforeRisshun = calculatePillarFoundation('2026-02-04T05:01:00+09:00');
const atRisshun = calculatePillarFoundation('2026-02-04T05:02:00+09:00');
assert.notEqual(beforeRisshun.year.label, atRisshun.year.label);
const beforeMonth = calculatePillarFoundation('2026-03-05T22:58:00+09:00');
const atMonth = calculatePillarFoundation('2026-03-05T22:59:00+09:00');
assert.notEqual(beforeMonth.month.label, atMonth.month.label);

console.log('Bazi common settings core passed');
