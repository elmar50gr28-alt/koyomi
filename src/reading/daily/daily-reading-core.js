(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KOYOMI_DAILY_READING_CORE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VERSION = '3.7.0';
  const rawFoci = [
    ['complete', '完了', 'work', ['途中になっている仕事を、完了と伝えられる状態に仕上げる', '返答待ちの案件について、完了できるか相手に確認する', '仕上げの残っている成果物を、提出できる形にする'], ["新しい予定を増やす前に、残っている仕事を確認して。","仕上げが残っているうちに、別の仕事へ移らないで。","修正を続けるなら、どこで完了とするか決めておいて。"]],
    ['organize', '整理', 'life', ['机の上を、必要な物がすぐ取り出せる状態に整える', '作業を妨げている通知を止める', '今日使う資料を、探し回らずに済む場所へまとめる'], ["片づけだけで一日が終わらないよう、用事の時間も残して。","思い出の品まで、勢いで捨てないこと。","分類に迷ったら、まず取り出しやすい場所へまとめて。"]],
    ['contact', '連絡', 'relationship', ['保留していた連絡について、用件を整理して相手に伝える', '相手に何を答えてほしいかが伝わる文章で連絡する', '返事が必要な期限を添えて確認する'], ["返事を急かさず、相手が答えられる時間を残して。","感情を長文で一度にぶつけないで。","既読や返信速度だけで、相手の気持ちを決めつけないこと。"]],
    ['negotiate', '交渉', 'work', ['期限・費用・責任範囲のうち、曖昧な条件を相手と確認する', '交渉を始める前に、譲れない条件を相手に伝える', '口頭の合意を短い文章で確認する'], ["口頭で決まった内容は、文章でも確認して。","条件をまとめて争わず、合意が必要な点を分けて話して。","相手が黙っていても、承諾したとは限らないわ。"]],
    ['rest', '休息', 'health', ['急がない用事を後日に回し、休む時間を確保する', '眠る準備が遅れないよう、画面を見る時間を切り上げる', '疲れが強くなる時間帯を記録する'], ["疲れているときは、重要な判断を急がないで。","休息を後回しにして、あとで埋め合わせようとしないこと。","占いを診断や治療の代わりにしないで。"]],
    ['learn', '学習', 'growth', ['今の課題で分からないところを、教材で確かめる', '疑問に思っていることを調べ、分かったことをまとめる', '学んだ内容を、自分の言葉で説明してみる'], ["資料集めだけで終わらず、内容を読む時間も取って。","教材を増やす前に、今使っているものを活用して。","分からないまま、理解したことにして先へ進まないで。"]],
    ['create', '創作', 'growth', ['案が伝わる試作を作り、見てもらえる形にする', '冒頭や構成を仕上げ、作品の方向をはっきりさせる', '読んでもらう相手を想定して、案を書き出す'], ["完璧になるまで誰にも見せないと、意見を聞く機会を逃しやすいわ。","評価を恐れて、伝えたいことまで薄めないで。","道具選びだけで終わらず、実際に作る時間も残して。"]],
    ['money', '金銭管理', 'money', ['定期支出を見直し、使っていないサービスがないか確認する', '購入前に候補を比べ、価格と使い勝手の違いを確かめる', '予算の上限を先に数字で決める'], ["気分だけで、大きな支出を決めないで。","損を取り返すために、追加で賭けないこと。","占いだけで、投資判断を確定しないで。"]],
    ['boundary', '境界線', 'relationship', ['引き受けられない内容を、曖昧にせず相手に伝える', '返答する期限を自分から提示する', 'できる範囲とできない範囲を分けて伝える'], ["察してもらうのを待たず、難しいことは言葉で伝えて。","罪悪感だけで、頼み事を引き受けないこと。","勢いで関係をすべて断つ前に、距離の取り方を考えて。"]],
    ['relationship', '関係調整', 'relationship', ['起きたこと、自分の希望、相手へのお願いを分けて伝える', '曖昧な返事に具体的な日付を聞く', '結論を決める前に、相手の都合や希望を聞く'], ["相手の内心を、推測で決めつけないで。","都合のよい解釈だけで話を進めず、相手の意向を確かめて。","会話を勝ち負けにせず、何を決めたいかに戻って。"]],
    ['family', '家族', 'relationship', ['負担が偏っている家の用事について、担当を見直す', '家の用事で手伝ってほしい内容を、具体的に伝える', '家族の共有予定を確認し、行き違いがないようにする'], ["家の用事を、一人で全部背負わないで。","昔の不満まで持ち出さず、今話したいことを分けて。","家族だから分かるはずと思わず、必要な説明はして。"]],
    ['health', '健康管理', 'health', ['不調や疲労の発生時刻を記録する', '水分・食事・睡眠のうち、後回しになっているものを優先する', '続く症状について専門家へ相談する準備をする'], ["占いを診断や治療の代わりにしないで。","急に体調が悪化したら、我慢せず医療機関へ相談して。","生活習慣を、一日で全部変えようとしないこと。"]],
    ['move', '移動', 'life', ['移動時間と代替経路を確認する', '出発時刻を見直し、慌てず移動できる余裕を確保する', '天候と現地の案内を出発前に確認する'], ["方位だけで、安全だと判断しないで。","遅れを取り戻すために、慌てて移動しないこと。","普段と違う経路を使うなら、案内や状況を確認して。"]],
    ['prepare', '準備', 'work', ['作業に必要な物を揃え、始めるときに困らないようにする', '作業の段取りを決め、何から取りかかるかをはっきりさせる', '予定どおりに進まない場合に、どう対応するか決めておく'], ["準備を続けるなら、いつ始めるかも決めておいて。","起きそうにない問題まで備えて、準備を増やしすぎないで。","情報が全部揃うまで待つなら、期限に間に合うかも確認して。"]],
    ['release', '手放し', 'life', ['目的に合わなくなった予定を見直し、続ける必要があるか決める', '保留中の一件に終了条件を決める', '使っていない物を整理し、手放せる物と残す物を分ける'], ["不安だけで、必要な約束まで取り消さないで。","やめるときは、関係する相手に説明して。","手放したあとに代用品を買うなら、本当に必要か考えて。"]],
    ['review', '振り返り', 'growth', ['終わったことと残ったことを分け、次に必要な対応を書き出す', '予想と実際の結果を比べ、違いが生まれた理由を考える', '振り返りをもとに、次回はどう進めるか決める'], ["振り返りを、自己批判に変えないこと。","結果だけで、取り組んだ過程まで否定しないで。","改善したい点を増やす前に、次回何を変えるか決めて。"]],
    ['decide', '判断', 'life', ['選択肢を費用・期限・撤退条件で比べる', '今日決める部分と保留する部分を分ける', '選択を試すなら、見直せる条件を確かめてから実行する'], ["占いの点数だけで、取り消せない決定をしないで。","焦っている気持ちと、実際の締切を分けて考えて。","他人に決定の責任を預けず、納得できる理由を確かめて。"]],
    ['focus', '集中', 'work', ['通知を止め、取り組みたい仕事に集中できる環境を作る', '優先したい仕事に取りかかり、区切りのよいところまで進める', '何を終えたら完了とするかを決めてから、作業に取りかかる'], ["重要な仕事を同時に始めず、優先順位を決めて。","難しいところを避けて、小仕事だけで終わらないようにして。","休憩を抜いて、集中を続けようとしないこと。"]],
    ['cooperate', '協力', 'work', ['自分で抱えている作業のうち、任せられる部分を人に依頼する', '自分で解決しにくい点を、その分野に詳しい人に相談する', '役割と期限を文章で共有する'], ["依頼するときは、内容と期限を曖昧にしないで。","任せたあとに全部やり直すなら、仕上がりの認識を先に合わせて。","相手の善意だけを当てにせず、担当できるか確認して。"]],
    ['observe', '観察', 'life', ['予想と確かめられた事実を区別して、状況を見直す', '判断前に一晩分の変化を見る', '気になった出来事を、良し悪しを決めつけず記録する'], ["悪い結果を、先回りして決めつけないで。","見続けるだけで先延ばしにならないよう、判断する時期も考えて。","一度の出来事だけで、いつもそうだと断定しないで。"]]
  ];
  // Keep action IDs and order stable. Copy revisions clarify outcomes instead of arbitrary quotas.
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
  // Classify authored actions by purpose, independently of their wording or focus ID.
  // This is a preference among eligible assets, never permission to change the judgment.
  function actionKind(action, focusId = '') {
    const text = String(action || '');
    const groups = [
      ['rest', /休む|休息(?:を|の時間を)|睡眠時間.*(?:確保|戻)|寝る|食事.*(?:優先|確保)|水分.*(?:摂|補)/],
      ['release', /手放|断る|取り消|解約|中止|後日に回|減ら|削る/],
      ['delegate', /依頼する|依頼して|任せられる|任せる|分担.*(?:決め|相談)|人に頼む/],
      ['communicate', /伝え|相談(?:する|して)|話し合|連絡(?:する|して|を送)|聞く|聞いて|返答(?:する|して)|返信(?:する|して)/],
      ['complete', /仕上げ|完了|提出|精算/],
      ['create', /試作|作る|作り|形に|書いて|書き出/],
      ['learn', /学び|教材|説明|練習/],
      ['organize', /置き場所|整える|片づ|整理|分類/],
      ['decide', /決め|選ぶ|選び|比較|比べ/],
      ['verify', /確認|確かめ|調べ|記録|見直/]
    ];
    return groups.find(([, pattern]) => pattern.test(text))?.[0] || (/続け|維持/.test(text) ? 'maintain' : 'other');
  }
  function historyKind(row) {
    if (row.actionKind) return row.actionKind;
    const focus = FOCI.find(item => item.id === row.focusId);
    if (!String(row.actionId || '').startsWith(`${row.focusId}-`)) return '';
    const index = Number(String(row.actionId).split('-').at(-1));
    return focus && Number.isInteger(index) && focus.actions[index] ? actionKind(focus.actions[index], focus.id) : '';
  }
  function semanticCost(kind, history, date) {
    if (kind === 'other') return 0; // Unclassified copy is not proof of a new meaning.
    return history.reduce((sum, row) => {
      const age = daysSince(date, row.date);
      return sum + (historyKind(row) === kind ? (age === 1 ? 8 : age === 2 ? 2 : age === 3 ? 1 : 0) : 0);
    }, 0);
  }
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
      return { index, count: uses.length, semantic: key === 'actionId' ? semanticCost(actionKind(focus.actions[index], focus.id), history, input.date) : 0, age: recentAge(history, key, id, input.date), tie: (index + size - seed % size) % size };
    });
    candidates.sort((a, b) => a.count - b.count || b.age - a.age || a.semantic - b.semantic || a.tie - b.tie);
    return candidates[0].index;
  }

  // Complete sentences keep noun fragments from forming awkward instructions.
  const FOCUS_READINGS = Object.freeze({
    complete: '仕事を増やす前に、途中のものを仕上げたいところね。終わりの条件が曖昧なら、提出先と確認して。',
    organize: '必要なものを探す手間を減らしましょう。片づけた量より、使いやすくなったかが目安よ。',
    contact: '伝えたい内容と、相手に答えてほしいことを分けてみて。返信の速さだけで気持ちを判断しないこと。',
    negotiate: '曖昧な条件を残さずに話を進めたい日ね。望む内容と、相手が了承している内容を確かめて。',
    rest: '休む時間を、用事が全部終わったあとのご褒美にしないで。急がない予定を動かして、休める余裕を作りましょう。',
    learn: '知識を集めるだけでなく、今の課題にどう使えるか考えてみて。自分の言葉で説明できないところが、学び直す目印よ。',
    create: '案を頭の中に置いたままにせず、見せられる形にしてみましょう。出来栄えの採点より、伝えたいことが届くかを見て。',
    money: '金額だけでなく、支払う時期や使い続ける費用にも目を向けて。分からない条件を残したまま契約を決めないこと。',
    boundary: '頼まれたことを全部引き受ける必要はないわ。できる範囲と難しい範囲を、相手に分かる言葉で伝えましょう。',
    relationship: '自分の希望と、相手に確かめた事実を分けて考えて。気持ちを推測するより、話し合える内容を見つけたいところね。',
    family: '家の用事を誰が担っているか、見直してみましょう。家族だから分かるはずと思わず、頼みたい内容を伝えて。',
    health: '予定を守ることより、体調に合わせて予定を変えることを大事にして。食事や休息を後回しにしなくて済む段取りを考えましょう。',
    move: '移動は予定どおりに進む場合だけでなく、遅れた場合も考えておいて。慌てずに済む経路や連絡方法を確かめましょう。',
    prepare: '始めてから困らないよう、必要な物や手順を揃えたい日ね。準備が足りないところをはっきりさせれば、誰に相談するかも見えてくるわ。',
    release: '続ける理由が薄れている予定は、見直してもいいわ。ただし、相手との約束や必要な記録まで失わないようにして。',
    review: '結果の良し悪しだけで、自分のやり方を採点しないで。助けになった手順と、次は変えたい手順を見分けましょう。',
    decide: '今決める必要があることと、判断材料を待てることを分けましょう。選ぶ理由と見直す条件が分かれば、迷いを扱いやすくなるわ。',
    focus: '目についた用事より、時間を使いたい仕事を優先して。取り組む対象と区切りを決めれば、途中で別の用事に流されにくくなるわ。',
    cooperate: '自分で受け持つ部分と、人に頼みたい部分を整理しましょう。依頼するときは、内容と期限を相手が分かる形で伝えて。',
    observe: '気になっている予想と、確かめられた事実を分けてみて。まだ分からないことは、分からないまま残してもいいのよ。'
  });
  const STRENGTH_READINGS = Object.freeze({
  "complete": [
    "新しい締切を引き受ける前に、残っている仕事を確認して。",
    "提出するなら、内容と形式が求められているものに合うか確かめて。",
    "仕上がったものは提出し、受け取ってもらえたか確認して。"
  ],
  "organize": [
    "片づけに疲れるなら、残してよいものまで急いで捨てないで。",
    "使ったあとにも戻せる置き場所か、実際に確かめて。",
    "使いやすい置き場所が決まったら、整理を進めて。"
  ],
  "contact": [
    "返事や約束を急がず、自分の都合も大事にして。",
    "返事を待つ期限と、次に確認する方法を決めておきましょう。",
    "用件がまとまったら連絡し、相手が答えられる時間を残して。"
  ],
  "negotiate": [
    "分からない条件があるなら、その場で承諾しないで。",
    "変更できる条件と、相手の了承が必要な条件を確認して。",
    "合意できた内容は、文章に残してから進めて。"
  ],
  "rest": [
    "休める時間を確保し、急がない用事は後日に回して。",
    "休みづらい理由があるなら、予定変更や分担を相談して。",
    "余力があっても、休息を全部別の用事で埋めないこと。"
  ],
  "learn": [
    "理解しにくい点は、そのままにせず教材や詳しい人に確かめて。",
    "学んだことを使って、理解できているか確かめて。",
    "理解できたところから、課題や練習に使ってみて。"
  ],
  "create": [
    "完成を急がず、何を伝えたいかを整理して。",
    "試作を見てもらうなら、聞きたい意見を伝えておいて。",
    "見せられる形になったら、使う人や読む人に感想を聞いて。"
  ],
  "money": [
    "負担が増える支払いは急いで決めないで。",
    "購入や契約を決める前に、費用と見直す条件を確かめて。",
    "納得できる条件が揃っているか、支払い前に確認して。"
  ],
  "boundary": [
    "急な依頼にその場で返事せず、自分の予定を確認して。",
    "引き受ける部分と保留する部分について、認識を合わせて。",
    "受け持つ範囲が決まったら、その範囲を守って進めて。"
  ],
  "relationship": [
    "話す準備ができていないなら、返事を急がなくていいわ。",
    "相手と話し合い、まだ合意していないことを確認して。",
    "話したいことがまとまったら、落ち着いて話す機会を作って。"
  ],
  "family": [
    "一人で抱え込みそうなら、分担を変えられるか相談して。",
    "担当や予定について、家族と認識を合わせて。",
    "担当が決まったら、必要な情報や道具を共有して。"
  ],
  "health": [
    "予定を増やすより、休める時間を確保して。",
    "無理なく続けられる食事や休息の段取りを考えて。",
    "調子がよくても、休息を抜いて予定を詰めないこと。"
  ],
  "move": [
    "遅れを取り戻すために急がず、予定変更を連絡して。",
    "予定の経路が使えない場合の交通手段も確かめて。",
    "現地の案内や天候を確認し、余裕を持って出発して。"
  ],
  "prepare": [
    "準備が足りないなら、開始を急がず不足を確認して。",
    "手順が分からないところは、担当者に確かめてから始めて。",
    "必要な物や許可が揃ったら、段取りに沿って始めて。"
  ],
  "release": [
    "不安だけで、必要な約束まで取り消さないで。",
    "やめる場合の手続きや、残しておく記録を確認して。",
    "終了を決めたら、関係する相手に予定の変更を伝えて。"
  ],
  "review": [
    "振り返りを、自分を責める時間にしないこと。",
    "考えていた結果と、実際の結果を比べてみて。",
    "役立った手順を残し、変えたいところを次回の進め方に反映して。"
  ],
  "decide": [
    "判断材料が足りないなら、保留できるか確かめて。",
    "選ぶ理由と、あとから見直せるかを確かめて。",
    "条件に納得できたら決め、見直す時期も決めておいて。"
  ],
  "focus": [
    "仕事を増やすより、取り組む対象をはっきりさせて。",
    "途中で割り込みが来たときの対応を決めておいて。",
    "作業の区切りを決め、休憩も取りながら進めて。"
  ],
  "cooperate": [
    "無理に引き受けず、負担が偏っているところを相談して。",
    "依頼を受けてもらえたか、担当の認識が合っているか確認して。",
    "任せる相手が決まったら、必要な資料や手順を渡して。"
  ],
  "observe": [
    "悪い結果を先回りして決めず、確かめられたことを見て。",
    "違いを比べるなら、同じ条件の情報かを確認して。",
    "確認できた事実をもとに、次に必要な対応を考えて。"
  ]
});
  const READING_LENSES = Object.freeze([
    '終わったあとに何が変わればよいか、先に考えてみて。',
    '考えていた条件と、実際の条件を照らし合わせましょう。',
    'やり方が決まれば、あとは実際の手応えを見ていきましょう。',
    '気をつけたい点を先に知っておくと、無理を避けやすくなるわ。',
    '始める前、取り組む間、終えたあとで、必要なことを分けてみて。',
    '急いで済ませたいことと、大事にしたいことを比べてみましょう。',
    '結論が出ないときは、分かっていることを整理するところから。',
    '思いどおりにいかなかったら、どこを変えるか考えておいて。',
    'できなかった点だけでなく、役立った工夫も振り返ってみて。',
    'すでに揃っている材料を使えるか、見渡してみましょう。',
    '条件が分かっているなら実行へ。不明な点があるなら確認へ。',
    '今日は何を優先したいか、自分の言葉にしてみて。'
  ]);
  function narrativeFor(style, focus, scene, intensity) {
    const index = STRUCTURES.findIndex(item => item.id === style);
    const strength = STRENGTH_READINGS[focus.id][{ protect: 0, test: 1, forward: 2 }[intensity]];
    // Scene and focus prose are independent complete sentences, never spliced noun clauses.
    const notes = FOCUS_READINGS[focus.id].match(/[^。]+。/g);
    return '今日は「' + focus.label + '」に目を向けて。' + notes[index % notes.length] + strength + '\n\n' + scene + READING_LENSES[index];
  }

  function safetyFor(input, focus) {
    if (focus.domain === 'health') return '症状が強い、急に悪化した、長く続く場合は、占いより医療機関への相談を優先してね。';
    if (focus.domain === 'money' && (requestedDomain(input) === 'money' || input.themeCategory === 'legal')) return '大きな契約や投資は、占いだけで確定せず条件と専門情報を確認して。';
    return '';
  }

  const SCENES = {
    work: ['依頼が重なっているなら、期限を比べて優先順位を考えて。', '担当を決める話が出たら、自分の役割を確認して。', '仕事が残って帰りにくいなら、明日に回せる部分を分けて。'],
    relationship: ['返信に迷っているなら、答えられることと保留したいことを分けて。', '会う予定を相談するなら、お互いの都合を聞いて。', '頼み事を引き受けるか迷うなら、自分の予定も確認して。'],
    health: ['用事の合間に休めないなら、予定の組み方を見直して。', '食事が後回しになりそうなら、先に時間を確保して。', '寝る準備が遅れそうなら、急がない用事を切り上げて。'],
    money: ['明細に見覚えのない項目があるなら、請求内容を確認して。', '値引きに惹かれているなら、必要な物かも考えて。', '先の支払いが気になるなら、請求日と残高を照らし合わせて。'],
    life: ['予定に空きがないなら、動かせる用事があるか見直して。', '探し物が増えているなら、物や情報の置き場所を決めて。', '次の用事へ移るか迷うなら、今の用事をどこで区切るか考えて。'],
    growth: ['教材や道具選びで迷うなら、今の課題に必要なものを選んで。', '途中の案を直すなら、何を伝えたいかに立ち返って。', '人に見せる前に迷うなら、どんな意見を聞きたいか考えて。']
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

  function groundingFor(input, focus, intensity) {
    const theme = (input.themeEvidence || []).find(item => (input.themeIds || []).includes(item?.id) && THEME_FOCI[item.id]?.includes(focus.id));
    const name = String(theme?.label || '').replace(/[\n\r]/g, ' ').trim();
    const basis = name && name.length <= 30 ? `鑑定で出た「${name}」を、今日の焦点に結びつけています。` : `日運の強さと相談分野から、今日扱う焦点を選んでいます。`;
    const qualification = clamp(input.dailyScore) >= 70 && input.longTermScore != null && clamp(input.longTermScore) < 45 ? '日運は強めでも長期の判定は慎重なため、条件の確認を優先します。' : input.contradiction ? '長期の傾向と日運が一致しないため、結論は急がずに読みます。' : input.confidence != null && Number(input.confidence) < 0.5 ? '判断材料が限られるため、現実の条件を確かめる読み方です。' : intensity === 'protect' ? '日運の判定に合わせ、負担を増やさない対応を優先します。' : intensity === 'test' ? '日運の判定に合わせ、条件を確かめてから判断する読み方です。' : '日運の判定に合わせ、準備済みのことを進める読み方です。';
    return { basis, qualification, themeId: name && name.length <= 30 ? theme.id : null };
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
    const action = focus.actions[actionIndex], caution = focus.cautions[cautionIndex];
    const strengthNames = { protect: '負担を見直し、休息や確認を優先する', test: '必要な条件を確かめて判断する', forward: '準備が揃ったことを実行する' };
    const difference = yesterday?.intensity && yesterday.intensity !== intensity ? `昨日の強度は「${strengthNames[yesterday.intensity] || '前日の方針'}」、今日は「${strengthNames[intensity]}」。点数だけで予定を増減せず、今の余力と条件も確かめて。` : yesterday ? (yesterday.focusId === focus.id ? `昨日の「${focus.label}」を今日も扱うわ。${yesterday.actionId === `${focus.id}-${actionIndex}` ? '同じ一手が必要なら、今も条件が変わっていないか確かめて。' : '今日は扱う対象を切り替えながら、同じ主題を確かめていきましょう。'}` : `昨日の主題は「${yesterday.focusLabel || '前日の課題'}」。今日の主題は「${focus.label}」よ。前日の方針を否定せず、今日の作業を分けて考えて。`) : `今日の主題は「${focus.label}」。前日の記録がないため、日ごとの変化はまだ比べずに読んでいるわ。`;
    const recommendedTime = input.recommendedTime || '時刻の吉凶はこの信号からは決められないわ。必要な条件が揃い、落ち着いて取り組める時間を選んで。';
    const review = focus.id === 'money' ? MONEY_REVIEWS[actionIndex] || REVIEWS.money : REVIEWS[focus.id];
    const labels = { conclusion: '今日の読み', difference: '流れの変化', action: '今日やること', caution: '気をつけること', time: '動く頃合い', review: '今夜の確認' };
    const rationale = groundingFor(input, focus, intensity);
    const story = narrativeFor(structure.id, focus, scene, intensity) + '\n' + rationale.basis + rationale.qualification;
    const texts = { conclusion: story, difference, action, caution, time: recommendedTime, review };
    const evidence = (input.evidence || []).filter(Boolean).slice(0, 3);
    const safetyNotice = safetyFor(input, focus);
    return {
      schemaId: 'koyomi-daily-reading', version: VERSION, profileId: input.profileId, date: input.date,
      focusId: focus.id, focusLabel: focus.label, domain: focus.domain,
      mainTheme: focus.id, sceneId, scene, intensity, story,
      hasRecommendedTime: Boolean(input.recommendedTime),
      showDifference: Boolean(yesterday && yesterday.intensity && yesterday.intensity !== intensity),
      actionId: `${focus.id}-${actionIndex}`, actionKind: actionKind(action, focus.id), cautionId: `${focus.id}-${cautionIndex}`, structureId: structure.id,
      conclusionPatternId: structure.id, score, conclusion: texts.conclusion, difference, action, caution, recommendedTime, review,
      blocks: structure.order.map(role => ({ role, label: labels[role], text: texts[role] })),
      safetyNotice, grounding: ranked[0].breakdown, rationale,
      evidence: evidence.length ? evidence : [`日運信号 ${score}点`, input.dayKey].filter(Boolean),
      fingerprint: hash(JSON.stringify([input.profileId, input.date, focus.id, actionIndex, cautionIndex, structure.id, sceneId, intensity, score, texts, evidence])).toString(16)
    };
  }

  return Object.freeze({ VERSION, FOCI, STRUCTURES, generate, rankFocus, recentHistory, intensityFor, toText, requestedDomain, actionKind });
});
