import { BRANCHES, STEMS } from '../data.js';

export function calculateLuckCycles(chartResult, schoolConfig = {}) {
  const monthStemOrder = chartResult.chart?.pillars?.month?.stem?.order || 1;
  const monthBranchOrder = chartResult.chart?.pillars?.month?.branch?.order || 1;
  const gender = chartResult.normalizedInput?.gender || chartResult.input?.gender || '';
  const dayYang = chartResult.chart?.dayMaster?.yinYang === 'yang';
  const forward = !gender ? true : (gender === 'male' || gender === '\u7537\u6027') === dayYang;
  const startAge = chartResult.normalizedInput?.timeUnknown ? 8 : 6;
  const cycles = Array.from({ length: 8 }, (_, i) => {
    const delta = forward ? i + 1 : -(i + 1);
    const stem = STEMS[((monthStemOrder - 1 + delta) % 10 + 10) % 10];
    const branch = BRANCHES[((monthBranchOrder - 1 + delta) % 12 + 12) % 12];
    return {
      index: i + 1,
      startAge: startAge + i * 10,
      endAge: startAge + i * 10 + 9,
      stem,
      branch,
      label: stem.kanji + branch.kanji,
      relationToChart: [],
      evidence: ['luck-cycle-phase1']
    };
  });
  return {
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    direction: forward ? 'forward' : 'reverse',
    startAge,
    startDate: null,
    cycles,
    annual: [],
    monthly: [],
    warnings: chartResult.warnings?.filter(w => w.includes('time')) || []
  };
}
