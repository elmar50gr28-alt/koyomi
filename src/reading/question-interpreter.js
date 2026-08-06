const CATEGORY_RULES = [
  ['love', /恋愛|好きな人|片思い|復縁|結婚|離婚|夫|妻|彼|パートナー|交際/],
  ['work', /仕事|職場|転職|就職|退職|上司|部下|同僚|事業|商売|案件|昇進|働/],
  ['money', /お金|金運|収入|支出|貯金|投資|家計|借金|ローン|購入|買い物/],
  ['health', /健康|体調|病気|症状|疲れ|睡眠|眠れ|痛み|通院|治療/],
  ['relationship', /人間関係|友人|家族|親|子ども|相手|連絡|仲直り|距離|付き合い/]
];

const INTENT_RULES = [
  ['timing', /いつ|時期|何日|何月|今週|今月|今年|タイミング/],
  ['decision', /すべき|した方が|していい|やめるべき|どちら|選ぶ|決め|迷って/],
  ['outlook', /どうなる|見込み|可能性|うまくいく|成功|結果|将来/],
  ['reason', /なぜ|どうして|理由|原因/]
];

export function normalizeReadingQuestion(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
}

export function interpretReadingQuestion(value) {
  const question = normalizeReadingQuestion(value);
  const category = CATEGORY_RULES.find(([, pattern]) => pattern.test(question))?.[0] || 'overall';
  const intent = INTENT_RULES.find(([, pattern]) => pattern.test(question))?.[0] || 'action';
  return {
    question,
    category,
    intent,
    hasQuestion: question.length > 0,
    sensitive: category === 'health'
  };
}
