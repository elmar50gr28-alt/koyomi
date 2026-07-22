const ORB_LIMIT = Object.freeze({ sextile: 4, trine: 5, square: 5, opposition: 6 });

function aspectIndex(items) {
  const total = items.reduce((sum, item) => {
    const limit = ORB_LIMIT[item.aspect] || ORB_LIMIT[item.type] || 6;
    return sum + Math.max(0, 1 - Number(item.orb) / limit) * 100;
  }, 0);
  return Math.min(100, Math.round(total / 3));
}

function signature(item) {
  return `${[...item.bodies].sort().join('-')}:${item.type || item.aspect}`;
}

function changeIndex(currentChart, previousChart) {
  if (!previousChart) return null;
  const bodies = Object.keys(currentChart.placements || {}).filter(body => previousChart.placements?.[body]);
  const moved = bodies.filter(body => currentChart.placements[body].house !== previousChart.placements[body].house).length;
  const houseChange = bodies.length ? moved / bodies.length : 0;
  const current = new Set((currentChart.aspects || []).map(signature));
  const previous = new Set((previousChart.aspects || []).map(signature));
  const union = new Set([...current, ...previous]);
  const changed = [...union].filter(value => current.has(value) !== previous.has(value)).length;
  const aspectChange = union.size ? changed / union.size : 0;
  return Math.round(Math.min(1, houseChange * 0.6 + aspectChange * 0.4) * 100);
}

export function buildMonthlyTrend(charts, readings) {
  if (!Array.isArray(charts) || !Array.isArray(readings) || charts.length !== readings.length || !charts.length) throw new TypeError('matching monthly charts and readings are required');
  return charts.map((chart, index) => {
    const reading = readings[index];
    return {
      month: Number(chart.month || index + 1), nameJa: chart.nameJa,
      supportIndex: aspectIndex(reading.supports || []),
      pressureIndex: aspectIndex(reading.pressures || []),
      changeIndex: changeIndex(chart, charts[index - 1]),
      dominantTopic: reading.focusAreas?.[0]?.topic || '複数分野',
      narrative: reading.narrative,
      observationPoints: reading.observationPoints || [],
      recommendedActions: reading.recommendedActions || [],
      basis: {
        supportiveAspects: (reading.supports || []).length,
        pressureAspects: (reading.pressures || []).length,
        formula: '角度の許容範囲への近さを各100として合計し、3件相当で100に換算。変動は前月からハウスが変わった天体60%と主要角の入れ替わり40%。'
      }
    };
  });
}
