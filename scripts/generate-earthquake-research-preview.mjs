import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import * as h3 from '../vendor/h3-js/4.5.0/h3-js.es.js';
import { runDecayNeighborModel } from '../src/world/earthquake-forecast/model.js';

const DAY=86_400_000,API_LIMIT=20_000,startYear=2005,resolution=2,horizons=[1,3,7,14,30],targetMagnitudes=[4.5,6.5];
const cutoffDate=new Date();cutoffDate.setUTCMinutes(0,0,0);const cutoff=cutoffDate.toISOString(),cutoffMs=cutoffDate.getTime(),events=new Map(),sources=[];
const queryBase='https://earthquake.usgs.gov/fdsnws/event/1';
const params=(start,end)=>`starttime=${encodeURIComponent(start)}&endtime=${encodeURIComponent(end)}&minmagnitude=4.5&eventtype=earthquake`;

async function fetchWindow(start,end,label){
  const countUrl=`${queryBase}/count?${params(start,end)}`,countResponse=await fetch(countUrl);if(!countResponse.ok)throw new Error(`USGS count ${label}: ${countResponse.status}`);const expectedCount=Number(await countResponse.text());if(!Number.isInteger(expectedCount)||expectedCount<0)throw new Error(`USGS count ${label}: invalid response`);
  if(expectedCount>=API_LIMIT){const midpoint=new Date((Date.parse(start)+Date.parse(end))/2).toISOString();if(midpoint===start||midpoint===end)throw new Error(`USGS ${label}: unable to split saturated interval`);await fetchWindow(start,midpoint,`${label}a`);await fetchWindow(midpoint,end,`${label}b`);return}
  const url=`${queryBase}/query?format=geojson&orderby=time-asc&${params(start,end)}&limit=${API_LIMIT}`,response=await fetch(url);if(!response.ok)throw new Error(`USGS query ${label}: ${response.status}`);const bytes=new Uint8Array(await response.arrayBuffer()),payload=JSON.parse(new TextDecoder().decode(bytes));
  if(payload.features.length!==expectedCount)throw new Error(`USGS ${label}: expected ${expectedCount}, received ${payload.features.length}`);
  sources.push({label,start,end,countUrl,url,expectedCount,recordCount:payload.features.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  for(const feature of payload.features){
    const [longitude,latitude,depthKm]=feature.geometry?.coordinates||[],properties=feature.properties||{},id=String(feature.id||''),magnitude=Number(properties.mag),time=Number(properties.time),updated=Number(properties.updated);
    if(!id||![longitude,latitude,depthKm,magnitude,time,updated].every(Number.isFinite))throw new Error(`USGS ${label}: invalid event ${id||'(missing id)'}`);
    const event={id,time,magnitude,latitude,longitude,depthKm,updated,magType:String(properties.magType||'unknown'),status:String(properties.status||'unknown')},previous=events.get(id);if(!previous||event.updated>=previous.updated)events.set(id,event);
  }
}

for(let year=startYear;year<=cutoffDate.getUTCFullYear();year+=1){const start=`${year}-01-01T00:00:00.000Z`,end=year===cutoffDate.getUTCFullYear()?cutoff:`${year+1}-01-01T00:00:00.000Z`;if(Date.parse(start)<Date.parse(end))await fetchWindow(start,end,String(year))}
const fetchedCount=sources.reduce((sum,source)=>sum+source.recordCount,0);if(fetchedCount!==events.size)throw new Error(`USGS duplicate/completeness mismatch: fetched ${fetchedCount}, unique ${events.size}`);

const byCell=new Map();for(const event of events.values()){const cell=h3.latLngToCell(event.latitude,event.longitude,resolution);if(!byCell.has(cell))byCell.set(cell,[]);byCell.get(cell).push(event)}
const historyDays=(cutoffMs-Date.parse(`${startYear}-01-01T00:00:00.000Z`))/DAY,rows=[];
for(const [cell,cellEvents] of byCell){
  if(cellEvents.length<3)continue;
  const recent7=cellEvents.filter(event=>event.time<cutoffMs&&event.time>=cutoffMs-7*DAY).length,recent30=cellEvents.filter(event=>event.time<cutoffMs&&event.time>=cutoffMs-30*DAY).length,ordinaryBackground=cellEvents.length/historyDays,ordinaryActivity=Math.min(4,Math.max(.25,((recent7/7)/ordinaryBackground+(recent30/30)/ordinaryBackground)/2)),nearbyEvents=cellEvents.filter(event=>event.time<cutoffMs&&event.time>=cutoffMs-60*DAY).map(event=>({ageDays:(cutoffMs-event.time)/DAY,ring:0,magnitude:event.magnitude}));
  for(const targetMagnitude of targetMagnitudes){
    const targetCount=cellEvents.filter(event=>event.magnitude>=targetMagnitude&&event.time<cutoffMs).length,background=targetMagnitude===4.5?ordinaryBackground:(targetCount||.25)/(historyDays+2500);
    for(const horizon of horizons){const approved=targetMagnitude===6.5&&horizon===30,probability=targetMagnitude===4.5?1-Math.exp(-background*ordinaryActivity*horizon):approved?runDecayNeighborModel({targetBackgroundDailyRate:background,nearbyEvents},horizon,{productivityScale:.00002,temporalPower:.7,spatialDecayRings:1,temporalOffsetDays:.5,magnitudeExponent:.8,maxRing:0}).modelProbability:1-Math.exp(-background*horizon);rows.push({cell_id:cell,target_magnitude:targetMagnitude,horizon_days:horizon,preview_value:Number(probability.toPrecision(8)),data_quality:Math.min(1,cellEvents.length/50),model_tier:approved?'development-approved':targetMagnitude===4.5?'research-activity':'comparison-baseline'})}
  }
}
const bandBoundaries={};for(const targetMagnitude of targetMagnitudes){const sorted=rows.filter(row=>row.target_magnitude===targetMagnitude).map(row=>row.preview_value).sort((a,b)=>a-b),at=q=>sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*q))]??0,bounds=[at(.5),at(.75),at(.9)];bandBoundaries[String(targetMagnitude)]=bounds;for(const row of rows.filter(item=>item.target_magnitude===targetMagnitude))row.relative_band=row.preview_value<bounds[0]?1:row.preview_value<bounds[1]?2:row.preview_value<bounds[2]?3:4}

const eventsByCell=Object.fromEntries([...byCell].map(([cell,cellEvents])=>[cell,cellEvents.filter(event=>event.time<cutoffMs).sort((a,b)=>a.time-b.time).map(event=>[event.time,event.magnitude,event.latitude,event.longitude,event.depthKm,event.id,event.updated,event.magType,event.status])]));
const inputSha256=createHash('sha256').update(JSON.stringify(eventsByCell)).digest('hex'),generatedAt=new Date().toISOString(),freshness={lastSuccessfulUpdateUtc:generatedAt,catalogThroughUtc:cutoff,expectedRecords:fetchedCount,storedRecords:events.size,complete:true};
const manifest={schemaId:'koyomi-earthquake-research-preview-v1',generatedAt,forecastTimeUtc:cutoff,modelName:'対象規模切替モデル v1',modelNames:{'4.5':'M4.5以上・直近活動率モデル v1','6.5':'M6.5同一セル時間減衰モデル v1'},source:'USGS ComCat FDSN Event API',catalogMinimumMagnitude:4.5,targetMagnitudes,defaultTargetMagnitude:6.5,historyStart:`${startYear}-01-01T00:00:00.000Z`,h3:{version:'4.5.0',resolution},horizonsDays:horizons,developmentApprovedHorizons:{'4.5':[],'6.5':[30]},bandMethod:'target-specific-all-horizon-fixed-quantiles-v1',bandBoundaries,realHoldoutExecuted:false,inputCatalog:{schemaId:'koyomi-earthquake-research-catalog-v2',sha256:inputSha256},freshness,sources,recordCount:events.size,rows};
const catalog={schemaId:'koyomi-earthquake-research-catalog-v2',generatedAt,historyStart:manifest.historyStart,latestTimeUtcMs:cutoffMs,inputSha256,h3:manifest.h3,freshness,sources,eventsByCell};
await mkdir(new URL('../data/world/',import.meta.url),{recursive:true});await Promise.all([writeFile(new URL('../data/world/earthquake-research-preview-v1.json',import.meta.url),`${JSON.stringify(manifest)}\n`),writeFile(new URL('../data/world/earthquake-research-catalog-v2.json',import.meta.url),`${JSON.stringify(catalog)}\n`)]);console.log(`preview rows=${rows.length} events=${events.size} through=${cutoff}`);
