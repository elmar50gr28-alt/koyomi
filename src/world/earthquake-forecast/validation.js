import { LOCKED_VALIDATION } from './config.js';

const DAY_MS=86400000,EPSILON=1e-12,clampProbability=value=>Math.min(1-EPSILON,Math.max(EPSILON,Number(value)));
const mean=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null;
const median=values=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2};
const rowTime=row=>{const date=new Date(row.forecast_time_utc??row.time_utc??row.datetimeUtc);if(Number.isNaN(date.getTime()))throw new TypeError('holdout row time must be valid');return date};
const rowCell=row=>String(row.cell_id??row.cellId??'');

export function validateLockedPeriods(periods=LOCKED_VALIDATION){
  if(JSON.stringify(periods.development)!==JSON.stringify(['2005-01-01','2014-12-31'])||JSON.stringify(periods.holdout)!==JSON.stringify(['2015-01-01','2025-12-31']))throw new RangeError('locked chronological split must not change');
  return true;
}

function cellsMatch(alarmCell,eventCell,allowedNeighborCells){
  if(alarmCell===eventCell)return true;
  const configured=allowedNeighborCells instanceof Map?allowedNeighborCells.get(alarmCell):allowedNeighborCells?.[alarmCell];
  return Array.isArray(configured)&&configured.map(String).includes(eventCell);
}

function alertEpisodes(alerts,episodeGapDays){
  const byCell=new Map();
  for(const alert of alerts){if(!byCell.has(alert.cell))byCell.set(alert.cell,[]);byCell.get(alert.cell).push(alert)}
  const episodes=[];
  for(const [cell,items] of byCell){items.sort((a,b)=>a.time-b.time);let episode=null;for(const item of items){if(!episode||item.time-episode.end>episodeGapDays*DAY_MS){episode={cell,start:item.time,end:item.time,alerts:[item]};episodes.push(episode)}else{episode.end=item.time;episode.alerts.push(item)}}}
  return episodes;
}

export function evaluateHoldoutRows(rows,{horizonDays=7,topK=10,allowedNeighborCells=Object.freeze({}),episodeGapDays=1}={}){
  if(!Array.isArray(rows)||!rows.length)throw new TypeError('real holdout rows are required');
  const horizon=Math.trunc(Number(horizonDays));if(horizon<1)throw new RangeError('horizonDays must be positive');
  const normalized=rows.map(row=>{const outcome=Number(row.outcome),background=clampProbability(row.backgroundProbability),model=clampProbability(row.modelProbability),cell=rowCell(row),time=rowTime(row);if(!cell)throw new TypeError('holdout row cell is required');if(![0,1].includes(outcome))throw new RangeError('outcome must be binary');return{...row,outcome,background,model,cell,time}}).sort((a,b)=>a.time-b.time);
  const logLossFor=key=>-mean(normalized.map(row=>row.outcome*Math.log(row[key])+(1-row.outcome)*Math.log(1-row[key]))),brierFor=key=>mean(normalized.map(row=>(row[key]-row.outcome)**2));
  const alerts=normalized.filter(row=>row.alert===true),events=normalized.filter(row=>row.outcome===1),episodes=alertEpisodes(alerts,episodeGapDays),horizonMs=horizon*DAY_MS,matchedLeadDays=[];
  let recalledEvents=0;
  for(const event of events){const matching=alerts.filter(alert=>alert.time<=event.time&&event.time-alert.time<=horizonMs&&cellsMatch(alert.cell,event.cell,allowedNeighborCells));if(matching.length){recalledEvents+=1;matchedLeadDays.push((event.time-matching[0].time)/DAY_MS)}}
  let hitEpisodes=0;
  for(const episode of episodes){if(events.some(event=>event.time>=episode.start&&event.time<=new Date(episode.end.getTime()+horizonMs)&&cellsMatch(episode.cell,event.cell,allowedNeighborCells)))hitEpisodes+=1}
  const uniqueDays=new Set(normalized.map(row=>row.time.toISOString().slice(0,10))),alertDays=new Set(alerts.map(row=>row.time.toISOString().slice(0,10))),falseAlertShare=episodes.length?(episodes.length-hitEpisodes)/episodes.length:0,backgroundLogloss=logLossFor('background'),modelLogloss=logLossFor('model');
  return Object.freeze({horizon_days:horizon,n_holdout_rows:normalized.length,n_target_events:events.length,n_alert_episodes:episodes.length,background_logloss:backgroundLogloss,model_logloss:modelLogloss,background_brier:brierFor('background'),model_brier:brierFor('model'),information_gain_nats_per_row:backgroundLogloss-modelLogloss,event_recall:events.length?recalledEvents/events.length:0,alert_precision:episodes.length?hitEpisodes/episodes.length:0,false_alert_fraction:falseAlertShare,false_alert_share:falseAlertShare,space_time_alarm_fraction:alerts.length/normalized.length,alert_day_fraction:uniqueDays.size?alertDays.size/uniqueDays.size:0,median_lead_days:median(matchedLeadDays),peak_window_hit_rate:events.length?events.filter(row=>row.peakHit===true).length/events.length:0,topk_region_recall:events.length?events.filter(row=>Number(row.regionRank)<=topK).length/events.length:0});
}
