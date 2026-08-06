import { interpretReadingQuestion } from './question-interpreter.js';

const CATEGORY_LABELS = {
  overall: '全体', work: '仕事', love: '恋愛', relationship: '対人関係', money: 'お金', health: '健康'
};

const ACTION_WINDOWS = {
  overall: ['今日中', '3日以内'],
  work: ['今日の作業開始前', '3営業日以内'],
  love: ['今日から24時間以内', '3日後'],
  relationship: ['次に連絡する前', '1週間以内'],
  money: ['今日中', '次の支払い前'],
  health: ['今から', '今夜']
};

const SECOND_ACTIONS = {
  overall: '実行したことと相手や周囲の反応を一行で記録する。',
  work: '担当・期限・完了条件の三つを確認し、曖昧な点を一つ質問する。',
  love: '返事を急かさず、言葉と行動が一致しているかを確認する。',
  relationship: '事実と想像を分け、必要なら希望を一文で伝える。',
  money: '金額・期限・継続費用を数字で並べ、予算内かを確認する。',
  health: '休息後の変化を記録し、強い症状や長引く不調は専門家へ相談する。'
};

const REVIEW_POINTS = {
  overall: '予定が一つ完了したか、迷いが減ったか',
  work: '作業が前進したか、やり直しが減ったか',
  love: '会話が一方通行ではなく、相手の行動も返ってきたか',
  relationship: '無理な我慢が減り、約束や距離感が明確になったか',
  money: '支出総額と残せる金額が数字で見えるようになったか',
  health: '休息で負担が軽くなったか、日常生活へ影響が続いていないか'
};

function selectItem(reading, category) {
  return reading.items.find(item => item.categories.includes(category)) || reading.items[0] || null;
}

function directAnswer(context, item, reading, sister) {
  const topic = context.category === 'overall' ? '今の流れ' : CATEGORY_LABELS[context.category];
  const theme = item?.themeName || '足場を整えること';
  const action = item?.todayAction || reading.todayAction;
  if (!context.hasQuestion) {
    return sister
      ? `結論から言うわね。今は「${theme}」が中心よ。${action}`
      : `現在の中心テーマは「${theme}」です。${action}`;
  }
  if (context.intent === 'timing') {
    return sister
      ? `時期だけ先に言うわね。${topic}は、待ち続けるより今日から小さく確かめる時よ。まず${action}`
      : `${topic}は、今日から小さく確認を始める時期です。まず${action}`;
  }
  if (context.intent === 'decision') {
    return sister
      ? `結論は「条件を一つ確かめてから進む」よ。勢いだけで決めず、まず${action}`
      : `条件を一つ確認してから進む判断が適しています。まず${action}`;
  }
  if (context.intent === 'outlook') {
    return sister
      ? `可能性はあるわ。ただし自動的にうまくいく流れじゃないの。「${theme}」を実行できるかで結果が分かれるわ。`
      : `可能性はありますが、結果は「${theme}」を実行できるかに左右されます。`;
  }
  if (context.intent === 'reason') {
    return sister
      ? `理由は単純よ。今は「${theme}」の信号が重なっていて、急ぐより整えた方が結果につながるから。`
      : `現在は「${theme}」の傾向が重なり、急ぐより整える方が結果につながりやすいためです。`;
  }
  return sister
    ? `${topic}については、まず「${theme}」を形にするのが答えよ。${action}`
    : `${topic}では、まず「${theme}」を実行することが具体的な答えです。${action}`;
}

export function composeConcreteAnswer(reading, options = {}) {
  const context = interpretReadingQuestion(options.question);
  if (!reading.available) return { ...context, available: false, directAnswer: '', reason: '', actionPlan: [], stop: '', review: '', disclaimer: '' };
  const sister = options.tone === 'mitsunome';
  const item = selectItem(reading, context.category);
  const windows = ACTION_WINDOWS[context.category] || ACTION_WINDOWS.overall;
  const evidence = (item?.evidence || []).map(value => value.value).filter(Boolean);
  const uniqueEvidence = [...new Set(evidence)].slice(0, 2);
  const reason = uniqueEvidence.length
    ? `${uniqueEvidence.join('と')}の傾向が重なり、「${item.themeName}」を優先しています。`
    : `選ばれたテーマの強度と確度から、「${item?.themeName || '足場を整えること'}」を優先しています。`;
  const firstAction = item?.todayAction || reading.todayAction;
  return {
    ...context,
    available: true,
    categoryLabel: CATEGORY_LABELS[context.category],
    themeId: item?.themeId || '',
    themeName: item?.themeName || '',
    directAnswer: directAnswer(context, item, reading, sister),
    reason,
    actionPlan: [
      { when: windows[0], action: firstAction },
      { when: windows[1], action: SECOND_ACTIONS[context.category] || SECOND_ACTIONS.overall }
    ],
    stop: item?.avoidAction || reading.avoidAction,
    review: `${windows[1]}に「${REVIEW_POINTS[context.category] || REVIEW_POINTS.overall}」を確認する。`,
    disclaimer: context.sensitive ? '健康については診断や治療の代わりではありません。強い症状、急な悪化、長引く不調は医療機関へ相談してください。' : ''
  };
}
