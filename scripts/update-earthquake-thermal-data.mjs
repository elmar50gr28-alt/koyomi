import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename,dirname,resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSpatialGrid } from '../src/world/spatial-grid.js';

const API='https://appeears.earthdatacloud.nasa.gov/api';
const STATE=resolve('data/research/earthquake-thermal-appeears-tasks.local.json');
const DOWNLOADS=resolve('data/research/earthquake-thermal-downloads');
const CATALOG=resolve('data/world/earthquake-research-catalog-v2.json');
export const THERMAL_PRODUCTS=Object.freeze({
  'MOD11A1.061':Object.freeze(['LST_Night_1km','QC_Night','Night_view_time','Night_view_angl']),
  'MYD11A1.061':Object.freeze(['LST_Night_1km','QC_Night','Night_view_time','Night_view_angl']),
  'MOD10A1.061':Object.freeze(['NDSI_Snow_Cover','NDSI_Snow_Cover_Basic_QA']),
  'MOD14A2.061':Object.freeze(['FireMask','QA']),
  'MYD14A2.061':Object.freeze(['FireMask','QA'])
});

const dateForApi=value=>{const date=new Date(value);if(Number.isNaN(date.getTime()))throw new TypeError('invalid AppEEARS date');return`${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}-${date.getUTCFullYear()}`};
const chunks=(items,size)=>Array.from({length:Math.ceil(items.length/size)},(_,index)=>items.slice(index*size,(index+1)*size));

export function buildJapanSampleCoordinates(catalog,{grid=createSpatialGrid(),sampleResolution=3}={}){
  const aggregateResolution=Number(catalog?.spatialResolution??catalog?.h3?.resolution);
  if(aggregateResolution!==2||!catalog?.eventsByCell)throw new TypeError('H3 resolution 2 earthquake catalog is required');
  if(sampleResolution<aggregateResolution)throw new RangeError('sample resolution must be at least the catalog resolution');
  const parents=grid.viewportCells({south:20,north:48,west:122,east:154},aggregateResolution,1000),children=parents.flatMap(parent=>grid.children(parent,sampleResolution).map(id=>({id,category:parent,...grid.center(id)}))).filter(point=>point.latitude>=20&&point.latitude<=48&&point.longitude>=122&&point.longitude<=154);
  return Object.freeze(children.sort((a,b)=>a.id.localeCompare(b.id)).map(point=>Object.freeze({id:point.id,category:point.category,latitude:point.latitude,longitude:point.longitude})));
}

export function buildAppEearsTasks(coordinates,{start='2015-01-01',end='2015-12-31',maximumCoordinates=200}={}){
  const dates=[{startDate:dateForApi(start),endDate:dateForApi(end)}],layers=Object.entries(THERMAL_PRODUCTS).flatMap(([product,names])=>names.map(layer=>({product,layer})));
  return Object.freeze(chunks(coordinates,maximumCoordinates).map((points,index)=>Object.freeze({task_type:'point',task_name:`koyomi-thermal-${String(index+1).padStart(2,'0')}`,params:Object.freeze({dates,layers,coordinates:points})})));
}

export async function preflightThermalProducts(fetcher=fetch){
  const results={};for(const [product,layers] of Object.entries(THERMAL_PRODUCTS)){const response=await fetcher(`${API}/product/${product}`);if(!response.ok)throw new Error(`AppEEARS product unavailable: ${product} (${response.status})`);const metadata=await response.json(),missing=layers.filter(layer=>!metadata[layer]);if(missing.length)throw new Error(`AppEEARS layers missing: ${product} ${missing.join(',')}`);results[product]={available:true,layers}}
  return Object.freeze(results);
}

async function bearer(fetcher=fetch){
  if(process.env.APPEEARS_TOKEN)return process.env.APPEEARS_TOKEN;
  const username=process.env.EARTHDATA_USERNAME,password=process.env.EARTHDATA_PASSWORD;if(!username||!password)throw new Error('NASA Earthdata authentication is not configured; set APPEEARS_TOKEN or EARTHDATA_USERNAME and EARTHDATA_PASSWORD locally');
  const response=await fetcher(`${API}/login`,{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,'Content-Length':'0'}});if(!response.ok)throw new Error(`AppEEARS login failed: ${response.status}`);const payload=await response.json();if(!payload.token)throw new Error('AppEEARS login returned no token');return payload.token;
}

export async function submitThermalTasks(tasks,{fetcher=fetch}={}){
  const token=await bearer(fetcher),submitted=[];for(const task of tasks){const response=await fetcher(`${API}/task`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(task)});if(!response.ok)throw new Error(`AppEEARS task submission failed: ${response.status}`);const payload=await response.json();if(!payload.task_id)throw new Error('AppEEARS task id missing');submitted.push({taskId:payload.task_id,taskName:task.task_name,status:payload.status||'pending'})}return Object.freeze(submitted);
}

const validTaskId=value=>/^[a-z0-9-]{8,}$/i.test(String(value||''));
function validateTaskState(state){if(state?.schemaId!=='koyomi-thermal-appeears-tasks-v1'||!Array.isArray(state.submitted)||state.submitted.some(item=>!validTaskId(item?.taskId)))throw new TypeError('invalid local AppEEARS task state');return state}
const authorized=(token,options={})=>({redirect:options.redirect||'follow',headers:{...(options.headers||{}),Authorization:`Bearer ${token}`},...options});

export async function fetchThermalTaskStatuses(state,{fetcher=fetch,token=null}={}){
  const checked=validateTaskState(state),accessToken=token||await bearer(fetcher),statuses=[];
  for(const item of checked.submitted){const response=await fetcher(`${API}/task/${item.taskId}`,authorized(accessToken));if(!response.ok)throw new Error(`AppEEARS task status failed: ${item.taskId} (${response.status})`);const payload=await response.json();statuses.push(Object.freeze({taskId:item.taskId,taskName:item.taskName,status:payload.status||'unknown',error:payload.error||null,updated:payload.updated||null,expiresOn:payload.expires_on||null}))}
  return Object.freeze(statuses);
}

export async function downloadThermalTaskFiles(state,{fetcher=fetch,token=null,sink=null}={}){
  const checked=validateTaskState(state),accessToken=token||await bearer(fetcher),statuses=await fetchThermalTaskStatuses(checked,{fetcher,token:accessToken}),done=new Set(statuses.filter(item=>item.status==='done').map(item=>item.taskId)),saved=[];
  const save=sink||(async({taskId,fileName,bytes})=>{const directory=resolve(DOWNLOADS,taskId);await mkdir(directory,{recursive:true});await writeFile(resolve(directory,fileName),bytes)});
  for(const task of checked.submitted){if(!done.has(task.taskId))continue;const bundleResponse=await fetcher(`${API}/bundle/${task.taskId}`,authorized(accessToken));if(!bundleResponse.ok)throw new Error(`AppEEARS bundle listing failed: ${task.taskId} (${bundleResponse.status})`);const bundle=await bundleResponse.json();for(const file of bundle.files||[]){if(!validTaskId(file.file_id)||!file.sha256||!file.file_name)throw new Error(`invalid AppEEARS bundle entry: ${task.taskId}`);const response=await fetcher(`${API}/bundle/${task.taskId}/${file.file_id}`,authorized(accessToken));if(!response.ok)throw new Error(`AppEEARS file download failed: ${file.file_name} (${response.status})`);const bytes=Buffer.from(await response.arrayBuffer()),sha256=createHash('sha256').update(bytes).digest('hex');if(sha256!==String(file.sha256).toLowerCase())throw new Error(`AppEEARS checksum mismatch: ${file.file_name}`);const fileName=basename(String(file.file_name));await save({taskId:task.taskId,fileName,bytes,sha256,fileType:file.file_type});saved.push(Object.freeze({taskId:task.taskId,fileName,fileType:file.file_type,size:bytes.length,sha256}))}}
  return Object.freeze({statuses,saved:Object.freeze(saved)});
}

async function main(){
  const mode=process.argv[2]||'--preflight';
  if(mode==='--status'||mode==='--download'){const state=validateTaskState(JSON.parse(await readFile(STATE,'utf8')));if(mode==='--status'){const statuses=await fetchThermalTaskStatuses(state);await writeFile(STATE,`${JSON.stringify({...state,checkedAt:new Date().toISOString(),statuses},null,2)}\n`,'utf8');console.log(JSON.stringify({statuses},null,2));return}const downloaded=await downloadThermalTaskFiles(state);console.log(JSON.stringify({statuses:downloaded.statuses,saved:downloaded.saved.length,directory:DOWNLOADS},null,2));return}
  const products=await preflightThermalProducts(),catalog=JSON.parse(await readFile(CATALOG,'utf8')),coordinates=buildJapanSampleCoordinates(catalog),tasks=buildAppEearsTasks(coordinates,{start:process.env.KOYOMI_THERMAL_START||'2015-01-01',end:process.env.KOYOMI_THERMAL_END||'2015-12-31',maximumCoordinates:Number(process.env.KOYOMI_THERMAL_COORDINATES_PER_TASK)||200});
  if(mode==='--preflight'){console.log(JSON.stringify({products:Object.keys(products),coordinates:coordinates.length,tasks:tasks.length,authenticationConfigured:Boolean(process.env.APPEEARS_TOKEN||(process.env.EARTHDATA_USERNAME&&process.env.EARTHDATA_PASSWORD)),submitCommand:'npm run update:earthquake-thermal -- --submit'},null,2));return}
  if(mode!=='--submit')throw new Error('supported modes: --preflight, --submit, --status, --download');const submitted=await submitThermalTasks(tasks);await mkdir(dirname(STATE),{recursive:true});await writeFile(STATE,`${JSON.stringify({schemaId:'koyomi-thermal-appeears-tasks-v1',createdAt:new Date().toISOString(),submitted},null,2)}\n`,'utf8');console.log(JSON.stringify({submitted:submitted.length,stateFile:STATE,nextCommand:'npm run update:earthquake-thermal -- --status'}));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
