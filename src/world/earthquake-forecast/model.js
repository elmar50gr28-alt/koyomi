const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
export const BASELINE_MODEL_VERSION='earthquake-background-recent-rate-v1';

export function runBaselineModel(features,horizonDays=7){
  const horizon=Math.max(1,Math.trunc(Number(horizonDays))),backgroundProbability=clamp(1-Math.exp(-Math.max(0,features.backgroundDailyRate)*horizon),1e-9,1-1e-9),activityMultiplier=clamp((features.recentRateRatio7d+features.recentRateRatio30d)/2,0.25,4),modelProbability=clamp(1-Math.exp(-Math.max(0,features.backgroundDailyRate)*activityMultiplier*horizon),1e-9,1-1e-9);
  return Object.freeze({modelVersion:BASELINE_MODEL_VERSION,horizonDays:horizon,backgroundProbability,modelProbability,riskScore0To100:Math.round(clamp(activityMultiplier/4*100,0,100)*1000)/1000,topFactors:Object.freeze(['背景活動率','直近7日活動率','直近30日活動率'])});
}
