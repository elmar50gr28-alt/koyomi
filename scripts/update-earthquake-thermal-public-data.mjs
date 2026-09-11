import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSpatialGrid } from '../src/world/spatial-grid.js';
import { validateThermalDataset } from '../src/world/earthquake-forecast/thermal-data.js';

export const POWER_API='https://power.larc.nasa.gov/api/temporal/daily/point';
export const HIMAWARI_BUCKET='https://noaa-himawari9.s3.amazonaws.com';
export const POWER_PARAMETERS=Object.freeze(['TS','T2M','RH2M','PRECTOTCORR']);
const OUTPUT=resolve('data/world/earthquake-thermal-public-v1.json'),DAY=86_400_000,DEFAULT_START='2024-01-01';
const finite=value=>value!==null&&value!==''&&Number.isFinite(Number(value))&&Number(value)!==-999;
const dateKey=value=>new Date(value).toISOString().slice(0,10).replaceAll('-','');
const isoDay=value=>`${String(value).slice(0,4)}-${String(value).slice(4,6)}-${String(value).slice(6,8)}T00:00:00.000Z`;
const delay=milliseconds=>new Promise(resolveDelay=>setTimeout(resolveDelay,milliseconds));

async function fetchRetry(url,{fetcher=fetch,attempts=4}={}){
  let lastError;
  for(let attempt=0;attempt<attempts;attempt+=1){
    try{const response=await fetcher(url);if(response.ok)return response;if(response.status!==429&&response.status<500)throw new Error(`request failed: ${response.status}`);lastError=new Error(`request failed: ${response.status}`)}catch(error){lastError=error}
    if(attempt+1<attempts)await delay(300*(2**attempt));
  }
  throw lastError;
}

export function buildPowerCells({grid=createSpatialGrid(),resolution=2,bounds={south:20,north:48,west:122,east:154}}={}){
  return Object.freeze(grid.viewportCells(bounds,resolution,1000).sort().map(id=>Object.freeze({id,...grid.center(id)})));
}

export function powerPointUrl({latitude,longitude,start,end}){
  const query=new URLSearchParams({parameters:POWER_PARAMETERS.join(','),community:'AG',longitude:String(longitude),latitude:String(latitude),start:dateKey(start),end:dateKey(end),format:'JSON','time-standard':'UTC'});
  return `${POWER_API}?${query}`;
}

export function parsePowerPoint(payload,cellId){
  const parameters=payload?.properties?.parameter||{};
  if(!POWER_PARAMETERS.every(parameter=>parameters[parameter]&&typeof parameters[parameter]==='object'))throw new TypeError(`NASA POWER parameters missing for ${cellId}`);
  const dates=[...new Set(POWER_PARAMETERS.flatMap(parameter=>Object.keys(parameters[parameter])))].sort(),rows=[];
  for(const date of dates){const values=POWER_PARAMETERS.map(parameter=>parameters[parameter][date]);if(values.every(finite)&&Number(values[2])>=0&&Number(values[2])<=100&&Number(values[3])>=0)rows.push([Date.parse(isoDay(date)),...values.map(Number)])}
  if(!rows.length)throw new Error(`NASA POWER returned no complete observations for ${cellId}`);
  const latitude=Number(payload.geometry?.coordinates?.[1]),longitude=Number(payload.geometry?.coordinates?.[0]);if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw new Error(`NASA POWER coordinates missing for ${cellId}`);
  return Object.freeze({rows:Object.freeze(rows),coordinates:Object.freeze({latitude,longitude}),sources:Object.freeze([...(payload.header?.sources||[])])});
}

export async function fetchPowerCell(cell,{start,end,fetcher=fetch}={}){
  const response=await fetchRetry(powerPointUrl({...cell,start,end}),{fetcher}),payload=await response.json(),parsed=parsePowerPoint(payload,cell.id);
  if(!parsed.sources.some(source=>['MERRA2','GEOSIT'].includes(String(source))))throw new Error(`NASA POWER source provenance missing for ${cell.id}`);
  return Object.freeze({cellId:cell.id,...parsed});
}

const xmlValues=(xml,tag)=>[...String(xml).matchAll(new RegExp(`<${tag}>([^<]+)</${tag}>`,'g'))].map(match=>match[1].replaceAll('&amp;','&'));
export function parseHimawariListing(xml){return Object.freeze({prefixes:Object.freeze(xmlValues(xml,'Prefix')),keys:Object.freeze(xmlValues(xml,'Key')),lastModified:Object.freeze(xmlValues(xml,'LastModified'))})}

export async function checkHimawariAvailability({asOf=new Date(),fetcher=fetch}={}){
  for(let offset=0;offset<3;offset+=1){
    const day=new Date(asOf.getTime()-offset*DAY),prefix=`AHI-L1b-Japan/${day.getUTCFullYear()}/${String(day.getUTCMonth()+1).padStart(2,'0')}/${String(day.getUTCDate()).padStart(2,'0')}/`,listing=await fetchRetry(`${HIMAWARI_BUCKET}/?list-type=2&delimiter=%2F&prefix=${encodeURIComponent(prefix)}`,{fetcher}),folders=parseHimawariListing(await listing.text()).prefixes.filter(item=>item!==prefix).sort();
    if(!folders.length)continue;
    const latestPrefix=folders.at(-1),filesResponse=await fetchRetry(`${HIMAWARI_BUCKET}/?list-type=2&max-keys=100&prefix=${encodeURIComponent(latestPrefix)}`,{fetcher}),files=parseHimawariListing(await filesResponse.text()),bands=[...new Set(files.keys.map(key=>key.match(/B(\d{2})/)?.[1]).filter(Boolean))].sort();
    return Object.freeze({provider:'NOAA Open Data / JMA Himawari-9',sourceUrl:'https://registry.opendata.aws/noaa-himawari/',bucketUrl:HIMAWARI_BUCKET,status:files.keys.length?'available':'unavailable',checkedAt:new Date(asOf).toISOString(),latestPrefix,latestObjectModifiedUtc:[...files.lastModified].sort().at(-1)||null,availableBands:bands,usedInSignal:false,reason:'ひまわり9号HSD公開データの到達確認のみ。バイナリ値は本モデルの数値計算に未使用です'});
  }
  return Object.freeze({provider:'NOAA Open Data / JMA Himawari-9',sourceUrl:'https://registry.opendata.aws/noaa-himawari/',bucketUrl:HIMAWARI_BUCKET,status:'unavailable',checkedAt:new Date(asOf).toISOString(),latestPrefix:null,latestObjectModifiedUtc:null,availableBands:[],usedInSignal:false,reason:'直近3日分の公開オブジェクトを確認できませんでした'});
}

const mergeRows=(oldRows,newRows,retentionStart)=>{const rows=new Map([...(oldRows||[]),...(newRows||[])].filter(row=>Number(row[0])>=retentionStart).map(row=>[Number(row[0]),row]));return [...rows.values()].sort((a,b)=>a[0]-b[0])};
const canonical=value=>JSON.stringify(value);

export async function generatePowerThermalDataset({existing=null,fetcher=fetch,grid=createSpatialGrid(),asOf=new Date(),start=DEFAULT_START,end=new Date(asOf.getTime()-DAY),cells=buildPowerCells({grid})}={}){
  const retentionStart=Date.parse(`${start}T00:00:00Z`),existingEnd=existing?.status==='available'?Date.parse(existing.coverageEndUtc):NaN,requestStart=Number.isFinite(existingEnd)?new Date(Math.max(retentionStart,existingEnd-7*DAY)):new Date(retentionStart),requestEnd=new Date(end);
  if(!Number.isFinite(retentionStart)||!Number.isFinite(requestEnd.getTime())||requestEnd<requestStart)throw new RangeError('invalid NASA POWER date range');
  const results=[];let cursor=0;
  async function worker(){while(cursor<cells.length){const index=cursor++;results[index]=await fetchPowerCell(cells[index],{start:requestStart,end:requestEnd,fetcher})}}
  await Promise.all(Array.from({length:Math.min(4,cells.length)},()=>worker()));
  const observationsByCell={},coordinatesByCell={},sources=new Set();
  for(const result of results){observationsByCell[result.cellId]=mergeRows(existing?.observationsByCell?.[result.cellId],result.rows,retentionStart);coordinatesByCell[result.cellId]=result.coordinates;result.sources.forEach(source=>sources.add(source))}
  const allRows=Object.values(observationsByCell).flat(),times=allRows.map(row=>Number(row[0])),observationCount=allRows.length,sha256=createHash('sha256').update(canonical(observationsByCell)).digest('hex'),himawariAvailability=await checkHimawariAvailability({asOf,fetcher}).catch(error=>Object.freeze({provider:'NOAA Open Data / JMA Himawari-9',sourceUrl:'https://registry.opendata.aws/noaa-himawari/',bucketUrl:HIMAWARI_BUCKET,status:'unavailable',checkedAt:new Date(asOf).toISOString(),latestPrefix:null,latestObjectModifiedUtc:null,availableBands:[],usedInSignal:false,reason:`到達確認失敗: ${error.message}`}));
  const expectedDays=Math.floor((requestEnd-requestStart)/DAY)+1,receivedDays=results.reduce((sum,result)=>sum+result.rows.length,0);
  return validateThermalDataset({schemaId:'koyomi-earthquake-thermal-public-v1',status:'available',generatedAt:new Date(asOf).toISOString(),retrievedAt:new Date(asOf).toISOString(),coverageStartUtc:new Date(Math.min(...times)).toISOString(),coverageEndUtc:new Date(Math.max(...times)).toISOString(),spatialResolution:2,observationCount,sha256,dataQuality:{status:'complete-cell-requests',requestedCellCount:cells.length,availableCellCount:Object.keys(observationsByCell).length,completeObservationFraction:expectedDays&&cells.length?receivedDays/(expectedDays*cells.length):0,missingValuePolicy:'drop-incomplete-day'},provider:{name:'NASA POWER',sourceUrl:'https://power.larc.nasa.gov/docs/services/api/temporal/daily/',apiUrl:POWER_API,method:'daily-surface-air-temperature-residual',parameters:POWER_PARAMETERS,sourceProducts:[...sources].sort(),temporalResolution:'daily',valueType:'analysis-and-assimilation',directSatelliteLst:false},himawariAvailability,request:{start:requestStart.toISOString(),end:requestEnd.toISOString(),region:'Japan 20N-48N, 122E-154E',timeStandard:'UTC'},coordinatesByCell,observationsByCell});
}

export async function preflightPublicThermalData({fetcher=fetch,asOf=new Date()}={}){
  const end=new Date(asOf.getTime()-DAY),start=new Date(end.getTime()-2*DAY),cell=buildPowerCells()[0],power=await fetchPowerCell(cell,{start,end,fetcher}),himawari=await checkHimawariAvailability({asOf,fetcher});
  return Object.freeze({checkedAt:new Date(asOf).toISOString(),authenticationRequired:false,power:{status:'available',cellId:cell.id,observationCount:power.rows.length,sources:power.sources},himawari});
}

async function readExisting(){try{return validateThermalDataset(JSON.parse(await readFile(OUTPUT,'utf8')))}catch{return null}}
async function main(){
  const mode=process.argv[2]||'--preflight';
  if(mode==='--preflight'){console.log(JSON.stringify(await preflightPublicThermalData(),null,2));return}
  if(mode!=='--update')throw new Error('use --preflight or --update');
  const existing=await readExisting(),dataset=await generatePowerThermalDataset({existing,start:process.env.KOYOMI_POWER_START||DEFAULT_START,end:process.env.KOYOMI_POWER_END?new Date(`${process.env.KOYOMI_POWER_END}T00:00:00Z`):undefined});
  await writeFile(OUTPUT,`${JSON.stringify(dataset,null,2)}\n`,'utf8');console.log(JSON.stringify({status:dataset.status,observationCount:dataset.observationCount,coverageStartUtc:dataset.coverageStartUtc,coverageEndUtc:dataset.coverageEndUtc,sha256:dataset.sha256,himawari:dataset.himawariAvailability.status},null,2));
}

if(import.meta.url===pathToFileURL(process.argv[1]||'').href)main().catch(error=>{console.error(error);process.exitCode=1});
