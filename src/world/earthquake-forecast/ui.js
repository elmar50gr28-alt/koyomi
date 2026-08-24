import { EARTHQUAKE_FORECAST_FLAGS, EARTHQUAKE_SAFETY_NOTICE } from './config.js';
import { releaseGate } from './display-policy.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
export function createForecastUiModel({releaseResult,row}={},flags=EARTHQUAKE_FORECAST_FLAGS){const gate=releaseGate(releaseResult,flags);return Object.freeze({visible:gate.allowed,title:'今後7日の事前備え',gate,row:gate.allowed?row:null,safetyNotice:EARTHQUAKE_SAFETY_NOTICE})}
export function renderForecastShell(model){if(!model?.visible)return'';const row=model.row;return`<section class="earthquake-forecast" aria-label="今後7日の事前備え"><h3>${esc(model.title)}</h3><p><b>${esc(row.region_name||'選択地域')}</b>／事前備えレベル ${Number(row.action_level)}</p><p>相対リスク指標 ${Number(row.risk_score_0_100).toFixed(0)} / 100</p><p>${esc(model.safetyNotice)}</p></section>`}
