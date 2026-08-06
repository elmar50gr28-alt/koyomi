const CATEGORY_ORDER = ['overall', 'work', 'love', 'relationship', 'money', 'health', 'learning', 'family', 'creativity', 'timing'];

export function composeCommonReading(selected, options = {}) {
  const tone = options.tone === 'mitsunome' ? 'mitsunome' : 'standard';
  const items = (selected || []).map(entry => ({
    themeId: entry.theme.theme_id,
    themeName: entry.theme.theme_name,
    score: entry.score,
    text: tone === 'mitsunome' ? entry.theme.mitsunome_text : entry.theme.standard_text,
    todayAction: entry.theme.today_action,
    avoidAction: entry.theme.avoid_action,
    categories: entry.theme.categories,
    evidence: entry.evidence
  }));
  const categories = {};
  for (const category of CATEGORY_ORDER) {
    const match = items.find(item => item.categories.includes(category));
    if (match) categories[category] = match.text;
  }
  return {
    schemaId: 'koyomi-common-reading',
    version: '1.0.0',
    tone,
    available: items.length > 0,
    summary: items[0]?.text || '',
    todayAction: items[0]?.todayAction || '',
    avoidAction: items[0]?.avoidAction || '',
    categories,
    items,
    sourcePolicy: { existingCalculationResultsOnly: true, offlineDataOnly: true }
  };
}
