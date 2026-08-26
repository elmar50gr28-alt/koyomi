(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KOYOMI_UNIVERSAL_READING = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const POLICY = {
    personal: { label: '本鑑定', review: '7日後', window: '今日から24時間以内' },
    compatibility: { label: '相性鑑定', review: '14日後', window: '72時間以内' },
    timeline: { label: '人生年表', review: '3か月後', window: '今月中' },
    oracle: { label: '古代神託', review: '7日後', window: '今日中' },
    qimen: { label: '運命航法盤', review: '行動後', window: '指定した時間帯' },
    mundane: { label: 'マンデン鑑定', review: '翌月', window: '今月中' },
    today: { label: '今日の運勢', review: '今夜', window: '次の3時間以内' }
  };

  function clean(value, fallback = '') {
    const text = String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
    return text || fallback;
  }

  function list(values, fallback) {
    const result = (Array.isArray(values) ? values : [values]).map(value => clean(value)).filter(Boolean);
    return result.length ? result : [fallback];
  }

  function clampScore(value) {
    const score = Number(value);
    return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50;
  }

  function conclusion(score, label, subject) {
    const focus = clean(subject, '今のテーマ');
    if (score >= 72) return `結論から言うわね。${focus}は、条件を確かめたうえで進めていい流れよ。`;
    if (score < 42) return `結論から言うわね。${focus}は、今は無理に進めず守りと確認を優先しなさい。`;
    return `結論から言うわね。${focus}は、小さく試して結果を見ながら決めるのが正解よ。`;
  }

  function build(input = {}) {
    const type = POLICY[input.type] ? input.type : 'personal';
    const policy = POLICY[type];
    const score = clampScore(input.score);
    const evidence = list(input.evidence, `${policy.label}の総合信号 ${score}点`).slice(0, 3);
    const actions = list(input.actions, '今できる一番小さな行動を一つ終わらせる').slice(0, 2);
    const question = clean(input.question);
    const subject = clean(input.subject, question || policy.label);
    const caution = clean(input.caution, '焦って結論を固定したり、一度に予定を増やしすぎないこと');
    const window = clean(input.window, policy.window);
    const review = clean(input.review, policy.review);
    const narrativeEngine=globalThis.KOYOMI_APP_NARRATIVE;
    const narrative=narrativeEngine?.compose({surface:type,domain:input.domain,question,subject,score,direction:input.state,confidence:input.confidence,risk:input.risk,serious:input.serious,contradiction:input.contradiction,evidence,actions,caution,review,seed:input.seed||[type,subject,score].join('|'),variant:input.variant});
    const byRole=Object.fromEntries((narrative?.blocks||[]).map(block=>[block.role,block.text]));
    const directAnswer = clean(input.directAnswer, byRole.conclusion||conclusion(score, policy.label, subject));
    return {
      type, label: policy.label, score, question, directAnswer,
      reason: byRole.reason||`そう読む根拠は、${evidence.join('／')}です。`,
      actionPlan: (byRole.action?[byRole.action,...actions.slice(1)]:actions).slice(0,2).map((action, index) => ({ when: index === 0 ? window : review, action })),
      stop: byRole.stop||caution,
      review: byRole.review||`${review}に、実際に起きた変化を確認して判断を更新して。`,
      disclaimer: clean(input.disclaimer), narrative
    };
  }

  function escapeHtml(value) {
    return clean(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function toText(answer) {
    const lines = ['【相談への答え】'];
    if (answer.question) lines.push(`相談：${answer.question}`);
    lines.push(answer.directAnswer, `
【根拠】\n${answer.reason}`, `
【具体策】`);
    answer.actionPlan.forEach(step => lines.push(`・${step.when}：${step.action}`));
    lines.push(`
【控えること】\n${answer.stop}`, `
【見直し】\n${answer.review}`);
    if (answer.disclaimer) lines.push(answer.disclaimer);
    return lines.join('\n');
  }

  function toHtml(answer) {
    return `<section class="universal-reading-answer" data-reading-type="${escapeHtml(answer.type)}"><h3>相談への答え</h3>${answer.question ? `<p class="question"><b>相談</b>${escapeHtml(answer.question)}</p>` : ''}<p class="conclusion"><b>結論</b>${escapeHtml(answer.directAnswer)}</p><p><b>根拠</b>${escapeHtml(answer.reason)}</p><ol>${answer.actionPlan.map(step => `<li><b>${escapeHtml(step.when)}</b>${escapeHtml(step.action)}</li>`).join('')}</ol><p><b>控えること</b>${escapeHtml(answer.stop)}</p><p><b>見直し</b>${escapeHtml(answer.review)}</p>${answer.disclaimer ? `<small>${escapeHtml(answer.disclaimer)}</small>` : ''}</section>`;
  }

  function renderBefore(target, answer) {
    const element = typeof target === 'string' ? globalThis.document?.querySelector(target) : target;
    if (!element) return false;
    const parent = element.parentElement;
    const previous = parent?.querySelector(`.universal-reading-answer[data-reading-type="${answer.type}"]`);
    if (previous) previous.remove();
    element.insertAdjacentHTML('beforebegin', toHtml(answer));
    return true;
  }

  return { POLICY, build, toText, toHtml, renderBefore };
});
