import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { buildSeasonalIngressCharts } from '../src/mundane/western/index.js';

const source = await readFile('src/mundane/western/browser-global.js', 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const browserCore = context.window.KOYOMI_MUNDANE_BROWSER_CORE;
assert.ok(browserCore, 'classic browser core must install without ES module loading');

const YEAR_START = Date.UTC(2026, 0, 1);
const tropicalYear = 365.2422 * 86400000;
const ephemeris = {
  id: 'browser-global-test', precision: 'test',
  solarLongitude(date) { return ((date.getTime() - YEAR_START) / tropicalYear * 360 + 280) % 360; },
  planetLongitudes(date) { const sun = this.solarLongitude(date); return { Sun: sun, Moon: (sun + 47) % 360, Mercury: (sun + 5) % 360, Mars: (sun + 95) % 360, Jupiter: (sun + 120) % 360, Saturn: (sun + 180) % 360 }; }
};
const options = { year: 2026, location: { label: 'Tokyo', latitude: 35.6812, longitude: 139.7671, timezone: 'Asia/Tokyo' }, ephemeris };
const browserCharts = browserCore.buildSeasonalIngressCharts(options);
const moduleCharts = buildSeasonalIngressCharts(options);
assert.equal(JSON.stringify(browserCharts.map(chart => chart.datetime)), JSON.stringify(moduleCharts.map(chart => chart.datetime)));
assert.equal(browserCharts.length, 4);
const readings = browserCharts.map(browserCore.interpretSeasonalIngressChart);
assert.ok(readings.every(reading => reading.narrative && reading.recommendedActions.length));
assert.match(browserCore.synthesizeSeasonalIngressReadings(readings).narrative, /年間判断では/);
const browserMonths = browserCore.buildMonthlyIngressCharts(options);
assert.equal(browserMonths.length, 12);
const browserTrend = browserCore.buildMonthlyTrend(browserMonths, browserMonths.map(browserCore.interpretSeasonalIngressChart));
assert.equal(browserTrend.length, 12);
assert.equal(browserTrend[0].changeIndex, null);
assert.ok(browserTrend.slice(1).every(item => Number.isInteger(item.changeIndex)));
assert.ok(browserTrend.every(item => item.plainReading.stance));
assert.match(browserCore.summarizeMonthlyTrend(browserTrend).headline, /進める候補/);

console.log('Mundane classic browser core passed');
