import assert from 'node:assert/strict';
import { interpretSeasonalIngressChart, synthesizeSeasonalIngressReadings } from '../src/mundane/western/index.js';

const chart = {
  schemaId: 'koyomi-mundane-seasonal-ingress-v1', chartType: 'aries', nameJa: '春分図',
  placements: { Sun: { house: 10 }, Moon: { house: 1 }, Mars: { house: 7 }, Jupiter: { house: 9 }, Saturn: { house: 4 } },
  aspects: [
    { type: 'trine', bodies: ['Sun', 'Jupiter'], orb: 1.2 },
    { type: 'square', bodies: ['Mars', 'Saturn'], orb: 0.8 },
    { type: 'conjunction', bodies: ['Sun', 'Moon'], orb: 2.4 }
  ],
  retrogrades: { Sun: false, Moon: false, Mars: true, Jupiter: false, Saturn: false },
  warnings: ['fallback-ephemeris']
};

const reading = interpretSeasonalIngressChart(chart);
assert.equal(reading.schemaId, 'koyomi-mundane-seasonal-reading-v1');
assert.equal(reading.focusAreas[0].house, 1, 'Moon in an angular house must be a leading focus');
assert.equal(reading.supports.length, 1);
assert.equal(reading.pressures.length, 1);
assert.equal(reading.intensifications.length, 1);
assert.match(reading.supports[0].text, /政府・指導層/);
assert.match(reading.pressures[0].text, /事故・対立・実行力/);
assert.equal(reading.reviews[0].body, 'Mars');
assert.deepEqual(reading.uncertainties, ['fallback-ephemeris']);
assert.match(reading.suppressedClaims[0], /断定しません/);
assert.match(reading.narrative, /世論調査、生活実感、消費者心理/);
assert.match(reading.narrative, /費用・安全・責任分担/);
assert.equal(reading.observationPoints[0].text, '世論調査、生活実感、消費者心理の変化');
assert.match(reading.recommendedActions[0].text, /一部の大きな声だけで全体を判断しない/);
assert.deepEqual(interpretSeasonalIngressChart(chart), reading, 'the same chart must produce the same reading');

const annual = synthesizeSeasonalIngressReadings([reading, reading, reading, reading]);
assert.equal(annual.schemaId, 'koyomi-mundane-seasonal-summary-v1');
assert.equal(annual.focusAreas[0].appearances, 4);
assert.equal(annual.supportCount, 4);
assert.equal(annual.pressureCount, 4);
assert.deepEqual(annual.uncertainties, ['fallback-ephemeris']);
assert.match(annual.disclaimer, /断定するものではありません/);
assert.match(annual.narrative, /年間判断では/);
assert.match(annual.observationPoints[0].text, /世論調査/);
assert.throws(() => interpretSeasonalIngressChart({}), /required/);
assert.throws(() => synthesizeSeasonalIngressReadings([]), /required/);

console.log('Mundane seasonal interpretation core passed');
