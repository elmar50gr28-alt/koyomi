const HOUSE_TOPICS = Object.freeze({
  1: '国民生活と社会の空気', 2: '財政・物価・国の資源', 3: '報道・交通・教育・通信',
  4: '国土・住宅・農業', 5: '子ども・文化・娯楽・投機', 6: '労働・公衆衛生・行政実務',
  7: '外交・条約・対立相手', 8: '税・共同資産・危機管理', 9: '司法・高等教育・海外',
  10: '政府・指導層・国家目標', 11: '議会・同盟・社会運動', 12: '制度の死角・隔離・慢性的負担'
});

const PLANET_TOPICS = Object.freeze({
  Sun: '政府・指導層', Moon: '国民生活・世論', Mercury: '報道・交通・商取引',
  Venus: '外交・文化・通貨価値', Mars: '事故・対立・実行力', Jupiter: '法律・国際関係・拡大',
  Saturn: '制度・制約・長期負担', Uranus: '技術革新・急変', Neptune: '理想・混乱・情報の曖昧さ',
  Pluto: '権力再編・大規模な転換'
});

const ASPECT_LABELS = Object.freeze({ conjunction: '合', sextile: '60度', square: '90度', trine: '120度', opposition: '180度' });
const SUPPORTIVE = new Set(['sextile', 'trine']);
const PRESSURING = new Set(['square', 'opposition']);
const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);

const topicOf = body => PLANET_TOPICS[body] || body;
const aspectText = aspect => `${aspect.bodies.map(topicOf).join('と')}の${ASPECT_LABELS[aspect.type] || aspect.type}（ずれ${Number(aspect.orb).toFixed(1)}度）`;

function conclusionFor(supports, pressures) {
  if (pressures.length > supports.length + 1) return '調整と危機管理を優先したい季節です。';
  if (supports.length > pressures.length + 1) return '準備してきた政策や協力を前へ進めやすい季節です。';
  return '前進できる分野と慎重な調整が必要な分野が混在する季節です。';
}

export function interpretSeasonalIngressChart(chart) {
  if (!chart || chart.schemaId !== 'koyomi-mundane-seasonal-ingress-v1') throw new TypeError('a seasonal ingress chart is required');
  const focus = new Map();
  for (const [body, placement] of Object.entries(chart.placements || {})) {
    const house = Number(placement.house);
    const current = focus.get(house) || { house, topic: HOUSE_TOPICS[house] || `${house}室`, priority: 0, bodies: [] };
    current.priority += 1 + (ANGULAR_HOUSES.has(house) ? 2 : 0) + (['Sun', 'Moon'].includes(body) ? 1 : 0);
    current.bodies.push(body);
    focus.set(house, current);
  }
  const focusAreas = [...focus.values()].sort((left, right) => right.priority - left.priority || left.house - right.house).slice(0, 3);
  const supports = [];
  const pressures = [];
  const intensifications = [];
  for (const aspect of chart.aspects || []) {
    const item = { bodies: [...aspect.bodies], aspect: aspect.type, orb: Number(aspect.orb), text: aspectText(aspect) };
    if (SUPPORTIVE.has(aspect.type)) supports.push(item);
    else if (PRESSURING.has(aspect.type)) pressures.push(item);
    else intensifications.push(item);
  }
  const reviews = Object.entries(chart.retrogrades || {}).filter(([, retrograde]) => retrograde).map(([body]) => ({ body, topic: topicOf(body), text: `${topicOf(body)}は見直しや再検討を挟みやすい状態です。` }));
  return {
    schemaId: 'koyomi-mundane-seasonal-reading-v1', chartType: chart.chartType, nameJa: chart.nameJa,
    conclusion: conclusionFor(supports, pressures), focusAreas, supports, pressures, intensifications, reviews,
    evidence: [
      ...focusAreas.map(item => ({ type: 'house', house: item.house, bodies: item.bodies, text: `${item.house}室の${item.topic}に天体が集まり、優先テーマになります。` })),
      ...supports.slice(0, 3).map(item => ({ type: 'support', ...item })),
      ...pressures.slice(0, 3).map(item => ({ type: 'pressure', ...item }))
    ],
    uncertainties: [...(chart.warnings || [])],
    suppressedClaims: ['具体的な事件・災害・市場価格・選挙結果は、この四季図だけでは断定しません。']
  };
}

export function synthesizeSeasonalIngressReadings(readings) {
  if (!Array.isArray(readings) || readings.length === 0) throw new TypeError('seasonal readings are required');
  const topics = new Map();
  for (const reading of readings) for (const area of reading.focusAreas || []) {
    const current = topics.get(area.house) || { house: area.house, topic: area.topic, appearances: 0, priority: 0 };
    current.appearances += 1;
    current.priority += area.priority;
    topics.set(area.house, current);
  }
  const focusAreas = [...topics.values()].sort((left, right) => right.appearances - left.appearances || right.priority - left.priority || left.house - right.house).slice(0, 3);
  const supportCount = readings.reduce((sum, item) => sum + item.supports.length, 0);
  const pressureCount = readings.reduce((sum, item) => sum + item.pressures.length, 0);
  return {
    schemaId: 'koyomi-mundane-seasonal-summary-v1',
    conclusion: pressureCount > supportCount + 2 ? '年間を通じて、急いで広げるより調整と備えを優先したい流れです。' : supportCount > pressureCount + 2 ? '年間を通じて、協力関係と既存計画を具体化しやすい流れです。' : '年間を通じて、前進と調整を分野ごとに使い分ける流れです。',
    focusAreas, supportCount, pressureCount,
    uncertainties: [...new Set(readings.flatMap(item => item.uncertainties || []))],
    disclaimer: '社会全体の傾向を読む材料です。具体的な出来事を断定するものではありません。'
  };
}
