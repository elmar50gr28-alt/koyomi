const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
export const BASELINE_MODEL_VERSION='earthquake-background-recent-rate-v1';
export const DECAY_NEIGHBOR_MODEL_VERSION='earthquake-m65-decay-neighbor-candidate-v1';

export function runBaselineModel(features,horizonDays=7){
  const horizon=Math.max(1,Math.trunc(Number(horizonDays))),backgroundProbability=clamp(1-Math.exp(-Math.max(0,features.backgroundDailyRate)*horizon),1e-9,1-1e-9),activityMultiplier=clamp((features.recentRateRatio7d+features.recentRateRatio30d)/2,0.25,4),modelProbability=clamp(1-Math.exp(-Math.max(0,features.backgroundDailyRate)*activityMultiplier*horizon),1e-9,1-1e-9);
  return Object.freeze({modelVersion:BASELINE_MODEL_VERSION,horizonDays:horizon,backgroundProbability,modelProbability,riskScore0To100:Math.round(clamp(activityMultiplier/4*100,0,100)*1000)/1000,topFactors:Object.freeze(['背景活動率','直近7日活動率','直近30日活動率'])});
}

export function runDecayNeighborModel({targetBackgroundDailyRate,nearbyEvents=[]},horizonDays=7,{productivityScale=.00002,temporalOffsetDays=.5,temporalPower=1.05,spatialDecayRings=.85,magnitudeExponent=.8,maxRing=2}={}){
  const horizon=Math.max(1,Math.trunc(Number(horizonDays))),backgroundRate=Math.max(0,Number(targetBackgroundDailyRate)||0);
  let triggeredDailyRate=0;
  for(const event of nearbyEvents){const age=Math.max(0,Number(event.ageDays)||0),ring=Math.max(0,Math.trunc(Number(event.ring)||0)),magnitude=Math.max(4.5,Number(event.magnitude)||4.5);if(ring>maxRing)continue;triggeredDailyRate+=productivityScale*10**(magnitudeExponent*(magnitude-4.5))*(age+temporalOffsetDays)**(-temporalPower)*Math.exp(-ring/spatialDecayRings)}
  const expectedCount=(backgroundRate+triggeredDailyRate)*horizon,modelProbability=clamp(1-Math.exp(-expectedCount),1e-9,1-1e-9),backgroundProbability=clamp(1-Math.exp(-backgroundRate*horizon),1e-9,1-1e-9);
  return Object.freeze({modelVersion:DECAY_NEIGHBOR_MODEL_VERSION,horizonDays:horizon,backgroundProbability,modelProbability,expectedCount,backgroundDailyRate:backgroundRate,triggeredDailyRate,topFactors:Object.freeze(['M6.5以上の長期背景率','時間減衰活動率','H3近傍活動率','地震規模'])});
}
