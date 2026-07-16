export { calculateSolarTerms, calculateTrueSolarTime, julianDay } from './calendar/index.js';
export { calculateBaziChart, calculateFourPillars, calculateTenGod, calculateTwelveStage, getHiddenStems } from './chart/index.js';
export { evaluateBasicBranchRelations, evaluateBasicStemRelations, evaluateBranchRelations, evaluateStemRelations } from './relations/index.js';
export { evaluateClimate, evaluateDayMasterStrength, evaluateElementDistribution, evaluateExposedStems, evaluateMonthCommand, evaluateQiFlow, evaluateRoots, evaluateStrength } from './strength/index.js';
export { evaluateFollowPatterns, evaluatePatternCandidates, evaluatePatterns, evaluateTransformationPatterns } from './patterns/index.js';
export { evaluateFavorableElements, evaluateYongshen, evaluateYongshenByMethod } from './yongshen/index.js';
export { calculateLuckCycles } from './luck/index.js';
export { compareBaziSchools, compareSchools, listSchoolProfiles } from './schools/index.js';
export { explainBaziDecision, explainRule, getEvidence } from './evidence/index.js';
export { validateBaziPhase2Result, validateBaziResult, validateChartResult } from './validation/index.js';
export { buildInterpretationFacts } from './interpretation/index.js';

import { calculateBaziChart, calculateFourPillars, calculateTenGod, calculateTwelveStage, getHiddenStems } from './chart/index.js';
import { evaluateBasicBranchRelations, evaluateBasicStemRelations, evaluateBranchRelations, evaluateStemRelations } from './relations/index.js';
import { evaluateStrength } from './strength/index.js';
import { evaluatePatterns } from './patterns/index.js';
import { evaluateFavorableElements, evaluateYongshen } from './yongshen/index.js';
import { calculateLuckCycles } from './luck/index.js';
import { compareBaziSchools, compareSchools } from './schools/index.js';
import { buildInterpretationFacts } from './interpretation/index.js';
import { validateBaziPhase2Result, validateBaziResult, validateChartResult } from './validation/index.js';

export function calculateBazi(profile, schoolConfig = {}) {
  const chart = calculateBaziChart(profile, schoolConfig);
  const relations = {
    stems: evaluateStemRelations(chart, schoolConfig),
    branches: evaluateBranchRelations(chart, schoolConfig)
  };
  const strength = evaluateStrength(chart, schoolConfig);
  const patterns = evaluatePatterns({ ...chart, relations }, schoolConfig, strength);
  const yongshen = evaluateYongshen({ ...chart, relations }, schoolConfig, strength, patterns);
  const favorableElements = evaluateFavorableElements({ ...chart, relations }, schoolConfig, yongshen);
  const luckCycles = calculateLuckCycles({ ...chart, relations }, profile, schoolConfig);
  const interpretationFacts = buildInterpretationFacts(chart, strength, patterns, yongshen, luckCycles);
  const result = {
    ...chart,
    relations,
    strength,
    patterns,
    yongshen,
    favorableElements,
    luckCycles,
    schoolComparison: compareBaziSchools(profile, [schoolConfig.schoolId || 'koyomi-integrated']),
    interpretationFacts,
    calculationVersion: KOYOMI_BAZI_VERSION
  };
  return { ...result, validation: validateBaziResult(result), phase2Validation: validateBaziPhase2Result(result) };
}

export const KOYOMI_BAZI_VERSION = 'phase2-2026-07-17';

export default {
  calculateBazi,
  calculateBaziChart,
  calculateFourPillars,
  calculateTenGod,
  calculateTwelveStage,
  getHiddenStems,
  evaluateStemRelations,
  evaluateBranchRelations,
  evaluateBasicStemRelations,
  evaluateBasicBranchRelations,
  evaluateStrength,
  evaluatePatterns,
  evaluateYongshen,
  evaluateFavorableElements,
  calculateLuckCycles,
  compareSchools,
  compareBaziSchools,
  validateChartResult,
  validateBaziResult,
  validateBaziPhase2Result
};
