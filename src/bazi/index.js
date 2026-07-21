export { calculateSolarTerms, calculateTrueSolarTime, julianDay } from './calendar/index.js';
export { calculatePillarFoundation } from './chart/foundation.js';
export { calculateBaziChart, calculateFourPillars, calculateTenGod, calculateTwelveStage, getHiddenStems } from './chart/index.js';
export { evaluateBasicBranchRelations, evaluateBasicStemRelations, evaluateBranchRelations, evaluateStemRelations } from './relations/index.js';
export { evaluateClimate, evaluateDayMasterStrength, evaluateElementDistribution, evaluateExposedStems, evaluateMonthCommand, evaluateQiFlow, evaluateRoots, evaluateStrength } from './strength/index.js';
export { evaluateFollowPatterns, evaluatePatternCandidates, evaluatePatterns, evaluateTransformationPatterns } from './patterns/index.js';
export { evaluateFavorableElements, evaluateYongshen, evaluateYongshenByMethod } from './yongshen/index.js';
export { calculateLuckCycles } from './luck/index.js';
export { compareBaziSchools, compareSchools, listSchoolProfiles } from './schools/index.js';
export { explainBaziDecision, explainRule, getEvidence, PHASE3_CLASSICAL_INDEX } from './evidence/index.js';
export { validateBaziPhase2Result, validateBaziPhase3Result, validateBaziResult, validateChartResult } from './validation/index.js';
export { buildBeginnerExplanation, buildInterpretationFacts, buildMitsunomeInput, buildProfessionalEvidence, evaluateInterpretationTendencies, evaluateLuckInterpretations } from './interpretation/index.js';
export { buildBaziBeginnerReading, buildBaziMitsunomeReadingInput, buildBaziProfessionalReading, buildBaziReading, validateBaziReading } from './reading/index.js';

import { calculateBaziChart, calculateFourPillars, calculateTenGod, calculateTwelveStage, getHiddenStems } from './chart/index.js';
import { evaluateBasicBranchRelations, evaluateBasicStemRelations, evaluateBranchRelations, evaluateStemRelations } from './relations/index.js';
import { evaluateStrength } from './strength/index.js';
import { evaluatePatterns } from './patterns/index.js';
import { evaluateFavorableElements, evaluateYongshen } from './yongshen/index.js';
import { calculateLuckCycles } from './luck/index.js';
import { compareBaziSchools, compareSchools } from './schools/index.js';
import { buildBeginnerExplanation, buildInterpretationFacts, buildMitsunomeInput, buildProfessionalEvidence, evaluateInterpretationTendencies, evaluateLuckInterpretations } from './interpretation/index.js';
import { buildBaziReading, validateBaziReading } from './reading/index.js';
import { validateBaziPhase2Result, validateBaziPhase3Result, validateBaziResult, validateChartResult } from './validation/index.js';

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
  const interpretation = {
    facts: interpretationFacts,
    tendencies: evaluateInterpretationTendencies(result),
    luck: evaluateLuckInterpretations(result)
  };
  const phase3Result = {
    ...result,
    interpretation,
    beginnerExplanation: buildBeginnerExplanation({ ...result, interpretation }),
    professionalEvidence: buildProfessionalEvidence({ ...result, interpretation })
  };
  const finalResult = {
    ...phase3Result,
    mitsunomeInput: buildMitsunomeInput(phase3Result)
  };
  const reading = buildBaziReading(finalResult);
  return {
    ...finalResult,
    reading,
    readingValidation: validateBaziReading(reading),
    validation: validateBaziResult(finalResult),
    phase2Validation: validateBaziPhase2Result(finalResult),
    phase3Validation: validateBaziPhase3Result(finalResult)
  };
}

export const KOYOMI_BAZI_VERSION = 'phase3-2026-07-17';

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
  validateBaziPhase2Result,
  validateBaziPhase3Result,
  evaluateInterpretationTendencies,
  evaluateLuckInterpretations,
  buildBeginnerExplanation,
  buildProfessionalEvidence,
  buildMitsunomeInput,
  buildBaziReading,
  validateBaziReading
};
