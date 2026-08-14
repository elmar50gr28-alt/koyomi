(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KOYOMI_DAILY_READING_CORE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VERSION = '2.0.0';
  const rawFoci = [
    ['complete', '完了', 'work', ['途中の一件を最後まで終わらせる', '返答待ちの案件を一件だけ閉じる', '八割できた作業を提出できる形にする'], ['新しい予定を増やす', '仕上げ前に別の仕事へ逃げる', '細部を直し続けて完了を遅らせる']],
    ['organize', '整理', 'life', ['机の上を15分だけ整える', '不要な通知を三つ止める', '今日使う資料だけを一か所へ集める'], ['整理だけで一日を終える', '思い出の品まで勢いで捨てる', '分類方法を考えるだけで手を止める']],
    ['contact', '連絡', 'relationship', ['止めていた重要な連絡を一件送る', '要件を三行にまとめて送る', '返事が必要な期限を添えて確認する'], ['返事を急かす', '長文で感情を一度にぶつける', '既読や返信速度だけで気持ちを決めつける']],
    ['negotiate', '交渉', 'work', ['期限・費用・責任範囲の一つを確認する', '譲れない条件を一つだけ先に伝える', '口頭の合意を短い文章で確認する'], ['口約束だけで進める', '全部の条件を同時に争う', '相手の沈黙を承諾として扱う']],
    ['rest', '休息', 'health', ['予定を一件減らし30分休む', '眠る前の画面時間を20分短くする', '疲れが強くなる時間帯を記録する'], ['疲れた状態で重要事項を決める', '休息を先延ばしにして埋め合わせる', '占いを診断や治療の代わりにする']],
    ['learn', '学習', 'growth', ['今必要な知識を25分だけ学ぶ', '一つの疑問に絞って調べる', '学んだ内容を三行で説明してみる'], ['資料を集めるだけで終わる', '複数の教材を同時に始める', '理解したふりで次へ進む']],
    ['create', '創作', 'growth', ['未完成でも見せられる試作を一つ作る', '冒頭または骨組みだけを完成させる', '他人に見せる前提で一案を書き出す'], ['完璧になるまで公開しない', '評価を恐れて無難にまとめる', '道具選びだけに時間を使う']],
    ['money', '金銭管理', 'money', ['定期支出を一件確認する', '購入前に比較対象を一つ増やす', '予算の上限を先に数字で決める'], ['気分だけで大きな支出を決める', '損を取り返すため追加で賭ける', '占いだけで投資判断を確定する']],
    ['boundary', '境界線', 'relationship', ['引き受けないことを一つ言葉にする', '返答する期限を自分から提示する', 'できる範囲とできない範囲を分けて伝える'], ['察してもらうことを待つ', '罪悪感だけで引き受ける', '突然すべての関係を断つ']],
    ['relationship', '関係調整', 'relationship', ['事実・希望・お願いを一つずつ伝える', '曖昧な返事に具体的な日付を聞く', '結論より先に相手の条件を一つ確認する'], ['相手の内心を推測で決めつける', '好意的な解釈だけで話を進める', '勝ち負けを決める会話にする']],
    ['family', '家族', 'relationship', ['家の負担を一項目だけ見直す', '頼みたいことを具体的に一つ伝える', '共有予定を一件だけ確認する'], ['一人で全員分を背負う', '昔の不満まで同時に持ち出す', '家族だから分かるはずと説明を省く']],
    ['health', '健康管理', 'health', ['不調や疲労の発生時刻を記録する', '水分・食事・睡眠の一つを整える', '続く症状について専門家へ相談する準備をする'], ['占いを診断や治療の代わりにする', '急な悪化を我慢して様子見する', '一日で生活習慣を全部変える']],
    ['move', '移動', 'life', ['移動時間と代替経路を確認する', '出発を10分早める', '天候と現地の案内を出発前に確認する'], ['方位だけで安全を判断する', '遅れを取り戻すため急ぐ', '確認なしで普段と違う経路へ入る']],
    ['prepare', '準備', 'work', ['次の行動に必要な物を一つ揃える', '開始時刻と最初の作業を決める', '失敗した場合の代替案を一つ用意する'], ['準備のまま期限を決めない', '起きそうにない問題まで備える', '情報が全部揃うまで始めない']],
    ['release', '手放し', 'life', ['目的に合わない予定を一件やめる', '保留中の一件に終了条件を決める', '使っていない物を一つ手放す'], ['不安だけで必要な約束まで捨てる', '説明せず突然放棄する', '捨てた直後に代用品を買う']],
    ['review', '振り返り', 'growth', ['終わったことと残ったことを一行ずつ書く', '予想と事実の違いを一つ見つける', '次回変える点を一つだけ決める'], ['反省を自己批判に変える', '結果だけで過程を否定する', '改善点を増やしすぎる']],
    ['decide', '判断', 'life', ['選択肢を費用・期限・撤退条件で比べる', '今日決める部分と保留する部分を分ける', '取り消せる小さな選択から試す'], ['占いの点数だけで不可逆な決定をする', '焦りを締切と勘違いする', '他人に決定の責任を預ける']],
    ['focus', '集中', 'work', ['通知を止め90分だけ一つに集中する', '最重要作業の最初の15分を始める', '終える条件を一行で決めて着手する'], ['複数の重要作業を同時に進める', '難所を避けて小仕事だけ片づける', '休憩なしで能率を落とす']],
    ['cooperate', '協力', 'work', ['抱えている作業を一件依頼する', '得意な人へ具体的な質問を一つする', '役割と期限を文章で共有する'], ['依頼内容と期限を曖昧にする', '任せた後も全部やり直す', '相手の善意だけを当てにする']],
    ['observe', '観察', 'life', ['予想ではなく数字や行動を一つ確認する', '判断前に一晩分の変化を見る', '気になった事実を評価せず三つ記録する'], ['悪い結果を先回りして決めつける', '観察を先延ばしの口実にする', '一度の出来事を傾向と断定する']]
  ];
  const FOCI = Object.freeze(rawFoci.map(([id, label, domain, actions, cautions], index) => ({ id, label, domain, actions, cautions, index })));
  const STRUCTURES = Object.freeze([
    ['verdict-first', ['conclusion', 'action', 'caution', 'difference', 'time', 'review']],
    ['evidence-turn', ['difference', 'conclusion', 'action', 'time', 'caution', 'review']],
    ['action-first', ['action', 'conclusion', 'difference', 'caution', 'time', 'review']],
    ['warning-first', ['caution', 'conclusion', 'action', 'difference', 'time', 'review']],
    ['timeline', ['time', 'conclusion', 'action', 'caution', 'difference', 'review']],
    ['contrast', ['difference', 'caution', 'conclusion', 'action', 'review', 'time']],
    ['quiet-read', ['conclusion', 'difference', 'review', 'action', 'caution', 'time']],
    ['coach', ['action', 'time', 'caution', 'conclusion', 'review', 'difference']],
    ['reframe', ['caution', 'difference', 'conclusion', 'review', 'action', 'time']],
    ['opportunity', ['conclusion', 'time', 'action', 'difference', 'caution', 'review']],
    ['two-step', ['difference', 'action', 'review', 'conclusion', 'caution', 'time']],
    ['short-pulse', ['conclusion', 'caution', 'action', 'time', 'review', 'difference']]
  ].map(([id, order]) => ({ id, order })));

  function hash(value) { let h = 2166136261; for (const char of String(value || '')) h = Math.imul(h ^ char.charCodeAt(0), 16777619); return h >>> 0; }
  function clamp(value) { return Math.max(0, Math.min(100, Math.round(Number(value) || 50))); }
  function daysSince(current, past) { return (Date.parse(current) - Date.parse(past)) / 86400000; }
  function categoryDomain(value) { return ({ love: 'relationship', money: 'money', work: 'work', health: 'health' })[value] || null; }
  function recentAge(history, key, value, date) { const found = (history || []).find(item => item[key] === value && daysSince(date, item.date) >= 0); return found ? daysSince(date, found.date) : Infinity; }

  function rankFocus(input, history) {
    const score = clamp(input.dailyScore), requested = categoryDomain(input.themeCategory);
    const seed = hash(`${input.profileId}|${input.date}|${input.dayKey}|${input.themeCategory}`);
    return FOCI.map(focus => {
      let signalFit = 35 + ((seed >>> (focus.index % 16)) & 15);
      if (focus.index % 5 === new Date(`${input.date}T12:00:00`).getDay() % 5) signalFit += 12;
      if (score >= 70 && ['complete', 'contact', 'create', 'focus', 'cooperate'].includes(focus.id)) signalFit += 22;
      if (score < 45 && ['rest', 'organize', 'prepare', 'observe', 'health'].includes(focus.id)) signalFit += 24;
      const questionFit = requested && focus.domain === requested ? 20 : 0;
      const longTermFit = focus.domain === (input.longTermDomain || '') ? 15 : 0;
      const age = recentAge(history, 'focusId', focus.id, input.date);
      const novelty = age === 1 ? -30 : age <= 7 ? -12 : age <= 14 ? -4 : 10;
      return { focus, value: signalFit + questionFit + longTermFit + novelty, breakdown: { signalFit, questionFit, longTermFit, novelty } };
    }).sort((a, b) => b.value - a.value || a.focus.id.localeCompare(b.focus.id));
  }

  function chooseVariant(focus, input, history, key, size) {
    const seed = hash(`${input.profileId}|${input.date}|${input.dayKey}|${focus.id}|${key}`);
    const used = new Set((history || []).filter(item => daysSince(input.date, item.date) >= 0 && daysSince(input.date, item.date) <= 7).map(item => item[key]));
    for (let offset = 0; offset < size; offset++) { const index = (seed + offset) % size; if (!used.has(`${focus.id}-${index}`)) return index; }
    return seed % size;
  }

  function conclusionFor(style, focus, score) {
    const forward = score >= 70, quiet = score < 45;
    const lines = {
      'verdict-first': `結論から言うわ。今日は「${focus.label}」を選ぶ日。${forward ? '遠慮せず一歩進めて。' : quiet ? '広げず、効く一点だけ整えなさい。' : '大勝負より小さな実行で確かめて。'}`,
      'evidence-turn': `流れを読むと、今日の鍵は派手な幸運ではなく「${focus.label}」。ここを扱える人から状況が動くわ。`,
      'action-first': `考え続けるより、今日は「${focus.label}」を形にしなさい。動いた後の情報の方が役に立つ日よ。`,
      'warning-first': `今日は勢いだけで決めないこと。いま大切にしたいのは「${focus.label}」よ。`,
      'timeline': `今日の流れは後半ほど輪郭が出るわ。「${focus.label}」に時間を残しておきなさい。`,
      'contrast': `昨日までの正解を続けるだけでは足りないわ。今日は「${focus.label}」へ重心を移す番。`,
      'quiet-read': `静かだけれど見逃せない日ね。運は「${focus.label}」という小さな選択に出ているわ。`,
      'coach': `迷うなら、今日の勝ち筋は一つ。「${focus.label}」を先に済ませることよ。`,
      'reframe': `問題は運が弱いことじゃないの。「${focus.label}」の扱い方が曖昧なことよ。`,
      'opportunity': `チャンスは目立つ姿で来ないわ。今日は「${focus.label}」の中に入口がある。`,
      'two-step': `今日は二段階でいきなさい。まず状況を絞り、その次に「${focus.label}」を実行するの。`,
      'short-pulse': `今日は「${focus.label}」。迷ったら、増やすより一つ決める。これで十分よ。`
    };
    return lines[style];
  }

  function safetyFor(input, focus) {
    if (focus.domain === 'health') return '症状が強い、急に悪化した、長く続く場合は、占いより医療機関への相談を優先してね。';
    if (focus.domain === 'money' && ['money', 'legal'].includes(input.themeCategory)) return '大きな契約や投資は、占いだけで確定せず条件と専門情報を確認して。';
    return '';
  }

  function generate(input = {}, history = []) {
    const ranked = rankFocus(input, history), focus = ranked[0].focus, score = clamp(input.dailyScore);
    const actionIndex = chooseVariant(focus, input, history, 'actionId', focus.actions.length);
    const cautionIndex = chooseVariant(focus, input, history, 'cautionId', focus.cautions.length);
    const recentStructures = new Set((history || []).filter(item => daysSince(input.date, item.date) >= 0 && daysSince(input.date, item.date) <= 5).map(item => item.structureId));
    const structureSeed = hash(`${input.profileId}|${input.date}|${input.dayKey}|structure`);
    let structure = STRUCTURES[structureSeed % STRUCTURES.length];
    for (let offset = 0; offset < STRUCTURES.length; offset++) {
      const candidate = STRUCTURES[(structureSeed + offset) % STRUCTURES.length];
      if (!recentStructures.has(candidate.id)) { structure = candidate; break; }
    }
    const yesterday = history.find(item => daysSince(input.date, item.date) === 1);
    const action = focus.actions[actionIndex], caution = focus.cautions[cautionIndex];
    const difference = yesterday ? `昨日の「${yesterday.focusLabel}」を引きずるより、今日は「${focus.label}」へ切り替えると流れが通るわ。` : '履歴がたまると、昨日との違いもここで読み分けるわね。';
    const recommendedTime = input.recommendedTime || (score >= 70 ? '午前中。動けるうちに最初の一手を。' : score < 45 ? '夕方以降。材料が揃ってから。' : '昼過ぎ。周囲の反応を一度見てから。');
    const review = ['できた量ではなく、状況がどう変わったかを一つ確認して。', '今夜は、予想と実際の違いを一行だけ残して。', '相手の反応ではなく、自分が決められたことを確かめて。'][hash(`${input.date}|review`) % 3];
    const labels = { conclusion: '今日の読み', difference: '流れの変化', action: '今日やること', caution: '気をつけること', time: '動く頃合い', review: '今夜の確認' };
    const texts = { conclusion: conclusionFor(structure.id, focus, score), difference, action, caution, time: recommendedTime, review };
    const evidence = (input.evidence || []).filter(Boolean).slice(0, 3);
    const safetyNotice = safetyFor(input, focus);
    return {
      schemaId: 'koyomi-daily-reading', version: VERSION, profileId: input.profileId, date: input.date,
      focusId: focus.id, focusLabel: focus.label, domain: focus.domain,
      actionId: `${focus.id}-${actionIndex}`, cautionId: `${focus.id}-${cautionIndex}`, structureId: structure.id,
      conclusionPatternId: structure.id, score, conclusion: texts.conclusion, difference, action, caution, recommendedTime, review,
      blocks: structure.order.map(role => ({ role, label: labels[role], text: texts[role] })),
      safetyNotice, grounding: ranked[0].breakdown,
      evidence: evidence.length ? evidence : [`日運信号 ${score}点`, input.dayKey].filter(Boolean),
      fingerprint: hash(`${input.profileId}|${input.date}|${focus.id}|${actionIndex}|${structure.id}|${score}`).toString(16)
    };
  }

  return Object.freeze({ VERSION, FOCI, STRUCTURES, generate, rankFocus });
});
