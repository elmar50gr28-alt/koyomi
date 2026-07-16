export function buildInterpretationFacts(chartResult, strengthResult, patternResult, yongshenResult, luckResult) {
  return {
    dayMaster: chartResult.chart?.dayMaster,
    pillars: chartResult.chart?.pillars,
    elementBalance: chartResult.chart?.elementBalance,
    strength: strengthResult?.result,
    patternCandidates: patternResult?.candidates || [],
    yongshen: yongshenResult,
    luckCycles: luckResult?.cycles || [],
    evidence: [
      ...(chartResult.evidence || []),
      ...(strengthResult?.evidence || []),
      ...(patternResult?.evidence || []),
      ...(yongshenResult?.evidence || [])
    ]
  };
}
