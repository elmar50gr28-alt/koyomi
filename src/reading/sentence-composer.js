export function composeCommonReading(selected, options = {}) {
  const tone = options.tone === 'mitsunome' ? 'mitsunome' : 'standard';
  const items = (selected || []).map(entry => ({
    themeId: entry.theme.theme_id,
    themeName: entry.theme.theme_name,
    score: entry.score,
    text: tone === 'mitsunome' ? entry.theme.mitsunome_text : entry.theme.standard_text,
    workText: entry.theme.work_expression,
    loveText: entry.theme.love_expression,
    relationshipText: entry.theme.relationship_expression,
    healthText: entry.theme.health_caution,
    todayAction: entry.theme.today_action,
    avoidAction: entry.theme.avoid_action,
    categories: entry.theme.categories,
    evidence: entry.evidence
  }));
  const forCategory = category => items.find(item => item.categories.includes(category)) || items[0];
  const work = forCategory('work');
  const love = forCategory('love');
  const relationship = forCategory('relationship');
  const health = forCategory('health');
  const categories = items.length ? {
    overall: items[0].text,
    work: work.workText || work.text,
    love: love.loveText || love.text,
    relationship: relationship.relationshipText || relationship.text,
    health: health.healthText || health.text
  } : {};
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
