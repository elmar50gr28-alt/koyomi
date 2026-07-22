import assert from 'node:assert/strict';
import { buildSeasonalIngressCharts, createAstronomyEngineAdapter, findSeasonalIngress, SEASONAL_INGRESSES } from '../src/mundane/western/index.js';

const YEAR_START = Date.UTC(2026, 0, 1);
const tropicalYear = 365.2422 * 86400000;
const ephemeris = {
  id: 'deterministic-test-ephemeris',
  precision: 'test',
  solarLongitude(date) { return ((date.getTime() - YEAR_START) / tropicalYear * 360 + 280) % 360; },
  planetLongitudes(date) {
    const sun = this.solarLongitude(date);
    return { Sun: sun, Moon: (sun + 47) % 360, Mercury: (sun + 5) % 360, Mars: (sun + 95) % 360, Jupiter: (sun + 120) % 360, Saturn: (sun + 180) % 360 };
  }
};

const charts = buildSeasonalIngressCharts({ year: 2026, location: { label: 'Tokyo', latitude: 35.6812, longitude: 139.7671, timezone: 'Asia/Tokyo' }, ephemeris });
assert.equal(charts.length, 4);
assert.deepEqual(charts.map(chart => chart.chartType), ['aries', 'cancer', 'libra', 'capricorn']);
assert.ok(charts.every(chart => chart.cusps.length === 12));
assert.ok(charts.every(chart => Object.keys(chart.placements).length === 6));
assert.ok(charts.every(chart => chart.aspects.length > 0));
assert.ok(charts.every(chart => chart.calculation.ephemerisId === ephemeris.id));
assert.ok(charts.every(chart => chart.warnings.length === 0));
assert.ok(charts.every((chart, index) => Math.abs(ephemeris.solarLongitude(new Date(chart.datetime)) - SEASONAL_INGRESSES[index].targetLongitude) < 0.001 || Math.abs(ephemeris.solarLongitude(new Date(chart.datetime)) - 360) < 0.001));

const duplicate = buildSeasonalIngressCharts({ year: 2026, location: { latitude: 35.6812, longitude: 139.7671 }, ephemeris });
assert.deepEqual(charts.map(chart => chart.datetime), duplicate.map(chart => chart.datetime));
assert.throws(() => findSeasonalIngress(1700, SEASONAL_INGRESSES[0], ephemeris.solarLongitude), /1800/);
assert.throws(() => buildSeasonalIngressCharts({ year: 2026, location: { latitude: 100, longitude: 0 }, ephemeris }), /latitude/);
assert.throws(() => createAstronomyEngineAdapter({}), /unavailable/);

console.log('Mundane seasonal ingress core passed');
