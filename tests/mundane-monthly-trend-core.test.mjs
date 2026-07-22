import assert from 'node:assert/strict';
import { buildMonthlyIngressCharts, buildMonthlyTrend, createAstronomyEngineAdapter, interpretSeasonalIngressChart, MONTHLY_INGRESSES } from '../src/mundane/western/index.js';

const YEAR_START = Date.UTC(2026, 0, 1), tropicalYear = 365.2422 * 86400000;
const ephemeris = {
  id: 'monthly-test', precision: 'test',
  solarLongitude(date) { return ((date.getTime() - YEAR_START) / tropicalYear * 360 + 280) % 360; },
  planetLongitudes(date) { const sun = this.solarLongitude(date); const step = (date.getTime() - YEAR_START) / 86400000; return { Sun: sun, Moon: (sun + step * 12.2) % 360, Mercury: (sun + step * 0.4 + 8) % 360, Venus: (sun + step * 0.7 + 45) % 360, Mars: (sun + step * 0.5 + 92) % 360, Jupiter: (sun + step * 0.08 + 120) % 360, Saturn: (sun + step * 0.03 + 180) % 360 }; }
};
const charts = buildMonthlyIngressCharts({ year: 2026, location: { label: 'Tokyo', latitude: 35.6812, longitude: 139.7671 }, ephemeris });
assert.equal(MONTHLY_INGRESSES.length, 12);
assert.equal(charts.length, 12);
assert.deepEqual(charts.map(chart => chart.month), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
assert.ok(charts.every(chart => chart.positions.Sun >= 0 && chart.positions.Sun < 360));
const readings = charts.map(interpretSeasonalIngressChart);
const trend = buildMonthlyTrend(charts, readings);
assert.equal(trend.length, 12);
assert.equal(trend[0].changeIndex, null);
for (const item of trend) {
  assert.ok(item.supportIndex >= 0 && item.supportIndex <= 100);
  assert.ok(item.pressureIndex >= 0 && item.pressureIndex <= 100);
  if (item.changeIndex !== null) assert.ok(item.changeIndex >= 0 && item.changeIndex <= 100);
  assert.match(item.basis.formula, /天体60%/);
}
assert.ok(new Set(trend.map(item => `${item.supportIndex}:${item.pressureIndex}:${item.changeIndex}`)).size > 4, 'monthly results must show meaningful variation');
assert.throws(() => buildMonthlyTrend(charts, readings.slice(1)), /matching/);
assert.throws(() => createAstronomyEngineAdapter({}), /unavailable/);

console.log('Mundane monthly trend core passed');
