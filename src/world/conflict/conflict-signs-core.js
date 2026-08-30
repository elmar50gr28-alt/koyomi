import { calculateAngles } from '../../mundane/western/seasonal-ingress-core.js';
import { normalizeMundanePositions } from '../mundane-earthquake-adapter.js';
import { buildConflictEventCandidates, composeConflictScenarioReading } from './conflict-event-scenario-engine.js';
import { inspectConflictReading } from './conflict-quality-guard.js';

export const CONFLICT_SIGNS_VERSION='conflict-signs-v1.1';
const LABELS={Sun:'太陽',Moon:'月',Mercury:'水星',Mars:'火星',Jupiter:'木星',Saturn:'土星',Uranus:'天王星',Neptune:'海王星',Pluto:'冥王星'};
const ASPECTS=[['Mars','Saturn',20],['Mars','Uranus',23],['Mars','Pluto',24],['Saturn','Uranus',18],['Mercury','Mars',14],['Jupiter','Pluto',14],['Neptune','Mars',16]];
const BANDS=['静かな巡り','緊張の芽','対立の兆し','軍事的緊張の兆し','大きな動乱の兆し'];
const distance=(a,b)=>Math.abs((((a-b)+540)%360)-180),dateLabel=date=>`${date.getMonth()+1}月${date.getDate()}日`,bandFor=score=>score>=80?4:score>=65?3:score>=45?2:score>=25?1:0;
const aspect=(a,b,orb=6)=>{const separation=distance(a,b),hit=[0,90,180].map(angle=>({angle,orb:Math.abs(separation-angle)})).sort((x,y)=>x.orb-y.orb)[0];return hit.orb<=orb?hit:null};

export function calculateConflictSign({date,latitude,longitude,positions}){
  const normalized=normalizeMundanePositions(positions),angles=calculateAngles(new Date(date),{latitude,longitude}),axes=[angles.ascendant,angles.midheaven,(angles.midheaven+180)%360],contributors=[];
  for(const [left,right,weight] of ASPECTS){if(!Number.isFinite(normalized[left])||!Number.isFinite(normalized[right]))continue;const hit=aspect(normalized[left],normalized[right]);if(hit)contributors.push({body:left,id:`${left}-${right}`,label:`${LABELS[left]}と${LABELS[right]}の${hit.angle}度`,weight,orb:hit.orb})}
  for(const body of ['Mars','Saturn','Uranus','Neptune','Pluto']){if(!Number.isFinite(normalized[body]))continue;const orb=Math.min(...axes.map(axis=>distance(normalized[body],axis)));if(orb<=6)contributors.push({body,id:`angular-${body}`,label:`${LABELS[body]}が地域の主要軸付近`,weight:body==='Mars'||body==='Pluto'?22:16,orb})}
  const score=Math.min(100,Math.max(0,Math.round(12+contributors.reduce((sum,item)=>sum+Math.max(3,item.weight-item.orb*1.5),0)))),band=bandFor(score),ordered=contributors.sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id)),eventCandidates=buildConflictEventCandidates(ordered),scenarios=eventCandidates.map(item=>item.title),targets=[...new Set(eventCandidates.flatMap(item=>item.focus))].slice(0,2),direction=eventCandidates[0]?.direction||'示威と牽制が中心になりやすい';
  return Object.freeze({score,band,label:BANDS[band],contributors:Object.freeze(ordered),eventCandidates,scenarios:Object.freeze(scenarios.length?scenarios:['外交面の牽制と警戒姿勢の変化']),targets:Object.freeze(targets.length?targets:['外交経路','国境・周辺海域']),direction})
}

export function forecastConflictSign({startDate=new Date(),placeId,placeNameJa,latitude,longitude,ephemeris,horizonDays=30}){
  const start=new Date(startDate);start.setUTCHours(12,0,0,0);const days=[];
  for(let offset=0;offset<=horizonDays;offset++){const date=new Date(start.getTime()+offset*86400000);days.push({date,sign:calculateConflictSign({date,latitude,longitude,positions:ephemeris.planetLongitudes(date)})})}
  days.sort((a,b)=>b.sign.score-a.sign.score||a.date-b.date);const peak=days[0],windowStart=new Date(Math.max(start.getTime(),peak.date.getTime()-86400000)),windowEnd=new Date(peak.date.getTime()+2*86400000),sign=peak.sign,reading=composeConflictScenarioReading({windowStartLabel:dateLabel(windowStart),windowEndLabel:dateLabel(windowEnd),placeNameJa,label:sign.label,candidates:sign.eventCandidates}),quality=inspectConflictReading(reading);
  return Object.freeze({schemaId:'koyomi-conflict-sign-v1',engineVersion:CONFLICT_SIGNS_VERSION,category:'conflict',placeId,placeNameJa,latitude,longitude,issuedAt:new Date(startDate).toISOString(),peakDate:peak.date.toISOString(),windowStart:windowStart.toISOString(),windowEnd:windowEnd.toISOString(),horizonDays,score:sign.score,band:sign.band,label:sign.label,targets:sign.targets,scenarios:sign.scenarios,direction:sign.direction,eventCandidates:sign.eventCandidates,contributors:sign.contributors,reading,quality})
}

export function rankConflictSigns({places,startDate,ephemeris,horizonDays=30,limit=5}){const cache=new Map(),cached={...ephemeris,planetLongitudes(date){const key=date.toISOString();if(!cache.has(key))cache.set(key,ephemeris.planetLongitudes(date));return cache.get(key)}};return places.map(place=>forecastConflictSign({...place,startDate,ephemeris:cached,horizonDays})).sort((a,b)=>b.score-a.score||a.placeNameJa.localeCompare(b.placeNameJa,'ja')).slice(0,limit)}
