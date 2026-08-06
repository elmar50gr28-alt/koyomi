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

const HOUSE_GUIDANCE = Object.freeze({
  1: Object.freeze({ watch: '世論調査、生活実感、消費者心理の変化', action: '数字と街の声を併記し、一部の大きな声だけで全体を判断しない' }),
  2: Object.freeze({ watch: '物価、賃金、予算、税負担、通貨の動き', action: '家計や事業への影響額を試算し、支出の優先順位を決める' }),
  3: Object.freeze({ watch: '交通障害、通信障害、報道内容、学校制度の変更', action: '発表元と更新日時を確認し、連絡経路を二つ用意する' }),
  4: Object.freeze({ watch: '住宅、土地、農業、防災、地域基盤の課題', action: '設備・備蓄・避難経路を点検し、先送りした修繕を洗い出す' }),
  5: Object.freeze({ watch: '教育、出生・子育て、文化事業、娯楽市場、投機熱', action: '話題性と継続可能性を分け、費用と利用者数を確認する' }),
  6: Object.freeze({ watch: '雇用条件、人手不足、医療、公衆衛生、行政の現場負担', action: '現場の人員・待ち時間・欠勤率を確認し、工程と担当を減らす' }),
  7: Object.freeze({ watch: '外交交渉、条約、訴訟、競争相手との関係', action: '合意事項を文書にし、譲れる条件と譲れない条件を分ける' }),
  8: Object.freeze({ watch: '税、国債、保険、金融機関、共同資産、危機対応', action: '返済・補償・責任の範囲を確認し、最悪時の資金繰りを用意する' }),
  9: Object.freeze({ watch: '裁判、法改正、大学、宗教、海外との往来', action: '国内外の規則差を確認し、専門家の一次情報に当たる' }),
  10: Object.freeze({ watch: '政府方針、首脳人事、行政目標、企業トップの決定', action: '発言より予算・期限・責任者を確認し、実行可能性を見極める' }),
  11: Object.freeze({ watch: '議会、同盟、業界団体、市民運動、共同目標', action: '参加者の目的と負担を揃え、誰が何を実行するか決める' }),
  12: Object.freeze({ watch: '表に出にくい制度不備、隔離施設、秘密、長期化した問題', action: '匿名の相談窓口や内部記録も確認し、見えない負担を数える' })
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

function concreteSupport(item) {
  const [left, right] = item.bodies.map(topicOf);
  return `${left}と${right}を結ぶ計画は進めやすい傾向です。担当者・期限・予算を決めると、追い風を実行へ移せます。`;
}

function concretePressure(item) {
  const [left, right] = item.bodies.map(topicOf);
  return `${left}と${right}の要求がぶつかりやすい傾向です。発表や実施の前に、費用・安全・責任分担を確認してください。`;
}

function buildNarrative(conclusion, focusAreas, supports, pressures) {
  const primary = focusAreas[0];
  if (!primary) return `${conclusion}目立つ分野を一つに決めつけず、複数の公的資料を比べてください。`;
  const guide = HOUSE_GUIDANCE[primary.house];
  const focusText = `特に「${primary.topic}」が表に出やすく、${guide?.watch || '関連する公式発表と現場の変化'}が確認点です。`;
  const direction = pressures[0] ? concretePressure(pressures[0]) : supports[0] ? concreteSupport(supports[0]) : `${guide?.action || '数字と事実を確認してから判断する'}ことが現実的な対応です。`;
  return `${conclusion}${focusText}${direction}`;
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
  const conclusion = conclusionFor(supports, pressures);
  const observationPoints = focusAreas.slice(0, 2).map(item => ({ house: item.house, topic: item.topic, text: HOUSE_GUIDANCE[item.house]?.watch || `${item.topic}に関する公式発表と現場の変化` }));
  const recommendedActions = focusAreas.slice(0, 2).map(item => ({ house: item.house, topic: item.topic, text: HOUSE_GUIDANCE[item.house]?.action || '複数の資料を比較してから判断する' }));
  return {
    schemaId: 'koyomi-mundane-seasonal-reading-v1', chartType: chart.chartType, nameJa: chart.nameJa,
    conclusion, narrative: buildNarrative(conclusion, focusAreas, supports, pressures),
    focusAreas, observationPoints, recommendedActions, supports, pressures, intensifications, reviews,
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
  const conclusion = pressureCount > supportCount + 2 ? '年間を通じて、急いで広げるより調整と備えを優先したい流れです。' : supportCount > pressureCount + 2 ? '年間を通じて、協力関係と既存計画を具体化しやすい流れです。' : '年間を通じて、前進と調整を分野ごとに使い分ける流れです。';
  const observationPoints = focusAreas.map(item => ({ house: item.house, topic: item.topic, text: HOUSE_GUIDANCE[item.house]?.watch || `${item.topic}に関する公式発表と現場の変化` }));
  return {
    schemaId: 'koyomi-mundane-seasonal-summary-v1',
    conclusion,
    narrative: `${conclusion}${focusAreas[0] ? `最も繰り返し現れるのは「${focusAreas[0].topic}」です。年間判断では、${HOUSE_GUIDANCE[focusAreas[0].house]?.watch || '関連する公的資料'}を継続して比べてください。` : ''}`,
    focusAreas, observationPoints, supportCount, pressureCount,
    uncertainties: [...new Set(readings.flatMap(item => item.uncertainties || []))],
    disclaimer: '社会全体の傾向を読む材料です。具体的な出来事を断定するものではありません。'
  };
}
