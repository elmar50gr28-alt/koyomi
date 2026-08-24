import { LOCKED_VALIDATION } from './config.js';

const EPSILON=1e-12,clampProbability=value=>Math.min(1-EPSILON,Math.max(EPSILON,Number(value)));
const mean=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null;
export function validateLockedPeriods(periods=LOCKED_VALIDATION){
  if(JSON.stringify(periods.development)!==JSON.stringify(['2005-01-01','2014-12-31'])||JSON.stringify(periods.holdout)!==JSON.stringify(['2015-01-01','2025-12-31']))throw new RangeError('locked chronological split must not change');
  return true;
}

export function evaluateHoldoutRows(rows,{topK=10}={}){
  if(!Array.isArray(rows)||!rows.length)throw new TypeError('real holdout rows are required');
  const normalized=rows.map(row=>{const outcome=Number(row.outcome),background=clampProbability(row.backgroundProbability),model=clampProbability(row.modelProbability);if(![0,1].includes(outcome))throw new RangeError('outcome must be binary');return{...row,outcome,background,model}});
  const logLossFor=key=>-mean(normalized.map(row=>row.outcome*Math.log(row[key])+(1-row.outcome)*Math.log(1-row[key]))),brierFor=key=>mean(normalized.map(row=>(row[key]-row.outcome)**2)),alerts=normalized.filter(row=>row.alert===true),events=normalized.filter(row=>row.outcome===1),hits=alerts.filter(row=>row.outcome===1),leadDays=hits.map(row=>Number(row.leadDays)).filter(value=>Number.isFinite(value)).sort((a,b)=>a-b),middle=Math.floor(leadDays.length/2),medianLead=leadDays.length?(leadDays.length%2?leadDays[middle]:(leadDays[middle-1]+leadDays[middle])/2):null;
  const backgroundLogloss=logLossFor('background'),modelLogloss=logLossFor('model');
  return Object.freeze({n_holdout_rows:normalized.length,n_target_events:events.length,background_logloss:backgroundLogloss,model_logloss:modelLogloss,background_brier:brierFor('background'),model_brier:brierFor('model'),information_gain_nats_per_row:backgroundLogloss-modelLogloss,event_recall:events.length?hits.length/events.length:0,alert_precision:alerts.length?hits.length/alerts.length:0,false_alert_fraction:alerts.length?alerts.filter(row=>row.outcome===0).length/alerts.length:0,median_lead_days:medianLead,peak_window_hit_rate:events.length?events.filter(row=>row.peakHit===true).length/events.length:0,topk_region_recall:events.length?events.filter(row=>Number(row.regionRank)<=topK).length/events.length:0});
}
