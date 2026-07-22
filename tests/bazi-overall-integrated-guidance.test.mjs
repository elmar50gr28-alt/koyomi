import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildBaziReading, calculateBazi } from '../src/bazi/index.js';

const result = calculateBazi({
  displayName: 'overall-guidance-test', gender: 'female',
  birthData: { date: '1990-06-15', time: '08:20', place: { longitude: 135, latitude: 35, utcOffset: 9, timezone: 'Asia/Tokyo' } }
});
const original = structuredClone(result);
const reading = buildBaziReading(result, { locale: 'ja' });
const guidance = reading.executiveSummary.integratedGuidance;

assert.ok(guidance.strength.includes('件の支え'), 'overall strength must use integrated support count');
assert.ok(guidance.support.includes('件の追い風候補') || guidance.support.includes('追い風は限定的'), 'overall support must reflect integrated signals');
assert.ok(guidance.pressure.includes('件の注意作用') || guidance.pressure.includes('圧力は現在の判定では目立ちません'), 'overall pressure must reflect integrated signals');
assert.equal(reading.executiveSummary.currentFlow, guidance.currentFlow);
assert.deepEqual(result, original, 'reading generation must not mutate the calculation result');

const app = await readFile('app.html', 'utf8');
for (const field of ['strength', 'support', 'pressure']) {
  assert.ok(app.includes(`koyomiEscapeHtml(guidance.${field})`), `${field} display must be present and escaped`);
}

console.log('Bazi overall integrated guidance passed');
