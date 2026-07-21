import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  calculateDayPillar,
  calculateHourPillar,
  calculateMonthPillar,
  calculateYearPillar
} from '../src/bazi/calendar/index.js';
import { calculatePillarFoundation } from '../src/bazi/chart/foundation.js';

function legacyFoundation(date, options = {}) {
  const year = calculateYearPillar(date);
  const month = calculateMonthPillar(date, year.stem.id);
  const day = calculateDayPillar(date);
  const hour = options.timeUnknown
    ? null
    : calculateHourPillar(date, day.stem.id, options.schoolConfig || {});
  return { year, month, day, hour };
}

const BOUNDARY_CASES = [
  ['立春1分前', '2025-02-03T23:09:00+09:00'],
  ['立春ちょうど', '2025-02-03T23:10:00+09:00'],
  ['立春1分後', '2025-02-03T23:11:00+09:00'],
  ['啓蟄1分前', '2026-03-05T22:58:00+09:00'],
  ['啓蟄ちょうど', '2026-03-05T22:59:00+09:00'],
  ['白露1分前', '2026-09-07T23:40:00+09:00'],
  ['白露ちょうど', '2026-09-07T23:41:00+09:00']
];

for (const [label, datetime] of BOUNDARY_CASES) {
  assert.deepEqual(
    calculatePillarFoundation(datetime),
    legacyFoundation(datetime),
    `${label}で旧計算と新コアが一致すること`
  );
}

const ZI_HOUR_CASES = [
  ['23時直前', '2026-03-05T22:59:00+09:00'],
  ['23時ちょうど', '2026-03-05T23:00:00+09:00'],
  ['23時台末', '2026-03-05T23:59:00+09:00'],
  ['0時ちょうど', '2026-03-06T00:00:00+09:00'],
  ['0時台末', '2026-03-06T00:59:00+09:00'],
  ['1時ちょうど', '2026-03-06T01:00:00+09:00']
];

for (const ziHour of ['23', '0']) {
  const schoolConfig = { ziHour };
  for (const [label, datetime] of ZI_HOUR_CASES) {
    const current = calculatePillarFoundation(datetime, { schoolConfig });
    const legacy = legacyFoundation(datetime, { schoolConfig });
    assert.deepEqual(
      current,
      legacy,
      `${ziHour}時切替設定・${label}で旧計算と新コアが一致すること`
    );
  }
}

const beforeMidnight = calculatePillarFoundation('2026-03-05T23:59:00+09:00');
const midnight = calculatePillarFoundation('2026-03-06T00:00:00+09:00');
assert.equal(beforeMidnight.hour.branch.id, 'zi', '23時台は子刻であること');
assert.equal(midnight.hour.branch.id, 'zi', '0時台も子刻であること');
assert.notEqual(beforeMidnight.day.label, midnight.day.label, '現在どおり0時に日柱が切り替わること');

const unknown = calculatePillarFoundation('2026-03-06T00:00:00+09:00', { timeUnknown: true });
assert.equal(unknown.hour, null, '出生時刻不明では時柱を作らないこと');
assert.deepEqual(unknown, legacyFoundation('2026-03-06T00:00:00+09:00', { timeUnknown: true }));

const chartSource = await readFile('src/bazi/chart/index.js', 'utf8');
const appSource = await readFile('app.html', 'utf8');
assert.ok(chartSource.includes('calculatePillarFoundation(calculationDate'), '鑑定入口が新コアを呼ぶこと');
assert.ok(appSource.includes("import * as KOYOMI_BAZI from './src/bazi/index.js'"), '画面の四柱推命入口を維持すること');
assert.ok(appSource.includes('KOYOMI_BAZI.calculateBazi(profile)'), '画面の鑑定呼び出しを維持すること');

console.log(`Bazi chart core equivalence passed: boundaries=${BOUNDARY_CASES.length}, ziHourCases=${ZI_HOUR_CASES.length * 2}`);
