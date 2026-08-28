import { calculateAngles } from '../mundane/western/seasonal-ingress-core.js';
import { normalizeMundanePositions } from './mundane-earthquake-adapter.js';

export const EARTH_SIGNS_VERSION='earth-signs-v1.0';
export const EARTHQUAKE_OMEN_REGIONS=Object.freeze([
  {id:'jp-hokkaido-east',nameJa:'北海道東部・根室沖',latitude:43.2,longitude:146.0},{id:'jp-sanriku',nameJa:'岩手県沖から宮城県沖',latitude:39.0,longitude:143.0},{id:'jp-fukushima',nameJa:'福島県沖',latitude:37.4,longitude:142.1},{id:'jp-kanto',nameJa:'関東南部',latitude:35.5,longitude:139.7},{id:'jp-izu',nameJa:'伊豆諸島周辺',latitude:33.5,longitude:139.5},{id:'jp-tokai',nameJa:'東海地方',latitude:35.0,longitude:137.2},{id:'jp-nankai',nameJa:'紀伊半島沖・南海地域',latitude:32.8,longitude:135.2},{id:'jp-shikoku',nameJa:'四国沖',latitude:32.5,longitude:133.5},{id:'jp-kyushu',nameJa:'九州南部',latitude:31.4,longitude:130.7},{id:'jp-okinawa',nameJa:'沖縄本島周辺',latitude:26.3,longitude:128.1},
  {id:'aleutian',nameJa:'アリューシャン列島',latitude:52.0,longitude:-170.0},{id:'cascadia',nameJa:'北米西岸・カスケード地域',latitude:44.5,longitude:-124.0},{id:'california',nameJa:'米国カリフォルニア州',latitude:36.0,longitude:-120.5},{id:'mexico',nameJa:'メキシコ南部',latitude:16.5,longitude:-98.0},{id:'central-america',nameJa:'中米太平洋岸',latitude:12.5,longitude:-88.0},{id:'andes-north',nameJa:'南米アンデス北部',latitude:-2.0,longitude:-78.0},{id:'andes-central',nameJa:'南米アンデス中部',latitude:-20.0,longitude:-69.0},{id:'andes-south',nameJa:'南米アンデス南部',latitude:-38.0,longitude:-73.0},{id:'iceland',nameJa:'アイスランド周辺',latitude:64.8,longitude:-18.5},{id:'mediterranean',nameJa:'地中海東部',latitude:37.5,longitude:24.0},{id:'anatolia',nameJa:'トルコ・アナトリア地域',latitude:39.0,longitude:35.0},{id:'himalaya',nameJa:'ヒマラヤ山脈周辺',latitude:29.0,longitude:84.0},{id:'sumatra',nameJa:'インドネシア・スマトラ島西方',latitude:-2.0,longitude:99.0},{id:'java',nameJa:'インドネシア・ジャワ島中部',latitude:-7.5,longitude:110.0},{id:'philippines',nameJa:'フィリピン東方',latitude:13.0,longitude:126.0},{id:'papua',nameJa:'パプアニューギニア周辺',latitude:-5.5,longitude:148.0},{id:'tonga',nameJa:'トンガ・ケルマデック海溝',latitude:-24.0,longitude:-176.0},{id:'new-zealand',nameJa:'ニュージーランド北島周辺',latitude:-39.0,longitude:176.0}
]);

const BODY_LABELS={Sun:'太陽',Moon:'月',Mars:'火星',Saturn:'土星',Uranus:'天王星',Pluto:'冥王星'};
const distance=(a,b)=>Math.abs((((a-b)+540)%360)-180);
const hardAspect=(a,b,orb=6)=>{const separation=distance(a,b),closest=[0,90,180].map(angle=>({angle,orb:Math.abs(separation-angle)})).sort((x,y)=>x.orb-y.orb)[0];return closest.orb<=orb?closest:null};
const dateLabel=date=>`${date.getMonth()+1}月${date.getDate()}日`;
const hash=value=>[...String(value)].reduce((sum,char)=>(sum*31+char.charCodeAt(0))>>>0,2166136261);
const bandFor=score=>score>=80?4:score>=65?3:score>=45?2:score>=25?1:0;
export const omenBandLabel=(category,band)=>category==='volcano'?['穏やかな巡り','地下の気が動く','火の気が高まる','噴火の兆し','大きな噴火の兆し'][band]:['穏やかな巡り','大地の気が動く','揺れの兆し','強い揺れの兆し','大きな変動の兆し'][band];

export function calculateEarthOmen({date,latitude,longitude,category='earthquake',positions}){
  const normalized=normalizeMundanePositions(positions),angles=calculateAngles(new Date(date),{latitude,longitude}),axes=[{name:'ASC',value:angles.ascendant},{name:'MC',value:angles.midheaven},{name:'IC',value:(angles.midheaven+180)%360}],outerPairs=category==='volcano'?[['Mars','Pluto'],['Mars','Uranus'],['Saturn','Pluto']]:[['Mars','Uranus'],['Mars','Saturn'],['Saturn','Uranus'],['Uranus','Pluto']],contributors=[];
  for(const [left,right] of outerPairs){if(!Number.isFinite(normalized[left])||!Number.isFinite(normalized[right]))continue;const aspect=hardAspect(normalized[left],normalized[right]);if(aspect)contributors.push({id:`${left}-${right}`,label:`${BODY_LABELS[left]}と${BODY_LABELS[right]}の${aspect.angle}度`,weight:category==='volcano'&&left==='Mars'&&right==='Pluto'?25:18,orb:aspect.orb})}
  for(const body of ['Mars','Saturn','Uranus','Pluto']){if(!Number.isFinite(normalized[body]))continue;const nearest=axes.map(axis=>({...axis,orb:distance(normalized[body],axis.value)})).sort((a,b)=>a.orb-b.orb)[0];if(nearest.orb<=6)contributors.push({id:`angular-${body}`,label:`${BODY_LABELS[body]}が${nearest.name}付近`,weight:category==='volcano'&&['Mars','Pluto'].includes(body)?22:16,orb:nearest.orb})}
  if(Number.isFinite(normalized.Sun)&&Number.isFinite(normalized.Moon)){const phase=distance(normalized.Sun,normalized.Moon),newOrb=phase,fullOrb=Math.abs(phase-180),phaseOrb=Math.min(newOrb,fullOrb);if(phaseOrb<=8)contributors.push({id:'lunation',label:`${newOrb<fullOrb?'新月':'満月'}の影響`,weight:14,orb:phaseOrb})}
  if(category==='volcano'&&Number.isFinite(normalized.Mars)){const sign=Math.floor(normalized.Mars/30),fire=[0,4,8].includes(sign);if(fire)contributors.push({id:'mars-fire',label:'火星が火の宮を運行',weight:12,orb:0})}
  const raw=15+contributors.reduce((sum,item)=>sum+Math.max(4,item.weight-item.orb*1.4),0),score=Math.max(0,Math.min(100,Math.round(raw))),band=bandFor(score);
  return Object.freeze({score,band,label:omenBandLabel(category,band),contributors:Object.freeze(contributors.sort((a,b)=>b.weight-a.weight)),angles:Object.freeze(angles)});
}

export function forecastEarthOmen({startDate=new Date(),latitude,longitude,placeId,placeNameJa,category='earthquake',ephemeris,horizonDays=30}){
  if(!ephemeris?.planetLongitudes)throw new TypeError('planetLongitudes ephemeris is required');const start=new Date(startDate);start.setUTCHours(12,0,0,0);const days=[];
  for(let offset=0;offset<=horizonDays;offset++){const date=new Date(start.getTime()+offset*86400000),omen=calculateEarthOmen({date,latitude,longitude,category,positions:ephemeris.planetLongitudes(date)});days.push({date,omen})}
  days.sort((a,b)=>b.omen.score-a.omen.score||a.date-b.date);const peak=days[0],windowStart=new Date(Math.max(start.getTime(),peak.date.getTime()-86400000)),windowEnd=new Date(peak.date.getTime()+2*86400000),reading=composeOmenReading({placeNameJa,category,peakDate:peak.date,windowStart,windowEnd,omen:peak.omen});
  return Object.freeze({schemaId:'koyomi-earth-omen-v1',placeId,placeNameJa,category,latitude,longitude,issuedAt:new Date(startDate).toISOString(),peakDate:peak.date.toISOString(),windowStart:windowStart.toISOString(),windowEnd:windowEnd.toISOString(),horizonDays,score:peak.omen.score,band:peak.omen.band,label:peak.omen.label,contributors:peak.omen.contributors,reading,engineVersion:EARTH_SIGNS_VERSION});
}

export function composeOmenReading({placeNameJa,category,peakDate,windowStart,windowEnd,omen}){
  const seed=hash(`${placeNameJa}:${peakDate.toISOString()}:${category}`),lead=category==='volcano'?[`${placeNameJa}では火の気が大きく高まります。`,`${placeNameJa}では地下の力が表へ向かう巡りに入ります。`,`${placeNameJa}では静けさの内側で火の力が育ちます。`]:[`${placeNameJa}では大地の緊張が強まります。`,`${placeNameJa}では地の気が大きく動く巡りに入ります。`,`${placeNameJa}では大地に変化の波が重なります。`],timing=`特に${dateLabel(peakDate)}前後、${dateLabel(windowStart)}から${dateLabel(windowEnd)}にかけて${category==='volcano'?'噴火へ向かう兆し':'揺れの兆し'}が最も強まるでしょう。`,basis=omen.contributors.length?`${omen.contributors.slice(0,2).map(item=>item.label).join('、')}が重なっています。`:'天体の刺激はまだ穏やかです。';return`${lead[seed%lead.length]}${timing}${basis}`;
}

export function rankEarthOmens({places,startDate,category,ephemeris,horizonDays=30,limit=5}){const cache=new Map(),cachedEphemeris={...ephemeris,planetLongitudes(date){const key=date.toISOString();if(!cache.has(key))cache.set(key,ephemeris.planetLongitudes(date));return cache.get(key)}};return places.map(place=>forecastEarthOmen({...place,startDate,category:place.category||category,ephemeris:cachedEphemeris,horizonDays})).sort((a,b)=>b.score-a.score||a.placeNameJa.localeCompare(b.placeNameJa,'ja')).slice(0,limit)}
