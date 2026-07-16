import { ELEMENTS, SEASON_STRENGTH } from '../data.js';

export function evaluateStrength(chartResult, schoolConfig = {}) {
  const chart = chartResult.chart || {};
  const dayElement = chart.dayMaster?.element;
  const monthBranchId = chart.monthCommand?.id;
  const season = Object.values(SEASON_STRENGTH).find(s => s.branches.includes(monthBranchId));
  const balance = Object.fromEntries((chart.elementBalance || []).map(x => [x.element, x.value]));
  const support = (balance[dayElement] || 0) + (balance[resourceOf(dayElement)] || 0) * 0.75;
  const drain = (balance[ELEMENTS[dayElement]?.generates] || 0) + (balance[ELEMENTS[dayElement]?.controls] || 0) * 0.7;
  const monthCommand = season?.dominant === dayElement ? 'support' : season?.dominant === ELEMENTS[dayElement]?.controls ? 'controlled-by-season' : 'neutral';
  const level = support - drain >= 1.2 ? 'strong' : support - drain <= -1.2 ? 'weak' : 'balanced';
  return {
    schoolId: schoolConfig.schoolId || chart.schoolId,
    method: schoolConfig.strengthMethod || 'integrated',
    dimensions: {
      monthCommand,
      season: season?.dominant || 'unknown',
      roots: rootCount(chart, dayElement),
      throughRoot: rootCount(chart, dayElement) > 0,
      stemSupport: support,
      drain,
      climate: climateForSeason(season?.dominant)
    },
    candidates: {
      extremeStrong: level === 'strong' && support > 5,
      extremeWeak: level === 'weak' && support < 1.2,
      follow: level === 'weak' && drain > 4,
      transform: false
    },
    result: level,
    confidence: chartResult.confidence,
    evidence: ['bazi-strength-month-command-001']
  };
}

function resourceOf(element) {
  return Object.entries(ELEMENTS).find(([, v]) => v.generates === element)?.[0];
}

function rootCount(chart, element) {
  return Object.values(chart.pillars || {}).filter(Boolean).reduce((n, p) => n + p.branch.hiddenStems.filter(h => h.element === element).length, 0);
}

function climateForSeason(dominant) {
  if (dominant === 'water') return { cold: true, hot: false, dry: false, wet: true };
  if (dominant === 'fire') return { cold: false, hot: true, dry: true, wet: false };
  return { cold: false, hot: false, dry: dominant === 'metal', wet: dominant === 'wood' };
}
