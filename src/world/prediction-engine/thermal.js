export const EARTHQUAKE_THERMAL_MODEL_VERSION='earthquake-thermal-anomaly-v1';
export const EARTHQUAKE_THERMAL_SOURCE_IDS=Object.freeze(['NASA-MOD11-LST-USER-GUIDE','NASA-FIRMS-ACTIVE-FIRE','DOI-10.1029/2020JB020108','DOI-10.1029/2011GL048282']);

const DAY=86_400_000;
const EPSILON=1e-12;
const clamp=(value,low=0,high=1)=>Math.min(high,Math.max(low,Number(value)||0));
const median=values=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2};
const dayOfYear=time=>{const date=new Date(time);return Math.floor((Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())-Date.UTC(date.getUTCFullYear(),0,0))/DAY)};
const seasonalDistance=(left,right)=>Math.min(Math.abs(left-right),366-Math.abs(left-right));
const hourDistance=(left,right)=>Math.min(Math.abs(left-right),24-Math.abs(left-right));

function normalizeObservation(item,cutoff){
  const quality=item?.quality||{},confounders=item?.confounders||{},numericFields=[item?.nighttimeLSTK,item?.localSolarHour,item?.weatherAdjustmentK,quality.lstErrorK,quality.viewAngleDegrees,quality.emissivityError];
  if(numericFields.some(value=>value===null||value===''||!Number.isFinite(Number(value)))||!item?.sensorId||['fire','volcano','industrial','snow'].some(key=>typeof confounders[key]!=='boolean'))return null;
  const time=Date.parse(item?.timeUtc),temperature=Number(item.nighttimeLSTK),localHour=Number(item.localSolarHour),weatherAdjustment=Number(item.weatherAdjustmentK);
  if(!Number.isFinite(time)||time>=cutoff||!item?.cellId)return null;
  if(localHour>6&&localHour<18)return null;
  const lstError=Number(quality.lstErrorK),viewAngle=Math.abs(Number(quality.viewAngleDegrees)),emissivityError=Math.abs(Number(quality.emissivityError));
  if(quality.cloudFree!==true||!Number.isFinite(lstError)||lstError>2||!Number.isFinite(viewAngle)||viewAngle>40||!Number.isFinite(emissivityError)||emissivityError>.02)return null;
  if(confounders.fire===true||confounders.volcano===true||confounders.industrial===true||confounders.snow===true)return null;
  const qualityWeight=clamp(1-.35*lstError/2-.2*viewAngle/40-.15*emissivityError/.02,.3,1);
  return Object.freeze({cellId:String(item.cellId),time,temperature:temperature-weatherAdjustment,localHour,sensorId:String(item.sensorId),qualityWeight});
}

function scoreCell(cellId,observations,{cutoff,recentWindowDays,seasonalWindowDays,localTimeToleranceHours,minimumBaselineSamples,anomalyZThreshold,minimumScaleK}){
  const recentStart=cutoff-recentWindowDays*DAY,cell=observations.filter(item=>item.cellId===cellId).sort((a,b)=>a.time-b.time),history=cell.filter(item=>item.time<recentStart),recent=cell.filter(item=>item.time>=recentStart),scores=[];
  for(const item of recent){
    const targetDay=dayOfYear(item.time),references=history.filter(reference=>reference.sensorId===item.sensorId&&seasonalDistance(dayOfYear(reference.time),targetDay)<=seasonalWindowDays&&hourDistance(reference.localHour,item.localHour)<=localTimeToleranceHours);
    if(references.length<minimumBaselineSamples)continue;
    const values=references.map(reference=>reference.temperature),center=median(values),mad=median(values.map(value=>Math.abs(value-center))),scale=Math.max(minimumScaleK,1.4826*(mad||0)),z=(item.temperature-center)/scale;
    scores.push(Object.freeze({timeUtc:new Date(item.time).toISOString(),z,baselineSamples:references.length,baselineMedianK:center,robustScaleK:scale,qualityWeight:item.qualityWeight}));
  }
  const positive=scores.filter(item=>item.z>=anomalyZThreshold),negative=scores.filter(item=>item.z<=-anomalyZThreshold);
  return Object.freeze({scores:Object.freeze(scores),positive:Object.freeze(positive),negative:Object.freeze(negative)});
}

const mean=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
const evidenceFor=(scores,threshold,persistence,coherence,quality,direction)=>{
  const excess=mean(scores.map(item=>Math.max(0,direction*item.z-threshold)));
  return clamp(excess/3)*persistence*coherence*quality;
};

export function buildThermalAnomalyFeatures(observations,{cellId,neighborCellIds=[],asOf,recentWindowDays=7,seasonalWindowDays=20,localTimeToleranceHours=1.5,spatialTimeToleranceHours=36,minimumBaselineSamples=30,minimumPersistentObservations=2,minimumNeighborCells=2,anomalyZThreshold=2.5,minimumScaleK=.5}={}){
  const cutoff=Date.parse(asOf);if(!cellId||!Number.isFinite(cutoff))throw new TypeError('cellId and valid asOf are required');
  if(recentWindowDays<1||seasonalWindowDays<1||localTimeToleranceHours<0||spatialTimeToleranceHours<0||minimumBaselineSamples<3||minimumPersistentObservations<1||minimumNeighborCells<1||anomalyZThreshold<=0||minimumScaleK<=0)throw new RangeError('invalid thermal anomaly configuration');
  const past=(Array.isArray(observations)?observations:[]).filter(item=>{const time=Date.parse(item?.timeUtc);return Number.isFinite(time)&&time<cutoff}),normalized=past.map(item=>normalizeObservation(item,cutoff)).filter(Boolean),target=scoreCell(String(cellId),normalized,{cutoff,recentWindowDays,seasonalWindowDays,localTimeToleranceHours,minimumBaselineSamples,anomalyZThreshold,minimumScaleK});
  if(!target.scores.length)return Object.freeze({modelVersion:EARTHQUAKE_THERMAL_MODEL_VERSION,sourceIds:EARTHQUAKE_THERMAL_SOURCE_IDS,status:normalized.some(item=>item.cellId===String(cellId))?'insufficient-history':'data-unavailable',reviewStatus:'research-only',cellId:String(cellId),positiveEvidence:0,negativeEvidence:0,scientificProbabilityContribution:0,reason:'比較可能な夜間地表面温度が不足しています'});
  const neighborScores=neighborCellIds.map(id=>scoreCell(String(id),normalized,{cutoff,recentWindowDays,seasonalWindowDays,localTimeToleranceHours,minimumBaselineSamples,anomalyZThreshold,minimumScaleK})).filter(result=>result.scores.length),withinTolerance=(left,right)=>Math.abs(Date.parse(left.timeUtc)-Date.parse(right.timeUtc))<=spatialTimeToleranceHours*36e5,coherent=(targetItems,neighborItems)=>targetItems.some(targetItem=>neighborItems.some(neighborItem=>withinTolerance(targetItem,neighborItem))),positiveNeighbors=neighborScores.filter(result=>coherent(target.positive,result.positive)).length,negativeNeighbors=neighborScores.filter(result=>coherent(target.negative,result.negative)).length,validNeighbors=neighborScores.length;
  if(validNeighbors<minimumNeighborCells)return Object.freeze({modelVersion:EARTHQUAKE_THERMAL_MODEL_VERSION,sourceIds:EARTHQUAKE_THERMAL_SOURCE_IDS,status:'insufficient-spatial-coverage',reviewStatus:'research-only',cellId:String(cellId),positiveEvidence:0,negativeEvidence:0,scientificProbabilityContribution:0,reason:'隣接セルの比較可能な観測が不足しています',observationCount:target.scores.length,validNeighborCells:validNeighbors});
  const positivePersistence=target.positive.length>=minimumPersistentObservations?clamp(target.positive.length/minimumPersistentObservations):0,negativePersistence=target.negative.length>=minimumPersistentObservations?clamp(target.negative.length/minimumPersistentObservations):0,positiveCoherence=positiveNeighbors>=minimumNeighborCells?positiveNeighbors/validNeighbors:0,negativeCoherence=negativeNeighbors>=minimumNeighborCells?negativeNeighbors/validNeighbors:0,quality=mean(target.scores.map(item=>item.qualityWeight)),positiveEvidence=evidenceFor(target.positive,anomalyZThreshold,positivePersistence,positiveCoherence,quality,1),negativeEvidence=evidenceFor(target.negative,anomalyZThreshold,negativePersistence,negativeCoherence,quality,-1),active=positiveEvidence>0||negativeEvidence>0;
  return Object.freeze({modelVersion:EARTHQUAKE_THERMAL_MODEL_VERSION,sourceIds:EARTHQUAKE_THERMAL_SOURCE_IDS,status:active?'candidate-active':'inactive',reviewStatus:'research-only',cellId:String(cellId),positiveEvidence,negativeEvidence,scientificProbabilityContribution:0,reason:active?'継続性と周辺一致を伴う熱異常候補です。地震前兆とは確定していません':'固定基準を満たす熱異常はありません',observationCount:target.scores.length,validNeighborCells:validNeighbors,positivePersistence,negativePersistence,positiveSpatialCoherence:positiveCoherence,negativeSpatialCoherence:negativeCoherence,quality,latestObservationUtc:target.scores.at(-1)?.timeUtc??null,diagnostics:Object.freeze({anomalyZThreshold,minimumBaselineSamples,recentWindowDays,spatialTimeToleranceHours,positiveScores:Object.freeze(target.positive.map(item=>item.z)),negativeScores:Object.freeze(target.negative.map(item=>item.z))})});
}

export function applyThermalCandidate({seismicProbability,horizonDays,thermalFeatures,coefficients={positive:0,negative:0}}={}){
  const probability=Number(seismicProbability),horizon=Math.trunc(Number(horizonDays));if(!(probability>=0&&probability<1)||horizon<1)throw new RangeError('valid seismic probability and horizon are required');
  const usable=['candidate-active','inactive'].includes(thermalFeatures?.status);if(!usable)return Object.freeze({modelVersion:EARTHQUAKE_THERMAL_MODEL_VERSION,sourceIds:EARTHQUAKE_THERMAL_SOURCE_IDS,status:'withheld',reviewStatus:'research-only',horizonDays:horizon,seismicProbability:probability,thermalModelProbability:null,thermalMultiplier:null,publishable:false,scientificProbabilityContribution:0,reason:thermalFeatures?.reason||'熱観測を評価できません'});
  const effect=clamp(Number(coefficients.positive)*Number(thermalFeatures.positiveEvidence)+Number(coefficients.negative)*Number(thermalFeatures.negativeEvidence),-2,2),multiplier=Math.exp(effect),expected=-Math.log(Math.max(EPSILON,1-probability)),candidate=1-Math.exp(-expected*multiplier);
  return Object.freeze({modelVersion:EARTHQUAKE_THERMAL_MODEL_VERSION,sourceIds:EARTHQUAKE_THERMAL_SOURCE_IDS,status:'candidate',reviewStatus:'research-only',horizonDays:horizon,seismicProbability:probability,thermalModelProbability:candidate,thermalMultiplier:multiplier,publishable:false,scientificProbabilityContribution:0,reason:'既存地震モデルとの差分検証専用です。公開予測には加算しません'});
}

function probabilityMetrics(rows,key){let logloss=0,brier=0;for(const row of rows){const probability=clamp(row[key],EPSILON,1-EPSILON),outcome=Number(row.outcome);logloss-=outcome*Math.log(probability)+(1-outcome)*Math.log(1-probability);brier+=(probability-outcome)**2}return Object.freeze({logloss:logloss/rows.length,brier:brier/rows.length})}

export function compareThermalIncrement(rows,{alertThreshold=.5}={}){
  if(!Array.isArray(rows)||!rows.length)throw new TypeError('thermal backtest rows are required');
  for(const row of rows)if(![0,1].includes(Number(row.outcome))||!(Number(row.seismicProbability)>=0&&Number(row.seismicProbability)<=1)||!(Number(row.thermalModelProbability)>=0&&Number(row.thermalModelProbability)<=1)||row.foldId==null)throw new TypeError('outcome, probabilities and foldId are required');
  const seismic=probabilityMetrics(rows,'seismicProbability'),thermal=probabilityMetrics(rows,'thermalModelProbability'),foldIds=[...new Set(rows.map(row=>String(row.foldId)))],folds=foldIds.map(foldId=>{const selected=rows.filter(row=>String(row.foldId)===foldId),base=probabilityMetrics(selected,'seismicProbability'),candidate=probabilityMetrics(selected,'thermalModelProbability');return Object.freeze({foldId,informationGain:base.logloss-candidate.logloss,brierImprovement:base.brier-candidate.brier,positive:base.logloss>candidate.logloss&&base.brier>candidate.brier})}),alarms=rows.filter(row=>typeof row.alert==='boolean'?row.alert:Number(row.thermalModelProbability)>=alertThreshold);
  return Object.freeze({modelVersion:EARTHQUAKE_THERMAL_MODEL_VERSION,n:rows.length,eventCount:rows.filter(row=>Number(row.outcome)===1).length,seismic,thermal,informationGain:seismic.logloss-thermal.logloss,brierImprovement:seismic.brier-thermal.brier,foldCount:folds.length,positiveFoldCount:folds.filter(fold=>fold.positive).length,folds:Object.freeze(folds),spaceTimeAlarmFraction:alarms.length/rows.length});
}

export function thermalCandidateGate(evaluation,{formulaLocked=false,realHoldoutExecuted=false,informationGainLower95=null,negativeControlsPassed=false,minimumEvents=50,minimumFolds=5,minimumPositiveFolds=4,maximumSpaceTimeAlarmFraction=.1}={}){
  const failures=[];if(formulaLocked!==true)failures.push('formula-not-locked');if(realHoldoutExecuted!==true)failures.push('real-holdout-required');if(!(Number(evaluation?.eventCount)>=minimumEvents))failures.push('insufficient-events');if(!(Number(evaluation?.informationGain)>0))failures.push('information-gain-not-positive');if(!(Number(evaluation?.brierImprovement)>0))failures.push('brier-not-improved');if(!(Number(evaluation?.foldCount)>=minimumFolds&&Number(evaluation?.positiveFoldCount)>=minimumPositiveFolds))failures.push('rolling-folds-not-stable');if(!(Number(informationGainLower95)>0))failures.push('confidence-bound-not-positive');if(!(Number(evaluation?.spaceTimeAlarmFraction)>=0&&Number(evaluation?.spaceTimeAlarmFraction)<=maximumSpaceTimeAlarmFraction))failures.push('alert-burden-too-high');if(negativeControlsPassed!==true)failures.push('negative-controls-required');return Object.freeze({accepted:failures.length===0,status:failures.length?'testing':'accepted',failures:Object.freeze(failures),modelVersion:EARTHQUAKE_THERMAL_MODEL_VERSION});
}
