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

// The app uses these built-in formulas when app.html is opened directly as a file.
const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;
const jd = date => date.getTime() / 86400000 + 2440587.5;
const appSolarLongitude = date => {
  const days = jd(date) - 2451545;
  const mean = mod(280.460 + 0.9856474 * days, 360);
  const anomaly = mod(357.528 + 0.9856003 * days, 360) * Math.PI / 180;
  return mod(mean + 1.915 * Math.sin(anomaly) + 0.020 * Math.sin(2 * anomaly), 360);
};
const appFallback = {
  id: 'built-in-fallback', precision: 'fallback', solarLongitude: appSolarLongitude,
  planetLongitudes(date) {
    const days = jd(date) - 2451545;
    return { 太陽: appSolarLongitude(date), 月: mod(218.316 + 13.176396 * days, 360), 水星: mod(252.25 + 4.09233445 * days, 360), 金星: mod(181.98 + 1.60213034 * days, 360), 火星: mod(355.43 + 0.524039 * days, 360), 木星: mod(34.35 + 0.0830868 * days, 360), 土星: mod(50.08 + 0.0334597 * days, 360), 天王星: mod(314.06 + 0.0117313 * days, 360), 海王星: mod(304.35 + 0.005981 * days, 360), 冥王星: mod(238.95 + 0.003964 * days, 360) };
  }
};
const localOptions = { ...options, ephemeris: appFallback };
const localSeasons = browserCore.buildSeasonalIngressCharts(localOptions);
const localMonths = browserCore.buildMonthlyIngressCharts(localOptions);
const localTrend = browserCore.buildMonthlyTrend(localMonths, localMonths.map(browserCore.interpretSeasonalIngressChart));
assert.equal(localSeasons.length, 4);
assert.equal(localMonths.length, 12);
assert.match(browserCore.summarizeMonthlyTrend(localTrend).headline, /月/);

console.log('Mundane classic browser core passed');
