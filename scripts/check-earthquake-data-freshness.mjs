import { appendFile,readFile,writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { EARTHQUAKE_DATA_FRESHNESS_LIMITS } from '../src/world/earthquake-forecast/data-quality-presenter.js';

const HOUR=3_600_000,FUTURE_TOLERANCE=HOUR;
const CATALOG_PATH=new URL('../data/world/earthquake-research-catalog-v2.json',import.meta.url);
const THERMAL_PATH=new URL('../data/world/earthquake-thermal-public-v1.json',import.meta.url);
const REPORT_PATH='earthquake-data-freshness-report.md';
const validDate=value=>Number.isFinite(Date.parse(value));
const finitePositive=value=>Number.isFinite(Number(value))&&Number(value)>0;
const sha256=value=>/^[a-f0-9]{64}$/i.test(String(value||''));
const iso=value=>validDate(value)?new Date(value).toISOString():'日時不明';

function classify({key,label,timestamp,maxAgeMs,valid,reason},nowMs){
  if(!valid)return Object.freeze({key,label,status:'invalid',healthy:false,needsUpdate:true,timestamp:validDate(timestamp)?iso(timestamp):null,ageMs:null,reason});
  const time=Date.parse(timestamp),ageMs=nowMs-time;
  if(!Number.isFinite(time))return Object.freeze({key,label,status:'missing',healthy:false,needsUpdate:true,timestamp:null,ageMs:null,reason:'更新日時を確認できません'});
  if(ageMs < -FUTURE_TOLERANCE)return Object.freeze({key,label,status:'invalid',healthy:false,needsUpdate:true,timestamp:iso(timestamp),ageMs,reason:'更新日時が未来になっています'});
  const stale=ageMs>maxAgeMs;
  return Object.freeze({key,label,status:stale?'stale':'current',healthy:!stale,needsUpdate:stale,timestamp:iso(timestamp),ageMs:Math.max(0,ageMs),reason:stale?'更新期限を超えています':'更新期限内です'});
}

function productionState({catalog,thermal,productionCatalog,productionThermal,checkProduction}){
  if(!checkProduction)return Object.freeze({status:'skipped',healthy:true,needsDeploy:false,reason:'本番比較なし'});
  if(!productionCatalog||!productionThermal)return Object.freeze({status:'unavailable',healthy:false,needsDeploy:true,reason:'本番データを取得できません'});
  const catalogMatches=productionCatalog?.inputSha256===catalog?.inputSha256&&productionCatalog?.freshness?.catalogThroughUtc===catalog?.freshness?.catalogThroughUtc;
  const thermalMatches=productionThermal?.sha256===thermal?.sha256&&productionThermal?.coverageEndUtc===thermal?.coverageEndUtc;
  return Object.freeze({status:catalogMatches&&thermalMatches?'current':'stale',healthy:catalogMatches&&thermalMatches,needsDeploy:!(catalogMatches&&thermalMatches),catalogMatches,thermalMatches,reason:catalogMatches&&thermalMatches?'mainと本番が一致しています':'mainと本番のデータが一致しません'});
}

export function evaluateEarthquakeDataFreshness({catalog,thermal,productionCatalog=null,productionThermal=null,checkProduction=false,now=new Date(),only='all'}={}){
  const nowMs=new Date(now).getTime();if(!Number.isFinite(nowMs))throw new TypeError('invalid freshness reference time');
  const catalogValid=catalog?.schemaId==='koyomi-earthquake-research-catalog-v2'&&catalog?.freshness?.complete===true&&finitePositive(catalog?.freshness?.storedRecords)&&sha256(catalog?.inputSha256);
  const thermalValid=thermal?.schemaId==='koyomi-earthquake-thermal-public-v1'&&thermal?.status==='available'&&finitePositive(thermal?.observationCount)&&sha256(thermal?.sha256);
  const catalogState=classify({key:'catalog',label:'長期地震カタログ',timestamp:catalog?.freshness?.catalogThroughUtc,maxAgeMs:EARTHQUAKE_DATA_FRESHNESS_LIMITS.catalogMs,valid:catalogValid,reason:'カタログの完全性・件数・ハッシュを確認できません'},nowMs);
  const thermalState=classify({key:'thermal',label:'地表熱',timestamp:thermal?.coverageEndUtc,maxAgeMs:EARTHQUAKE_DATA_FRESHNESS_LIMITS.thermalMs,valid:thermalValid,reason:'地表熱の状態・件数・ハッシュを確認できません'},nowMs);
  const production=productionState({catalog,thermal,productionCatalog,productionThermal,checkProduction});
  const selected=only==='catalog'?[catalogState]:only==='thermal'?[thermalState]:[catalogState,thermalState];
  const healthy=selected.every(item=>item.healthy)&&(only!=='all'||production.healthy);
  return Object.freeze({healthy,checkedAt:new Date(nowMs).toISOString(),catalog:catalogState,thermal:thermalState,production});
}

const age=value=>Number.isFinite(value)?value<HOUR?'1時間未満':value<48*HOUR?`${Math.floor(value/HOUR)}時間`:`${Math.floor(value/(24*HOUR))}日`:'不明';
const mark=status=>status==='current'?'正常':status==='skipped'?'対象外':'要確認';
export function buildFreshnessReport(result){
  return `# 地震データ更新監視\n\n確認時刻: ${result.checkedAt}\n\n| 対象 | 状態 | 最新日時 | 経過 | 説明 |\n|---|---|---|---:|---|\n| 長期地震カタログ | ${mark(result.catalog.status)} | ${result.catalog.timestamp||'不明'} | ${age(result.catalog.ageMs)} | ${result.catalog.reason} |\n| 地表熱 | ${mark(result.thermal.status)} | ${result.thermal.timestamp||'不明'} | ${age(result.thermal.ageMs)} | ${result.thermal.reason} |\n| 本番反映 | ${mark(result.production.status)} | — | — | ${result.production.reason} |\n\n総合結果: **${result.healthy?'正常':'要確認'}**\n`;
}

async function fetchJson(url,fetcher=fetch){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30_000);try{const response=await fetcher(url,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error(`request failed: ${response.status}`);return await response.json()}finally{clearTimeout(timer)}}
const argValue=(args,name)=>{const index=args.indexOf(name);return index>=0?args[index+1]:null};

async function main(){
  const args=process.argv.slice(2),only=argValue(args,'--only')||'all';if(!['all','catalog','thermal'].includes(only))throw new Error('--only must be all, catalog, or thermal');
  const now=argValue(args,'--now')||new Date(),remoteBase=argValue(args,'--remote-base')||process.env.PRODUCTION_BASE_URL||null,reportPath=argValue(args,'--report')||(process.env.GITHUB_ACTIONS?REPORT_PATH:null);
  const [catalog,thermal]=await Promise.all([readFile(CATALOG_PATH,'utf8').then(JSON.parse),readFile(THERMAL_PATH,'utf8').then(JSON.parse)]);
  let productionCatalog=null,productionThermal=null;
  if(remoteBase){const base=remoteBase.endsWith('/')?remoteBase:`${remoteBase}/`;try{[productionCatalog,productionThermal]=await Promise.all([fetchJson(`${base}data/world/earthquake-research-catalog-v2.json`),fetchJson(`${base}data/world/earthquake-thermal-public-v1.json`)])}catch(error){console.error(`production freshness check failed: ${error.message}`)}}
  const result=evaluateEarthquakeDataFreshness({catalog,thermal,productionCatalog,productionThermal,checkProduction:Boolean(remoteBase),now,only}),report=buildFreshnessReport(result);
  if(reportPath)await writeFile(reportPath,report,'utf8');console.log(report);
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,report,'utf8');
  if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,[`healthy=${result.healthy}`,`catalog_needs_update=${result.catalog.needsUpdate}`,`thermal_needs_update=${result.thermal.needsUpdate}`,`production_needs_deploy=${result.production.needsDeploy}`,`report_path=${reportPath||''}`,''].join('\n'),'utf8');
  if(!result.healthy)process.exitCode=1;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error);process.exitCode=1});
