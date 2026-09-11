import { buildThermalAnomalyFeatures,EARTHQUAKE_THERMAL_MODEL_VERSION } from '../prediction-engine/thermal.js';
import { buildPowerThermalFeatures,EARTHQUAKE_POWER_THERMAL_MODEL_VERSION } from '../prediction-engine/power-thermal.js';

export const EARTHQUAKE_THERMAL_DATA_SCHEMA='koyomi-earthquake-thermal-research-v1';
export const EARTHQUAKE_THERMAL_PUBLIC_DATA_SCHEMA='koyomi-earthquake-thermal-public-v1';
const SHA256=/^[a-f0-9]{64}$/i;
const STATUS=new Set(['awaiting-authentication','collecting','available','failed']);
const unavailableReason=Object.freeze({
  'awaiting-authentication':'NASA Earthdata認証の設定後に取得を開始できます',
  collecting:'NASA衛星データを取得・集計中です',
  failed:'熱データの取得または検証に失敗しました'
});

const finite=value=>value!==null&&value!==''&&Number.isFinite(Number(value));

function validateHeader(dataset){
  if(!dataset||!STATUS.has(dataset.status))throw new TypeError('invalid earthquake thermal dataset');
  if(!Number.isInteger(dataset.spatialResolution)||dataset.spatialResolution<0||dataset.spatialResolution>15||!dataset.observationsByCell||Array.isArray(dataset.observationsByCell))throw new TypeError('invalid earthquake thermal spatial data');
}

function validateAppEearsDataset(dataset){
  validateHeader(dataset);
  if(dataset.provider?.name!=='NASA AppEEARS'||dataset.provider?.products?.MODIS_LST!=='MOD11A1.061'||!dataset.provider?.sourceUrl)throw new TypeError('missing earthquake thermal provenance');
  const entries=Object.values(dataset.observationsByCell).flat();
  for(const item of entries){if(!Array.isArray(item)||item.length!==9||!item.slice(0,7).every(finite)||!Number.isInteger(item[7])||typeof item[8]!=='string')throw new TypeError('invalid compact thermal observation')}
  if(dataset.observationCount!==entries.length)throw new TypeError('thermal observation count mismatch');
  if(dataset.status==='available'){
    if(!entries.length||!Number.isFinite(Date.parse(dataset.coverageStartUtc))||!Number.isFinite(Date.parse(dataset.coverageEndUtc))||!SHA256.test(dataset.sha256||''))throw new TypeError('invalid available thermal dataset integrity');
  }else if(entries.length||dataset.sha256!==null)throw new TypeError('unavailable thermal dataset must not contain observations');
  return Object.freeze(dataset);
}

function validatePowerDataset(dataset){
  validateHeader(dataset);
  const expected=['TS','T2M','RH2M','PRECTOTCORR'];
  if(dataset.provider?.name!=='NASA POWER'||dataset.provider?.method!=='daily-surface-air-temperature-residual'||!dataset.provider?.sourceUrl||!expected.every(parameter=>dataset.provider?.parameters?.includes(parameter)))throw new TypeError('missing NASA POWER thermal provenance');
  if(dataset.himawariAvailability?.provider!=='NOAA Open Data / JMA Himawari-9'||dataset.himawariAvailability?.usedInSignal!==false||!dataset.himawariAvailability?.sourceUrl)throw new TypeError('invalid Himawari availability provenance');
  const entries=Object.values(dataset.observationsByCell).flat();
  for(const item of entries){if(!Array.isArray(item)||item.length!==5||!item.every(finite)||Number(item[3])<0||Number(item[3])>100||Number(item[4])<0)throw new TypeError('invalid compact NASA POWER observation')}
  if(dataset.observationCount!==entries.length)throw new TypeError('thermal observation count mismatch');
  if(dataset.status==='available'){
    if(!entries.length||!Number.isFinite(Date.parse(dataset.coverageStartUtc))||!Number.isFinite(Date.parse(dataset.coverageEndUtc))||!SHA256.test(dataset.sha256||''))throw new TypeError('invalid available thermal dataset integrity');
  }else if(entries.length||dataset.sha256!==null)throw new TypeError('unavailable thermal dataset must not contain observations');
  return Object.freeze(dataset);
}

export function validateThermalDataset(dataset){
  if(dataset?.schemaId===EARTHQUAKE_THERMAL_DATA_SCHEMA)return validateAppEearsDataset(dataset);
  if(dataset?.schemaId===EARTHQUAKE_THERMAL_PUBLIC_DATA_SCHEMA)return validatePowerDataset(dataset);
  throw new TypeError('invalid earthquake thermal dataset');
}

export async function loadThermalDataset(url='./data/world/earthquake-thermal-public-v1.json',fetcher=fetch){
  const response=await fetcher(url);if(!response.ok)throw new Error('earthquake thermal dataset unavailable');return validateThermalDataset(await response.json());
}

function expand(cellId,item){const flags=item[7];return Object.freeze({cellId,timeUtc:new Date(item[0]).toISOString(),nighttimeLSTK:Number(item[1]),localSolarHour:Number(item[2]),weatherAdjustmentK:Number(item[3]),sensorId:item[8],quality:Object.freeze({cloudFree:true,lstErrorK:Number(item[4]),viewAngleDegrees:Number(item[5]),emissivityError:Number(item[6])}),confounders:Object.freeze({fire:Boolean(flags&1),volcano:Boolean(flags&2),industrial:Boolean(flags&4),snow:Boolean(flags&8)})})}
function expandPower(cellId,item){return Object.freeze({cellId,timeUtc:new Date(item[0]).toISOString(),skinTemperatureC:Number(item[1]),airTemperatureC:Number(item[2]),relativeHumidityPercent:Number(item[3]),precipitationMm:Number(item[4])})}

export function calculateThermalSignal(dataset,{cellId,neighborCellIds=[],asOf,grid}={}){
  const publicData=dataset?.schemaId===EARTHQUAKE_THERMAL_PUBLIC_DATA_SCHEMA,modelVersion=publicData?EARTHQUAKE_POWER_THERMAL_MODEL_VERSION:EARTHQUAKE_THERMAL_MODEL_VERSION;
  if(!dataset||dataset.status!=='available')return Object.freeze({modelVersion,status:'data-unavailable',reviewStatus:'research-only',cellId:String(cellId||''),positiveEvidence:0,negativeEvidence:0,scientificProbabilityContribution:0,reasonCode:dataset?.status||'dataset-missing',reason:unavailableReason[dataset?.status]||'地表熱データを取得できません'});
  if(!grid)return Object.freeze({modelVersion,status:'data-unavailable',reviewStatus:'research-only',cellId:String(cellId),positiveEvidence:0,negativeEvidence:0,scientificProbabilityContribution:0,reasonCode:'grid-missing',reason:'H3セルを熱観測へ対応づけられません'});
  const displayCellId=String(cellId),displayResolution=grid.resolution(displayCellId);
  if(displayResolution<dataset.spatialResolution)return Object.freeze({modelVersion,status:'data-unavailable',reviewStatus:'research-only',cellId:displayCellId,positiveEvidence:0,negativeEvidence:0,scientificProbabilityContribution:0,reasonCode:'resolution-mismatch',reason:`熱観測はH3解像度${dataset.spatialResolution}以上の表示で比較できます`});
  const observationCellId=displayResolution===dataset.spatialResolution?displayCellId:grid.parent(displayCellId,dataset.spatialResolution);
  const suppliedNeighbors=neighborCellIds.map(String).map(id=>grid.resolution(id)===dataset.spatialResolution?id:grid.parent(id,dataset.spatialResolution)),observationNeighborCellIds=[...new Set([...suppliedNeighbors,...grid.neighbors(observationCellId,1)].filter(id=>id!==observationCellId))],ids=[observationCellId,...observationNeighborCellIds],observations=ids.flatMap(id=>(dataset.observationsByCell[id]||[]).map(item=>publicData?expandPower(id,item):expand(id,item))),signal=publicData?buildPowerThermalFeatures(observations,{cellId:observationCellId,neighborCellIds:observationNeighborCellIds,asOf}):buildThermalAnomalyFeatures(observations,{cellId:observationCellId,neighborCellIds:observationNeighborCellIds,asOf});
  return Object.freeze({...signal,cellId:displayCellId,observationCellId,observationResolution:dataset.spatialResolution,provider:dataset.provider,retrievedAt:dataset.retrievedAt,dataQuality:dataset.dataQuality,sha256:dataset.sha256,himawariAvailability:dataset.himawariAvailability||null});
}
