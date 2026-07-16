import { BRANCHES, STEMS } from '../data.js';

export function calculateLuckCycles(chartResult, profileOrSchoolConfig = {}, maybeSchoolConfig = {}) {
  const profile = profileOrSchoolConfig?.birthData || profileOrSchoolConfig?.gender ? profileOrSchoolConfig : chartResult.input || {};
  const schoolConfig = profileOrSchoolConfig?.birthData || profileOrSchoolConfig?.gender ? maybeSchoolConfig : profileOrSchoolConfig;
  const monthStemOrder = chartResult.chart?.pillars?.month?.stem?.order || 1;
  const monthBranchOrder = chartResult.chart?.pillars?.month?.branch?.order || 1;
  const gender = chartResult.normalizedInput?.gender || profile.gender || chartResult.input?.gender || '';
  const yearYang = chartResult.chart?.pillars?.year?.stem?.yinYang === 'yang';
  const directionInfo = decideDirection(gender, yearYang, schoolConfig);
  const startAge = estimateStartAge(chartResult);
  const startDate = estimateStartDate(chartResult, startAge);
  const cycles = Array.from({ length: 8 }, (_, i) => {
    const delta = directionInfo.direction === 'forward' ? i + 1 : -(i + 1);
    const stem = STEMS[((monthStemOrder - 1 + delta) % 10 + 10) % 10];
    const branch = BRANCHES[((monthBranchOrder - 1 + delta) % 12 + 12) % 12];
    return {
      index: i + 1,
      startAge: startAge + i * 10,
      endAge: startAge + i * 10 + 9,
      startDate: null,
      endDate: null,
      stem,
      branch,
      label: stem.kanji + branch.kanji,
      relationToChart: [],
      yongshenMethodEffects: [],
      patternEffects: [],
      confidence: directionInfo.confidence,
      evidence: ['luck-cycle-phase2']
    };
  });
  return {
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    direction: directionInfo.direction,
    directionRule: directionInfo.ruleId,
    startAge,
    startDate,
    cycles,
    annual: [],
    monthly: [],
    schoolResults: [{ schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId, direction: directionInfo.direction, startAge }],
    confidence: chartResult.normalizedInput?.timeUnknown ? 0.42 : directionInfo.confidence,
    warnings: [
      ...(chartResult.warnings?.filter(w => w.includes('time')) || []),
      'phase2-luck-start-date-approximation'
    ]
  };
}

function decideDirection(gender, yearYang, schoolConfig = {}) {
  if (!gender) return { direction: schoolConfig.defaultLuckDirection || 'forward', ruleId: 'luck-direction-unknown-gender-school-default', confidence: 0.35 };
  const male = gender === 'male' || gender === '\u7537\u6027';
  const forward = (yearYang && male) || (!yearYang && !male);
  return {
    direction: forward ? 'forward' : 'reverse',
    ruleId: forward ? 'luck-direction-yang-male-yin-female-forward' : 'luck-direction-yang-female-yin-male-reverse',
    confidence: 0.62
  };
}

function estimateStartAge(chartResult) {
  if (chartResult.normalizedInput?.timeUnknown) return 8;
  return 6;
}

function estimateStartDate(chartResult, startAge) {
  const date = chartResult.normalizedInput?.date;
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + startAge);
  return d.toISOString().slice(0, 10);
}
