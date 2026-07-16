export function evaluatePatterns(chartResult, schoolConfig = {}) {
  const monthTenGod = chartResult.chart?.pillars?.month?.stem?.tenGod;
  const candidates = [];
  if (monthTenGod) {
    candidates.push({
      patternId: `month-${monthTenGod.id}`,
      name: `${monthTenGod.kanji}\u683c\u5019\u88dc`,
      candidate: true,
      established: false,
      broken: false,
      rescued: false,
      conditionsMet: ['month-stem-ten-god-present'],
      conditionsFailed: ['phase1-requires-human-review'],
      conflicts: [],
      schoolIds: [schoolConfig.schoolId || chartResult.chart?.schoolId],
      sourceIds: ['src-yuanhai-ziping-biblio'],
      confidence: 0.48
    });
  }
  return { candidates, finalPattern: null, evidence: ['pattern-candidate-phase1'] };
}
