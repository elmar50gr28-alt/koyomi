const round = value => Math.round(value * 100) / 100;

const REGULAR_PATTERNS = Object.freeze({
  zheng_guan: 'regular-zheng_guan', qi_sha: 'regular-qi_sha',
  zheng_yin: 'regular-zheng_yin', pian_yin: 'regular-pian_yin',
  shi_shen: 'regular-shi_shen', shang_guan: 'regular-shang_guan',
  zheng_cai: 'regular-zheng_cai', pian_cai: 'regular-pian_cai'
});

/**
 * These weights describe the relative meaning of evidence, not probability.
 * Month qi is primary; main/middle/residual preserve their traditional order.
 * Exposure makes month qi visible, roots confirm it elsewhere, and strength is
 * corroboration only. Relation/void penalties may obstruct but a single one
 * cannot erase main seasonal evidence. Hour uncertainty lowers confidence.
 */
export const PATTERN_WEIGHTS = Object.freeze({
  monthHiddenRole: Object.freeze({ main: 4, middle: 2.6, residual: 1.5 }),
  exposurePosition: Object.freeze({ month: 2, year: 1.3, hour: 1.1 }),
  rootPosition: Object.freeze({ month: 1.2, day: 1, hour: 0.8, year: 0.7 }),
  strengthCompatibility: 0.7,
  monthBranchClash: -1.4,
  monthBranchPunishment: -1,
  monthBranchHarm: -0.7,
  monthBranchDestruction: -0.6,
  stemCombination: -0.45,
  stemClash: -0.7,
  monthVoid: -1,
  unknownHour: -0.65
});

const DEFAULT_THRESHOLDS = Object.freeze({ established: 6.1, candidate: 2.2, broken: 4.2, mixedGap: 1.15 });

function configFor(schoolConfig) {
  return {
    weights: {
      ...PATTERN_WEIGHTS,
      ...(schoolConfig.patternWeights || {}),
      monthHiddenRole: { ...PATTERN_WEIGHTS.monthHiddenRole, ...(schoolConfig.patternWeights?.monthHiddenRole || {}) },
      exposurePosition: { ...PATTERN_WEIGHTS.exposurePosition, ...(schoolConfig.patternWeights?.exposurePosition || {}) },
      rootPosition: { ...PATTERN_WEIGHTS.rootPosition, ...(schoolConfig.patternWeights?.rootPosition || {}) }
    },
    thresholds: { ...DEFAULT_THRESHOLDS, ...(schoolConfig.patternThresholds || {}) },
    schoolId: schoolConfig.schoolId || 'koyomi-integrated',
    allowFollow: schoolConfig.allowFollowPatternEstablishment === true,
    allowTransformation: schoolConfig.allowTransformationPatternEstablishment === true
  };
}

const hasMember = (relation, id) => Boolean(id && relation?.members?.includes(id));

function obstructionFactors(chartResult, stemId, config) {
  const monthId = chartResult.chart?.pillars?.month?.branch?.id;
  const branches = chartResult.relations?.branches || {};
  const stems = chartResult.relations?.stems || {};
  const factors = [];
  const add = (relations, factor, score, member) => {
    if ((relations || []).some(relation => hasMember(relation, member))) factors.push({ factor, score, evidence: member });
  };
  add(branches.clashes, 'month-branch-clash', config.weights.monthBranchClash, monthId);
  add(branches.punishments, 'month-branch-punishment', config.weights.monthBranchPunishment, monthId);
  add(branches.harms, 'month-branch-harm', config.weights.monthBranchHarm, monthId);
  add(branches.destructions, 'month-branch-destruction', config.weights.monthBranchDestruction, monthId);
  add(stems.combinations, 'candidate-stem-combination', config.weights.stemCombination, stemId);
  add(stems.clashes, 'candidate-stem-clash', config.weights.stemClash, stemId);
  if ((chartResult.chart?.emptyVoid || []).includes(monthId)) factors.push({ factor: 'month-command-empty-void', score: config.weights.monthVoid, evidence: monthId });
  return factors;
}

function strengthEvidence(patternId, strengthResult, weight) {
  const level = strengthResult?.dayMasterStrength?.level || strengthResult?.result || 'indeterminate';
  const strong = ['extremely-strong', 'strong', 'slightly-strong'].includes(level);
  const weak = ['extremely-weak', 'weak', 'slightly-weak'].includes(level);
  const useStrength = /zheng_guan|qi_sha|zheng_cai|pian_cai|shi_shen|shang_guan/.test(patternId);
  const useWeakness = /zheng_yin|pian_yin/.test(patternId);
  const compatible = (useStrength && strong) || (useWeakness && weak) || level === 'balanced';
  return { level, compatible, score: compatible ? weight : -weight / 2 };
}

function rootsFor(chart, target) {
  const roots = [];
  for (const [pillarRole, pillar] of Object.entries(chart.pillars || {})) {
    if (!pillar) continue;
    for (const hidden of pillar.branch?.hiddenStems || []) {
      if (hidden.element === target.element) roots.push({ pillarRole, branchId: pillar.branch.id, stemId: hidden.id, qiWeight: Number(hidden.weight) || 0.35 });
    }
  }
  return roots;
}

function regularCandidate(chartResult, hidden, strengthResult, schoolConfig) {
  const config = configFor(schoolConfig);
  const chart = chartResult.chart || {};
  const patternId = REGULAR_PATTERNS[hidden.tenGod?.id];
  if (!patternId) return null;
  const role = hidden.role || 'residual';
  const exposures = ['month', 'year', 'hour'].flatMap(pillarRole => {
    const stem = chart.pillars?.[pillarRole]?.stem;
    return stem?.id === hidden.id ? [{ pillarRole, stemId: stem.id, score: config.weights.exposurePosition[pillarRole] || 0 }] : [];
  });
  const roots = rootsFor(chart, hidden).map(root => ({ ...root, score: round(root.qiWeight * (config.weights.rootPosition[root.pillarRole] || 0)) }));
  const strength = strengthEvidence(patternId, strengthResult, config.weights.strengthCompatibility);
  const obstructions = obstructionFactors(chartResult, hidden.id, config);
  const uncertainty = chartResult.normalizedInput?.timeUnknown ? config.weights.unknownHour : 0;
  const scoreBreakdown = {
    monthCommand: config.weights.monthHiddenRole[role] || 0,
    exposure: round(exposures.reduce((sum, item) => sum + item.score, 0)),
    roots: round(roots.reduce((sum, item) => sum + item.score, 0)),
    strengthCompatibility: round(strength.score),
    relationshipObstruction: round(obstructions.reduce((sum, item) => sum + item.score, 0)),
    timeUncertainty: uncertainty
  };
  scoreBreakdown.total = round(Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0));
  const breakingFactors = obstructions.map(item => item.factor);
  const supportingFactors = [`month-command-${role}-qi`, ...exposures.map(x => `exposed-at-${x.pillarRole}`), ...roots.map(x => `rooted-at-${x.pillarRole}`), ...(strength.compatible ? ['strength-compatible'] : [])];
  const established = scoreBreakdown.total >= config.thresholds.established && exposures.length > 0 && breakingFactors.length === 0;
  const broken = scoreBreakdown.total >= config.thresholds.broken && breakingFactors.length >= 2;
  const candidate = scoreBreakdown.total >= config.thresholds.candidate;
  return {
    patternId, tenGodId: hidden.tenGod.id, candidate, established, broken, rescued: false,
    purity: role === 'main' && breakingFactors.length === 0 ? 'clear' : 'mixed',
    establishmentStatus: established ? 'established' : broken ? 'broken' : candidate ? 'candidate' : 'not-established',
    conditionsMet: supportingFactors,
    conditionsFailed: established ? [] : [...breakingFactors, ...(exposures.length ? [] : ['month-command-qi-not-exposed'])],
    rescueFactors: [], breakingFactors, conflictingPatterns: [], supportingFactors, scoreBreakdown,
    schoolResults: [{ schoolId: config.schoolId, result: established ? 'established' : candidate ? 'candidate' : 'not-established', score: scoreBreakdown.total }],
    confidence: round(Math.max(0.2, Math.min(0.9, 0.38 + scoreBreakdown.total * 0.055 + (uncertainty ? -0.12 : 0)))),
    warnings: uncertainty ? ['hour-pillar-unknown-confidence-reduced'] : [],
    evidence: { monthHiddenStem: { stemId: hidden.id, role, weight: hidden.weight, tenGodId: hidden.tenGod.id }, exposures, roots, strength, obstructions }
  };
}

function monthStageCandidates(chartResult, strengthResult, schoolConfig) {
  const config = configFor(schoolConfig);
  const stage = chartResult.chart?.pillars?.month?.branch?.twelveStage?.stageId;
  if (!['jianlu', 'diwang'].includes(stage)) return [];
  const patternId = stage === 'jianlu' ? 'jianlu' : 'yangren';
  const score = stage === 'jianlu' ? 5.2 : 5;
  return [{
    patternId, candidate: true, established: false, broken: false, rescued: false, purity: 'mixed', establishmentStatus: 'candidate',
    conditionsMet: [`month-stage-${stage}`], conditionsFailed: ['human-review-required-before-establishment'], rescueFactors: [], breakingFactors: [], conflictingPatterns: [],
    supportingFactors: [`month-stage-${stage}`], scoreBreakdown: { monthCommand: score, total: score },
    schoolResults: [{ schoolId: config.schoolId, result: 'candidate', score }], confidence: 0.62, warnings: [],
    evidence: { monthTwelveStage: stage, strengthLevel: strengthResult?.dayMasterStrength?.level || strengthResult?.result }
  }];
}

function followCandidate(chartResult, strengthResult, schoolConfig) {
  const config = configFor(schoolConfig);
  const level = strengthResult?.dayMasterStrength?.level || strengthResult?.result;
  const rootStatus = strengthResult?.roots?.status;
  const extreme = ['extremely-strong', 'extremely-weak'].includes(level);
  const noRoots = rootStatus === 'unrooted';
  const candidate = extreme && (level === 'extremely-strong' || noRoots);
  const type = level === 'extremely-strong' ? 'follow-strong' : 'follow-weak';
  const established = candidate && config.allowFollow;
  return {
    patternId: type, candidate, established, broken: false, rescued: false, purity: 'mixed', establishmentStatus: established ? 'established' : candidate ? 'candidate' : 'not-established',
    conditionsMet: [extreme ? 'extreme-strength' : null, noRoots ? 'unrooted' : null].filter(Boolean),
    conditionsFailed: [!extreme ? 'not-extreme' : null, level === 'extremely-weak' && !noRoots ? 'reliable-root-present' : null, !config.allowFollow ? 'conservative-school-review' : null].filter(Boolean),
    rescueFactors: [], breakingFactors: [], conflictingPatterns: [], supportingFactors: [],
    scoreBreakdown: { extremeStrength: extreme ? 3 : 0, absenceOfRoot: noRoots ? 2 : 0, total: candidate ? 5 : 0 },
    schoolResults: [{ schoolId: config.schoolId, result: established ? 'established' : candidate ? 'candidate' : 'not-established' }],
    confidence: candidate ? 0.48 : 0.3, warnings: [], evidence: { strengthLevel: level, rootStatus }
  };
}

function transformationCandidates(chartResult, schoolConfig) {
  const config = configFor(schoolConfig);
  const seasonElement = chartResult.chart?.monthCommand?.element;
  return (chartResult.relations?.stems?.combinations || []).map(relation => {
    const seasonSupports = relation.resultElement === seasonElement;
    const established = seasonSupports && config.allowTransformation;
    return {
      patternId: `transformation-${relation.resultElement || 'unknown'}`, candidate: true, established, broken: false, rescued: false, purity: 'mixed', establishmentStatus: established ? 'established' : 'candidate',
      conditionsMet: ['stem-combination', ...(seasonSupports ? ['season-support'] : [])],
      conditionsFailed: [...(!seasonSupports ? ['season-support-insufficient'] : []), ...(!config.allowTransformation ? ['conservative-school-review'] : [])],
      rescueFactors: [], breakingFactors: [], conflictingPatterns: [], supportingFactors: ['stem-combination'],
      scoreBreakdown: { stemCombination: 2.5, seasonSupport: seasonSupports ? 2 : 0, total: seasonSupports ? 4.5 : 2.5 },
      schoolResults: [{ schoolId: config.schoolId, result: established ? 'established' : 'candidate' }], confidence: seasonSupports ? 0.46 : 0.28, warnings: [], evidence: { relation, seasonElement }
    };
  });
}

export function evaluateStructuredPatterns(chartResult, schoolConfig = {}, strengthResult = null) {
  const config = configFor(schoolConfig);
  const regular = (chartResult.chart?.pillars?.month?.branch?.hiddenStems || []).map(hidden => regularCandidate(chartResult, hidden, strengthResult, schoolConfig)).filter(Boolean);
  const follow = followCandidate(chartResult, strengthResult, schoolConfig);
  const transformations = transformationCandidates(chartResult, schoolConfig);
  const ranked = [...regular, ...monthStageCandidates(chartResult, strengthResult, schoolConfig), ...(follow.candidate ? [follow] : []), ...transformations].sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total);
  const candidates = ranked.filter(item => item.candidate);
  const rejectedCandidates = [...regular.filter(item => !item.candidate), ...(follow.candidate ? [] : [follow])];
  const top = candidates[0] || null;
  const mixed = Boolean(top && candidates[1] && top.scoreBreakdown.total - candidates[1].scoreBreakdown.total < config.thresholds.mixedGap);
  const broken = candidates.some(item => item.broken);
  const establishmentStatus = broken ? 'broken' : mixed ? 'mixed' : top?.established ? 'established' : top ? 'candidate' : 'not-established';
  if (mixed) candidates.slice(0, 2).forEach((item, index) => item.conflictingPatterns.push(candidates[index ? 0 : 1].patternId));
  const timeUnknown = Boolean(chartResult.normalizedInput?.timeUnknown);
  return {
    primaryPattern: establishmentStatus === 'established' ? top : null,
    secondaryPatterns: candidates.slice(establishmentStatus === 'established' ? 1 : 0, 3),
    candidates, rejectedCandidates, establishmentStatus,
    breakingFactors: [...new Set(candidates.flatMap(item => item.breakingFactors))],
    supportingFactors: [...new Set(candidates.flatMap(item => item.supportingFactors))],
    scoreBreakdown: Object.fromEntries(ranked.map(item => [item.patternId, item.scoreBreakdown])),
    schoolResults: [{ schoolId: config.schoolId, result: establishmentStatus, primaryPatternId: top?.patternId || null }],
    confidence: round(Math.max(0.2, Math.min(0.88, (top?.confidence || 0.25) - (mixed ? 0.1 : 0) - (timeUnknown ? 0.1 : 0)))),
    warnings: [...(timeUnknown ? ['hour-pillar-unknown-confidence-reduced'] : []), ...(mixed ? ['multiple-patterns-close-in-score'] : []), ...(!top ? ['insufficient-pattern-evidence'] : [])],
    // Keep the historical top-level evidence list string-only for downstream
    // reading compatibility; detailed evidence stays alongside each candidate.
    evidence: ['pattern-month-command-structured'],
    evidenceDetails: candidates.map(item => ({ patternId: item.patternId, evidence: item.evidence })),
    followPatterns: [follow], transformationPatterns: transformations
  };
}

export function evaluateLegacyPatterns(chartResult, schoolConfig = {}, strengthResult = null) {
  const monthTenGod = chartResult.chart?.pillars?.month?.stem?.tenGod;
  const schoolId = schoolConfig.schoolId || chartResult.chart?.schoolId;
  const candidates = [];
  if (monthTenGod) {
    const known = strengthResult?.dayMasterStrength?.level && strengthResult.dayMasterStrength.level !== 'indeterminate';
    candidates.push({ patternId: `regular-${monthTenGod.id}`, candidate: true, established: false, broken: false, rescued: false, purity: 'mixed', conditionsMet: ['month-stem-ten-god-present'], conditionsFailed: known ? ['human-review-required-before-establishment'] : ['strength-indeterminate'], rescueFactors: [], breakingFactors: [], conflictingPatterns: [], schoolResults: [{ schoolId, result: 'candidate' }], sourceIds: ['src-yuanhai-ziping-biblio'], confidence: 0.52 });
  }
  return { candidates, established: [], broken: [], rescued: [], finalPattern: null };
}
