import assert from 'node:assert/strict';

import {
  calculateMonthPillar,
  calculateSolarTerms
} from '../src/bazi/calendar/index.js';

const YEAR_STEM_ID = 'bing';

const CASES = [
  {
    label: '小寒',
    before: '2026-01-05T17:22:00+09:00',
    exact: '2026-01-05T17:23:00+09:00',
    previousBranchId: 'zi',
    currentBranchId: 'chou',
    currentBoundaryId: 'shokan'
  },
  {
    label: '立春',
    before: '2026-02-04T05:01:00+09:00',
    exact: '2026-02-04T05:02:00+09:00',
    previousBranchId: 'chou',
    currentBranchId: 'yin',
    currentBoundaryId: 'risshun'
  },
  {
    label: '啓蟄',
    before: '2026-03-05T22:58:00+09:00',
    exact: '2026-03-05T22:59:00+09:00',
    previousBranchId: 'yin',
    currentBranchId: 'mao',
    currentBoundaryId: 'keichitsu'
  },
  {
    label: '清明',
    before: '2026-04-05T03:39:00+09:00',
    exact: '2026-04-05T03:40:00+09:00',
    previousBranchId: 'mao',
    currentBranchId: 'chen',
    currentBoundaryId: 'seimei'
  },
  {
    label: '立夏',
    before: '2026-05-05T20:48:00+09:00',
    exact: '2026-05-05T20:49:00+09:00',
    previousBranchId: 'chen',
    currentBranchId: 'si',
    currentBoundaryId: 'rikka'
  },
  {
    label: '芒種',
    before: '2026-06-06T00:47:00+09:00',
    exact: '2026-06-06T00:48:00+09:00',
    previousBranchId: 'si',
    currentBranchId: 'wu',
    currentBoundaryId: 'boshu'
  },
  {
    label: '小暑',
    before: '2026-07-07T10:56:00+09:00',
    exact: '2026-07-07T10:57:00+09:00',
    previousBranchId: 'wu',
    currentBranchId: 'wei',
    currentBoundaryId: 'shosho'
  },
  {
    label: '立秋',
    before: '2026-08-07T20:42:00+09:00',
    exact: '2026-08-07T20:43:00+09:00',
    previousBranchId: 'wei',
    currentBranchId: 'shen',
    currentBoundaryId: 'risshu'
  },
  {
    label: '白露',
    before: '2026-09-07T23:40:00+09:00',
    exact: '2026-09-07T23:41:00+09:00',
    previousBranchId: 'shen',
    currentBranchId: 'you',
    currentBoundaryId: 'hakuro'
  },
  {
    label: '寒露',
    before: '2026-10-08T15:28:00+09:00',
    exact: '2026-10-08T15:29:00+09:00',
    previousBranchId: 'you',
    currentBranchId: 'xu',
    currentBoundaryId: 'kanro'
  },
  {
    label: '立冬',
    before: '2026-11-07T18:51:00+09:00',
    exact: '2026-11-07T18:52:00+09:00',
    previousBranchId: 'xu',
    currentBranchId: 'hai',
    currentBoundaryId: 'ritto'
  },
  {
    label: '大雪',
    before: '2026-12-07T11:52:00+09:00',
    exact: '2026-12-07T11:53:00+09:00',
    previousBranchId: 'hai',
    currentBranchId: 'zi',
    currentBoundaryId: 'taisetsu'
  }
];

for (const testCase of CASES) {
  const before = calculateMonthPillar(
    testCase.before,
    YEAR_STEM_ID
  );

  const exact = calculateMonthPillar(
    testCase.exact,
    YEAR_STEM_ID
  );

  assert.equal(
    before.branch.id,
    testCase.previousBranchId,
    `${testCase.label}1分前の月支`
  );

  assert.equal(
    exact.branch.id,
    testCase.currentBranchId,
    `${testCase.label}ちょうどの月支`
  );

  assert.equal(
    exact.boundary.termId,
    testCase.currentBoundaryId,
    `${testCase.label}の境界ID`
  );

  assert.equal(
    exact.boundary.nameJa,
    testCase.label,
    `${testCase.label}の日本語名`
  );

  assert.equal(
    exact.boundary.precision,
    'official-minute',
    `${testCase.label}の境界精度`
  );

  assert.equal(
    exact.boundary.sourceId,
    'naoj-rekiyou-2026',
    `${testCase.label}の出典`
  );

  assert.equal(
    exact.boundary.warning,
    null,
    `${testCase.label}に警告がないこと`
  );
}

const terms2026 = calculateSolarTerms(
  '2026-06-01T00:00:00+09:00'
);

assert.equal(
  terms2026.length,
  12,
  '2026年の月柱用節が12件あること'
);

assert.deepEqual(
  terms2026.map(term => term.termId),
  [
    'shokan',
    'risshun',
    'keichitsu',
    'seimei',
    'rikka',
    'boshu',
    'shosho',
    'risshu',
    'hakuro',
    'kanro',
    'ritto',
    'taisetsu'
  ],
  '月柱用十二節の順序'
);

const fallback = calculateMonthPillar(
  '2030-06-10T12:00:00+09:00',
  YEAR_STEM_ID
);

assert.equal(
  fallback.boundary.precision,
  'fallback-fixed-day',
  '正式データ未登録年は暫定精度を表示すること'
);

assert.equal(
  fallback.boundary.warning,
  'month-boundary-official-data-missing',
  '正式データ未登録年は警告を表示すること'
);

assert.throws(
  () => calculateMonthPillar('not-a-date', YEAR_STEM_ID),
  {
    name: 'TypeError',
    message: 'calculateMonthPillar requires a valid date'
  },
  '無効な日時を黙って計算しないこと'
);

console.log(
  `Bazi month boundary tests passed: ${CASES.length} official boundaries`
);
