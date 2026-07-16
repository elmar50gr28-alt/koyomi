export { calculateSolarTerms, calculateTrueSolarTime, julianDay } from './calendar/index.js';
export { calculateBaziChart, calculateFourPillars, calculateTenGod, calculateTwelveStage, getHiddenStems } from './chart/index.js';
export { evaluateBasicBranchRelations, evaluateBasicStemRelations, evaluateBranchRelations, evaluateStemRelations } from './relations/index.js';
export { evaluateStrength } from './strength/index.js';
export { evaluatePatterns } from './patterns/index.js';
export { evaluateYongshen } from './yongshen/index.js';
export { calculateLuckCycles } from './luck/index.js';
export { compareSchools, listSchoolProfiles } from './schools/index.js';
export { explainRule, getEvidence } from './evidence/index.js';
export { validateBaziResult, validateChartResult } from './validation/index.js';
export { buildInterpretationFacts } from './interpretation/index.js';

import { calculateBaziChart, calculateFourPillars, calculateTenGod, calculateTwelveStage, getHiddenStems } from './chart/index.js';
import { evaluateBasicBranchRelations, evaluateBasicStemRelations, evaluateBranchRelations, evaluateStemRelations } from './relations/index.js';
import { evaluateStrength } from './strength/index.js';
import { evaluatePatterns } from './patterns/index.js';
import { evaluateYongshen } from './yongshen/index.js';
import { calculateLuckCycles } from './luck/index.js';
import { compareSchools } from './schools/index.js';
import { buildInterpretationFacts } from './interpretation/index.js';
import { validateBaziResult, validateChartResult } from './validation/index.js';

export function calculateBazi(profile, schoolConfig = {}) {
  const chart = calculateBaziChart(profile, schoolConfig);
  const relations = {
    stems: evaluateStemRelations(chart, schoolConfig),
    branches: evaluateBranchRelations(chart, schoolConfig)
  };
  const strength = evaluateStrength(chart, schoolConfig);
  const patterns = evaluatePatterns(chart, schoolConfig);
  const yongshen = evaluateYongshen(chart, schoolConfig, strength);
  const luckCycles = calculateLuckCycles(chart, schoolConfig);
  const interpretationFacts = buildInterpretationFacts(chart, strength, patterns, yongshen, luckCycles);
  return {
    ...chart,
    relations,
    strength,
    patterns,
    yongshen,
    luckCycles,
    schoolComparison: [],
    interpretationFacts,
    validation: validateBaziResult(chart)
  };
}

export const KOYOMI_BAZI_VERSION = 'phase1-2026-07-17';

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
  calculateLuckCycles,
  compareSchools,
  validateChartResult,
  validateBaziResult
};
