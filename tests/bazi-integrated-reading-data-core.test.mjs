import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildBaziReading, buildIntegratedBaziReadingData, calculateBazi,
  validateIntegratedBaziReadingData
} from '../src/bazi/index.js';

const profile = (date = '1990-06-15', time = '08:20', options = {}) => ({
  displayName: 'integrated-reading-test', gender: options.gender || 'male',
  birthData: {
    date, time: options.timeUnknown ? '' : time, timeUnknown: Boolean(options.timeUnknown),
    place: { longitude: options.longitude === undefined ? 135 : options.longitude, latitude: 35, utcOffset: 9, timezone: 'Asia/Tokyo' }
  }
});

const standard = calculateBazi(profile());
const data = standard.integratedReadingData;
assert.equal(validateIntegratedBaziReadingData(data).valid, true);
assert.deepEqual(data.basic.chart, standard.chart.pillars);
assert.equal(data.basic.timeBasis, standard.baziSettings.calendar.timeBasis);
assert.deepEqual(data.analysis.dayMaster, standard.chart.dayMaster);
assert.deepEqual(data.analysis.elementBalance, standard.chart.elementBalance);
assert.deepEqual(data.analysis.relations, standard.relations);
assert.deepEqual(data.analysis.patterns.legacyComparison, standard.patterns.legacyComparison);
assert.deepEqual(data.analysis.yongshen.legacyComparison, standard.yongshen.legacyComparison);
assert.ok(Object.values(data.analysis.pillars).every(pillar => 'tenGod' in pillar && 'twelveStage' in pillar && Array.isArray(pillar.hiddenStems)));
assert.deepEqual(data.analysis.emptyVoid, standard.chart.emptyVoid);
assert.ok(Array.isArray(data.luck.decades) && data.luck.decades.length > 0);
assert.ok(data.luck.currentAnnual && data.luck.currentMonthly);
assert.ok(data.luck.currentAnnual.relationsToNatal && data.luck.currentMonthly.relationsToNatal);
assert.ok(data.summary.evidence.every(entry => entry.sourceCore && entry.decisionType));
assert.ok(data.summary.priorities.every(entry => Number.isInteger(entry.order)));
assert.equal(standard.reading.sourceIntegratedDataVersion, data.version);
assert.deepEqual(standard.mitsunomeInput.structuredResult.integratedReadingData, data);

for (const [expected, date] of [['strong', '1984-02-15'], ['weak', '1984-08-15'], ['balanced', '1984-01-15']]) {
  const result = calculateBazi(profile(date, '12:00'));
  assert.equal(result.integratedReadingData.analysis.strength.dayMasterStrength.level, expected);
}

assert.ok(data.analysis.patterns.candidates.length > 0, 'regular pattern candidates retained');
const specialCandidate = JSON.parse(JSON.stringify(standard));
specialCandidate.patterns.candidates.push({ patternId: 'follow-weak', candidate: true, established: false });
specialCandidate.patterns.establishmentStatus = 'candidate-only';
const specialData = buildIntegratedBaziReadingData(specialCandidate);
assert.ok(specialData.analysis.patterns.candidates.some(entry => entry.patternId === 'follow-weak'));
assert.ok(specialData.summary.suppressedClaims.some(entry => entry.id === 'established-pattern-claim'));

const agreement = JSON.parse(JSON.stringify(standard));
agreement.yongshen.conflicts = [];
agreement.yongshen.integratedComparison.conflicts = [];
assert.equal(buildIntegratedBaziReadingData(agreement).summary.conflicts.some(entry => entry.sourceCore === 'yongshen'), false);
const conflict = JSON.parse(JSON.stringify(standard));
conflict.yongshen.conflicts = ['method-disagreement'];
conflict.yongshen.integratedComparison.conflicts = ['method-disagreement'];
const conflictData = buildIntegratedBaziReadingData(conflict);
assert.equal(conflictData.summary.conflicts.filter(entry => entry.id === 'yongshen-method-disagreement').length, 1);
assert.ok(conflictData.summary.suppressedClaims.some(entry => entry.id === 'single-final-yongshen-claim'));

const relationFixture = JSON.parse(JSON.stringify(standard));
relationFixture.relations.stems.combinations = [{ type: 'stem-combination', members: ['jia', 'ji'], established: true, evidence: ['combination-rule'] }];
relationFixture.relations.branches.combinations = [{ type: 'branch-six-combination', members: ['zi', 'chou'], established: true }];
relationFixture.relations.branches.clashes = [{ type: 'branch-clash', members: ['zi', 'wu'], established: true }];
relationFixture.relations.branches.punishments = [{ type: 'branch-punishment', members: ['yin', 'si'], established: true }];
relationFixture.relations.branches.harms = [{ type: 'branch-harm', members: ['chou', 'wu'], established: true }];
relationFixture.relations.branches.destructions = [{ type: 'branch-destruction', members: ['zi', 'you'], established: true }];
const relationData = buildIntegratedBaziReadingData(relationFixture);
assert.ok(relationData.summary.supports.some(entry => entry.decisionType === 'combinations'));
for (const type of ['clashes', 'punishments', 'harms', 'destructions']) assert.ok(relationData.summary.pressures.some(entry => entry.decisionType === type));

const luckFixture = JSON.parse(JSON.stringify(standard));
luckFixture.favorableElements.favorable = ['wood'];
luckFixture.favorableElements.unfavorable = ['metal'];
for (const period of [luckFixture.luckCycles.cycles[0], luckFixture.luckCycles.annual[0], luckFixture.luckCycles.monthly[0]]) {
  period.stem.element = 'wood'; period.branch.element = 'metal';
  period.relationToChart.stems.combinations = [{ type: 'stem-combination', members: ['jia', 'ji'], established: true }];
  period.relationToChart.branches.clashes = [{ type: 'branch-clash', members: ['zi', 'wu'], established: true }];
}
const luckData = buildIntegratedBaziReadingData(luckFixture, { referenceDate: luckFixture.luckCycles.cycles[0].startDate });
assert.ok(luckData.luck.currentDecade);
assert.ok(luckData.summary.supports.some(entry => entry.decisionType === 'favorable-element-match'));
assert.ok(luckData.summary.pressures.some(entry => entry.decisionType === 'unfavorable-element-match'));
assert.ok(luckData.summary.supports.some(entry => entry.sourceCore === 'luck' && entry.period));
assert.ok(luckData.summary.pressures.some(entry => entry.sourceCore === 'luck' && entry.period));

for (const [label, input, settings] of [
  ['risshun-before', profile('2026-02-04', '05:01'), { solar: 'standard' }],
  ['risshun-after', profile('2026-02-04', '05:02'), { solar: 'standard' }],
  ['month-before', profile('2026-03-05', '22:58'), { solar: 'standard' }],
  ['month-after', profile('2026-03-05', '22:59'), { solar: 'standard' }],
  ['23-boundary', profile('2026-03-05', '23:00'), { boundary: 23 }],
  ['0-boundary', profile('2026-03-06', '00:00'), { boundary: 0 }]
]) {
  const boundary = calculateBazi(input, settings).integratedReadingData;
  assert.equal(validateIntegratedBaziReadingData(boundary).valid, true, label);
  if (label.includes('boundary')) assert.ok(boundary.summary.uncertainties.some(entry => entry.value === 'day-boundary-proximity'));
  if (label.startsWith('risshun') || label.startsWith('month')) assert.ok(boundary.summary.uncertainties.some(entry => entry.value === 'solar-term-boundary-proximity'));
}

const unknown = calculateBazi(profile('1990-07-10', '', { timeUnknown: true })).integratedReadingData;
assert.equal(unknown.basic.timeUnknown, true);
assert.ok(unknown.summary.uncertainties.some(entry => entry.value === 'birth-time-unknown'));
assert.ok(unknown.summary.suppressedClaims.some(entry => entry.id === 'hour-pillar-dependent-claims'));
const missingLongitude = calculateBazi(profile('1990-07-10', '12:00', { longitude: null })).integratedReadingData;
assert.ok(missingLongitude.summary.uncertainties.some(entry => entry.value === 'longitude-missing'));
const legacySettings = calculateBazi(profile(), { boundary: 'bad', solar: 'bad', hidden: 'bad' }).integratedReadingData;
assert.equal(legacySettings.basic.settings.calendar.dayBoundary, 'midnight');
assert.equal(legacySettings.basic.settings.calendar.timeBasis, 'true');

const duplicate = JSON.parse(JSON.stringify(standard));
duplicate.strength.dayMasterStrength.supportingFactors = [
  { factor: 'roots', direction: 'support' }, { factor: 'roots', direction: 'support' }
];
const duplicateData = buildIntegratedBaziReadingData(duplicate);
assert.equal(duplicateData.summary.strengths.filter(entry => entry.id === 'strength-support-roots').length, 1);
const restored = JSON.parse(JSON.stringify(data));
assert.deepEqual(restored, data);
assert.equal(validateIntegratedBaziReadingData(restored).valid, true);

const rebuiltReading = buildBaziReading(standard, { locale: standard.reading.locale, integratedData: data });
assert.equal(rebuiltReading.sourceIntegratedDataVersion, '1.0.0');
assert.equal(rebuiltReading.executiveSummary.centralTheme, standard.reading.executiveSummary.centralTheme);
assert.equal(rebuiltReading.beginnerText, standard.reading.beginnerText);
const appSource = await readFile('app.html', 'utf8');
assert.ok(appSource.includes('KOYOMI_BAZI.calculateBazi(profile)'), 'existing UI calculation entry remains unchanged');

console.log('Bazi integrated reading data core passed');
