import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  calculateAnnualLuck,
  calculateBazi,
  calculateBaziChart,
  calculateLuckCycles,
  calculateLuckStart,
  calculateMonthlyLuck
} from '../src/bazi/index.js';

function profile(date, time, gender = 'male', timeUnknown = false) {
  return {
    displayName: 'Luck core fixture',
    gender,
    birthData: {
      date,
      time: timeUnknown ? '' : time,
      timeUnknown,
      place: {
        label: 'Tokyo',
        longitude: 135,
        latitude: 35.68,
        timezone: 'Asia/Tokyo',
        utcOffset: 9
      }
    }
  };
}

const male = profile('1984-07-10', '12:00', 'male');
const female = profile('1984-07-10', '12:00', 'female');
const maleLuck = calculateBazi(male).luckCycles;
const femaleLuck = calculateBazi(female).luckCycles;

assert.equal(maleLuck.direction, 'forward', 'yang-year male should run forward');
assert.equal(femaleLuck.direction, 'reverse', 'yang-year female should run reverse');
assert.notEqual(maleLuck.cycles[0].label, femaleLuck.cycles[0].label, 'forward/reverse first pillars must differ');
assert.ok(maleLuck.cycles.every(period => period.startDate && period.endDate), 'decade periods need date ranges');

const boundaryChart = calculateBaziChart(profile('2025-02-03', '23:10'));
const exactStart = calculateLuckStart(boundaryChart, 'forward');
assert.equal(exactStart.startAge, 0, 'birth exactly at a solar-term boundary starts at zero');
assert.equal(exactStart.boundary.termId, 'risshun', 'start boundary should retain the term');

const beforeRisshun = calculateAnnualLuck(boundaryChart, '2025-02-03T23:09:00+09:00');
const atRisshun = calculateAnnualLuck(boundaryChart, '2025-02-03T23:10:00+09:00');
assert.notEqual(beforeRisshun.label, atRisshun.label, 'annual pillar must change at Risshun');
assert.equal(atRisshun.boundary.termId, 'risshun');

const beforeMonth = calculateMonthlyLuck(boundaryChart, '2026-03-05T22:58:00+09:00');
const atMonth = calculateMonthlyLuck(boundaryChart, '2026-03-05T22:59:00+09:00');
assert.notEqual(beforeMonth.branch.id, atMonth.branch.id, 'monthly pillar must change at the solar-term minute');
assert.equal(atMonth.boundary.termId, 'keichitsu');

for (const time of ['23:00', '00:00']) {
  const result = calculateBazi(profile(time === '23:00' ? '2025-07-10' : '2025-07-11', time));
  assert.ok(result.luckCycles.cycles[0].tenGod, `${time} decade ten-god connection`);
  assert.ok(result.luckCycles.annual[0].twelveStage, `${time} annual twelve-stage connection`);
  assert.ok(result.luckCycles.monthly[0].relationToChart.branches, `${time} branch relation connection`);
}

const unknown = profile('1990-07-10', '', 'male', true);
const unknownLuck = calculateLuckCycles(calculateBaziChart(unknown), unknown, { referenceDate: '2026-07-10T12:00:00+09:00' });
assert.ok(unknownLuck.warnings.includes('luck-start-birth-time-unknown'));
assert.ok(unknownLuck.annual[0].warnings.includes('annual-birth-time-unknown'));
assert.ok(unknownLuck.monthly[0].warnings.includes('monthly-birth-time-unknown'));

const connected = maleLuck.cycles[0];
assert.ok(connected.tenGod?.id, 'ten-god must be connected');
assert.ok(connected.twelveStage?.stageId, 'twelve-stage must be connected');
assert.equal(connected.elementContribution.length, 5, 'five-element contribution must cover all elements');
assert.ok(connected.evaluationMaterials.natalStrength, 'strength material must be passed through');
assert.ok('natalPattern' in connected.evaluationMaterials, 'pattern material slot must exist');
assert.ok('natalYongshen' in connected.evaluationMaterials, 'yongshen material slot must exist');

const appHtml = fs.readFileSync(new URL('../app.html', import.meta.url), 'utf8');
assert.match(appHtml, /function calcLuck\(/, 'legacy visible luck model remains for display compatibility');
assert.match(appHtml, /window\.lastPersonal\.luckCycles=result\.luckCycles/, 'structured luck core is connected without changing UI text');

console.log('Bazi luck period core tests passed');
