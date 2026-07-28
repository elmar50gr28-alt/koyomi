import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { calculateBazi } from '../src/bazi/index.js';

function profile(date, time, longitude = 139.7671) {
  return {
    displayName: '節入り境界確認',
    birthData: {
      date,
      time,
      place: {
        label: '東京都千代田区',
        latitude: 35.6812,
        longitude,
        utcOffset: 9,
        timezone: 'Asia/Tokyo'
      }
    }
  };
}

const beforeRisshun = calculateBazi(
  profile('2026-02-04', '05:01')
);
const exactRisshun = calculateBazi(
  profile('2026-02-04', '05:02')
);

assert.equal(
  beforeRisshun.chart.pillars.year.stem.id,
  'yi',
  '真太陽時が立春後を示しても、立春前の実際の瞬間は前年柱を維持する'
);
assert.equal(
  exactRisshun.chart.pillars.year.stem.id,
  'bing',
  '国立天文台の立春時刻ちょうどで年柱を切り替える'
);
assert.equal(
  beforeRisshun.calendarCalculation.pillarTimeBasis.yearMonth,
  'astronomical-instant'
);
assert.ok(
  new Date(beforeRisshun.calendarCalculation.trueSolarTime.date) >
    new Date(beforeRisshun.calendarCalculation.boundaryDate),
  '東京の真太陽時補正が境界判定時刻と分離される条件を固定する'
);

const beforeKeichitsu = calculateBazi(
  profile('2026-03-05', '22:58')
);
const exactKeichitsu = calculateBazi(
  profile('2026-03-05', '22:59')
);

assert.equal(
  beforeKeichitsu.chart.pillars.month.branch.id,
  'yin',
  '啓蟄1分前は寅月を維持する'
);
assert.equal(
  exactKeichitsu.chart.pillars.month.branch.id,
  'mao',
  '啓蟄ちょうどで卯月へ切り替える'
);

const westBefore = calculateBazi(
  profile('2026-02-04', '05:01', 122.94)
);
assert.equal(
  westBefore.chart.pillars.year.label,
  beforeRisshun.chart.pillars.year.label,
  '出生地経度が違っても同じ瞬間の年柱境界は変化しない'
);

const appSource = await readFile('app.html', 'utf8');
assert.ok(
  appSource.includes('core.calculateAnnualLuck(coreResult,reference,settings())'),
  '人生年表の流年を本鑑定と同じ共通運勢コアから取得する'
);
assert.ok(
  appSource.includes('立春 ${new Date(x.annualStart)'),
  '人生年表に各流年の立春開始時刻を表示する'
);

console.log('Bazi solar-boundary time-basis passed: Risshun, Keichitsu, longitude independence and timeline connection');
