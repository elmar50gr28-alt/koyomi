import { buildThermalAnomalyFeatures,EARTHQUAKE_THERMAL_MODEL_VERSION } from '../prediction-engine/thermal.js';

export const EARTHQUAKE_THERMAL_DATA_SCHEMA='koyomi-earthquake-thermal-research-v1';
const SHA256=/^[a-f0-9]{64}$/i;
const STATUS=new Set(['awaiting-authentication','collecting','available','failed']);
const unavailableReason=Object.freeze({
  'awaiting-authentication':'NASA Earthdata認証の設定後に取得を開始できます',
  collecting:'NASA衛星データを取得・集計中です',
  failed:'衛星データの取得または検証に失敗しました'
});

const finite=value=>value!==null&&value!==''&&Number.isFinite(Number(value));

export function validateThermalDataset(dataset){
  if(!dataset||dataset.schemaId!==EARTHQUAKE_THERMAL_DATA_SCHEMA||!STATUS.has(dataset.status))throw new TypeError('invalid earthquake thermal dataset');
  if(dataset.provider?.name!=='NASA AppEEARS'||dataset.provider?.products?.MODIS_LST!=='MOD11A1.061'||!dataset.provider?.sourceUrl)throw new TypeError('missing earthquake thermal provenance');
  if(!Number.isInteger(dataset.spatialResolution)||dataset.spatialResolution<0||dataset.spatialResolution>15||!dataset.observationsByCell||Array.isArray(dataset.observationsByCell))throw new TypeError('invalid earthquake thermal spatial data');
  const entries=Object.values(dataset.observationsByCell).flat();
  for(const item of entries){if(!Array.isArray(item)||item.length!==9||!item.slice(0,7).every(finite)||!Number.isInteger(item[7])||typeof item[8]!=='string')throw new TypeError('invalid compact thermal observation')}
  if(dataset.observationCount!==entries.length)throw new TypeError('thermal observation count mismatch');
  if(dataset.status==='available'){
    if(!entries.length||!Number.isFinite(Date.parse(dataset.coverageStartUtc))||!Number.isFinite(Date.parse(dataset.coverageEndUtc))||!SHA256.test(dataset.sha256||''))throw new TypeError('invalid available thermal dataset integrity');
  }else if(entries.length||dataset.sha256!==null)throw new TypeError('unavailable thermal dataset must not contain observations');
  return Object.freeze(dataset);
}

export async function loadThermalDataset(url='./data/world/earthquake-thermal-research-v1.json',fetcher=fetch){
  const response=await fetcher(url);if(!response.ok)throw new Error('earthquake thermal dataset unavailable');return validateThermalDataset(await response.json());
}

function expand(cellId,item){const flags=item[7];return Object.freeze({cellId,timeUtc:new Date(item[0]).toISOString(),nighttimeLSTK:Number(item[1]),localSolarHour:Number(item[2]),weatherAdjustmentK:Number(item[3]),sensorId:item[8],quality:Object.freeze({cloudFree:true,lstErrorK:Number(item[4]),viewAngleDegrees:Number(item[5]),emissivityError:Number(item[6])}),confounders:Object.freeze({fire:Boolean(flags&1),volcano:Boolean(flags&2),industrial:Boolean(flags&4),snow:Boolean(flags&8)})})}

export function calculateThermalSignal(dataset,{cellId,neighborCellIds=[],asOf,grid}={}){
  if(!dataset||dataset.status!=='available')return Object.freeze({modelVersion:EARTHQUAKE_THERMAL_MODEL_VERSION,status:'data-unavailable',reviewStatus:'research-only',cellId:String(cellId||''),positiveEvidence:0,negativeEvidence:0,scientificProbabilityContribution:0,reasonCode:dataset?.status||'dataset-missing',reason:unavailableReason[dataset?.status]||'地表熱データを取得できません'});
  if(!grid)return Object.freeze({modelVersion:EARTHQUAKE_THERMAL_MODEL_VERSION,status:'data-unavailable',reviewStatus:'research-only',cellId:String(cellId),positiveEvidence:0,negativeEvidence:0,scientificProbabilityContribution:0,reasonCode:'grid-missing',reason:'H3セルを熱観測へ対応づけられません'});
  const displayCellId=String(cellId),displayResolution=grid.resolution(displayCellId);
  if(displayResolution<dataset.spatialResolution)return Object.freeze({modelVersion:EARTHQUAKE_THERMAL_MODEL_VERSION,status:'data-unavailable',reviewStatus:'research-only',cellId:displayCellId,positiveEvidence:0,negativeEvidence:0,scientificProbabilityContribution:0,reasonCode:'resolution-mismatch',reason:`熱観測はH3解像度${dataset.spatialResolution}以上の表示で比較できます`});
  const observationCellId=displayResolution===dataset.spatialResolution?displayCellId:grid.parent(displayCellId,dataset.spatialResolution);
  const suppliedNeighbors=neighborCellIds.map(String).map(id=>grid.resolution(id)===dataset.spatialResolution?id:grid.parent(id,dataset.spatialResolution)),observationNeighborCellIds=[...new Set([...suppliedNeighbors,...grid.neighbors(observationCellId,1)].filter(id=>id!==observationCellId))],ids=[observationCellId,...observationNeighborCellIds],observations=ids.flatMap(id=>(dataset.observationsByCell[id]||[]).map(item=>expand(id,item))),signal=buildThermalAnomalyFeatures(observations,{cellId:observationCellId,neighborCellIds:observationNeighborCellIds,asOf});
  return Object.freeze({...signal,cellId:displayCellId,observationCellId,observationResolution:dataset.spatialResolution,provider:dataset.provider,retrievedAt:dataset.retrievedAt,dataQuality:dataset.dataQuality,sha256:dataset.sha256});
}
