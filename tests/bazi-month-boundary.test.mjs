import assert from 'node:assert/strict';

import {
  calculateMonthPillar,
  calculateSolarTerms
} from '../src/bazi/calendar/index.js';

const YEAR_STEM_ID = 'bing';

const EXPECTED_TERM_IDS = [
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
];

const YEAR_CASES = [
  {
    year: 2025,
    sourceId: 'naoj-rekiyou-2025',
    cases: [
      ['小寒', '2025-01-05T11:32:00+09:00', '2025-01-05T11:33:00+09:00', 'zi', 'chou', 'shokan'],
      ['立春', '2025-02-03T23:09:00+09:00', '2025-02-03T23:10:00+09:00', 'chou', 'yin', 'risshun'],
      ['啓蟄', '2025-03-05T17:06:00+09:00', '2025-03-05T17:07:00+09:00', 'yin', 'mao', 'keichitsu'],
      ['清明', '2025-04-04T21:48:00+09:00', '2025-04-04T21:49:00+09:00', 'mao', 'chen', 'seimei'],
      ['立夏', '2025-05-05T14:56:00+09:00', '2025-05-05T14:57:00+09:00', 'chen', 'si', 'rikka'],
      ['芒種', '2025-06-05T18:56:00+09:00', '2025-06-05T18:57:00+09:00', 'si', 'wu', 'boshu'],
      ['小暑', '2025-07-07T05:04:00+09:00', '2025-07-07T05:05:00+09:00', 'wu', 'wei', 'shosho'],
      ['立秋', '2025-08-07T14:51:00+09:00', '2025-08-07T14:52:00+09:00', 'wei', 'shen', 'risshu'],
      ['白露', '2025-09-07T17:51:00+09:00', '2025-09-07T17:52:00+09:00', 'shen', 'you', 'hakuro'],
      ['寒露', '2025-10-08T09:40:00+09:00', '2025-10-08T09:41:00+09:00', 'you', 'xu', 'kanro'],
      ['立冬', '2025-11-07T13:03:00+09:00', '2025-11-07T13:04:00+09:00', 'xu', 'hai', 'ritto'],
      ['大雪', '2025-12-07T06:04:00+09:00', '2025-12-07T06:05:00+09:00', 'hai', 'zi', 'taisetsu']
    ]
  },
  {
    year: 2026,
    sourceId: 'naoj-rekiyou-2026',
    cases: [
      ['小寒', '2026-01-05T17:22:00+09:00', '2026-01-05T17:23:00+09:00', 'zi', 'chou', 'shokan'],
      ['立春', '2026-02-04T05:01:00+09:00', '2026-02-04T05:02:00+09:00', 'chou', 'yin', 'risshun'],
      ['啓蟄', '2026-03-05T22:58:00+09:00', '2026-03-05T22:59:00+09:00', 'yin', 'mao', 'keichitsu'],
      ['清明', '2026-04-05T03:39:00+09:00', '2026-04-05T03:40:00+09:00', 'mao', 'chen', 'seimei'],
      ['立夏', '2026-05-05T20:48:00+09:00', '2026-05-05T20:49:00+09:00', 'chen', 'si', 'rikka'],
      ['芒種', '2026-06-06T00:47:00+09:00', '2026-06-06T00:48:00+09:00', 'si', 'wu', 'boshu'],
      ['小暑', '2026-07-07T10:56:00+09:00', '2026-07-07T10:57:00+09:00', 'wu', 'wei', 'shosho'],
      ['立秋', '2026-08-07T20:42:00+09:00', '2026-08-07T20:43:00+09:00', 'wei', 'shen', 'risshu'],
      ['白露', '2026-09-07T23:40:00+09:00', '2026-09-07T23:41:00+09:00', 'shen', 'you', 'hakuro'],
      ['寒露', '2026-10-08T15:28:00+09:00', '2026-10-08T15:29:00+09:00', 'you', 'xu', 'kanro'],
      ['立冬', '2026-11-07T18:51:00+09:00', '2026-11-07T18:52:00+09:00', 'xu', 'hai', 'ritto'],
      ['大雪', '2026-12-07T11:52:00+09:00', '2026-12-07T11:53:00+09:00', 'hai', 'zi', 'taisetsu']
    ]
  }
];

let testedBoundaryCount = 0;

for (const yearCase of YEAR_CASES) {
  for (const [
    label,
    beforeDatetime,
    exactDatetime,
    previousBranchId,
    currentBranchId,
    currentBoundaryId
  ] of yearCase.cases) {
    const before = calculateMonthPillar(
      beforeDatetime,
      YEAR_STEM_ID
    );

    const exact = calculateMonthPillar(
      exactDatetime,
      YEAR_STEM_ID
    );

    assert.equal(
      before.branch.id,
      previousBranchId,
      `${yearCase.year}年${label}1分前の月支`
    );

    assert.equal(
      exact.branch.id,
      currentBranchId,
      `${yearCase.year}年${label}ちょうどの月支`
    );

    assert.equal(
      exact.boundary.termId,
      currentBoundaryId,
      `${yearCase.year}年${label}の境界ID`
    );

    assert.equal(
      exact.boundary.nameJa,
      label,
      `${yearCase.year}年${label}の日本語名`
    );

    assert.equal(
      exact.boundary.precision,
      'official-minute',
      `${yearCase.year}年${label}の境界精度`
    );

    assert.equal(
      exact.boundary.sourceId,
      yearCase.sourceId,
      `${yearCase.year}年${label}の出典`
    );

    assert.equal(
      exact.boundary.warning,
      null,
      `${yearCase.year}年${label}に警告がないこと`
    );

    testedBoundaryCount += 1;
  }

  const terms = calculateSolarTerms(
    `${yearCase.year}-06-01T00:00:00+09:00`
  );

  assert.equal(
    terms.length,
    12,
    `${yearCase.year}年の月柱用節が12件あること`
  );

  assert.deepEqual(
    terms.map(term => term.termId),
    EXPECTED_TERM_IDS,
    `${yearCase.year}年の十二節の順序`
  );

  assert.ok(
    terms.every(
      term =>
        term.precision === 'official-minute' &&
        term.sourceId === yearCase.sourceId
    ),
    `${yearCase.year}年の十二節すべてに正式精度と出典があること`
  );
}

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
  () =>
    calculateMonthPillar(
      'not-a-date',
      YEAR_STEM_ID
    ),
  {
    name: 'TypeError',
    message:
      'calculateMonthPillar requires a valid date'
  },
  '無効な日時を黙って計算しないこと'
);

console.log(
  `Bazi month boundary tests passed: ${testedBoundaryCount} official boundaries`
);
