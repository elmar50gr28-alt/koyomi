const ELEMENTS = new Set(['wood', 'fire', 'earth', 'metal', 'water']);
const SUPPORT_RELATIONS = ['combinations', 'trines', 'seasonalMeetings', 'halfTrines'];
const PRESSURE_RELATIONS = ['clashes', 'punishments', 'selfPunishments', 'harms', 'destructions'];

const array = value => Array.isArray(value) ? value : [];
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const unique = values => [...new Set(values.filter(Boolean))];
const elementIds = values => unique(array(values).filter(value => ELEMENTS.has(value)));
const certainty = confidence => Number(confidence) >= 0.6 ? 'determinate' : 'reference';
const isoDateTime = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

function correctedBirthDateTime(result) {
  const input = result.normalizedInput || {};
  if (!input.date || !input.time || input.timeUnknown) return isoDateTime(result.calendarCalculation?.trueSolarTime?.date);
  const offset = Number(input.place?.utcOffset ?? 9);
  const totalMinutes = Math.round(Math.abs(offset) * 60);
  const zone = `${offset < 0 ? '-' : '+'}${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
  const base = new Date(`${input.date}T${input.time}:00${zone}`);
  if (Number.isNaN(base.getTime())) return isoDateTime(result.calendarCalculation?.trueSolarTime?.date);
  const correctionMinutes = Number(result.calendarCalculation?.trueSolarTime?.minutesOffset || 0);
  return new Date(base.getTime() + correctionMinutes * 60 * 1000).toISOString();
}

function item(id, value, sourceCore, decisionType, extra = {}) {
  return { id, value: clone(value), sourceCore, decisionType, ...extra };
}

function dedupe(items) {
  const seen = new Set();
  return items.filter(entry => {
    const key = [entry.id, entry.sourceCore, entry.decisionType, entry.target || '', entry.period?.scope || '', entry.period?.index ?? ''].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function relationItems(relations, keys, sourceCore, period = null) {
  return keys.flatMap(key => array(relations?.stems?.[key]).concat(array(relations?.branches?.[key])).map((relation, index) =>
    item(`${period?.scope || 'natal'}-${key}-${index}-${array(relation.members).join('-')}`, relation, sourceCore, key, {
      target: period ? 'luck-to-natal' : 'natal-chart', period, certainty: relation.established === false ? 'reference' : 'determinate',
      evidence: unique([...(array(relation.evidence)), relation.ruleId, relation.sourceId])
    })
  ));
}

function pillarAnalysis(pillars = {}) {
  return Object.fromEntries(Object.entries(pillars).filter(([, pillar]) => pillar).map(([role, pillar]) => [role, {
    stem: clone(pillar.stem), branch: clone(pillar.branch), label: pillar.label,
    tenGod: clone(pillar.stem?.tenGod || null), twelveStage: clone(pillar.branch?.twelveStage || null),
    hiddenStems: clone(pillar.branch?.hiddenStems || [])
  }]));
}

function periodData(period, favorable, unfavorable) {
  if (!period) return null;
  const elements = unique([period.stem?.element, period.branch?.element]);
  return {
    ...clone(period),
    favorableMatches: elements.filter(value => favorable.has(value)),
    unfavorableMatches: elements.filter(value => unfavorable.has(value)),
    strengthContribution: clone(period.evaluationMaterials?.natalStrength?.scoreBreakdown || null),
    patternInfluenceMaterials: clone(period.evaluationMaterials?.natalPattern || null),
    relationsToNatal: clone(period.relationToChart || { stems: {}, branches: {} })
  };
}

function currentDecade(cycles, referenceDate) {
  const timestamp = new Date(referenceDate).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return array(cycles).find(cycle => {
    const start = new Date(cycle.startDate).getTime();
    const end = new Date(cycle.endDate).getTime();
    return Number.isFinite(start) && Number.isFinite(end) && start <= timestamp && timestamp <= end;
  }) || null;
}

function evidenceRecords(result) {
  const domains = [
    ['chart', result.evidence], ['strength', result.strength?.evidence], ['patterns', result.patterns?.evidence],
    ['yongshen', result.yongshen?.evidence], ['luck', result.luckCycles?.evidence]
  ];
  return dedupe(domains.flatMap(([sourceCore, ids]) => array(ids).map(id => item(id, id, sourceCore, 'evidence-reference'))));
}

function conflicts(result) {
  const output = [];
  const yongshen = result.yongshen || {};
  const explicit = unique([...array(yongshen.conflicts), ...array(yongshen.integratedComparison?.conflicts)]);
  explicit.forEach(value => output.push(item(`yongshen-${value}`, value, 'yongshen', 'method-conflict', {
    certainty: 'reference', evidence: clone(yongshen.evidence || []), legacyComparison: clone(yongshen.legacyComparison || null)
  })));
  const strength = result.strength?.dayMasterStrength;
  if (strength?.legacyComparison?.level && strength.level && strength.legacyComparison.level !== strength.level) {
    output.push(item('strength-legacy-comparison', {
      current: strength.level, legacy: strength.legacyComparison.level
    }, 'strength', 'legacy-comparison-conflict', { certainty: 'reference', legacyComparison: clone(strength.legacyComparison) }));
  }
  if (result.patterns?.establishmentStatus !== 'established' && array(result.patterns?.candidates).length > 1) {
    output.push(item('pattern-candidate-competition', array(result.patterns.candidates).map(value => value.patternId), 'patterns', 'candidate-conflict', {
      certainty: 'reference', evidence: clone(result.patterns.evidence || []), legacyComparison: clone(result.patterns.legacyComparison || null)
    }));
  }
  return dedupe(output);
}

function uncertainties(result) {
  const values = unique([
    ...array(result.warnings), ...array(result.strength?.warnings), ...array(result.patterns?.warnings),
    ...array(result.yongshen?.warnings), ...array(result.luckCycles?.warnings)
  ]);
  if (result.normalizedInput?.timeUnknown) values.push('birth-time-unknown');
  const time = String(result.normalizedInput?.time || '');
  if (/^(23|00):/.test(time)) values.push('day-boundary-proximity');
  const corrected = correctedBirthDateTime(result);
  const correctedTime = corrected ? new Date(corrected).getTime() : NaN;
  if (Number.isFinite(correctedTime) && array(result.calendarCalculation?.solarTerms).some(term =>
    Math.abs(new Date(term.datetime).getTime() - correctedTime) <= 60 * 60 * 1000
  )) values.push('solar-term-boundary-proximity');
  return unique(values).map(value => item(`uncertainty-${value}`, value, 'integration', 'uncertainty', {
    certainty: 'reference', evidence: [value]
  }));
}

function priorities(result, conflictItems, uncertaintyItems) {
  const values = [
    ['day-master-strength', result.strength?.dayMasterStrength?.level, 'strength'],
    ['pattern', result.patterns?.primaryPattern?.patternId || result.patterns?.finalPattern?.patternId, 'patterns'],
    ['yongshen', result.yongshen?.primaryYongshen || result.yongshen?.primary?.element || result.yongshen?.primary, 'yongshen']
  ];
  if (conflictItems.length) values.push(['conflicts', conflictItems.map(value => value.id), 'integration']);
  if (uncertaintyItems.length) values.push(['uncertainties', uncertaintyItems.map(value => value.id), 'integration']);
  return values.filter(([, value]) => value != null).map(([id, value, sourceCore], index) =>
    item(`priority-${id}`, value, sourceCore, 'reading-priority', { order: index + 1, certainty: id === 'conflicts' || id === 'uncertainties' ? 'reference' : 'determinate' })
  );
}

/**
 * Aggregate existing Bazi core results for reading generation. This function
 * introduces no new divination rules, scores, weights, or prose.
 */
export function buildIntegratedBaziReadingData(result, options = {}) {
  if (!result || typeof result !== 'object') throw new TypeError('Bazi result is required');
  const favorable = new Set(elementIds(result.favorableElements?.favorable || result.yongshen?.favorable));
  const unfavorable = new Set(elementIds(result.favorableElements?.unfavorable || result.yongshen?.unfavorable || result.yongshen?.avoidElements));
  const referenceDate = options.referenceDate || new Date().toISOString();
  const cycles = array(result.luckCycles?.cycles);
  const activeDecade = currentDecade(cycles, referenceDate);
  const annual = result.luckCycles?.annual?.[0] || null;
  const monthly = result.luckCycles?.monthly?.[0] || null;
  const periods = [
    ['decade', activeDecade], ['annual', annual], ['monthly', monthly]
  ].filter(([, period]) => period).map(([scope, period]) => [scope, periodData(period, favorable, unfavorable)]);
  const conflictItems = conflicts(result);
  const uncertaintyItems = uncertainties(result);
  const strengthDetails = result.strength?.dayMasterStrength || {};
  const natalSupports = array(strengthDetails.supportingFactors).map((value, index) =>
    item(`strength-support-${value.factor || index}`, value, 'strength', 'supporting-factor', { target: 'day-master', certainty: certainty(result.strength?.confidence), evidence: result.strength?.evidence || [] })
  );
  const natalPressures = array(strengthDetails.opposingFactors).map((value, index) =>
    item(`strength-pressure-${value.factor || index}`, value, 'strength', 'opposing-factor', { target: 'day-master', certainty: certainty(result.strength?.confidence), evidence: result.strength?.evidence || [] })
  );
  const relationSupports = relationItems(result.relations, SUPPORT_RELATIONS, 'relations');
  const relationPressures = relationItems(result.relations, PRESSURE_RELATIONS, 'relations');
  const luckSupports = periods.flatMap(([scope, period]) => [
    ...period.favorableMatches.map(value => item(`${scope}-favorable-${value}`, value, 'luck', 'favorable-element-match', { target: 'luck-to-natal', period: { scope, index: period.index }, certainty: certainty(period.confidence), evidence: period.evidence || [] })),
    ...relationItems(period.relationsToNatal, SUPPORT_RELATIONS, 'luck', { scope, index: period.index })
  ]);
  const luckPressures = periods.flatMap(([scope, period]) => [
    ...period.unfavorableMatches.map(value => item(`${scope}-unfavorable-${value}`, value, 'luck', 'unfavorable-element-match', { target: 'luck-to-natal', period: { scope, index: period.index }, certainty: certainty(period.confidence), evidence: period.evidence || [] })),
    ...relationItems(period.relationsToNatal, PRESSURE_RELATIONS, 'luck', { scope, index: period.index })
  ]);
  const suppressedClaims = dedupe([
    ...(result.normalizedInput?.timeUnknown ? [item('hour-pillar-dependent-claims', 'hour-pillar-dependent-claims', 'chart', 'suppressed-claim', { reason: 'birth-time-unknown', certainty: 'reference' })] : []),
    ...(conflictItems.length ? [item('single-final-yongshen-claim', 'single-final-yongshen-claim', 'yongshen', 'suppressed-claim', { reason: 'core-conflict', certainty: 'reference' })] : []),
    ...(result.patterns?.establishmentStatus !== 'established' ? [item('established-pattern-claim', 'established-pattern-claim', 'patterns', 'suppressed-claim', { reason: result.patterns?.establishmentStatus || 'not-established', certainty: 'reference' })] : [])
  ]);
  return {
    schemaId: 'koyomi-bazi-integrated-reading-data', version: '1.0.0', calculationVersion: result.calculationVersion || null,
    basic: {
      chart: clone(result.chart?.pillars || {}), correctedBirthDateTime: correctedBirthDateTime(result),
      timeBasis: result.baziSettings?.calendar?.timeBasis || result.settingsInspection?.settings?.calendar?.timeBasis || null,
      settings: clone(result.baziSettings || result.settingsInspection?.settings || null), timeUnknown: Boolean(result.normalizedInput?.timeUnknown),
      warnings: unique(array(result.warnings)), confidence: result.confidence
    },
    analysis: {
      dayMaster: clone(result.chart?.dayMaster || null), strength: clone(result.strength || null), elementBalance: clone(result.chart?.elementBalance || null),
      pillars: pillarAnalysis(result.chart?.pillars), emptyVoid: clone(result.chart?.emptyVoid || []), relations: clone(result.relations || null),
      patterns: clone(result.patterns || null), yongshen: clone(result.yongshen || null), favorableElements: [...favorable], unfavorableElements: [...unfavorable],
      unresolved: dedupe([...array(strengthDetails.unresolvedFactors).map((value, index) => item(`strength-unresolved-${index}`, value, 'strength', 'unresolved-factor')), ...conflictItems])
    },
    luck: {
      direction: result.luckCycles?.direction || null, start: clone({ age: result.luckCycles?.startAge, date: result.luckCycles?.startDate, boundary: result.luckCycles?.startBoundary }),
      decades: clone(cycles), currentDecade: periodData(activeDecade, favorable, unfavorable), annual: clone(result.luckCycles?.annual || []),
      currentAnnual: periodData(annual, favorable, unfavorable), monthly: clone(result.luckCycles?.monthly || []), currentMonthly: periodData(monthly, favorable, unfavorable)
    },
    summary: {
      strengths: dedupe(natalSupports), challenges: dedupe(natalPressures), supports: dedupe([...relationSupports, ...luckSupports]),
      pressures: dedupe([...relationPressures, ...luckPressures]), conflicts: conflictItems, uncertainties: uncertaintyItems,
      evidence: evidenceRecords(result), priorities: priorities(result, conflictItems, uncertaintyItems), suppressedClaims
    },
    audit: {
      sourceCores: ['chart', 'derived-info', 'strength', 'patterns', 'yongshen', 'relations', 'luck', 'settings'],
      legacyComparisons: { strength: clone(strengthDetails.legacyComparison || null), patterns: clone(result.patterns?.legacyComparison || null), yongshen: clone(result.yongshen?.legacyComparison || null) },
      settingsInspection: clone(result.settingsInspection || null), generatedAt: options.generatedAt || null, newDivinationRulesAdded: false, newScoresAdded: false
    }
  };
}

export function validateIntegratedBaziReadingData(data) {
  const errors = [];
  if (data?.schemaId !== 'koyomi-bazi-integrated-reading-data') errors.push('schema-id-invalid');
  if (!data?.basic?.chart) errors.push('chart-missing');
  if (!data?.analysis?.dayMaster) errors.push('day-master-missing');
  if (!data?.analysis?.strength) errors.push('strength-missing');
  if (!data?.analysis?.patterns) errors.push('patterns-missing');
  if (!data?.analysis?.yongshen) errors.push('yongshen-missing');
  for (const key of ['strengths', 'challenges', 'supports', 'pressures', 'conflicts', 'uncertainties', 'evidence', 'priorities', 'suppressedClaims']) {
    if (!Array.isArray(data?.summary?.[key])) errors.push(`summary-${key}-missing`);
  }
  try { JSON.stringify(data); } catch { errors.push('json-unsafe'); }
  return { valid: errors.length === 0, errors };
}
