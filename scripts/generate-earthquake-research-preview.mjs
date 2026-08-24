import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import * as h3 from '../vendor/h3-js/4.5.0/h3-js.es.js';

const startYear=2005,cutoff='2026-08-24T00:00:00.000Z',resolution=2,horizons=[1,3,7,14,30],events=new Map(),sources=[];
for(let year=startYear;year<=2026;year+=1){
  const start=`${year}-01-01T00:00:00.000Z`,end=year===2026?cutoff:`${year+1}-01-01T00:00:00.000Z`,url=`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time-asc&starttime=${encodeURIComponent(start)}&endtime=${encodeURIComponent(end)}&minmagnitude=4.5&eventtype=earthquake&limit=20000`;
  const response=await fetch(url);if(!response.ok)throw new Error(`USGS ${year}: ${response.status}`);const bytes=new Uint8Array(await response.arrayBuffer()),payload=JSON.parse(new TextDecoder().decode(bytes));
  sources.push({year,url,recordCount:payload.features.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  for(const feature of payload.features){const [longitude,latitude]=feature.geometry?.coordinates||[];if(Number.isFinite(latitude)&&Number.isFinite(longitude)&&Number.isFinite(feature.properties?.time))events.set(feature.id,{id:feature.id,time:feature.properties.time,latitude,longitude})}
}
const byCell=new Map();for(const event of events.values()){const cell=h3.latLngToCell(event.latitude,event.longitude,resolution);if(!byCell.has(cell))byCell.set(cell,[]);byCell.get(cell).push(event.time)}
const cutoffMs=Date.parse(cutoff),historyDays=(cutoffMs-Date.parse(`${startYear}-01-01T00:00:00.000Z`))/86400000,rows=[];
for(const [cell,times] of byCell){if(times.length<3)continue;const recent7=times.filter(time=>time<cutoffMs&&time>=cutoffMs-7*86400000).length,recent30=times.filter(time=>time<cutoffMs&&time>=cutoffMs-30*86400000).length,background=times.length/historyDays,ratio7=background?recent7/7/background:0,ratio30=background?recent30/30/background:0,multiplier=Math.min(4,Math.max(.25,(ratio7+ratio30)/2));for(const horizon of horizons){const probability=1-Math.exp(-background*multiplier*horizon);rows.push({cell_id:cell,horizon_days:horizon,preview_value:Number(probability.toPrecision(8)),data_quality:Math.min(1,times.length/50)})}}
const sorted=rows.map(row=>row.preview_value).sort((a,b)=>a-b),at=q=>sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*q))]??0,bounds=[at(.5),at(.75),at(.9)];for(const row of rows)row.relative_band=row.preview_value<bounds[0]?1:row.preview_value<bounds[1]?2:row.preview_value<bounds[2]?3:4;
const manifest={schemaId:'koyomi-earthquake-research-preview-v1',generatedAt:new Date().toISOString(),forecastTimeUtc:cutoff,modelName:'背景活動率・直近活動率ベースライン v1',source:'USGS ComCat FDSN Event API',minimumMagnitude:4.5,historyStart:`${startYear}-01-01T00:00:00.000Z`,h3:{version:'4.5.0',resolution},horizonsDays:horizons,bandMethod:'all-horizon-fixed-quantiles-v1',bandBoundaries:bounds,realHoldoutExecuted:false,sources,recordCount:events.size,rows};
await mkdir(new URL('../data/world/',import.meta.url),{recursive:true});await writeFile(new URL('../data/world/earthquake-research-preview-v1.json',import.meta.url),`${JSON.stringify(manifest)}\n`);console.log(`preview rows=${rows.length} events=${events.size}`);
