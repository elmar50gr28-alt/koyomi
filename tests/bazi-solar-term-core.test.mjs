import assert from 'node:assert/strict';

import {
  calculateSetsuBoundaries,
  solarApparentLongitude
} from '../src/bazi/astronomy/solar-term-core.js';
import {
  calculateMonthPillar,
  calculateYearPillar
} from '../src/bazi/calendar/index.js';

const minute = 60000;
const officialFixtures = [
  ['2025-risshun', 2025, 'risshun', '2025-02-03T14:10:00.000Z'],
  ['2025-keichitsu', 2025, 'keichitsu', '2025-03-05T08:07:00.000Z'],
  ['2026-risshun', 2026, 'risshun', '2026-02-03T20:02:00.000Z'],
  ['2026-keichitsu', 2026, 'keichitsu', '2026-03-05T13:59:00.000Z']
];

for (const [label, year, termId, officialIso] of officialFixtures) {
  const calculated = calculateSetsuBoundaries(year)
    .find(term => term.termId === termId);
  const differenceMinutes = Math.abs(
    calculated.date.getTime() - new Date(officialIso).getTime()
  ) / minute;

  assert.ok(
    differenceMinutes <= 12,
    `${label}の内蔵計算は国立天文台時刻から12分以内であること`
  );
  assert.ok(
    Math.abs(
      ((solarApparentLongitude(calculated.date) - calculated.targetLongitude + 540) % 360) - 180
    ) < 0.001,
    `${label}で目標黄経を通過すること`
  );
}

const historicalTerms = calculateSetsuBoundaries(1990);
assert.equal(historicalTerms.length, 12, '過去の出生年でも12節を計算すること');
assert.ok(
  historicalTerms.every((term, index) =>
    index === 0 || term.date > historicalTerms[index - 1].date
  ),
  '節入りが時系列順であること'
);

globalThis.Astronomy = {
  SunPosition(date) {
    return { elon: solarApparentLongitude(date) };
  }
};
const browserTerms = calculateSetsuBoundaries(1990);
assert.ok(
  browserTerms.every(term =>
    term.precision === 'astronomy-engine-minute' &&
    term.sourceId === 'astronomy-engine-2.1.19'
  ),
  'ブラウザーでは既存の高精度天文エンジンを使用すること'
);
delete globalThis.Astronomy;

const risshun2030 = calculateSetsuBoundaries(2030)
  .find(term => term.termId === 'risshun');
const beforeRisshun = new Date(risshun2030.date.getTime() - minute);
const atRisshun = risshun2030.date;
assert.equal(calculateYearPillar(beforeRisshun).pillarYear, 2029);
assert.equal(calculateYearPillar(atRisshun).pillarYear, 2030);

const keichitsu2030 = calculateSetsuBoundaries(2030)
  .find(term => term.termId === 'keichitsu');
const beforeMonth = calculateMonthPillar(
  new Date(keichitsu2030.date.getTime() - minute),
  'geng'
);
const atMonth = calculateMonthPillar(keichitsu2030.date, 'geng');
assert.equal(beforeMonth.branch.id, 'yin');
assert.equal(atMonth.branch.id, 'mao');

assert.throws(
  () => calculateSetsuBoundaries(1800),
  /between 1899 and 2101/
);

console.log('Bazi solar-term core tests passed: calculated range and boundaries');
