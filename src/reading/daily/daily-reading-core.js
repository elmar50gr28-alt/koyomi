(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KOYOMI_DAILY_READING_CORE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VERSION = '1.0.0';
  const FOCI = Object.freeze([
    ['complete', '完了', '途中の一件を終わらせる', '新しい予定を増やす'],
    ['organize', '整理', '机やデータを15分だけ整える', '整理だけで一日を終える'],
    ['contact', '連絡', '止めていた重要な連絡を一件送る', '返事を急かす'],
    ['negotiate', '交渉', '期限・費用・責任範囲の一つを確認する', '口約束だけで進める'],
    ['rest', '休息', '予定を一件減らし、回復の時間を30分確保する', '疲れた状態で重要事項を決める'],
    ['learn', '学習', '今必要な知識を25分だけ学ぶ', '資料を集めるだけで終わる'],
    ['create', '創作', '未完成でも見せられる試作を一つ作る', '完璧になるまで公開しない'],
    ['money', '金銭管理', '定期支出または保留中の購入を一件確認する', '今日の気分だけで大きな支出を決める'],
    ['boundary', '境界線', '引き受けないことを一つ言葉にする', '察してもらうことを待つ'],
    ['relationship', '関係調整', '事実・希望・お願いを一つずつ伝える', '相手の内心を推測で決めつける'],
    ['family', '家族', '家の負担を一項目だけ見直す', '一人で全員分を背負う'],
    ['health', '健康管理', '不調や疲労の発生時刻を記録する', '占いを診断や治療の代わりにする'],
    ['move', '移動', '移動時間と代替経路を出発前に確認する', '方位だけで安全を判断する'],
    ['prepare', '準備', '次の行動に必要な道具や資料を一つ揃える', '準備のまま期限を決めない'],
    ['release', '手放し', '今の目的に合わない予定を一件やめる', '不安だけで必要な約束まで捨てる'],
    ['review', '振り返り', '終わったことと残ったことを一行ずつ書く', '反省を自己批判に変える'],
    ['decide', '判断', '選択肢を費用・期限・撤退条件で比べる', '占いの点数だけで不可逆な決定をする'],
    ['focus', '集中', '通知を止め90分だけ一つの作業に集中する', '複数の重要作業を同時に進める'],
    ['cooperate', '協力', '一人で抱えている作業を一件依頼する', '依頼内容と期限を曖昧にする'],
    ['observe', '観察', '予想ではなく、数字や相手の行動を一つ確認する', '悪い結果を先回りして決めつける']
  ].map(([id, label, action, caution], index) => ({ id, label, action, caution, index })));

  function hash(value) { let h = 2166136261; for (const char of String(value || '')) h = Math.imul(h ^ char.charCodeAt(0), 16777619); return h >>> 0; }
  function clamp(value) { return Math.max(0, Math.min(100, Math.round(Number(value) || 50))); }
  function daysSince(current, past) { return (Date.parse(current) - Date.parse(past)) / 86400000; }

  function rankFocus(input, history) {
    const score = clamp(input.dailyScore);
    const seed = hash(`${input.profileId}|${input.date}|${input.dayKey}|${input.themeCategory}`);
    const recent = new Map((history || []).map(item => [item.focusId, daysSince(input.date, item.date)]).filter(([, age]) => age >= 0));
    return FOCI.map(focus => {
      let value = 50 + ((seed >>> (focus.index % 16)) & 15) - 7;
      if (focus.index % 5 === new Date(`${input.date}T12:00:00`).getDay() % 5) value += 10;
      if (score >= 70 && ['complete', 'contact', 'create', 'focus', 'cooperate'].includes(focus.id)) value += 15;
      if (score < 45 && ['rest', 'organize', 'prepare', 'observe', 'health'].includes(focus.id)) value += 18;
      if (input.themeCategory === 'money' && focus.id === 'money') value += 20;
      if (input.themeCategory === 'love' && ['relationship', 'boundary'].includes(focus.id)) value += 18;
      if (input.themeCategory === 'work' && ['complete', 'negotiate', 'focus'].includes(focus.id)) value += 16;
      const age = recent.get(focus.id);
      if (age === 1) value -= 40; else if (age <= 7) value -= 22; else if (age <= 14) value -= 8;
      return { focus, value };
    }).sort((a, b) => b.value - a.value || a.focus.id.localeCompare(b.focus.id));
  }

  function generate(input = {}, history = []) {
    const ranked = rankFocus(input, history);
    const focus = ranked[0].focus;
    const yesterday = history.find(item => daysSince(input.date, item.date) === 1);
    const score = clamp(input.dailyScore);
    const stance = score >= 70 ? '進める力を使える' : score < 45 ? '拡大より調整を優先する' : '小さく試して確かめる';
    const difference = yesterday ? `昨日の中心は「${yesterday.focusLabel}」。今日は「${focus.label}」へ重心を移します。` : '前回の結果との比較は、閲覧履歴ができてから表示します。';
    const evidence = (input.evidence || []).filter(Boolean).slice(0, 3);
    return {
      schemaId: 'koyomi-daily-reading', version: VERSION, profileId: input.profileId, date: input.date,
      focusId: focus.id, focusLabel: focus.label, actionId: `${focus.id}-primary`, cautionId: `${focus.id}-caution`,
      conclusionPatternId: score >= 70 ? 'advance' : score < 45 ? 'adjust' : 'test', score,
      conclusion: `今日は「${focus.label}」が中心。${stance}日よ。`, difference,
      action: focus.action, caution: focus.caution,
      recommendedTime: input.recommendedTime || (score >= 70 ? '09:00〜11:00' : score < 45 ? '18:00以降' : '13:00〜15:00'),
      review: '今夜、実際に起きた事実だけを確認して。',
      evidence: evidence.length ? evidence : [`日運信号 ${score}点`, input.dayKey].filter(Boolean),
      fingerprint: hash(`${input.profileId}|${input.date}|${focus.id}|${score}`).toString(16)
    };
  }

  return Object.freeze({ VERSION, FOCI, generate, rankFocus });
});
