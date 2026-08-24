import { EARTHQUAKE_FORECAST_FLAGS, EARTHQUAKE_SAFETY_NOTICE, LOCKED_VALIDATION } from './config.js';
import { releaseGate } from './display-policy.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
export function createForecastUiModel({releaseResult,row}={},flags=EARTHQUAKE_FORECAST_FLAGS){const gate=releaseGate(releaseResult,flags),rowAllowed=gate.allowed&&gate.passingHorizonDays.includes(row?.horizon_days);return Object.freeze({visible:rowAllowed,title:`今後${row?.horizon_days??7}日の事前備え`,gate,row:rowAllowed?row:null,safetyNotice:EARTHQUAKE_SAFETY_NOTICE})}
export function renderForecastShell(model){if(!model?.visible)return'';const row=model.row;return`<section class="earthquake-forecast" aria-label="今後7日の事前備え"><h3>${esc(model.title)}</h3><p><b>${esc(row.region_name||'選択地域')}</b>／事前備えレベル ${Number(row.action_level)}</p><p>相対リスク指標 ${Number(row.risk_score_0_100).toFixed(0)} / 100</p><p>${esc(model.safetyNotice)}</p></section>`}

const gateReason=value=>({
  'predictive-ui-disabled':'実ホールドアウト完了後も、公開フラグによる確認が必要です。',
  'real-holdout-required':'固定期間の実ホールドアウトが未実施、または検証可能な結果がありません。',
  'all-horizons-required':'固定した全horizonの評価結果がそろっていません。',
  'holdout-thresholds-not-met':'公開基準を満たしたhorizonがありません。'
}[value]||'公開条件を確認中です。');

export function createForecastLayerState({releaseResult,rows=[]}={},flags=EARTHQUAKE_FORECAST_FLAGS){
  const gate=releaseGate(releaseResult,flags),bestHorizonDays=gate.allowed?gate.bestHorizonDays:null,allowedRows=bestHorizonDays?(rows||[]).filter(row=>row?.horizon_days===bestHorizonDays&&gate.passingHorizonDays.includes(row.horizon_days)):[];
  return Object.freeze({status:gate.allowed?'公開可能':'検証中',modelName:'背景活動率・直近活動率ベースライン v1',horizonCandidates:Object.freeze([...LOCKED_VALIDATION.horizonsDays]),realHoldoutStatus:releaseResult?.realHoldout?(gate.bestHorizonDays?'評価済み':'基準未達'):'未実施',dataQuality:releaseResult?.dataQualityLabel||'実ホールドアウト評価前',predictiveUiEnabled:gate.allowed,reason:gateReason(gate.reason),bestHorizonDays,allowedRows:Object.freeze(allowedRows),gate});
}
