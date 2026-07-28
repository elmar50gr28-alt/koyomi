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
assert.equal(result.normalizedInput.place.longitude,138.366667,'中野市の経度を計算入力に保持すること');
assert.ok(Math.abs(result.calendarCalculation.trueSolarTime.longitudeMinutes-13.466668)<0.0001,'中野市では日本標準子午線との差を+13分28秒として補正すること');
assert.ok(Math.abs(result.calendarCalculation.trueSolarTime.equationOfTimeMinutes-(-13.6756059))<0.0001,'1980年2月5日の均時差を約-13分41秒として補正すること');
assert.ok(Math.abs(result.calendarCalculation.trueSolarTime.minutesOffset-(-0.2089379))<0.0001,'経度差と均時差を合算した真太陽時補正を保持すること');
assert.equal(result.calendarCalculation.trueSolarTime.date.toISOString(),'1980-02-04T16:59:47.463Z','入力02:00を真太陽時01:59:47へ補正すること');

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
assert.ok(appSource.includes('async function ensureBirthPlaceCoordinates()'),'出生地名から座標を確定する入力ガードがあること');
assert.ok(appSource.includes("if(!await ensureBirthPlaceCoordinates())return"),'座標未確定のまま本鑑定を実行しないこと');
assert.ok(appSource.includes("window.KOYOMI_BAZI_READING?.render()"),'座標確定後に共通四柱コアを再計算すること');
assert.ok(!appSource.includes("longitude:Number(value('longitude'))||135"),'共通四柱コアへ不明な経度を135度として渡さないこと');
assert.ok(!appSource.includes("lon:isFinite(lon)?lon:135"),'旧鑑定でも不明な経度を135度として扱わないこと');

console.log('Bazi four-pillar regression passed: Nakano fixture, civil day, month stems, hour stem and UI source');
