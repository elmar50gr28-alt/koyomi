import { prepareBirthCalculation } from './birth-time.js';
import {
  buildDerivedChartInfo,
  calculateTenGod,
  calculateTwelveStage,
  getHiddenStems,
  tenGodFor
} from './derived-info.js';
import { calculatePillarFoundation } from './foundation.js';

export { calculateTenGod, calculateTwelveStage, getHiddenStems, tenGodFor };

export function calculateFourPillars(normalizedBirthData, settings = {}) {
  return calculateBaziChart(normalizedBirthData, settings).chart.pillars;
}

export function calculateBaziChart(profile, schoolConfigInput = {}) {
  const {
    schoolConfig,
    normalizedInput,
    birthLocal,
    trueSolarTime,
    calculationDate,
    solarTerms,
    warnings
  } = prepareBirthCalculation(profile, schoolConfigInput);
  const { year, month, day, hour } = calculatePillarFoundation(calculationDate, {
    timeUnknown: normalizedInput.timeUnknown,
    schoolConfig
  });
  const derived = buildDerivedChartInfo({ year, month, day, hour });
  return {
    input: profile,
    normalizedInput,
    calendarCalculation: {
      timezone: normalizedInput.place.timezone,
      utcOffset: normalizedInput.place.utcOffset,
      trueSolarTime,
      solarTerms
    },
    chart: {
      schoolId: schoolConfig.schoolId,
      dayMaster: day.stem,
      pillars: derived.pillars,
      monthCommand: month.branch,
      elementBalance: derived.elementBalance,
      emptyVoid: derived.emptyVoid,
      tombStorage: derived.tombStorage
    },
    confidence: normalizedInput.date ? (normalizedInput.timeUnknown ? 0.66 : 0.82) : 0.2,
    warnings,
    evidence: ['bazi-calendar-cycle-phase1', 'bazi-hidden-stems-phase1'],
    interpretationFacts: []
  };
}
