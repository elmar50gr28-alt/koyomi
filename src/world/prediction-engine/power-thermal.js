export const EARTHQUAKE_POWER_THERMAL_MODEL_VERSION='earthquake-power-surface-residual-v1';
export const EARTHQUAKE_POWER_THERMAL_SOURCE_IDS=Object.freeze(['NASA-POWER-DAILY-API','NASA-POWER-MERRA2-GEOSIT']);

const DAY=86_400_000;
const clamp=(value,low=0,high=1)=>Math.min(high,Math.max(low,Number(value)||0));
const median=values=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2};
const dayOfYear=time=>{const date=new Date(time);return Math.floor((Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())-Date.UTC(date.getUTCFullYear(),0,0))/DAY)};
const seasonalDistance=(left,right)=>Math.min(Math.abs(left-right),366-Math.abs(left-right));
const finite=value=>value!==null&&value!==''&&Number.isFinite(Number(value))&&Number(value)!==-999;

function normalize(item,cutoff){
  const time=Date.parse(item?.timeUtc),values=[item?.skinTemperatureC,item?.airTemperatureC,item?.relativeHumidityPercent,item?.precipitationMm];
  if(!item?.cellId||!Number.isFinite(time)||time>=cutoff||values.some(value=>!finite(value)))return null;
  const humidity=Number(item.relativeHumidityPercent),precipitation=Number(item.precipitationMm);
  if(humidity<0||humidity>100||precipitation<0)return null;
  return Object.freeze({cellId:String(item.cellId),time,residual:Number(item.skinTemperatureC)-Number(item.airTemperatureC),humidity,wet:precipitation>=1});
}

function scoreCell(cellId,observations,{cutoff,recentWindowDays,seasonalWindowDays,humidityTolerance,minimumBaselineSamples,anomalyZThreshold,minimumScaleK}){
  const recentStart=cutoff-recentWindowDays*DAY,cell=observations.filter(item=>item.cellId===String(cellId)).sort((a,b)=>a.time-b.time),history=cell.filter(item=>item.time<recentStart),recent=cell.filter(item=>item.time>=recentStart),scores=[];
  for(const item of recent){
    const targetDay=dayOfYear(item.time),references=history.filter(reference=>seasonalDistance(dayOfYear(reference.time),targetDay)<=seasonalWindowDays&&Math.abs(reference.humidity-item.humidity)<=humidityTolerance&&reference.wet===item.wet);
    if(references.length<minimumBaselineSamples)continue;
    const values=references.map(reference=>reference.residual),center=median(values),mad=median(values.map(value=>Math.abs(value-center))),scale=Math.max(minimumScaleK,1.4826*(mad||0)),z=(item.residual-center)/scale;
    scores.push(Object.freeze({timeUtc:new Date(item.time).toISOString(),z,baselineSamples:references.length,residualC:item.residual,baselineMedianC:center,robustScaleC:scale}));
  }
  return Object.freeze({scores:Object.freeze(scores),positive:Object.freeze(scores.filter(item=>item.z>=anomalyZThreshold)),negative:Object.freeze(scores.filter(item=>item.z<=-anomalyZThreshold)),observationCount:cell.length,latestTime:cell.at(-1)?.time??null,recentObservationCount:recent.length});
}

export function buildPowerThermalFeatures(observations,{cellId,neighborCellIds=[],asOf,recentWindowDays=7,seasonalWindowDays=45,humidityTolerance=20,minimumBaselineSamples=30,minimumPersistentObservations=2,minimumNeighborCells=2,spatialTimeToleranceDays=2,anomalyZThreshold=2.5,minimumScaleK=.5}={}){
  const cutoff=Date.parse(asOf);if(!cellId||!Number.isFinite(cutoff))throw new TypeError('cellId and valid asOf are required');
  if(recentWindowDays<1||seasonalWindowDays<1||humidityTolerance<0||minimumBaselineSamples<3||minimumPersistentObservations<1||minimumNeighborCells<1||spatialTimeToleranceDays<0||anomalyZThreshold<=0||minimumScaleK<=0)throw new RangeError('invalid POWER thermal configuration');
  const normalized=(Array.isArray(observations)?observations:[]).map(item=>normalize(item,cutoff)).filter(Boolean),options={cutoff,recentWindowDays,seasonalWindowDays,humidityTolerance,minimumBaselineSamples,anomalyZThreshold,minimumScaleK},target=scoreCell(cellId,normalized,options);
  const base={modelVersion:EARTHQUAKE_POWER_THERMAL_MODEL_VERSION,sourceIds:EARTHQUAKE_POWER_THERMAL_SOURCE_IDS,reviewStatus:'research-only',cellId:String(cellId),scientificProbabilityContribution:0,signalKind:'daily-surface-air-temperature-residual',limitations:Object.freeze(['daily-analysis-data','not-direct-satellite-lst','fire-volcano-industrial-masks-not-applied'])};
  if(!target.scores.length){const stale=target.observationCount>0&&target.latestTime<cutoff-recentWindowDays*DAY,status=!target.observationCount?'data-unavailable':stale?'stale-data':'insufficient-history',reason=stale?'直近7日内のNASA POWER日次解析値がありません':'同季節・同湿度・同降水区分の比較履歴が不足しています';return Object.freeze({...base,status,positiveEvidence:0,negativeEvidence:0,reason,latestObservationUtc:target.latestTime===null?null:new Date(target.latestTime).toISOString()})}
  const neighborScores=neighborCellIds.map(id=>scoreCell(id,normalized,options)).filter(result=>result.scores.length),tolerance=spatialTimeToleranceDays*DAY,coherent=(targetItems,neighborItems)=>targetItems.some(left=>neighborItems.some(right=>Math.abs(Date.parse(left.timeUtc)-Date.parse(right.timeUtc))<=tolerance)),positiveNeighbors=neighborScores.filter(result=>coherent(target.positive,result.positive)).length,negativeNeighbors=neighborScores.filter(result=>coherent(target.negative,result.negative)).length;
  if(neighborScores.length<minimumNeighborCells)return Object.freeze({...base,status:'insufficient-spatial-coverage',positiveEvidence:0,negativeEvidence:0,reason:'周辺セルのNASA POWER比較履歴が不足しています',observationCount:target.scores.length,validNeighborCells:neighborScores.length});
  const evidence=(scores,neighbors,direction)=>{const persistent=scores.length>=minimumPersistentObservations?clamp(scores.length/minimumPersistentObservations):0,spatial=neighbors>=minimumNeighborCells?neighbors/neighborScores.length:0,excess=scores.length?scores.reduce((sum,item)=>sum+Math.max(0,direction*item.z-anomalyZThreshold),0)/scores.length:0;return clamp(excess/3)*persistent*spatial};
  const positiveEvidence=evidence(target.positive,positiveNeighbors,1),negativeEvidence=evidence(target.negative,negativeNeighbors,-1),active=positiveEvidence>0||negativeEvidence>0;
  return Object.freeze({...base,status:active?'candidate-active':'inactive',positiveEvidence,negativeEvidence,reason:active?'NASA POWERの日次地表面温度と気温の差に、継続性と周辺一致を伴う異常候補があります。衛星LSTそのものではありません':'固定基準を満たす日次地表熱残差はありません',observationCount:target.scores.length,validNeighborCells:neighborScores.length,latestObservationUtc:target.latestTime===null?null:new Date(target.latestTime).toISOString(),quality:clamp(Math.min(...target.scores.map(item=>item.baselineSamples))/60),diagnostics:Object.freeze({anomalyZThreshold,minimumBaselineSamples,recentWindowDays,seasonalWindowDays,humidityTolerance,positiveScores:Object.freeze(target.positive.map(item=>item.z)),negativeScores:Object.freeze(target.negative.map(item=>item.z))})});
}
