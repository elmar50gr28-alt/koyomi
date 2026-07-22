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

export function describeMonthlyIndex(support, pressure, change) {
  const supportLevel = support < 25 ? '小さい' : support < 50 ? 'やや目立つ' : support < 75 ? '強い' : '非常に強い';
  const pressureLevel = pressure < 25 ? '小さい' : pressure < 50 ? 'やや目立つ' : pressure < 75 ? '強い' : '非常に強い';
  const changeLabel = change === null ? '年間比較の起点' : change < 35 ? '前月の流れを引き継ぐ' : change < 65 ? '前月から変化あり' : '流れの切り替わりが大きい';
  let stance = '様子を見る', summary = '追い風と圧力の差が小さいため、条件を確認しながら小さく進める月です。';
  if (support >= 60 && pressure >= 60) { stance = '動く前に条件確認'; summary = '動きは大きい一方で衝突も増えやすいため、進める条件と止める条件を先に決める月です。'; }
  else if (support - pressure >= 20) { stance = '準備済みなら進める'; summary = '圧力より追い風が目立ちます。準備済みの計画を一段進める候補月です。'; }
  else if (pressure - support >= 20) { stance = '確認と調整を優先'; summary = '追い風より圧力が目立ちます。新規拡大より、費用・安全・責任の確認を優先する月です。'; }
  else if (support < 25 && pressure < 25) { stance = '急がず土台を整える'; summary = '強い追い風も圧力も少ないため、準備・整理・情報収集に使いやすい月です。'; }
  return { stance, summary, supportLevel, pressureLevel, changeLabel };
}

export function buildMonthlyTrend(charts, readings) {
  if (!Array.isArray(charts) || !Array.isArray(readings) || charts.length !== readings.length || !charts.length) throw new TypeError('matching monthly charts and readings are required');
  return charts.map((chart, index) => {
    const reading = readings[index];
    const supportIndex = aspectIndex(reading.supports || []), pressureIndex = aspectIndex(reading.pressures || []), monthlyChange = changeIndex(chart, charts[index - 1]);
    return {
      month: Number(chart.month || index + 1), nameJa: chart.nameJa,
      supportIndex, pressureIndex, changeIndex: monthlyChange,
      plainReading: describeMonthlyIndex(supportIndex, pressureIndex, monthlyChange),
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

export function summarizeMonthlyTrend(trend) {
  if (!Array.isArray(trend) || !trend.length) throw new TypeError('monthly trend is required');
  const forward = [...trend].sort((left, right) => (right.supportIndex - right.pressureIndex) - (left.supportIndex - left.pressureIndex))[0];
  const caution = [...trend].sort((left, right) => (right.pressureIndex - right.supportIndex) - (left.pressureIndex - left.supportIndex))[0];
  const change = [...trend].filter(item => item.changeIndex !== null).sort((left, right) => right.changeIndex - left.changeIndex)[0];
  return {
    headline: `${forward.month}月は準備済みの計画を進める候補、${caution.month}月は確認と調整を優先する候補です。`,
    forward: { month: forward.month, reason: `追い風${forward.supportIndex}、圧力${forward.pressureIndex}` },
    caution: { month: caution.month, reason: `圧力${caution.pressureIndex}、追い風${caution.supportIndex}` },
    turningPoint: change ? { month: change.month, reason: `前月からの変動${change.changeIndex}` } : null,
    note: '候補月は行動の保証ではありません。各月の「確認」と「備え」を現実の判断に使ってください。'
  };
}
