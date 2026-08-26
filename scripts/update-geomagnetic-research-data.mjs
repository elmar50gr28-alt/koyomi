import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateGeomagneticDataset } from '../src/world/earthquake-forecast/geomagnetic-data.js';

const OUTPUT=resolve('data/world/geomagnetic-research-v1.json');
const START=process.env.KOYOMI_GEOMAGNETIC_START||'2015-01-01T00:00:00Z';
const END=process.env.KOYOMI_GEOMAGNETIC_END||new Date().toISOString();
const API='https://kp.gfz.de/app/json/';
const DAY=86_400_000;

function iso(value){return new Date(value).toISOString().replace(/\.\d{3}Z$/,'Z')}
function hashObservations(observations){return createHash('sha256').update(JSON.stringify(observations)).digest('hex')}
async function existingDataset(){try{return validateGeomagneticDataset(JSON.parse(await readFile(OUTPUT,'utf8')))}catch{return null}}

export async function fetchOfficialKp({start=START,end=END,fetcher=fetch}={}){
  const startTime=Date.parse(start),endTime=Date.parse(end);if(!Number.isFinite(startTime)||!Number.isFinite(endTime)||endTime<=startTime)throw new TypeError('invalid requested coverage');
  const observations=[];
  for(let cursor=startTime;cursor<endTime;cursor+=90*DAY){
    const chunkEnd=Math.min(endTime-1000,cursor+90*DAY-1000),url=new URL(API);url.searchParams.set('start',iso(cursor));url.searchParams.set('end',iso(chunkEnd));url.searchParams.set('index','Kp');
    const response=await fetcher(url);if(!response.ok)throw new Error(`GFZ Kp fetch failed: ${response.status} ${url.searchParams.get('start')}..${url.searchParams.get('end')}`);const payload=await response.json();
    if(!Array.isArray(payload.datetime)||!Array.isArray(payload.Kp)||payload.datetime.length!==payload.Kp.length||payload.datetime.length<1)throw new Error('GFZ Kp response invalid');
    for(let index=0;index<payload.datetime.length;index++){const time=Date.parse(payload.datetime[index]),kp=Number(payload.Kp[index]);if(Number.isFinite(time)&&time>=startTime&&time<endTime&&Number.isFinite(kp))observations.push({timeUtc:iso(time),kp,dst:null})}
  }
  const unique=[...new Map(observations.map(item=>[item.timeUtc,item])).values()].sort((a,b)=>Date.parse(a.timeUtc)-Date.parse(b.timeUtc));
  if(unique.length<240||unique.some((item,index)=>index&&Date.parse(item.timeUtc)<=Date.parse(unique[index-1].timeUtc)))throw new Error('GFZ Kp coverage failed closed');
  const retrievedAt=new Date().toISOString();
  return validateGeomagneticDataset({schemaId:'koyomi-geomagnetic-research-v1',provider:{kp:{sourceName:'GFZ Helmholtz Centre for Geosciences',sourceId:'GFZ-Kp',sourceUrl:'https://kp.gfz.de/en/data',license:'CC BY 4.0',attribution:'GFZ Helmholtz Centre for Geosciences'},dst:{sourceName:'WDC for Geomagnetism, Kyoto',sourceId:'Kyoto-Dst',sourceUrl:'https://wdc.kugi.kyoto-u.ac.jp/dstdir/',status:'not-integrated'}},retrievedAt,coverageStartUtc:unique[0].timeUtc,coverageEndUtc:unique.at(-1).timeUtc,recordCount:unique.length,sha256:hashObservations(unique),dataQuality:'verified-kp-dst-unavailable',freshness:{latestFetchStatus:'success',lastSuccessfulUpdateUtc:retrievedAt},observations:unique});
}

export async function updateDataset(options={}){
  const previous=await existingDataset();let next;
  try{next=await fetchOfficialKp(options)}catch(error){if(previous)console.error(`Latest fetch failed; last-known-good preserved: ${error.message}`);throw error}
  if(previous&&Date.parse(next.coverageEndUtc)<Date.parse(previous.coverageEndUtc))throw new Error('new dataset would shorten coverage');
  await mkdir(dirname(OUTPUT),{recursive:true});const temporary=`${OUTPUT}.tmp`;await writeFile(temporary,`${JSON.stringify(next)}\n`,'utf8');await rename(temporary,OUTPUT);return next;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const result=await updateDataset();console.log(JSON.stringify({recordCount:result.recordCount,coverageStartUtc:result.coverageStartUtc,coverageEndUtc:result.coverageEndUtc,sha256:result.sha256}))}
