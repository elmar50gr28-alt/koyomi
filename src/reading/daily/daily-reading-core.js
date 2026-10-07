(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KOYOMI_DAILY_READING_CORE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VERSION = '3.4.0';
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
  // Append distinct tasks; never reword existing actions or move their saved IDs.
  const EXTRA_ACTIONS = {
    complete: ['提出先が求める形式を確認する', '残っている修正を一つ反映する', '完了した成果物を保管する場所を決める'],
    organize: ['探すことが多い物の置き場所を一つ決める', '保存したファイルを一つ分かる名前に変える', '期限が過ぎたメモを一つ整理する'],
    contact: ['相手が連絡を受け取りやすい時間を確認する', '添付する資料が揃っているか確認する', '連絡した結果と次の確認日をメモする'],
    negotiate: ['合意に必要な決裁者を確認する', '条件を変更できる期限を確認する', '相手が困っている条件を一つ聞く'],
    learn: ['理解が曖昧な用語を一つ調べる', '学んだ内容を使って一問解く', '次に学ぶ単元を一つ選ぶ'],
    create: ['使う人や読む人を一人想定する', '試作を使って分かりにくい箇所を一つ見つける', '他の人に試作の感想を一つ聞く'],
    money: [
      '直近の明細と領収書を照合する', '支払日と口座残高を照合する', '使っていない定期購入の解約条件を調べる', '購入後にかかる維持費を書き出す', '契約の更新日と追加料金を確認する', '緊急時に使える資金の置き場所を確認する', '返金や返品の期限を確認する', '今月の残りの支出予定を一覧にする', '家族と共有する費用の分担を確認する',
      '期限のある立替金が未精算になっていないか確認する', '年間払いの費用が発生する月を予定表に記す', '買う予定の物を借りられるか調べる', '値引き前後の単価を比べる', '使い切れない分のまとめ買いを見直す', '注文内容と届いた品を照合する', '支払先の名義と請求元を照合する', '小額でも続いている手数料を確認する', 'レシートを保管する基準を決める', '持っているポイントの有効期限を確認する', '家計の記録で分類できていない支出を一件整理する', '購入を見送ると何に困るか書き出す'
    ],
    boundary: ['相談されても答えられない範囲を一つ伝える', '自分の作業を中断しない時間帯を決める', '断った後に必要な引継ぎがあるか確認する'],
    relationship: ['お互いの認識が違う事実を一つ確認する', '話す場所や時間を相手と相談する', '会話の後に決まったことを短く共有する'],
    family: ['家の用事を担当別に一つ書き出す', '家族と共有する物の置き場所を決める', '相手が一人で過ごしたい時間を確認する'],
    rest: ['休憩の開始時刻を予定表に入れる', '明日に回せる用事を一つ選ぶ', '休む間に届く連絡への返答時刻を決める', '休む前に気になる用事をメモへ移す', '落ち着いて過ごせる場所を一つ選ぶ', '休憩中に見ない通知を一つ決める', '今日終えなくてよい作業の相手に予定変更を伝える', '次の予定までの空き時間を確保する', '家の用事を一つ頼める相手に相談する'],
    health: ['無理なく食事を取れる時間を予定に入れる', '作業場所の姿勢や明るさを確認する', '相談時に伝える症状の経過をメモする', '今日の睡眠時間を記録する', '水分を取れる物を手元に用意する', '体調に合わせて予定の所要時間を見直す', '受診を考えている場合の相談先を確認する', '食事や休憩を抜かずに済む移動予定を組む', '体調が悪いときに予定を変更する連絡先を確認する'],
    move: ['目的地で使う入口を確認する', '帰りの交通手段を確認する', '持ち歩く荷物を必要な物に絞る'],
    prepare: ['作業に必要な権限や許可を確認する', '作業場所が使えるか確認する', '手順の中で人に頼む部分を決める'],
    release: ['やめる予定に関係する相手へ変更を伝える', '手放す物に必要な情報が残っていないか確認する', 'やめた予定の時間を何に使うか決める'],
    review: ['途中で助けになった条件を一つ記録する', '使った時間を当初の予定と比べる', '次回も残したい手順を一つ選ぶ'],
    decide: ['決定前に確認が必要な人を一人挙げる', '決めた内容をいつ見直すか決める', '選択肢ごとに必要な準備を一つ書く'],
    focus: ['割り込みが来たときの対応を決める', '集中を妨げる道具を一つ片づける', '難しい作業を自分が取り組みやすい時間へ置く'],
    cooperate: ['依頼する作業の完成例を一つ示す', '相談できる時間を相手に確認する', '引き継ぐ情報を一か所にまとめる'],
    observe: ['観察した事実と推測を別の欄へ書く', '比較する基準を一つ決める', '判断に必要だがまだ分からないことを一つ挙げる']
  };
  // More checks and preparation tasks for prolonged protective periods. Eligibility is unchanged.
  const PROTECTIVE_ACTIONS = {
    prepare: ['期限までに必要な工程を一つ確認する', '使う資料が最新版か確認する', '作業前の状態を記録しておく', '手順で分からない箇所を担当者に聞く', '困ったときの連絡先を控える', '途中で作業を止める場合の保存方法を確認する'],
    negotiate: ['納品後に何を確認するか相手と共有する', '修正の回数や受付範囲を確認する', '延期が必要な場合の連絡手順を確認する', '追加の依頼を受ける窓口を確認する', '辞退する場合に必要な引継ぎを確認する', '返答する前に確認すべき資料を一つ指定する'],
    organize: ['同じ内容のメモを一か所へまとめる', '期限のある書類を取り出しやすい場所へ移す', '使わないアプリのショートカットを一つ整理する'],
    observe: ['確認した情報がいつのものか調べる', '同じ条件の別の例を一つ調べる', '判断する前に当事者の説明を聞く'],
    release: ['解約後も必要になる記録を保存する', '借りたまま使っていない物の返却方法を確認する', '続ける約束とやめたい予定を分けて書く'],
    boundary: ['急な依頼に答える前に自分の予定を確認する', '頼まれた内容のうち保留する部分を伝える'],
    relationship: ['返事がない場合の次の確認方法を相談する', '会話でまだ決まっていない点を一つ書き出す'],
    family: ['共有の道具を使う順番を相談する', '家の用事を外へ頼む場合の候補を一つ調べる']
  };
  const FOCI = Object.freeze(rawFoci.map(([id, label, domain, actions, cautions], index) => ({ id, label, domain, actions: [...actions, ...(EXTRA_ACTIONS[id] || []), ...(PROTECTIVE_ACTIONS[id] || [])], cautions, index })));
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
  function clamp(value) { return Number.isFinite(Number(value)) && value != null ? Math.max(0, Math.min(100, Math.round(Number(value)))) : 50; }
  function daysSince(current, past) { return (Date.parse(current) - Date.parse(past)) / 86400000; }
  function categoryDomain(value) {
    const domains = { love: 'relationship', relationship: 'relationship', family: 'relationship', money: 'money', work: 'work', health: 'health', decision: 'life', future: 'life', growth: 'growth' };
    return Object.prototype.hasOwnProperty.call(domains, value) ? domains[value] : null;
  }
  const FOCUS_DOMAINS = Object.freeze({ talent: 'growth', career: 'work', changejob: 'work', business: 'work', income: 'money', purchase: 'money', encounter: 'relationship', relationship: 'relationship', marriage: 'relationship', reconcile: 'relationship', family: 'relationship', healthrhythm: 'health', study: 'growth', creative: 'growth', relocation: 'life', timing: 'life', choice: 'life' });
  function requestedDomain(input) {
    const focused = Object.prototype.hasOwnProperty.call(FOCUS_DOMAINS, input.focusCategory) ? FOCUS_DOMAINS[input.focusCategory] : null;
    return focused || categoryDomain(input.questionCategory) || categoryDomain(input.themeCategory);
  }
  const THEME_FOCI = {
    ACTION_CAREFUL_DECISION: ['observe', 'decide', 'prepare'], MIND_STRONG_INTUITION: ['observe', 'review'],
    MIND_OVERTHINKING: ['focus', 'rest', 'review'], WORK_STEADY_PROGRESS: ['complete', 'focus', 'prepare'],
    MONEY_LONG_TERM_STABILITY: ['money'], WORK_LEADERSHIP: ['cooperate', 'negotiate'],
    RELATIONSHIP_SET_BOUNDARIES: ['boundary', 'relationship'], LOVE_OPEN_COMMUNICATION: ['contact', 'relationship'],
    ACTION_START_SMALL: ['prepare', 'create', 'learn'], HEALTH_REST_AND_RECOVERY: ['rest', 'health'],
    CHANGE_RELEASE_OLD_PATTERN: ['release', 'organize']
  };
  function recentHistory(input, history) {
    return (Array.isArray(history) ? history : []).filter(item => item && item.profileId === input.profileId && daysSince(input.date, item.date) > 0 && daysSince(input.date, item.date) <= 30)
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  function recentAge(history, key, value, date) { return Math.min(Infinity, ...history.filter(item => item[key] === value).map(item => daysSince(date, item.date))); }
  function intensityFor(input) {
    const score = clamp(input.dailyScore);
    if (score < 45) return 'protect';
    if (input.contradiction || (input.longTermScore != null && clamp(input.longTermScore) < 45) || (input.confidence != null && Number(input.confidence) < 0.5)) return 'test';
    return score >= 70 ? 'forward' : 'test';
  }

  function rankFocus(input, history) {
    const score = clamp(input.dailyScore), requested = requestedDomain(input);
    history = recentHistory(input, history);
    const intensity = intensityFor(input);
    const protective = ['rest', 'organize', 'prepare', 'observe', 'health', 'money', 'boundary', 'review', 'negotiate', 'relationship', 'family', 'learn', 'release'];
    const ranked = FOCI.filter(focus => (!requested || focus.domain === requested) && (intensity !== 'protect' || protective.includes(focus.id))).map(focus => {
      let signalFit = 35;
      if (score >= 70 && ['complete', 'contact', 'create', 'focus', 'cooperate'].includes(focus.id)) signalFit += 22;
      if (score < 45 && ['rest', 'organize', 'prepare', 'observe', 'health'].includes(focus.id)) signalFit += 24;
      const questionFit = requested && focus.domain === requested ? 20 : 0;
      const longTermFit = focus.domain === (input.longTermDomain || '') ? 15 : 0;
      const evidenceFit = (input.themeIds || []).some(id => THEME_FOCI[id]?.includes(focus.id)) ? 12 : 0;
      const age = recentAge(history, 'focusId', focus.id, input.date);
      const novelty = age === 1 ? -30 : age <= 7 ? -12 : age <= 14 ? -4 : age <= 30 ? 0 : 10;
      const usedActions = new Set(history.filter(item => item.focusId === focus.id).map(item => item.actionId));
      // Within a requested domain, daily preference (24), evidence fit (12), and recency (30)
      // must not force a used-up action pool over an eligible pool with fresh checks.
      const actionNovelty = focus.actions.every((_, index) => usedActions.has(`${focus.id}-${index}`)) ? -72 : 0;
      return { focus, value: signalFit + questionFit + longTermFit + evidenceFit + novelty + actionNovelty, breakdown: { signalFit, questionFit, longTermFit, evidenceFit, novelty, actionNovelty } };
    });
    // Once every eligible action has appeared, recycle globally by frequency and age.
    // Otherwise a preferred theme can repeat while another theme's oldest action expires.
    if (ranked.every(item => item.breakdown.actionNovelty < 0)) {
      for (const item of ranked) {
        const index = chooseVariant(item.focus, input, history, 'actionId', item.focus.actions.length);
        const id = `${item.focus.id}-${index}`;
        item.breakdown.reuseCount = history.filter(row => row.actionId === id).length;
        item.breakdown.reuseAge = recentAge(history, 'actionId', id, input.date);
      }
      return ranked.sort((a, b) => a.breakdown.reuseCount - b.breakdown.reuseCount || b.breakdown.reuseAge - a.breakdown.reuseAge || b.value - a.value || a.focus.id.localeCompare(b.focus.id));
    }
    return ranked.sort((a, b) => b.value - a.value || a.focus.id.localeCompare(b.focus.id));
  }

  function chooseVariant(focus, input, history, key, size) {
    const seed = hash(`${input.profileId}|${input.date}|${input.dayKey}|${focus.id}|${key}`);
    // Exhaust finite assets honestly: least used, then least recent, with a deterministic tie break.
    const candidates = Array.from({ length: size }, (_, index) => {
      const id = `${focus.id}-${index}`, uses = history.filter(item => item[key] === id);
      return { index, count: uses.length, age: recentAge(history, key, id, input.date), tie: (index + size - seed % size) % size };
    });
    candidates.sort((a, b) => a.count - b.count || b.age - a.age || a.tie - b.tie);
    return candidates[0].index;
  }

  // Each focus has a real decision tension, rather than a date-specific synonym.
  const TENSIONS = Object.freeze({
    complete: ['仕上げたい範囲', '提出できる区切り'], organize: ['残しておきたい物', 'すぐ使える場所'],
    contact: ['伝えたいこと', '相手が答えられる用件'], negotiate: ['望んでいる条件', 'まだ合意できていない条件'],
    rest: ['今日済ませたい用事', '休むために空ける時間'], learn: ['集めた情報', '自分で説明できる知識'],
    create: ['頭の中にある案', '人に見せられる形'], money: ['表示されている金額', '後から必要になる費用や手続き'],
    boundary: ['頼まれていること', '自分が引き受けられる範囲'], relationship: ['自分の希望', '相手に確認できた事実'],
    family: ['家で必要な用事', '誰がどこまで担当するか'], health: ['続けたい予定', '体調に合わせて変えられる部分'],
    move: ['予定どおりの経路', '遅れた場合にも使える手段'], prepare: ['始めたい気持ち', '実際に揃っている条件'],
    release: ['続ける理由', 'やめる場合に守る約束'], review: ['予想していた結果', '実際に起きたこと'],
    decide: ['今決める必要のあること', '判断材料を待てること'], focus: ['目に入る用事', '時間を使いたい一件'],
    cooperate: ['自分で受け持つ部分', '相手に頼みたい部分'], observe: ['気になっている推測', '確認できる事実']
  });
  function narrativeFor(style, focus, scene, intensity) {
    const [want, condition] = TENSIONS[focus.id];
    const limit = intensity === 'protect' ? '新しく背負う量を増やさず、確認できるところまで。' : intensity === 'test' ? '取り消せる範囲で試し、反応を見てから次を決めて。' : '条件が揃う一件は進めてよい日。余力を残せる区切りまで。';
    const frames = {
      'verdict-first': () => '今日の軸は「' + focus.label + '」。' + scene + '、' + want + 'より先に、' + condition + 'を見定めて。',
      'evidence-turn': () => scene + '、思っていた条件と手元の条件に違いがないか見てみましょう。「' + focus.label + '」では、' + condition + 'が次の一手の判断材料になるわ。',
      'action-first': () => '「' + focus.label + '」を、頭の中だけで終わらせないために、今回の一手を選んだわ。' + scene + '、それに取り組める条件があるか確かめて。',
      'warning-first': () => want + 'だけで話を進めると、' + condition + 'が置き去りになりやすい。今日は「' + focus.label + '」の落とし穴を先に確認しましょう。' + scene + '、一度立ち止まれる区切りを作って。',
      'timeline': () => scene + '、まず' + condition + 'を確認する。次に手を動かし、終わったら残ったことを見直す。「' + focus.label + '」を三つの区切りで扱う日よ。',
      'contrast': () => '「' + focus.label + '」で並べて見たいのは、' + want + 'と、' + condition + '。同じものとして扱わず、二つに分けてみて。' + scene + '、違いが一つ見えれば判断材料になるわ。',
      'quiet-read': () => scene + '、まだ答えが出ないなら、' + condition + 'について分かっていることだけ残して。「' + focus.label + '」は、結論を急がず輪郭をつかむところからでも始められるわ。',
      'coach': () => '今回の一手を試すなら、終えたあとに何を確かめたい？「' + focus.label + '」では、' + condition + 'が少し明確になるかを目印にして。' + scene + '、実行する前にその目印を決めてみて。',
      'reframe': () => '「' + focus.label + '」を、うまくできたかだけで採点しないで。' + want + 'と' + condition + 'を区別できたか、という見方もあるわ。' + scene + '、自分で確かめられる点を探して。',
      'opportunity': () => scene + '、「' + condition + '」について、すでに分かっていることはあるかしら。「' + focus.label + '」では、足りないものを全部集める前に、手元の材料でできる一手を選んで。',
      'two-step': () => '「' + focus.label + '」は二段階で考えましょう。' + scene + '、' + condition + 'が分かっていれば一手を選ぶ。まだ不明なら、まず確認する先を決める。',
      'short-pulse': () => '今日の問いは、「' + condition + '」について分かっていることと、まだ分からないこと。「' + focus.label + '」について、' + scene + '答えられる部分を一つ拾ってみて。'
    };
    return frames[style]() + limit;
  }

  function safetyFor(input, focus) {
    if (focus.domain === 'health') return '症状が強い、急に悪化した、長く続く場合は、占いより医療機関への相談を優先してね。';
    if (focus.domain === 'money' && (requestedDomain(input) === 'money' || input.themeCategory === 'legal')) return '大きな契約や投資は、占いだけで確定せず条件と専門情報を確認して。';
    return '';
  }

  const SCENES = {
    work: ['依頼や締切が重なっているなら', '打合せで役割を決める場面なら', '作業の続きが気になって帰りにくいなら'],
    relationship: ['返信を書く前に迷っているなら', '会う予定について話す場面なら', '頼み事を引き受けるか迷う場面なら'],
    health: ['用事の合間に休む時間を探すなら', '食事や休憩の時間がずれそうなら', '寝る準備より用事を優先しそうなら'],
    money: ['明細に見覚えのない項目があるなら', '値引きや特典に目が向いているなら', '先の支払いが気になっているなら'],
    life: ['予定に空きがなく選び直したいなら', '物や情報が増えて探し物をするなら', '次の用事へ移るか迷っているなら'],
    growth: ['教材や道具を選び続けているなら', '途中の案に手を加える場面なら', '成果を人に見せる前に迷うなら']
  };
  const REVIEWS = Object.freeze({
    complete: '今夜は、終えた部分と残っている部分を分けて確認して。',
    organize: '今夜は、必要な物や情報を次に取り出しやすくなったか確かめて。',
    contact: '今夜は、用件や次に確認する方法が整理できたか振り返って。',
    negotiate: '今夜は、曖昧な条件が減り、次に確かめることが分かったか確認して。',
    rest: '今夜は、休める時間や、休みにくくしている原因を把握できたか振り返って。',
    learn: '今夜は、理解できたことと、まだ分からないことを一つずつ残して。',
    create: '今夜は、形にできたことと、次の制作に必要なことを分けてみて。',
    money: '今夜は、支出・金額・期限・条件の不明点が一つ減ったか確認して。',
    boundary: '今夜は、自分ができる範囲と保留する範囲が言葉になったか確かめて。',
    relationship: '今夜は、決まったことと、相手にまだ確認していないことを分けて。',
    family: '今夜は、家の用事や共有ルールで確認できたことを一つ残して。',
    health: '今夜は、体調や生活について分かったことと、明日のために必要な準備をメモして。',
    move: '今夜は、移動の不確かな点が減り、まだ確認が必要な点が分かったか振り返って。',
    prepare: '今夜は、始めるための物や条件が揃ったか、残る不足を一つ確認して。',
    release: '今夜は、手放したいものと、守る必要のある約束を区別できたか振り返って。',
    review: '今夜は、次も残す手順と、変える点が一つずつ見つかったか確認して。',
    decide: '今夜は、決める条件と、まだ必要な判断材料を分けてみて。',
    focus: '今夜は、取り組む対象と区切り方が明確になったか確かめて。',
    cooperate: '今夜は、相手に頼むことと、自分が受け持つ部分を整理して。',
    observe: '今夜は、確かな事実と、まだ判断できないことを分けて残して。'
  });
  // Match verification targets to stable action IDs, rather than rephrasing by date.
  const MONEY_REVIEWS = Object.freeze([
    '今夜は、続けたい定期支出と、見直せそうな支出を分けられたか確かめて。',
    '今夜は、候補ごとの違いが一つ分かり、比較の基準を持てたか振り返って。',
    '今夜は、使ってよい範囲と、上限を超えそうなときの対応をメモして。',
    '今夜は、記録の食い違いがなかったか、調べ直す点を整理して。',
    '今夜は、支払時期の残高に不明点がなく、必要な準備が分かったか確認して。',
    '今夜は、使わないサービスと、やめる場合の手続きが分かったか確かめて。',
    '今夜は、買うとき以外にかかる費用をどこまで見通せたか振り返って。',
    '今夜は、契約を見直す期限と、料金が変わる条件を整理して。',
    '今夜は、必要なときに資金をどこから取り出せるか、分かったことを記録して。',
    '今夜は、返金や返品について、いつまでに何を連絡するか整理できたか振り返って。',
    '今夜は、これから必要な支払いを見渡し、残しておく資金が分かったか確認して。',
    '今夜は、誰がどの費用を受け持つか、まだ合意が必要な点を分けて。',
    '今夜は、精算が済んでいない案件と、次に確認する相手を整理して。',
    '今夜は、毎月の支払いとは別に、まとまった出費へ備える時期を確認して。',
    '今夜は、購入以外の方法と、その利用条件が一つ分かったか振り返って。',
    '今夜は、割引の表示だけでなく、数量あたりの費用を比べられたか確かめて。',
    '今夜は、実際に使う予定の量と、余りそうな量を分けてみて。',
    '今夜は、届いた品に不足や違いがなかったか、連絡が必要な点を整理して。',
    '今夜は、支払先について不明な点と、送金前に確認する相手を分けて。',
    '今夜は、積み重なる手数料と、見直せる手続きが分かったか確認して。',
    '今夜は、必要な記録をあとから取り出せる形に整理できたか振り返って。',
    '今夜は、ポイントの利用期限の有無と、期限がある場合の日付をメモして。',
    '今夜は、支出の使い道が分かる記録になり、分類が残る項目が減ったか確認して。',
    '今夜は、本当に必要な理由と、先送りできる条件を言葉にできたか振り返って。'
  ]);
  function toText(reading) {
    const selected = reading.blocks.filter(block => (block.role !== 'time' || reading.hasRecommendedTime) && (block.role !== 'difference' || reading.showDifference) && (block.role !== 'review' || !['short-pulse', 'warning-first', 'action-first'].includes(reading.structureId)));
    return selected.map(block => `【${block.label}】\n${block.text}`).join('\n\n') + (reading.safetyNotice ? `\n\n${reading.safetyNotice}` : '');
  }

  function generate(input = {}, history = []) {
    history = recentHistory(input, history);
    const ranked = rankFocus(input, history), focus = ranked[0].focus, score = clamp(input.dailyScore);
    const intensity = intensityFor(input);
    const actionIndex = chooseVariant(focus, input, history, 'actionId', focus.actions.length);
    const cautionIndex = chooseVariant(focus, input, history, 'cautionId', focus.cautions.length);
    const sceneIndex = chooseVariant({ id: focus.domain }, input, history, 'sceneId', SCENES[focus.domain].length);
    const sceneId = `${focus.domain}-${sceneIndex}`, scene = SCENES[focus.domain][sceneIndex];
    // Suppress complete story combinations, not only independently recurring parts.
    const storyHistory = history.filter(item => item.focusId === focus.id && item.sceneId === sceneId && item.intensity === intensity);
    const structureSeed = hash(`${input.profileId}|${input.date}|${input.dayKey}|structure`);
    const structures = STRUCTURES.map((part, index) => ({ index, storyCount: storyHistory.filter(item => item.structureId === part.id).length, count: history.filter(item => item.structureId === part.id).length, age: recentAge(history, 'structureId', part.id, input.date), tie: (index + STRUCTURES.length - structureSeed % STRUCTURES.length) % STRUCTURES.length }));
    structures.sort((a, b) => a.storyCount - b.storyCount || a.count - b.count || b.age - a.age || a.tie - b.tie);
    const structureIndex = structures[0].index;
    const structure = STRUCTURES[structureIndex];
    const yesterday = history.find(item => daysSince(input.date, item.date) === 1);
    const action = focus.actions[actionIndex], caution = `${focus.cautions[cautionIndex]}ことは避けて。`;
    const strengthNames = { protect: '負担を増やさず確認する', test: '取り消せる範囲で試す', forward: '条件が揃う一件を進める' };
    const difference = yesterday?.intensity && yesterday.intensity !== intensity ? `昨日の強度は「${strengthNames[yesterday.intensity] || '前日の方針'}」、今日は「${strengthNames[intensity]}」。点数だけで予定を増減せず、今の余力と条件も確かめて。` : yesterday ? (yesterday.focusId === focus.id ? `昨日の「${focus.label}」を今日も扱うわ。${yesterday.actionId === `${focus.id}-${actionIndex}` ? '同じ一手が必要なら、今も条件が変わっていないか確かめて。' : '今日は扱う対象を切り替えながら、同じ主題を確かめていきましょう。'}` : `昨日の主題は「${yesterday.focusLabel || '前日の課題'}」。今日の主題は「${focus.label}」よ。前日の方針を否定せず、今日の作業を分けて考えて。`) : `今日の主題は「${focus.label}」。前日の記録がないため、日ごとの変化はまだ比べずに読んでいるわ。`;
    const recommendedTime = input.recommendedTime || '時刻の吉凶はこの信号からは決められないわ。必要な条件が揃い、落ち着いて取り組める時間を選んで。';
    const review = focus.id === 'money' ? MONEY_REVIEWS[actionIndex] || REVIEWS.money : REVIEWS[focus.id];
    const labels = { conclusion: '今日の読み', difference: '流れの変化', action: '今日やること', caution: '気をつけること', time: '動く頃合い', review: '今夜の確認' };
    const story = narrativeFor(structure.id, focus, scene, intensity);
    const texts = { conclusion: story, difference, action, caution, time: recommendedTime, review };
    const evidence = (input.evidence || []).filter(Boolean).slice(0, 3);
    const safetyNotice = safetyFor(input, focus);
    return {
      schemaId: 'koyomi-daily-reading', version: VERSION, profileId: input.profileId, date: input.date,
      focusId: focus.id, focusLabel: focus.label, domain: focus.domain,
      mainTheme: focus.id, sceneId, scene, intensity, story,
      hasRecommendedTime: Boolean(input.recommendedTime),
      showDifference: Boolean(yesterday && yesterday.intensity && yesterday.intensity !== intensity),
      actionId: `${focus.id}-${actionIndex}`, cautionId: `${focus.id}-${cautionIndex}`, structureId: structure.id,
      conclusionPatternId: structure.id, score, conclusion: texts.conclusion, difference, action, caution, recommendedTime, review,
      blocks: structure.order.map(role => ({ role, label: labels[role], text: texts[role] })),
      safetyNotice, grounding: ranked[0].breakdown,
      evidence: evidence.length ? evidence : [`日運信号 ${score}点`, input.dayKey].filter(Boolean),
      fingerprint: hash(JSON.stringify([input.profileId, input.date, focus.id, actionIndex, cautionIndex, structure.id, sceneId, intensity, score, texts, evidence])).toString(16)
    };
  }

  return Object.freeze({ VERSION, FOCI, STRUCTURES, generate, rankFocus, recentHistory, intensityFor, toText, requestedDomain });
});
