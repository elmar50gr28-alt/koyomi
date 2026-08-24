import { EARTHQUAKE_FORECAST_FLAGS, LOCKED_VALIDATION } from './config.js';

export function releaseGate(result,flags=EARTHQUAKE_FORECAST_FLAGS){
  const dataset=result?.dataset,source=result?.sourceManifest,lockedDataset=dataset?.development_start==='2005-01-01'&&dataset?.development_end==='2014-12-31'&&dataset?.holdout_start==='2015-01-01'&&dataset?.holdout_end==='2025-12-31'&&dataset?.target_magnitude_threshold===6.5,verifiedSource=['GCMT','USGS','JMA'].includes(source?.provider)&&/^[a-f0-9]{64}$/i.test(source?.sha256||'')&&Number(source?.recordCount)>0;
  const empty=(reason)=>Object.freeze({allowed:false,reason,bestHorizonDays:null,passingHorizonDays:Object.freeze([]),horizonDecisions:Object.freeze({})});
  if(!result?.realHoldout||result.validationVersion!=='2.8.0'||!Array.isArray(result.horizons)||!lockedDataset||!verifiedSource)return empty('real-holdout-required');
  if(JSON.stringify(result.horizons.map(item=>item.horizon_days).sort((a,b)=>a-b))!==JSON.stringify([...LOCKED_VALIDATION.horizonsDays]))return empty('all-horizons-required');
  const decisions=Object.fromEntries(result.horizons.map(item=>{const passed=item.n_target_events>=50&&item.model_logloss<item.background_logloss&&item.model_brier<item.background_brier&&item.information_gain_nats_per_row>0&&item.event_recall>=.4&&item.false_alert_fraction<=.1&&item.median_lead_days>=1;return[item.horizon_days,Object.freeze({passed,reason:passed?'PASS':'FAIL_HOLDOUT_GATE',informationGain:item.information_gain_nats_per_row,falseAlertBurden:item.space_time_alarm_fraction??item.alert_day_fraction??item.false_alert_fraction})]}));
  const passing=result.horizons.filter(item=>decisions[item.horizon_days].passed).sort((left,right)=>right.information_gain_nats_per_row-left.information_gain_nats_per_row||(decisions[left.horizon_days].falseAlertBurden-decisions[right.horizon_days].falseAlertBurden)||left.horizon_days-right.horizon_days),passingHorizonDays=Object.freeze(passing.map(item=>item.horizon_days)),bestHorizonDays=passing[0]?.horizon_days??null,enabled=flags.earthquakeForecastEnabled&&flags.experimentalPredictiveUIEnabled;
  return Object.freeze({allowed:Boolean(enabled&&bestHorizonDays),reason:!enabled?'predictive-ui-disabled':bestHorizonDays?'real-holdout-passed':'holdout-thresholds-not-met',bestHorizonDays,passingHorizonDays,horizonDecisions:Object.freeze(decisions)});
}

export function peakDisplayMode(metrics,flags=EARTHQUAKE_FORECAST_FLAGS){return flags.peakDateEnabled&&metrics?.peak_window_hit_rate>=.55?'date':'window'}
