import assert from 'node:assert/strict';
import {
  adaptIntegratedBaziReadingSource,
  buildBaziReading,
  calculateBazi
} from '../src/bazi/index.js';

const profile = {
  displayName: 'reading-adapter-test',
  gender: 'female',
  birthData: {
    date: '1990-06-15', time: '08:20',
    place: { longitude: 135, latitude: 35, utcOffset: 9, timezone: 'Asia/Tokyo' }
  }
};

const calculated = calculateBazi(profile);
assert.equal(calculated.reading.sourceAdapter.mode, 'integrated');
assert.equal(calculated.reading.sourceAdapter.newCalculation, false);
assert.equal(calculated.reading.sourceIntegratedDataVersion, calculated.integratedReadingData.version);

const explicitData = structuredClone(calculated.integratedReadingData);
explicitData.analysis.favorableElements = ['water'];
explicitData.analysis.unfavorableElements = ['fire'];
const before = structuredClone(calculated);
const adapted = adaptIntegratedBaziReadingSource(calculated, { integratedData: explicitData });
assert.deepEqual(adapted.result.favorableElements.favorable, ['water']);
assert.deepEqual(adapted.result.favorableElements.unfavorable, ['fire']);
assert.equal(adapted.audit.mode, 'integrated');
assert.deepEqual(calculated, before, 'adapter must not mutate calculation results');

const explicitReading = buildBaziReading(calculated, { locale: 'en', integratedData: explicitData });
assert.equal(explicitReading.sourceAdapter.mode, 'integrated');
assert.match(explicitReading.executiveSummary.centralTheme, /learning, recovery, and adaptive strategy/);

const invalidData = { schemaId: explicitData.schemaId, version: 'broken' };
const fallback = adaptIntegratedBaziReadingSource(calculated, { integratedData: invalidData });
assert.equal(fallback.audit.mode, 'legacy-fallback');
assert.strictEqual(fallback.result, calculated);
const fallbackReading = buildBaziReading(calculated, { locale: 'en', integratedData: invalidData });
assert.equal(fallbackReading.sourceAdapter.mode, 'legacy-fallback');
assert.equal(fallbackReading.executiveSummary.centralTheme, buildBaziReading(calculated, { locale: 'en', integratedData: null }).executiveSummary.centralTheme);

const uncertainData = structuredClone(calculated.integratedReadingData);
uncertainData.summary.uncertainties.push({ value: 'adapter-test-uncertainty' });
const uncertain = adaptIntegratedBaziReadingSource(calculated, { integratedData: uncertainData });
assert.ok(uncertain.result.warnings.includes('adapter-test-uncertainty'));

const guardedData = structuredClone(calculated.integratedReadingData);
guardedData.summary.conflicts.push({ id: 'adapter-test-conflict' });
guardedData.summary.uncertainties.push({ id: 'uncertainty-adapter-test', value: 'adapter-test-uncertainty' });
guardedData.summary.suppressedClaims.push({ id: 'adapter-test-claim' });
guardedData.summary.evidence.push({ id: 'adapter-test-evidence' });
const guardedReading = buildBaziReading(calculated, { locale: 'en', integratedData: guardedData });
assert.ok(guardedReading.sourceGuardrails.conflicts.includes('adapter-test-conflict'));
assert.ok(guardedReading.sourceGuardrails.suppressedClaims.includes('adapter-test-claim'));
assert.ok(guardedReading.sections.overall.unresolvedFactors.includes('adapter-test-conflict'));
assert.ok(guardedReading.sections.overall.unresolvedFactors.includes('adapter-test-uncertainty'));
assert.ok(guardedReading.sections.overall.unresolvedFactors.includes('adapter-test-claim'));
assert.ok(guardedReading.sections.overall.warnings.includes('claim-suppressed:adapter-test-claim'));
assert.ok(guardedReading.sections.overall.sourceIds.includes('adapter-test-evidence'));
assert.equal(guardedReading.sections.overall.guardrailReviewRequired, true);
assert.deepEqual(guardedReading.mitsunomeInput.readingSections.overall.unresolvedFactors, guardedReading.sections.overall.unresolvedFactors);

console.log('Bazi reading adapter passed');
