import { evaluateLegacyPatterns, evaluateStructuredPatterns } from './pattern-core.js';

export function evaluatePatternCandidates(chartResult, schoolConfig = {}, strengthResult = null) {
  return evaluateStructuredPatterns(chartResult, schoolConfig, strengthResult).candidates;
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
  const structured = evaluateStructuredPatterns(chartResult, schoolConfig, strengthResult);
  const candidates = structured.candidates;
  const followPatterns = structured.followPatterns;
  const transformationPatterns = structured.transformationPatterns;
  const established = candidates.filter(x => x.established);
  const broken = candidates.filter(x => x.broken);
  const rescued = candidates.filter(x => x.rescued);
  return {
    ...structured,
    candidates,
    established,
    broken,
    rescued,
    followPatterns,
    transformationPatterns,
    // Keep the legacy final-selection field untouched while the refined
    // result is reviewed through primaryPattern/establishmentStatus.
    finalPattern: null,
    legacyComparison: evaluateLegacyPatterns(chartResult, schoolConfig, strengthResult)
  };
}

export { evaluateLegacyPatterns, evaluateStructuredPatterns, PATTERN_WEIGHTS } from './pattern-core.js';
