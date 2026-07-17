import assert from 'node:assert/strict';

import {
  calculateYearPillar
} from '../src/bazi/calendar/index.js';

const CASES = [
  {
    year: 2024,
    boundary: '2024-02-04T17:27:00+09:00',
    before: '2024-02-04T17:26:00+09:00',
    after: '2024-02-04T17:28:00+09:00',
    previousLabel: '癸卯',
    currentLabel: '甲辰',
    previousPillarYear: 2023,
    currentPillarYear: 2024
  },
  {
    year: 2025,
    boundary: '2025-02-03T23:10:00+09:00',
    before: '2025-02-03T23:09:00+09:00',
    after: '2025-02-03T23:11:00+09:00',
    previousLabel: '甲辰',
    currentLabel: '乙巳',
    previousPillarYear: 2024,
    currentPillarYear: 2025
  },
  {
    year: 2026,
    boundary: '2026-02-04T05:02:00+09:00',
    before: '2026-02-04T05:01:00+09:00',
    after: '2026-02-04T05:03:00+09:00',
    previousLabel: '乙巳',
    currentLabel: '丙午',
    previousPillarYear: 2025,
    currentPillarYear: 2026
  },
  {
    year: 2027,
    boundary: '2027-02-04T10:46:00+09:00',
    before: '2027-02-04T10:45:00+09:00',
    after: '2027-02-04T10:47:00+09:00',
    previousLabel: '丙午',
    currentLabel: '丁未',
    previousPillarYear: 2026,
    currentPillarYear: 2027
  }
];

for (const testCase of CASES) {
  const before = calculateYearPillar(testCase.before);
  const exact = calculateYearPillar(testCase.boundary);
  const after = calculateYearPillar(testCase.after);

  assert.equal(
    before.label,
    testCase.previousLabel,
    `${testCase.year}年立春1分前の年柱`
  );

  assert.equal(
    before.pillarYear,
    testCase.previousPillarYear,
    `${testCase.year}年立春1分前の年柱年`
  );

  assert.equal(
    exact.label,
    testCase.currentLabel,
    `${testCase.year}年立春ちょうどの年柱`
  );

  assert.equal(
    exact.pillarYear,
    testCase.currentPillarYear,
    `${testCase.year}年立春ちょうどの年柱年`
  );

  assert.equal(
    after.label,
    testCase.currentLabel,
    `${testCase.year}年立春1分後の年柱`
  );

  assert.equal(
    exact.boundary.termId,
    'risshun',
    `${testCase.year}年の境界ID`
  );

  assert.equal(
    exact.boundary.timezone,
    'Asia/Tokyo',
    `${testCase.year}年の境界タイムゾーン`
  );

  assert.equal(
    exact.boundary.precision,
    'official-minute',
    `${testCase.year}年の境界精度`
  );

  assert.equal(
    exact.boundary.sourceId,
    `naoj-rekiyou-${testCase.year}`,
    `${testCase.year}年の出典ID`
  );

  assert.equal(
    exact.boundary.warning,
    null,
    `${testCase.year}年の公式データに警告がないこと`
  );
}

const before2026 = calculateYearPillar(
  '2026-02-04T05:01:00+09:00'
);

const exact2026 = calculateYearPillar(
  '2026-02-04T05:02:00+09:00'
);

assert.notEqual(
  before2026.label,
  exact2026.label,
  '2026年立春の瞬間に年柱が切り替わること'
);

const fallback = calculateYearPillar(
  '2030-02-04T12:00:00+09:00'
);

assert.equal(
  fallback.boundary.precision,
  'fallback-fixed-day',
  '公式立春データ未登録年は暫定精度を表示すること'
);

assert.equal(
  fallback.boundary.warning,
  'risshun-official-boundary-missing',
  '公式立春データ未登録年は警告を表示すること'
);

assert.throws(
  () => calculateYearPillar('not-a-date'),
  {
    name: 'TypeError',
    message: 'calculateYearPillar requires a valid date'
  },
  '無効な日時を黙って計算しないこと'
);

console.log(
  `Bazi Risshun boundary tests passed: ${CASES.length} official years`
);
