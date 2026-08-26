import { runDecayNeighborModel } from './model.js';
import { calculateGeomagneticSignal, calculateQuiescenceSignal } from './research-signals.js';

const DAY=86_400_000;
const HISTORY_START=Date.parse('2005-01-01T00:00:00.000Z');
const MONTHS_PER_ANCHOR=1;
const M65_PARAMETERS=Object.freeze({productivityScale:.00002,temporalPower:.7,spatialDecayRings:1,temporalOffsetDays:.5,magnitudeExponent:.8,maxRing:0});

export const CHANGE_BASELINE=Object.freeze({
  version:'self-history-expanding-monthly-v1',
  historyStartUtc:'2005-01-01T00:00:00.000Z',
  anchorIntervalMonths:MONTHS_PER_ANCHOR,
  minimumHistoricalAnchors:24,
  minimumHistoryYears:2
});

function lowerBound(events,time){let low=0,high=events.length;while(low<high){const middle=(low+high)>>>1;if(events[middle][0]<time)low=middle+1;else high=middle}return low}

function previewValueAt(compactEvents,calculationTime,target,horizon){
  const end=lowerBound(compactEvents,calculationTime);
  if(end<3||calculationTime<=HISTORY_START)return null;
  const historyDays=Math.max(1,(calculationTime-HISTORY_START)/DAY);
  let historyCount=0,recent7=0,recent30=0,targetCount=0;
  for(let index=0;index<end;index++){
    const event=compactEvents[index],observedAt=Number.isFinite(event[6])?event[6]:event[0];
    if(observedAt>=calculationTime)continue;
    historyCount++;if(event[0]>=calculationTime-7*DAY)recent7++;if(event[0]>=calculationTime-30*DAY)recent30++;if(event[1]>=target)targetCount++;
  }
  if(historyCount<3)return null;
  const ordinaryBackground=historyCount/historyDays;
  const ordinaryActivity=Math.min(4,Math.max(.25,((recent7/7)/ordinaryBackground+(recent30/30)/ordinaryBackground)/2));
  const background=target===4.5?ordinaryBackground:(targetCount||.25)/(historyDays+2500);
  if(target===4.5)return 1-Math.exp(-background*ordinaryActivity*horizon);
  if(target!==6.5||horizon!==30)return 1-Math.exp(-background*horizon);
  const nearbyEvents=[];for(let index=lowerBound(compactEvents,calculationTime-60*DAY);index<end;index++){const event=compactEvents[index],observedAt=Number.isFinite(event[6])?event[6]:event[0];if(observedAt<calculationTime)nearbyEvents.push({ageDays:(calculationTime-event[0])/DAY,ring:0,magnitude:event[1]})}
  return runDecayNeighborModel({targetBackgroundDailyRate:background,nearbyEvents},horizon,M65_PARAMETERS).modelProbability;
}

function anchorsBefore(time){
  const anchors=[],date=new Date(HISTORY_START);date.setUTCMonth(date.getUTCMonth()+MONTHS_PER_ANCHOR);
  while(date.getTime()<time){anchors.push(date.getTime());date.setUTCMonth(date.getUTCMonth()+MONTHS_PER_ANCHOR)}
  return anchors;
}

function percentileRank(values,current){
  const tolerance=Math.max(1e-12,Math.abs(current)*1e-10);let lower=0,equal=0;
  for(const value of values){if(value<current-tolerance)lower++;else if(Math.abs(value-current)<=tolerance)equal++}
  return Math.round(1000*(lower+equal/2)/values.length)/10;
}

function changeAt(compactEvents,time,target,horizon){
  const current=previewValueAt(compactEvents,time,target,horizon),historySpanYears=(time-HISTORY_START)/(365.2425*DAY);
  if(current===null||historySpanYears<CHANGE_BASELINE.minimumHistoryYears)return Object.freeze({status:'insufficient-history',change_percentile:null,historical_anchor_count:0,preview_value:current});
  const historicalValues=[];
  for(const anchor of anchorsBefore(time)){const value=previewValueAt(compactEvents,anchor,target,horizon);if(value!==null)historicalValues.push(value)}
  if(historicalValues.length<CHANGE_BASELINE.minimumHistoricalAnchors)return Object.freeze({status:'insufficient-history',change_percentile:null,historical_anchor_count:historicalValues.length,preview_value:current});
  return Object.freeze({status:'available',change_percentile:percentileRank(historicalValues,current),historical_anchor_count:historicalValues.length,preview_value:current});
}

export function changeBand(percentile){if(!Number.isFinite(percentile))return 0;if(percentile<60)return 1;if(percentile<80)return 2;if(percentile<95)return 3;return 4}

export function changeLabel(percentile){return ['比較不能','平常域','やや上昇','上昇','大きく上昇'][changeBand(percentile)]}

export function calculateChangePreview(catalog,{forecastTime,targetMagnitude=6.5,horizonDays=30,geomagneticDataset=null}={}){
  const requestedTime=new Date(forecastTime).getTime(),latestCatalogTime=Number(catalog?.latestTimeUtcMs);
  if(!Number.isFinite(requestedTime))throw new TypeError('forecastTime must be valid');
  if(!Number.isFinite(latestCatalogTime)||catalog?.freshness?.complete===false) return Object.freeze({status:'catalog-incomplete',rows:Object.freeze([]),baseline:CHANGE_BASELINE});
  const calculationTime=Math.min(requestedTime,latestCatalogTime),target=Number(targetMagnitude),horizon=Math.max(1,Math.trunc(Number(horizonDays))),rows=[];
  for(const [cell,compactEvents] of Object.entries(catalog?.eventsByCell||{})){
    const current=changeAt(compactEvents,calculationTime,target,horizon),seven=changeAt(compactEvents,calculationTime-7*DAY,target,horizon),thirty=changeAt(compactEvents,calculationTime-30*DAY,target,horizon),quiescenceSignal=calculateQuiescenceSignal(compactEvents,{forecastTime:calculationTime});
    const delta7=current.change_percentile===null||seven.change_percentile===null?null:Math.round((current.change_percentile-seven.change_percentile)*10)/10;
    const trend=delta7===null?'unavailable':delta7>=5?'rising':delta7<=-5?'falling':'stable';
    rows.push(Object.freeze({cell_id:cell,target_magnitude:target,horizon_days:horizon,...current,change_band:changeBand(current.change_percentile),change_7d:seven.change_percentile,change_30d:thirty.change_percentile,change_7d_delta:delta7,trend,model_tier:target===6.5&&horizon===30?'development-approved':target===4.5?'research-activity':'comparison-baseline',quiescenceSignal}));
  }
  return Object.freeze({status:'available',requestedTimeUtc:new Date(requestedTime).toISOString(),calculationTimeUtc:new Date(calculationTime).toISOString(),futureDateClamped:requestedTime>latestCatalogTime,baseline:CHANGE_BASELINE,geomagneticSignal:calculateGeomagneticSignal(geomagneticDataset,{forecastTime:calculationTime}),rows:Object.freeze(rows)});
}
