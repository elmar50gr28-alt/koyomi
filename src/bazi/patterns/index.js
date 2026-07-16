export function evaluatePatternCandidates(chartResult, schoolConfig = {}, strengthResult = null) {
  const monthTenGod = chartResult.chart?.pillars?.month?.stem?.tenGod;
  const schoolId = schoolConfig.schoolId || chartResult.chart?.schoolId;
  const candidates = [];
  if (monthTenGod) {
    const established = strengthResult?.dayMasterStrength?.level && strengthResult.dayMasterStrength.level !== 'indeterminate';
    candidates.push({
      patternId: `regular-${monthTenGod.id}`,
      candidate: true,
      established: false,
      broken: false,
      rescued: false,
      purity: 'mixed',
      conditionsMet: ['month-stem-ten-god-present'],
      conditionsFailed: established ? ['human-review-required-before-establishment'] : ['strength-indeterminate'],
      rescueFactors: [],
      breakingFactors: [],
      conflictingPatterns: [],
      schoolResults: [{ schoolId, result: 'candidate' }],
      sourceIds: ['src-yuanhai-ziping-biblio'],
      confidence: 0.52
    });
  }
  return candidates;
}

export function evaluateFollowPatterns(chartResult, schoolConfig = {}, strengthResult = null) {
  const level = strengthResult?.dayMasterStrength?.level || strengthResult?.result;
  const noRoots = strengthResult?.roots?.status === 'unrooted';
  return [{
    candidateType: 'follow-weak',
    strictResult: level === 'extremely-weak' && noRoots ? 'candidate' : 'not-established',
    permissiveResult: ['extremely-weak', 'weak'].includes(level) && noRoots ? 'candidate' : 'not-established',
    failedConditions: noRoots ? [] : ['reliable-root-present'],
    schoolDifferences: [{ schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId, result: 'candidate-only' }],
    confidence: level === 'extremely-weak' && noRoots ? 0.5 : 0.36
  }];
}

export function evaluateTransformationPatterns(chartResult, schoolConfig = {}) {
  const stemRelations = chartResult.relations?.stems?.combinations || [];
  return stemRelations.map(relation => ({
    candidateType: 'transformation',
    strictResult: 'human-review-required',
    permissiveResult: 'candidate',
    failedConditions: ['season-support-not-fully-reviewed'],
    schoolDifferences: [{ schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId, result: 'candidate-only' }],
    sourceIds: ['src-yuanhai-ziping-biblio'],
    confidence: relation.established ? 0.48 : 0.28
  }));
}

export function evaluatePatterns(chartResult, schoolConfig = {}, strengthResult = null) {
  const candidates = evaluatePatternCandidates(chartResult, schoolConfig, strengthResult);
  const followPatterns = evaluateFollowPatterns(chartResult, schoolConfig, strengthResult);
  const transformationPatterns = evaluateTransformationPatterns(chartResult, schoolConfig);
  const established = candidates.filter(x => x.established);
  const broken = candidates.filter(x => x.broken);
  const rescued = candidates.filter(x => x.rescued);
  return {
    candidates,
    established,
    broken,
    rescued,
    followPatterns,
    transformationPatterns,
    finalPattern: established[0] || null,
    evidence: ['pattern-month-ten-god-candidate'],
    confidence: Math.max(0.3, ...candidates.map(x => x.confidence), ...followPatterns.map(x => x.confidence), ...transformationPatterns.map(x => x.confidence))
  };
}
