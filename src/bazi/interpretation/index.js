export function buildInterpretationFacts(chartResult, strengthResult, patternResult, yongshenResult, luckResult) {
  return {
    dayMaster: chartResult.chart?.dayMaster,
    pillars: chartResult.chart?.pillars,
    elementBalance: chartResult.chart?.elementBalance,
    strength: strengthResult?.result,
    patternCandidates: patternResult?.candidates || [],
    yongshen: yongshenResult,
    luckCycles: luckResult?.cycles || [],
    evidence: [
      ...(chartResult.evidence || []),
      ...(strengthResult?.evidence || []),
      ...(patternResult?.evidence || []),
      ...(yongshenResult?.evidence || [])
    ]
  };
}

const categories = ['career', 'finance', 'relationship', 'family', 'health'];

export function evaluateInterpretationTendencies(baziResult, options = {}) {
  const confidenceBase = baziResult.normalizedInput?.timeUnknown ? 0.38 : 0.5;
  const strengthLevel = baziResult.strength?.dayMasterStrength?.level || baziResult.strength?.result || 'indeterminate';
  const useful = baziResult.favorableElements?.favorable || baziResult.yongshen?.favorable || [];
  const hasConflict = (baziResult.relations?.branches?.clashes || []).length > 0;
  return {
    career: tendency('career', 'responsibility-and-learning', ['strength', 'resource-officer-signals'], confidenceBase + 0.04, ['interp-career-resource-officer']),
    finance: tendency('finance', 'resource-exchange-style', ['wealth-flow', `strength-${strengthLevel}`], confidenceBase, ['interp-wealth-flow']),
    relationship: tendency('relationship', hasConflict ? 'change-and-adjustment-rhythm' : 'relationship-rhythm', ['branch-relations', 'element-balance'], confidenceBase - 0.04, ['interp-relationship-balance']),
    family: tendency('family', 'support-structure', ['roots', 'pillar-positions'], confidenceBase - 0.06, ['interp-family-roots']),
    health: tendency('health', 'lifestyle-attention', ['climate', 'element-distribution'], confidenceBase - 0.08, ['interp-health-climate'], 'not-medical-advice'),
    meta: {
      categories,
      usefulElements: useful,
      certaintyPolicy: 'tendency-condition-confidence',
      generatedText: false,
      reviewStatus: options.reviewStatus || 'phase3-structured'
    }
  };
}

export function evaluateLuckInterpretations(baziResult) {
  const favorable = new Set(baziResult.favorableElements?.favorable || []);
  const decade = (baziResult.luckCycles?.cycles || []).map(cycle => {
    const supportive = favorable.has(cycle.stem?.element) || favorable.has(cycle.branch?.element);
    return {
      scope: 'decade',
      cycleIndex: cycle.index,
      tendency: supportive ? 'supportive-condition' : 'neutral-or-mixed-condition',
      conditions: ['natal-context-required', 'luck-cycle-element-comparison'],
      confidence: supportive ? 0.46 : 0.34,
      sourceIds: ['src-sanming-tonghui-biblio'],
      reviewStatus: 'phase3-seed'
    };
  });
  return {
    decade,
    annual: [{
      scope: 'year',
      tendency: 'change-pressure-if-relations-activate',
      conditions: ['annual-stem-branch-required'],
      confidence: 0.32,
      sourceIds: ['src-sanming-tonghui-biblio'],
      reviewStatus: 'human-review-required'
    }],
    monthly: [{
      scope: 'month',
      tendency: 'short-term-flow-if-monthly-pillar-known',
      conditions: ['monthly-stem-branch-required'],
      confidence: 0.28,
      sourceIds: ['src-sanming-tonghui-biblio'],
      reviewStatus: 'human-review-required'
    }]
  };
}

export function buildBeginnerExplanation(baziResult) {
  const tendencies = baziResult.interpretation?.tendencies || evaluateInterpretationTendencies(baziResult);
  return categories.map(category => ({
    category,
    headline: tendencies[category].tendency,
    plainSummary: `This is a ${category} tendency, not a fixed outcome.`,
    conditions: tendencies[category].conditions,
    confidence: tendencies[category].confidence,
    warnings: tendencies[category].warnings,
    sourceIds: tendencies[category].sourceIds,
    reviewStatus: tendencies[category].reviewStatus
  }));
}

export function buildProfessionalEvidence(baziResult) {
  const evidenceIds = new Set([
    ...(baziResult.evidence || []),
    ...(baziResult.strength?.evidence || []),
    ...(baziResult.patterns?.evidence || []),
    ...(baziResult.yongshen?.evidence || []),
    ...Object.values(baziResult.interpretation?.tendencies || {}).flatMap(item => Array.isArray(item?.sourceIds) ? item.sourceIds : [])
  ]);
  return [...evidenceIds].filter(Boolean).map(entityId => ({
    entityId,
    sourceIds: entityId.startsWith('src-') ? [entityId] : [],
    schoolIds: ['koyomi-integrated'],
    evidenceLevel: entityId.startsWith('src-') ? 'classical-index' : 'engine-rule',
    reviewStatus: entityId.startsWith('src-') ? 'reviewed-index' : 'phase3-seed',
    sourceSeparation: {
      originalTextStored: false,
      summaryStored: entityId.startsWith('src-'),
      modernInterpretationStored: !entityId.startsWith('src-'),
      aiGeneratedProseStoredAsSource: false
    }
  }));
}

export function buildMitsunomeInput(baziResult) {
  return {
    schemaId: 'mitsunome-bazi-phase3-input',
    version: '1.0.0',
    personContext: {
      personId: baziResult.normalizedInput?.personId || null,
      name: baziResult.normalizedInput?.name || '',
      precision: baziResult.normalizedInput?.timeUnknown ? 'partial-without-hour-pillar' : 'known-birth-time'
    },
    structuredResult: {
      chart: baziResult.chart,
      strength: baziResult.strength,
      patterns: baziResult.patterns,
      yongshen: baziResult.yongshen,
      luckCycles: baziResult.luckCycles,
      interpretation: baziResult.interpretation
    },
    beginnerExplanation: baziResult.beginnerExplanation || buildBeginnerExplanation(baziResult),
    professionalEvidence: baziResult.professionalEvidence || buildProfessionalEvidence(baziResult),
    sourcePolicy: {
      classicalOriginalTextAsEvidenceOnly: true,
      aiGeneratedTextIsNotSource: true,
      modernCopyrightedTextNotCopied: true,
      unknownEvidenceRequiresReviewStatus: true
    }
  };
}

function tendency(category, value, conditions, confidence, sourceIds, warning = null) {
  return {
    category,
    tendency: value,
    conditions,
    certainty: 'conditional',
    confidence: Math.max(0.1, Math.min(0.8, Math.round(confidence * 100) / 100)),
    sourceIds,
    warnings: warning ? [warning] : [],
    reviewStatus: 'phase3-seed'
  };
}
