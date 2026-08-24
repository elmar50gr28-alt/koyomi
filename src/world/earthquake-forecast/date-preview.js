import { runDecayNeighborModel } from './model.js';

const DAY=86_400_000;
const START=Date.parse('2005-01-01T00:00:00.000Z');
const M65_PARAMETERS=Object.freeze({productivityScale:.00002,temporalPower:.7,spatialDecayRings:1,temporalOffsetDays:.5,magnitudeExponent:.8,maxRing:0});

export function calculateDatedPreview(catalog,{forecastTime,targetMagnitude=6.5,horizonDays=30}={}){
  const requestedTime=new Date(forecastTime).getTime();
  if(!Number.isFinite(requestedTime))throw new TypeError('forecastTime must be valid');
  const latestCatalogTime=Number(catalog?.latestTimeUtcMs);
  const calculationTime=Math.min(requestedTime,latestCatalogTime);
  const historyDays=Math.max(1,(calculationTime-START)/DAY);
  const horizon=Math.max(1,Math.trunc(Number(horizonDays)));
  const target=Number(targetMagnitude);
  const rows=[];
  for(const [cell,compactEvents] of Object.entries(catalog?.eventsByCell||{})){
    const events=compactEvents.filter(([time])=>time<calculationTime).map(([time,magnitude])=>({time,magnitude}));
    if(events.length<3)continue;
    const recent7=events.filter(event=>event.time>=calculationTime-7*DAY).length;
    const recent30=events.filter(event=>event.time>=calculationTime-30*DAY).length;
    const ordinaryBackground=events.length/historyDays;
    const ordinaryActivity=Math.min(4,Math.max(.25,((recent7/7)/ordinaryBackground+(recent30/30)/ordinaryBackground)/2));
    const targetCount=events.filter(event=>event.magnitude>=target).length;
    const background=target===4.5?ordinaryBackground:(targetCount||.25)/(historyDays+2500);
    const nearbyEvents=events.filter(event=>event.time>=calculationTime-60*DAY).map(event=>({ageDays:(calculationTime-event.time)/DAY,ring:0,magnitude:event.magnitude}));
    const approved=target===6.5&&horizon===30;
    const probability=target===4.5?1-Math.exp(-background*ordinaryActivity*horizon):approved?runDecayNeighborModel({targetBackgroundDailyRate:background,nearbyEvents},horizon,M65_PARAMETERS).modelProbability:1-Math.exp(-background*horizon);
    rows.push({cell_id:cell,target_magnitude:target,horizon_days:horizon,preview_value:Number(probability.toPrecision(8)),data_quality:Math.min(1,events.length/50),model_tier:approved?'development-approved':target===4.5?'research-activity':'comparison-baseline'});
  }
  const sorted=rows.map(row=>row.preview_value).sort((a,b)=>a-b);
  const at=q=>sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*q))]??0;
  const bounds=[at(.5),at(.75),at(.9)];
  for(const row of rows)row.relative_band=row.preview_value<bounds[0]?1:row.preview_value<bounds[1]?2:row.preview_value<bounds[2]?3:4;
  return Object.freeze({requestedTimeUtc:new Date(requestedTime).toISOString(),calculationTimeUtc:new Date(calculationTime).toISOString(),futureDateClamped:requestedTime>latestCatalogTime,bandBoundaries:Object.freeze(bounds),rows:Object.freeze(rows)});
}
