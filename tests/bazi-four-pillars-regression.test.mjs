import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { calculateBazi } from '../src/bazi/index.js';
import {
  calculateDayPillar,
  calculateHourPillar,
  calculateMonthPillar
} from '../src/bazi/calendar/index.js';

const result = calculateBazi({
  displayName: '回帰確認',
  birthData: {
    date: '1980-02-05',
    time: '02:00',
    place: {
      label: '長野県中野市',
      latitude: 36.733333,
      longitude: 138.366667,
      utcOffset: 9,
      timezone: 'Asia/Tokyo'
    }
  }
});

assert.deepEqual(
  ['year', 'month', 'day', 'hour'].map(role => result.chart.pillars[role]?.label),
  ['庚申', '戊寅', '戊申', '癸丑'],
  '1980年2月5日2時・長野県中野市は四柱すべてを正しく算出すること'
);

for (const time of ['00:30:00', '02:00:00', '12:00:00', '22:30:00']) {
  assert.equal(
    calculateDayPillar(new Date(`1980-02-05T${time}+09:00`)).label,
    '戊申',
    `${time}でも同じ日本民事日の間は日柱が変わらないこと`
  );
}

for (const [yearStemId, expected] of [
  ['jia', '丙寅'], ['ji', '丙寅'],
  ['yi', '戊寅'], ['geng', '戊寅'],
  ['bing', '庚寅'], ['xin', '庚寅'],
  ['ding', '壬寅'], ['ren', '壬寅'],
  ['wu', '甲寅'], ['gui', '甲寅']
]) {
  assert.equal(
    calculateMonthPillar(new Date('2026-02-10T12:00:00+09:00'), yearStemId).label,
    expected,
    `${yearStemId}年の寅月干を五虎遁で算出すること`
  );
}

assert.equal(
  calculateHourPillar(new Date('1980-02-05T02:13:28+09:00'), 'wu').label,
  '癸丑',
  '戊日の丑刻は癸丑になること'
);

const appSource = await readFile('app.html', 'utf8');
assert.ok(
  appSource.includes("const pillars=result.chart?.pillars||{}"),
  '画面の命式表示が共通計算結果を参照すること'
);
assert.ok(
  appSource.includes("pillarOrder=[['year','年柱'],['month','月柱'],['day','日柱'],['hour','時柱']]"),
  '画面に年・月・日・時の順で共通計算結果を表示すること'
);

console.log('Bazi four-pillar regression passed: Nakano fixture, civil day, month stems, hour stem and UI source');
