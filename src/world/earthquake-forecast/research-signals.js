const DAY=86_400_000;
const HISTORY_START=Date.parse('2005-01-01T00:00:00.000Z');

export const RESEARCH_SIGNAL_DEFINITIONS=Object.freeze({
  version:'earthquake-independent-research-signals-v1',
  quiescence:Object.freeze({minimumHistoryDays:365,minimumPriorCount:3,activationRatio:2,dropRatioThreshold:.65,currentWindowDays:5,priorWindowDays:7}),
  geomagnetic:Object.freeze({lagStartDays:7,lagEndDays:21,referenceLagDays:15,controlLagDays:Object.freeze([27,54]),minimumBaselineRecords:30})
});

function observedBefore(event,time){return event[0]<time&&(Number.isFinite(event[6])?event[6]:event[0])<time}
function countSince(events,time,days){return events.reduce((count,event)=>count+(event[0]>=time-days*DAY?1:0),0)}
function percentileRank(values,current){if(!values.length||!Number.isFinite(current))return null;let lower=0,equal=0;for(const value of values){if(value<current-1e-12)lower++;else if(Math.abs(value-current)<=1e-12)equal++}return Math.round(1000*(lower+equal/2)/values.length)/10}

function transitionAt(compactEvents,time){
  const definition=RESEARCH_SIGNAL_DEFINITIONS.quiescence,history=compactEvents.filter(event=>observedBefore(event,time)),historyDays=(time-HISTORY_START)/DAY;
  if(historyDays<definition.minimumHistoryDays||history.length<12)return null;
  const backgroundDailyRate=history.length/Math.max(1,historyDays),currentStart=time-definition.currentWindowDays*DAY,priorStart=currentStart-definition.priorWindowDays*DAY;
  const currentCount=history.reduce((count,event)=>count+(event[0]>=currentStart?1:0),0),priorCount=history.reduce((count,event)=>count+(event[0]>=priorStart&&event[0]<currentStart?1:0),0);
  const currentRate=currentCount/definition.currentWindowDays,priorRate=priorCount/definition.priorWindowDays,activityDropRatio=priorRate>0?Math.max(0,Math.min(1,1-currentRate/priorRate)):0;
  const hadActivation=priorCount>=definition.minimumPriorCount&&priorRate>=backgroundDailyRate*definition.activationRatio,active=hadActivation&&activityDropRatio>=definition.dropRatioThreshold;
  return{backgroundDailyRate,currentCount,priorCount,currentRate,priorRate,peakRecentActivity:Math.max(currentRate,priorRate),activityDropRatio,hadActivation,active};
}

export function calculateQuiescenceSignal(compactEvents,{forecastTime}={}){
  const time=new Date(forecastTime).getTime();if(!Number.isFinite(time))throw new TypeError('forecastTime must be valid');
  const eligible=(compactEvents||[]).filter(event=>observedBefore(event,time)),current=transitionAt(compactEvents||[],time);
  const recent30=eligible.filter(event=>event[0]>=time-30*DAY),observation={activity3d:countSince(eligible,time,3),activity5d:countSince(eligible,time,5),activity7d:countSince(eligible,time,7),activity14d:countSince(eligible,time,14),activity30d:recent30.length,maximumMagnitude:recent30.length?Math.max(...recent30.map(event=>event[1])):null,latestEarthquakeUtc:eligible.length?new Date(eligible.at(-1)[0]).toISOString():null};
  if(!current)return Object.freeze({status:'insufficient-history',signal0To100:null,dropPercentile:null,quiescenceStartUtc:null,quiescenceDurationDays:null,observation:Object.freeze(observation),calculation:null,definitionVersion:RESEARCH_SIGNAL_DEFINITIONS.version});
  const historicalDrops=[];for(let anchor=HISTORY_START+365*DAY;anchor<time;anchor+=30*DAY){const transition=transitionAt(compactEvents||[],anchor);if(transition?.hadActivation)historicalDrops.push(transition.activityDropRatio)}
  const dropPercentile=percentileRank(historicalDrops,current.activityDropRatio),latestTime=eligible.at(-1)?.[0],duration=current.active&&latestTime?Math.round(Math.min(30,(time-latestTime)/DAY)*10)/10:null;
  return Object.freeze({status:current.active?'available':'inactive',signal0To100:current.active?Math.round((dropPercentile??current.activityDropRatio*100)*10)/10:0,dropPercentile,currentActivityPercentile:null,quiescenceStartUtc:current.active?new Date(time-RESEARCH_SIGNAL_DEFINITIONS.quiescence.currentWindowDays*DAY).toISOString():null,quiescenceDurationDays:duration,observation:Object.freeze(observation),calculation:Object.freeze(current),definitionVersion:RESEARCH_SIGNAL_DEFINITIONS.version});
}

function closestObservation(observations,target,maxDistanceDays=1.5){let selected=null,distance=Infinity;for(const item of observations){const next=Math.abs(item.time-target);if(next<distance){selected=item;distance=next}}return distance<=maxDistanceDays*DAY?selected:null}

export function calculateGeomagneticSignal(dataset,{forecastTime}={}){
  const time=new Date(forecastTime).getTime();if(!Number.isFinite(time))throw new TypeError('forecastTime must be valid');
  if(!dataset||!Array.isArray(dataset.observations))return Object.freeze({status:'data-unavailable',signal0To100:null,definitionVersion:RESEARCH_SIGNAL_DEFINITIONS.version,global:true,provider:null});
  const observations=dataset.observations.map(item=>({time:Date.parse(item.timeUtc),kp:Number(item.kp),dst:item.dst==null?null:Number(item.dst)})).filter(item=>Number.isFinite(item.time)&&item.time<time&&Number.isFinite(item.kp)).sort((a,b)=>a.time-b.time),definition=RESEARCH_SIGNAL_DEFINITIONS.geomagnetic;
  const baseline=observations.filter(item=>item.time<time-definition.lagEndDays*DAY);if(baseline.length<definition.minimumBaselineRecords)return Object.freeze({status:'insufficient-history',signal0To100:null,definitionVersion:RESEARCH_SIGNAL_DEFINITIONS.version,global:true,provider:dataset.provider||null});
  const mean=baseline.reduce((sum,item)=>sum+item.kp,0)/baseline.length,variance=baseline.reduce((sum,item)=>sum+(item.kp-mean)**2,0)/baseline.length,std=Math.sqrt(variance)||1;
  const lagWindow=observations.filter(item=>item.time>=time-definition.lagEndDays*DAY&&item.time<=time-definition.lagStartDays*DAY).map(item=>({...item,anomaly:(item.kp-mean)/std})),strongest=lagWindow.sort((a,b)=>b.anomaly-a.anomaly)[0]||null,reference=closestObservation(observations,time-definition.referenceLagDays*DAY),controls=Object.fromEntries(definition.controlLagDays.map(days=>[days,closestObservation(observations,time-days*DAY)]));
  if(!strongest)return Object.freeze({status:'data-unavailable',signal0To100:null,definitionVersion:RESEARCH_SIGNAL_DEFINITIONS.version,global:true,provider:dataset.provider||null});
  const historicalAnomalies=baseline.map(item=>(item.kp-mean)/std),percentile=percentileRank(historicalAnomalies,strongest.anomaly),signal=Math.max(0,Math.min(100,percentile??0));
  return Object.freeze({status:signal>=60?'available':'inactive',signal0To100:Math.round(signal*10)/10,geomagneticLagPercentile:percentile,strongestLagDays:Math.round((time-strongest.time)/DAY*10)/10,kpAtStrongestLag:strongest.kp,dstAtStrongestLag:strongest.dst,anomalyAt15d:reference?(reference.kp-mean)/std:null,lag27Control:controls[27]?.kp??null,lag54Control:controls[54]?.kp??null,observationTimeUtc:new Date(strongest.time).toISOString(),definitionVersion:RESEARCH_SIGNAL_DEFINITIONS.version,global:true,provider:dataset.provider||null,retrievedAt:dataset.retrievedAt||null,sha256:dataset.sha256||null,dataQuality:dataset.dataQuality??null});
}

export function calculateIndependentResearchSignals(compactEvents,{forecastTime,geomagneticDataset=null}={}){return Object.freeze({coreForecast:null,changeSignal:null,quiescenceSignal:calculateQuiescenceSignal(compactEvents,{forecastTime}),geomagneticSignal:calculateGeomagneticSignal(geomagneticDataset,{forecastTime})})}
