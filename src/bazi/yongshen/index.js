import { ELEMENTS } from '../data.js';

const methods = ['support-control', 'climate', 'mediation', 'illness-medicine', 'pattern', 'assistant-god'];

export function evaluateYongshenByMethod(chartResult, methodId, schoolConfig = {}, strengthResult = null, patternResult = null) {
  const dayElement = chartResult.chart?.dayMaster?.element;
  const strengthLevel = strengthResult?.dayMasterStrength?.level || strengthResult?.result || 'balanced';
  const resource = Object.entries(ELEMENTS).find(([, value]) => value.generates === dayElement)?.[0] || null;
  const output = ELEMENTS[dayElement]?.generates || null;
  const climateElements = strengthResult?.climate?.candidateElements || [];
  const base = {
    methodId,
    primaryCandidates: [],
    secondaryCandidates: [],
    rejectedCandidates: [],
    reasons: [],
    exclusions: [],
    supportingEvidence: [],
    conflictingEvidence: [],
    sourceIds: [],
    confidence: 0.35
  };
  if (methodId === 'support-control') {
    const weak = ['extremely-weak', 'weak', 'slightly-weak'].includes(strengthLevel);
    return { ...base, primaryCandidates: weak ? [resource, dayElement].filter(Boolean) : [output].filter(Boolean), reasons: [`day-master-${strengthLevel}`], supportingEvidence: ['strength-result'], sourceIds: ['src-yuanhai-ziping-biblio'], confidence: 0.56 };
  }
  if (methodId === 'climate') {
    return { ...base, primaryCandidates: climateElements, reasons: [strengthResult?.climate?.primaryNeed || 'no-major-climate-need'], supportingEvidence: strengthResult?.climate?.supportingEvidence || [], sourceIds: ['src-qiongtong-baojian-biblio'], confidence: climateElements.length ? 0.58 : 0.36 };
  }
  if (methodId === 'mediation') {
    return { ...base, secondaryCandidates: findMediationCandidates(chartResult), reasons: ['conflict-mediation-candidate'], supportingEvidence: ['element-flow-phase2'], confidence: 0.42 };
  }
  if (methodId === 'illness-medicine') {
    const excess = strengthResult?.elementDistribution?.excess || [];
    return { ...base, primaryCandidates: excess.map(element => ELEMENTS[element]?.controls).filter(Boolean), reasons: excess.map(element => `excess-${element}`), supportingEvidence: ['element-distribution'], confidence: excess.length ? 0.45 : 0.32 };
  }
  if (methodId === 'pattern') {
    return { ...base, secondaryCandidates: patternResult?.candidates?.map(x => x.patternId) || [], reasons: ['pattern-candidate-only'], exclusions: ['no-final-pattern-without-review'], sourceIds: ['src-yuanhai-ziping-biblio'], confidence: 0.38 };
  }
  return { ...base, secondaryCandidates: [resource].filter(Boolean), reasons: ['assistant-god-contextual'], supportingEvidence: ['resource-relation'], confidence: 0.36 };
}

export function evaluateFavorableElements(chartResult, schoolConfig = {}, yongshenResult = null) {
  const useful = new Set();
  const assistant = new Set();
  for (const method of Object.values(yongshenResult?.methods || {})) {
    (method.primaryCandidates || []).forEach(x => useful.add(x));
    (method.secondaryCandidates || []).forEach(x => assistant.add(x));
  }
  return {
    useful: [...useful].filter(Boolean),
    assistant: [...assistant].filter(Boolean),
    favorable: [...new Set([...useful, ...assistant])].filter(Boolean),
    unfavorable: [],
    avoid: [],
    neutral: Object.keys(ELEMENTS).filter(element => !useful.has(element) && !assistant.has(element)),
    classifications: Object.keys(ELEMENTS).map(element => ({
      element,
      classification: useful.has(element) ? 'useful' : assistant.has(element) ? 'assistant' : 'neutral',
      reason: useful.has(element) ? 'primary-yongshen-candidate' : assistant.has(element) ? 'secondary-yongshen-candidate' : 'not-selected-by-phase2-methods',
      methodId: useful.has(element) ? 'integrated' : null,
      context: 'natal',
      schoolIds: [schoolConfig.schoolId || chartResult.chart?.schoolId],
      confidence: useful.has(element) || assistant.has(element) ? 0.52 : 0.35
    }))
  };
}

export function evaluateYongshen(chartResult, schoolConfig = {}, strengthResult = null, patternResult = null) {
  const methodResults = Object.fromEntries(methods.map(methodId => [methodId, evaluateYongshenByMethod(chartResult, methodId, schoolConfig, strengthResult, patternResult)]));
  const favorableElements = evaluateFavorableElements(chartResult, schoolConfig, { methods: methodResults });
  const primary = methodResults['support-control'].primaryCandidates[0] || methodResults.climate.primaryCandidates[0] || null;
  return {
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    primary,
    secondary: favorableElements.assistant,
    favorable: favorableElements.favorable,
    unfavorable: favorableElements.unfavorable,
    neutral: favorableElements.neutral,
    supportControl: methodResults['support-control'],
    climate: methodResults.climate,
    mediation: methodResults.mediation,
    illnessMedicine: methodResults['illness-medicine'],
    patternMethod: methodResults.pattern,
    assistantGod: methodResults['assistant-god'],
    integratedComparison: { primary, conflicts: collectConflicts(methodResults), reviewStatus: 'human-review-required-for-final-yongshen' },
    methods: methodResults,
    favorableElements,
    conflicts: collectConflicts(methodResults),
    confidence: Math.max(...Object.values(methodResults).map(x => x.confidence)),
    evidence: ['yongshen-support-weak-resource', 'yongshen-climate-season']
  };
}

function findMediationCandidates(chartResult) {
  const branches = chartResult.relations?.branches?.clashes || [];
  return branches.length ? ['wood', 'earth'] : [];
}

function collectConflicts(methodResults) {
  const primarySets = Object.values(methodResults).map(x => (x.primaryCandidates || []).filter(Boolean).join(',')).filter(Boolean);
  return new Set(primarySets).size > 1 ? ['method-disagreement'] : [];
}
