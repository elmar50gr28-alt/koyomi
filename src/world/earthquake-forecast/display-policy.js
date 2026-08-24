import { EARTHQUAKE_FORECAST_FLAGS, LOCKED_VALIDATION } from './config.js';

export function releaseGate(result,flags=EARTHQUAKE_FORECAST_FLAGS){
  if(!flags.earthquakeForecastEnabled||!flags.experimentalPredictiveUIEnabled)return Object.freeze({allowed:false,reason:'predictive-ui-disabled'});
  const dataset=result?.dataset,source=result?.sourceManifest,lockedDataset=dataset?.development_start==='2005-01-01'&&dataset?.development_end==='2014-12-31'&&dataset?.holdout_start==='2015-01-01'&&dataset?.holdout_end==='2025-12-31'&&dataset?.target_magnitude_threshold===6.5,verifiedSource=['GCMT','USGS','JMA'].includes(source?.provider)&&/^[a-f0-9]{64}$/i.test(source?.sha256||'')&&Number(source?.recordCount)>0;
  if(!result?.realHoldout||result.validationVersion!=='2.8.0'||!Array.isArray(result.horizons)||!lockedDataset||!verifiedSource)return Object.freeze({allowed:false,reason:'real-holdout-required'});
  if(JSON.stringify(result.horizons.map(item=>item.horizon_days).sort((a,b)=>a-b))!==JSON.stringify([...LOCKED_VALIDATION.horizonsDays]))return Object.freeze({allowed:false,reason:'all-horizons-required'});
  const passed=result.horizons.every(item=>item.n_target_events>=50&&item.model_logloss<item.background_logloss&&item.model_brier<item.background_brier&&item.information_gain_nats_per_row>0&&item.event_recall>=.4&&item.false_alert_fraction<=.1&&item.median_lead_days>=1);
  return Object.freeze({allowed:passed,reason:passed?'real-holdout-passed':'holdout-thresholds-not-met'});
}

export function peakDisplayMode(metrics,flags=EARTHQUAKE_FORECAST_FLAGS){return flags.peakDateEnabled&&metrics?.peak_window_hit_rate>=.55?'date':'window'}
