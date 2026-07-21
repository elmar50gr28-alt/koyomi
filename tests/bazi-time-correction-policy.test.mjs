import assert from 'node:assert/strict';

import { calculateTrueSolarTime } from '../src/bazi/calendar/index.js';
import { prepareBirthCalculation } from '../src/bazi/chart/birth-time.js';
import { applyBirthTimeCorrection } from '../src/bazi/chart/time-correction.js';

const birthLocal = new Date('2026-03-06T00:05:00+09:00');

const missingLongitude = calculateTrueSolarTime(birthLocal, null, 9);
assert.equal(missingLongitude.date.getTime(), birthLocal.getTime());
assert.equal(missingLongitude.minutesOffset, 0);
assert.equal(missingLongitude.precision, 'timezone-only');
assert.equal(missingLongitude.warning, 'longitude-missing');

const standard = applyBirthTimeCorrection(
  birthLocal,
  { longitude: 122.94, utcOffset: 9 },
  'standard'
);
assert.equal(standard.date.getTime(), birthLocal.getTime());
assert.equal(standard.minutesOffset, 0);
assert.equal(standard.precision, 'standard-time');

const solar = applyBirthTimeCorrection(
  birthLocal,
  { longitude: 122.94, utcOffset: 9 },
  'true'
);
assert.equal(solar.minutesOffset, (122.94 - 135) * 4);
assert.ok(solar.date.getTime() < birthLocal.getTime());

const profile = {
  birthData: {
    date: '2026-03-06',
    time: '00:05',
    place: { longitude: 122.94, utcOffset: 9, timezone: 'Asia/Tokyo' }
  }
};
const standardPreparation = prepareBirthCalculation(profile, { solar: 'standard' });
const solarPreparation = prepareBirthCalculation(profile, { solar: 'true' });
assert.equal(standardPreparation.calculationDate.getDate(), 6);
assert.equal(solarPreparation.calculationDate.getDate(), 5);

const noLongitude = prepareBirthCalculation({
  birthData: {
    date: '2026-09-07',
    time: '23:41',
    place: { longitude: null, utcOffset: 9, timezone: 'Asia/Tokyo' }
  }
});
assert.equal(noLongitude.calculationDate.getHours(), 23);
assert.ok(noLongitude.warnings.includes('longitude-missing'));

console.log('Bazi time-correction policy passed: cases=5');
