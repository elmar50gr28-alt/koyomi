const TEN_GOD_THEME_IDS = Object.freeze({
  '偏印': ['ACTION_CAREFUL_DECISION', 'MIND_STRONG_INTUITION'],
  '傷官': ['MIND_OVERTHINKING'],
  '正財': ['WORK_STEADY_PROGRESS', 'MONEY_LONG_TERM_STABILITY'],
  '比肩': ['WORK_LEADERSHIP'],
  '劫財': ['RELATIONSHIP_SET_BOUNDARIES'],
  '食神': ['LOVE_OPEN_COMMUNICATION']
});

const TWELVE_STAGE_THEME_IDS = Object.freeze({
  '長生': ['ACTION_START_SMALL'],
  '病': ['HEALTH_REST_AND_RECOVERY'],
  '墓': ['CHANGE_RELEASE_OLD_PATTERN']
});

const values = object => object && typeof object === 'object' ? Object.values(object) : [];
const textValue = value => typeof value === 'string'
  ? value
  : value?.kanji || value?.name || value?.label || value?.id || value?.tenGod || value?.stage || '';

function collectExistingBaziFactors(result) {
  const pillars = result?.chart?.pillars || result?.pillars || result?.integratedReadingData?.analysis?.pillars || {};
  const factors = [];
  for (const [role, pillar] of Object.entries(pillars)) {
    const tenGodCandidates = [pillar?.stem?.tenGod, pillar?.tenGod, ...values(pillar?.hiddenStems).map(item => item?.tenGod)];
    for (const candidate of tenGodCandidates) {
      const label = textValue(candidate);
      if (TEN_GOD_THEME_IDS[label]) factors.push({ kind: 'ten-god', label, role, themeIds: TEN_GOD_THEME_IDS[label] });
    }
    const stage = textValue(pillar?.branch?.twelveStage || pillar?.twelveStage);
    if (TWELVE_STAGE_THEME_IDS[stage]) factors.push({ kind: 'twelve-stage', label: stage, role, themeIds: TWELVE_STAGE_THEME_IDS[stage] });
  }
  return factors;
}

export function selectCommonReadingThemes(result, themes, options = {}) {
  const index = new Map((themes || []).map(theme => [theme.theme_id, theme]));
  const selected = new Map();
  for (const factor of collectExistingBaziFactors(result)) {
    for (const themeId of factor.themeIds) {
      const theme = index.get(themeId);
      if (!theme) continue;
      const score = Number((theme.intensity * theme.confidence).toFixed(4));
      const prior = selected.get(themeId);
      const evidence = { system: 'bazi', type: factor.kind, value: factor.label, pillar: factor.role };
      if (prior) {
        prior.evidence.push(evidence);
        prior.score = Number(Math.min(1, prior.score + 0.06).toFixed(4));
      } else {
        selected.set(themeId, { theme, score, evidence: [evidence] });
      }
    }
  }
  const limit = Math.max(1, Number(options.maxThemes) || 4);
  return [...selected.values()].sort((a, b) => b.score - a.score || a.theme.theme_id.localeCompare(b.theme.theme_id)).slice(0, limit);
}
