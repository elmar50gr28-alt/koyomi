const STORAGE_KEY='koyomi.world.usgsEarthquakes.v1';
const DEFAULT_LOOKBACK_DAYS=30;
const MAX_SAVED_AGE_MS=7*86_400_000;
const finite=value=>Number.isFinite(Number(value));

export function normalizeUsgsEarthquakeFeed(payload){
  if(payload?.type!=='FeatureCollection'||!Array.isArray(payload.features))throw new TypeError('invalid USGS earthquake feed');
  const byId=new Map();
  for(const feature of payload.features){
    const coordinates=feature?.geometry?.coordinates,properties=feature?.properties||{},id=String(feature?.id||'');
    if(!id||!Array.isArray(coordinates)||!finite(coordinates[0])||!finite(coordinates[1])||!finite(properties.mag)||!finite(properties.time))continue;
    const longitude=Number(coordinates[0]),latitude=Number(coordinates[1]),magnitude=Number(properties.mag);
    if(latitude< -90||latitude>90||longitude< -180||longitude>180||magnitude<0)continue;
    byId.set(id,Object.freeze({id,timeUtc:new Date(Number(properties.time)).toISOString(),magnitude,latitude,longitude,depthKm:finite(coordinates[2])?Number(coordinates[2]):null,place:String(properties.place||''),sourceUrl:String(properties.url||'')}));
  }
  return Object.freeze([...byId.values()].sort((left,right)=>right.timeUtc.localeCompare(left.timeUtc)));
}

export function buildUsgsQueryUrl({now=new Date(),lookbackDays=DEFAULT_LOOKBACK_DAYS,minimumMagnitude=4.5}={}){
  const end=new Date(now);if(!Number.isFinite(end.getTime()))throw new TypeError('now must be valid');
  const start=new Date(end.getTime()-Math.max(1,Number(lookbackDays))*86_400_000),url=new URL('https://earthquake.usgs.gov/fdsnws/event/1/query');
  url.searchParams.set('format','geojson');url.searchParams.set('starttime',start.toISOString());url.searchParams.set('endtime',end.toISOString());url.searchParams.set('minmagnitude',String(minimumMagnitude));url.searchParams.set('orderby','time');url.searchParams.set('limit','20000');
  return url.toString();
}

const readSaved=(storage,now)=>{try{const value=JSON.parse(storage?.getItem(STORAGE_KEY)||'null'),savedAt=Date.parse(value?.fetchedAt);if(!Number.isFinite(savedAt)||now.getTime()-savedAt>MAX_SAVED_AGE_MS||!Array.isArray(value.events))return null;return{events:Object.freeze(value.events),fetchedAt:value.fetchedAt,source:'saved'}}catch{return null}};
const save=(storage,value)=>{try{storage?.setItem(STORAGE_KEY,JSON.stringify(value))}catch{}}

export async function loadLiveEarthquakes({fetchImpl=globalThis.fetch,storage=globalThis.localStorage,now=new Date(),timeoutMs=8000}={}){
  const saved=readSaved(storage,now),controller=typeof AbortController==='function'?new AbortController():null,timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
  try{
    if(typeof fetchImpl!=='function')throw new Error('fetch unavailable');
    const response=await fetchImpl(buildUsgsQueryUrl({now}),{cache:'no-store',signal:controller?.signal});if(!response?.ok)throw new Error(`USGS HTTP ${response?.status||0}`);
    const events=normalizeUsgsEarthquakeFeed(await response.json()),result={events,fetchedAt:now.toISOString(),source:'network'};save(storage,result);return Object.freeze(result);
  }catch(error){return Object.freeze(saved?{...saved,error:String(error?.message||error)}:{events:Object.freeze([]),fetchedAt:null,source:'unavailable',error:String(error?.message||error)})}
  finally{if(timer)clearTimeout(timer)}
}

export function liveEventsInWindow(feed,{startTime,endTime,minimumMagnitude=4.5}={}){
  const start=Date.parse(startTime),end=Date.parse(endTime);if(!Number.isFinite(start)||!Number.isFinite(end))return Object.freeze([]);
  return Object.freeze((feed?.events||[]).filter(item=>{const time=Date.parse(item.timeUtc);return time>=start&&time<end&&item.magnitude>=Number(minimumMagnitude)}).map(item=>({time_utc:item.timeUtc,...item})));
}
