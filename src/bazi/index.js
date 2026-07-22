export { calculateSolarTerms, calculateTrueSolarTime, julianDay } from './calendar/index.js';
export { calculatePillarFoundation } from './chart/foundation.js';
export { prepareBirthCalculation } from './chart/birth-time.js';
export { applyBirthTimeCorrection } from './chart/time-correction.js';
export { calculateBaziChart, calculateFourPillars, calculateTenGod, calculateTwelveStage, getHiddenStems } from './chart/index.js';
export { buildDerivedChartInfo, buildDerivedPillar, calculateElementBalance, calculateEmptyVoid, seasonForBranch } from './chart/derived-info.js';
export { evaluateBasicBranchRelations, evaluateBasicStemRelations, evaluateBranchRelationSet, evaluateBranchRelations, evaluateStemRelationSet, evaluateStemRelations } from './relations/index.js';
export { evaluateClimate, evaluateDayMasterStrength, evaluateElementDistribution, evaluateExposedStems, evaluateMonthCommand, evaluateQiFlow, evaluateRoots, evaluateStrength } from './strength/index.js';
export { classifyStrengthScore, evaluateLegacyDayMasterStrength, evaluatePreciseDayMasterStrength, relationToDayMaster, STRENGTH_WEIGHTS } from './strength/day-master-core.js';
export { evaluateFollowPatterns, evaluateLegacyPatterns, evaluatePatternCandidates, evaluatePatterns, evaluateStructuredPatterns, evaluateTransformationPatterns, PATTERN_WEIGHTS } from './patterns/index.js';
export { evaluateFavorableElements, evaluateIntegratedYongshen, evaluateLegacyYongshen, evaluateYongshen, evaluateYongshenByMethod, YONGSHEN_WEIGHTS } from './yongshen/index.js';
export { buildLuckPeriod, calculateAnnualLuck, calculateLuckCycles, calculateLuckStart, calculateMonthlyLuck } from './luck/index.js';
export { compareBaziSchools, compareSchools, listSchoolProfiles } from './schools/index.js';
export { DEFAULT_BAZI_SETTINGS, inspectBaziSettings, normalizeBaziSettings, toLegacySchoolConfig } from './settings/index.js';
export { buildIntegratedBaziReadingData, validateIntegratedBaziReadingData } from './integration/index.js';
export { explainBaziDecision, explainRule, getEvidence, PHASE3_CLASSICAL_INDEX } from './evidence/index.js';
export { validateBaziPhase2Result, validateBaziPhase3Result, validateBaziResult, validateChartResult } from './validation/index.js';
export { buildBeginnerExplanation, buildInterpretationFacts, buildMitsunomeInput, buildProfessionalEvidence, evaluateInterpretationTendencies, evaluateLuckInterpretations } from './interpretation/index.js';
export { buildBaziBeginnerReading, buildBaziMitsunomeReadingInput, buildBaziProfessionalReading, buildBaziReading, validateBaziReading } from './reading/index.js';
export { adaptIntegratedBaziReadingSource } from './reading/adapter.js';

import { calculateBaziChart, calculateFourPillars, calculateTenGod, calculateTwelveStage, getHiddenStems } from './chart/index.js';
import { evaluateBasicBranchRelations, evaluateBasicStemRelations, evaluateBranchRelations, evaluateStemRelations } from './relations/index.js';
import { evaluateStrength } from './strength/index.js';
import { evaluatePatterns } from './patterns/index.js';
import { evaluateFavorableElements, evaluateYongshen } from './yongshen/index.js';
import { buildLuckPeriod, calculateAnnualLuck, calculateLuckCycles, calculateLuckStart, calculateMonthlyLuck } from './luck/index.js';
import { compareBaziSchools, compareSchools } from './schools/index.js';
import { buildBeginnerExplanation, buildInterpretationFacts, buildMitsunomeInput, buildProfessionalEvidence, evaluateInterpretationTendencies, evaluateLuckInterpretations } from './interpretation/index.js';
import { buildBaziReading, validateBaziReading } from './reading/index.js';
import { validateBaziPhase2Result, validateBaziPhase3Result, validateBaziResult, validateChartResult } from './validation/index.js';
import { inspectBaziSettings, normalizeBaziSettings, toLegacySchoolConfig } from './settings/index.js';
import { buildIntegratedBaziReadingData, validateIntegratedBaziReadingData } from './integration/index.js';

export function calculateBazi(profile, schoolConfig = profile?.baziSettings || {}) {
  const baziSettings = normalizeBaziSettings(schoolConfig);
  const normalizedSchoolConfig = toLegacySchoolConfig(baziSettings);
  const chart = calculateBaziChart(profile, normalizedSchoolConfig);
  schoolConfig = normalizedSchoolConfig;
  const relations = {
    stems: evaluateStemRelations(chart, schoolConfig),
    branches: evaluateBranchRelations(chart, schoolConfig)
  };
  const strength = evaluateStrength(chart, schoolConfig);
  // Pattern and yongshen rules remain on the former strength decision during
  // this refinement. A later, separately reviewed change can opt them into the
  // precise level without silently changing their final selections here.
  const legacyStrengthLevel = strength.dayMasterStrength?.legacyComparison?.level || strength.result;
  const strengthForDependentRules = {
    ...strength,
    result: legacyStrengthLevel,
    dayMasterStrength: {
      ...strength.dayMasterStrength,
      level: legacyStrengthLevel
    }
  };
  const patterns = evaluatePatterns({ ...chart, relations }, schoolConfig, strength);
  // Yongshen remains deliberately isolated from the refined pattern ranking.
  // This preserves its current selection and wording until a separate review.
  const patternsForYongshen = {
    ...patterns,
    candidates: patterns.legacyComparison?.candidates || [],
    finalPattern: patterns.legacyComparison?.finalPattern || null
  };
  const yongshen = evaluateYongshen(
    { ...chart, relations },
    schoolConfig,
    strength,
    patterns,
    { strengthResult: strengthForDependentRules, patternResult: patternsForYongshen }
  );
  const favorableElements = evaluateFavorableElements({ ...chart, relations }, schoolConfig, yongshen);
  const luckCycles = calculateLuckCycles({ ...chart, relations, strength, patterns, yongshen }, profile, schoolConfig);
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
    baziSettings,
    settingsInspection: inspectBaziSettings(baziSettings),
    calculationVersion: KOYOMI_BAZI_VERSION
  };
  const integratedReadingData = buildIntegratedBaziReadingData(result);
  const interpretation = {
    facts: interpretationFacts,
    tendencies: evaluateInterpretationTendencies({ ...result, integratedReadingData }),
    luck: evaluateLuckInterpretations({ ...result, integratedReadingData })
  };
  const phase3Result = {
    ...result,
    integratedReadingData,
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
  buildLuckPeriod,
  calculateAnnualLuck,
  calculateLuckCycles,
  calculateLuckStart,
  calculateMonthlyLuck,
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
  buildIntegratedBaziReadingData,
  validateIntegratedBaziReadingData,
  buildBaziReading,
  validateBaziReading
};
