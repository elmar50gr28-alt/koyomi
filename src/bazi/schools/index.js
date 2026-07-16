import { SCHOOL_PROFILES } from '../data.js';
import { calculateBaziChart } from '../chart/index.js';
import { evaluateStrength } from '../strength/index.js';

export function listSchoolProfiles() {
  return Object.entries(SCHOOL_PROFILES).map(([schoolId, config]) => ({ schoolId, ...config }));
}

export function compareSchools(profile, schoolIds = Object.keys(SCHOOL_PROFILES)) {
  return schoolIds.map(schoolId => {
    const chart = calculateBaziChart(profile, { schoolId });
    const strength = evaluateStrength(chart, { schoolId, ...SCHOOL_PROFILES[schoolId] });
    return {
      schoolId,
      chartSummary: Object.values(chart.chart.pillars).filter(Boolean).map(p => p.label).join(' '),
      dayMaster: chart.chart.dayMaster,
      strength: strength.result,
      confidence: chart.confidence,
      warnings: chart.warnings
    };
  });
}

export function compareBaziSchools(profile, schoolIds = Object.keys(SCHOOL_PROFILES)) {
  return compareSchools(profile, schoolIds);
}
