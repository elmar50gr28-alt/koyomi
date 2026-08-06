import { ELEMENTS } from '../data.js';

const ELEMENT_IDS = Object.keys(ELEMENTS);
const round = value => Math.round(value * 100) / 100;
const predecessor = element => ELEMENT_IDS.find(id => ELEMENTS[id].generates === element) || null;
const controller = element => ELEMENT_IDS.find(id => ELEMENTS[id].controls === element) || null;

/**
 * Weight meanings rather than unexplained constants:
 * - Pattern and month command lead the ordinary selection because they define
 *   the chart's operating structure.
 * - Climate urgency is a separate axis and may lead only when heat/cold is
 *   explicit; ordinary dryness/wetness remains supporting evidence.
 * - Mediation and illness/medicine gain weight only when an actual conflict or
 *   excess is present. Distribution alone never creates a final selection.
 * - Agreement bonuses reward independent methods naming the same element.
 */
export const YONGSHEN_WEIGHTS = Object.freeze({
  method: Object.freeze({ pattern: 1.35, climate: 1.25, mediation: 1.1, illnessMedicine: 1.05, supportControl: 1, assistant: 0.55 }),
  agreementBonus: 0.65,
  unknownHourPenalty: 0.6,
  primaryThreshold: 4,
  conflictGap: 0.8,
  minimumMethods: 2
});

function configFor(schoolConfig) {
  return {
    weights: {
      ...YONGSHEN_WEIGHTS,
      ...(schoolConfig.yongshenWeights || {}),
      method: { ...YONGSHEN_WEIGHTS.method, ...(schoolConfig.yongshenWeights?.method || {}) }
    },
    allowUrgentClimatePrimary: schoolConfig.allowUrgentClimatePrimary !== false,
    allowSpecialPatternPrimary: schoolConfig.allowSpecialPatternYongshen === true,
    schoolId: schoolConfig.schoolId || 'koyomi-integrated'
  };
}

function methodResult(methodId, candidates = [], details = {}) {
  return {
    methodId,
    candidates: candidates.filter(item => item.element),
    primaryCandidates: candidates.filter(item => item.score >= 2.5).map(item => item.element),
    secondaryCandidates: candidates.filter(item => item.score < 2.5).map(item => item.element),
    rejectedCandidates: details.rejectedCandidates || [],
    urgency: details.urgency || 'normal',
    reasons: details.reasons || [],
    supportingFactors: details.supportingFactors || [],
    opposingFactors: details.opposingFactors || [],
    confidence: details.confidence || 0.35,
    evidence: details.evidence || []
  };
}

function elementRelations(dayElement) {
  return {
    companion: dayElement,
    resource: predecessor(dayElement),
    output: ELEMENTS[dayElement]?.generates || null,
    wealth: ELEMENTS[dayElement]?.controls || null,
    officer: controller(dayElement)
  };
}

function supportControlMethod(chartResult, strengthResult) {
  const day = chartResult.chart?.dayMaster?.element;
  const relation = elementRelations(day);
  const level = strengthResult?.dayMasterStrength?.level || strengthResult?.result || 'balanced';
  const score = Number(strengthResult?.dayMasterStrength?.score) || 0;
  const monthRelation = strengthResult?.monthCommand?.relationToDayMaster;
  const candidates = [];
  if (score <= -1.2) {
    candidates.push({ element: relation.resource, score: Math.min(3.2, 1.6 + Math.abs(score) * 0.25), reason: 'restore-through-resource' });
    candidates.push({ element: relation.companion, score: 1.2, reason: 'support-through-companion' });
  } else if (score >= 1.2) {
    candidates.push({ element: relation.output, score: Math.min(3, 1.5 + score * 0.22), reason: 'release-excess-qi' });
    candidates.push({ element: relation.wealth, score: 1.25, reason: 'channel-output-to-wealth' });
    candidates.push({ element: relation.officer, score: 1.05, reason: 'restrain-excess-carefully' });
  }
  if (monthRelation === 'resource' && score < 0) candidates.find(item => item.element === relation.resource).score += 0.45;
  return methodResult('support-control', candidates, {
    reasons: [`day-master-${level}`, `precise-score-${round(score)}`, `month-command-${monthRelation || 'unknown'}`],
    supportingFactors: ['precise-strength', 'month-command'], confidence: candidates.length ? 0.67 : 0.42,
    evidence: [{ strengthLevel: level, strengthScore: score, monthRelation }]
  });
}

function climateMethod(strengthResult) {
  const climate = strengthResult?.climate || {};
  const state = climate.climateState || {};
  const urgent = state.hot || state.cold;
  const score = urgent ? 3.4 : (state.dry || state.wet) ? 2.15 : 0;
  return methodResult('climate', (climate.candidateElements || []).map(element => ({ element, score, reason: climate.primaryNeed })), {
    urgency: urgent ? 'urgent' : score ? 'supporting' : 'none', reasons: [climate.primaryNeed || 'no-major-climate-need'],
    supportingFactors: climate.supportingEvidence || [], confidence: urgent ? 0.72 : score ? 0.55 : 0.35,
    evidence: [{ climateState: state, primaryNeed: climate.primaryNeed }]
  });
}

function mediationMethod(chartResult, strengthResult) {
  const weighted = strengthResult?.elementDistribution?.weightedCount || {};
  const conflicts = [];
  for (const controllerElement of ELEMENT_IDS) {
    const controlled = ELEMENTS[controllerElement].controls;
    if ((weighted[controllerElement] || 0) >= 18 && (weighted[controlled] || 0) >= 18) {
      conflicts.push({ controller: controllerElement, controlled, mediator: ELEMENTS[controllerElement].generates });
    }
  }
  const relationCount = (chartResult.relations?.branches?.clashes || []).length + (chartResult.relations?.stems?.clashes || []).length;
  const candidates = conflicts.map(item => ({ element: item.mediator, score: 2.4 + Math.min(relationCount, 2) * 0.3, reason: `mediate-${item.controller}-${item.controlled}` }));
  return methodResult('mediation', candidates, {
    reasons: conflicts.length ? ['controlling-elements-both-active'] : ['no-material-element-conflict'],
    supportingFactors: relationCount ? ['stem-or-branch-conflict-present'] : [], confidence: candidates.length ? 0.62 : 0.34,
    evidence: conflicts
  });
}

function illnessMedicineMethod(strengthResult) {
  const distribution = strengthResult?.elementDistribution || {};
  const excess = distribution.excess || [];
  const blocked = strengthResult?.qiFlow?.opposingFactors || [];
  const diseases = excess.map(element => ({ type: 'element-excess', element }));
  if (blocked.length >= 3) diseases.push({ type: 'qi-flow-blockage', paths: blocked });
  const candidates = excess.map(element => ({ element: controller(element), score: 2.25, reason: `control-excess-${element}` }));
  return methodResult('illness-medicine', candidates, {
    reasons: diseases.map(item => item.type), opposingFactors: diseases, confidence: diseases.length ? 0.6 : 0.33,
    evidence: [{ diseases, medicines: candidates }]
  });
}

function patternMethod(chartResult, patternResult, schoolConfig) {
  const config = configFor(schoolConfig);
  const relation = elementRelations(chartResult.chart?.dayMaster?.element);
  const pattern = patternResult?.primaryPattern || patternResult?.candidates?.[0] || null;
  if (!pattern) return methodResult('pattern', [], { reasons: ['pattern-not-established'], confidence: 0.3 });
  const id = pattern.patternId || '';
  const special = /follow-|transformation-/.test(id);
  const candidates = [];
  if (/zheng_guan/.test(id)) candidates.push({ element: relation.wealth, score: 3, reason: 'support-officer-pattern' }, { element: relation.resource, score: 1.8, reason: 'protect-day-master' });
  else if (/qi_sha/.test(id)) candidates.push({ element: relation.output, score: 3, reason: 'control-seven-killings' }, { element: relation.resource, score: 1.7, reason: 'transform-seven-killings' });
  else if (/zheng_yin|pian_yin/.test(id)) candidates.push({ element: relation.officer, score: 2.7, reason: 'generate-resource-pattern' });
  else if (/shi_shen|shang_guan/.test(id)) candidates.push({ element: relation.wealth, score: 2.8, reason: 'continue-output-flow' });
  else if (/zheng_cai|pian_cai/.test(id)) candidates.push({ element: relation.output, score: 2.8, reason: 'generate-wealth-pattern' });
  else if (/jianlu|yangren/.test(id)) candidates.push({ element: relation.officer, score: 2.5, reason: 'restrain-prosperous-companion' }, { element: relation.output, score: 2.2, reason: 'release-prosperous-qi' });
  else if (/transformation-/.test(id)) candidates.push({ element: id.replace('transformation-', ''), score: 1.7, reason: 'transformation-candidate-only' });
  if (special && !config.allowSpecialPatternPrimary) candidates.forEach(item => { item.score = Math.min(item.score, 1.7); });
  const rescueElements = pattern.breakingFactors?.length ? [relation.resource, relation.output].filter(Boolean) : [];
  rescueElements.forEach(element => candidates.push({ element, score: 1.5, reason: 'rescue-broken-pattern' }));
  return methodResult('pattern', candidates, {
    reasons: [id, `status-${patternResult.establishmentStatus || pattern.establishmentStatus || 'candidate'}`],
    opposingFactors: pattern.breakingFactors || [], confidence: special ? 0.42 : patternResult?.confidence || pattern.confidence || 0.55,
    evidence: [{ patternId: id, establishmentStatus: patternResult?.establishmentStatus, supportingFactors: pattern.supportingFactors || [], breakingFactors: pattern.breakingFactors || [] }]
  });
}

function assistantMethod(chartResult, methodResults) {
  const day = chartResult.chart?.dayMaster?.element;
  const resource = predecessor(day);
  const named = Object.values(methodResults).flatMap(result => result.candidates).map(item => item.element);
  return methodResult('assistant-god', named.includes(resource) ? [{ element: day, score: 1, reason: 'assist-resource-day-flow' }] : [], {
    reasons: ['support-primary-candidate'], confidence: 0.4
  });
}

function integrate(methodResults, chartResult, schoolConfig) {
  const config = configFor(schoolConfig);
  const byElement = Object.fromEntries(ELEMENT_IDS.map(element => [element, { element, total: 0, methods: [], contributions: [] }]));
  for (const [methodId, result] of Object.entries(methodResults)) {
    for (const candidate of result.candidates) {
      const weightedScore = round(candidate.score * (config.weights.method[methodId] || 1));
      byElement[candidate.element].total += weightedScore;
      byElement[candidate.element].methods.push(methodId);
      byElement[candidate.element].contributions.push({ methodId, rawScore: candidate.score, weightedScore, reason: candidate.reason });
    }
  }
  for (const entry of Object.values(byElement)) {
    const independentMethods = new Set(entry.methods).size;
    if (independentMethods > 1) entry.total += (independentMethods - 1) * config.weights.agreementBonus;
    entry.total = round(entry.total);
    entry.methodCount = independentMethods;
  }
  const ranked = Object.values(byElement).sort((a, b) => b.total - a.total);
  const top = ranked[0];
  const second = ranked[1];
  const urgentClimate = methodResults.climate.urgency === 'urgent' && methodResults.climate.candidates.some(item => item.element === top.element);
  const closeConflict = top.total > 0 && top.total - second.total < config.weights.conflictGap && (ELEMENTS[top.element].controls === second.element || ELEMENTS[second.element].controls === top.element);
  const enough = top.total >= config.weights.primaryThreshold && (top.methodCount >= config.weights.minimumMethods || (urgentClimate && config.allowUrgentClimatePrimary));
  const status = closeConflict ? 'conflicted' : enough ? 'selected' : 'withheld';
  const primary = status === 'selected' ? top.element : null;
  const secondary = ranked.filter(item => item.total > 0 && item.element !== primary && item.total >= 1.5).slice(0, 2).map(item => item.element);
  return { ranked, primary, secondary, status, closeConflict, urgentClimate };
}

export function evaluateIntegratedYongshen(chartResult, schoolConfig = {}, strengthResult = null, patternResult = null, legacyComparison = null) {
  const methodResults = {};
  methodResults.supportControl = supportControlMethod(chartResult, strengthResult);
  methodResults.climate = climateMethod(strengthResult);
  methodResults.mediation = mediationMethod(chartResult, strengthResult);
  methodResults.illnessMedicine = illnessMedicineMethod(strengthResult);
  methodResults.pattern = patternMethod(chartResult, patternResult, schoolConfig);
  methodResults.assistant = assistantMethod(chartResult, methodResults);
  const integrated = integrate(methodResults, chartResult, schoolConfig);
  const distribution = strengthResult?.elementDistribution || {};
  const illnessAvoid = methodResults.illnessMedicine.opposingFactors.map(item => item.element).filter(Boolean);
  const opposing = [...new Set(illnessAvoid)];
  const favorable = [...new Set([integrated.primary, ...integrated.secondary].filter(Boolean))];
  const avoid = opposing.filter(element => (distribution.weightedCount?.[element] || 0) >= 30);
  const unfavorable = opposing.filter(element => !avoid.includes(element));
  const neutral = ELEMENT_IDS.filter(element => !favorable.includes(element) && !opposing.includes(element));
  const enemyCandidates = [...new Set(avoid.map(element => predecessor(element)).filter(element => !favorable.includes(element)))];
  const timeUnknown = Boolean(chartResult.normalizedInput?.timeUnknown);
  const conflicts = [
    ...(integrated.closeConflict ? ['top-candidates-control-each-other'] : []),
    ...(integrated.status === 'withheld' ? ['insufficient-cross-method-consensus'] : [])
  ];
  const confidenceBase = integrated.status === 'selected' ? 0.58 + Math.min(integrated.ranked[0].methodCount, 3) * 0.08 : 0.4;
  return {
    primaryYongshen: integrated.primary,
    secondaryYongshen: integrated.secondary,
    favorableElements: favorable,
    unfavorableElements: unfavorable,
    avoidElements: avoid,
    neutralElements: neutral,
    enemyGodCandidates: enemyCandidates,
    methodResults,
    consensus: { status: integrated.status, element: integrated.primary, agreeingMethods: integrated.ranked[0].methods, urgentClimateOverride: integrated.urgentClimate },
    conflicts,
    scoreBreakdown: Object.fromEntries(integrated.ranked.map(item => [item.element, { total: item.total, methodCount: item.methodCount, contributions: item.contributions }])),
    supportingFactors: integrated.ranked[0].contributions,
    opposingFactors: methodResults.illnessMedicine.opposingFactors,
    rejectedCandidates: integrated.ranked.filter(item => item.total <= 0 || (!favorable.includes(item.element) && item.total < 1.5)).map(item => ({ element: item.element, score: item.total })),
    confidence: round(Math.max(0.2, confidenceBase - (timeUnknown ? configFor(schoolConfig).weights.unknownHourPenalty * 0.2 : 0) - (integrated.closeConflict ? 0.15 : 0))),
    warnings: [...(timeUnknown ? ['hour-pillar-unknown-confidence-reduced'] : []), ...(integrated.status !== 'selected' ? ['yongshen-decision-withheld'] : []), ...(/follow-|transformation-/.test(patternResult?.candidates?.[0]?.patternId || '') ? ['special-pattern-treated-conservatively'] : [])],
    evidence: ['yongshen-integrated-method-comparison'],
    evidenceDetails: Object.values(methodResults).flatMap(result => result.evidence),
    legacyComparison
  };
}
