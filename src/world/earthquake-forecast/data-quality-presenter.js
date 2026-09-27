const HOUR=3_600_000,DAY=86_400_000,FUTURE_TOLERANCE=HOUR;
export const EARTHQUAKE_DATA_FRESHNESS_LIMITS=Object.freeze({liveMs:2*HOUR,catalogMs:3*DAY,thermalMs:7*DAY});

const finite=value=>value!=null&&Number.isFinite(Number(value));
const validDate=value=>Number.isFinite(Date.parse(value));
const countLabel=value=>finite(value)?`${Number(value).toLocaleString('ja-JP')}件`:'未取得';
const dateLabel=value=>validDate(value)?new Date(value).toLocaleString('ja-JP',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'日時不明';
const dayLabel=value=>validDate(value)?new Date(value).toLocaleDateString('ja-JP',{year:'numeric',month:'numeric',day:'numeric'}):'期間不明';
const ageLabel=ageMs=>ageMs<HOUR?'1時間未満':ageMs<2*DAY?`${Math.floor(ageMs/HOUR)}時間前`:`${Math.floor(ageMs/DAY)}日前`;

function freshness(value,now,maxAgeMs){
  const time=Date.parse(value),current=new Date(now).getTime();
  if(!Number.isFinite(time)||!Number.isFinite(current))return Object.freeze({status:'missing',ageMs:null,label:'日時不明'});
  const ageMs=current-time;
  if(ageMs< -FUTURE_TOLERANCE)return Object.freeze({status:'invalid',ageMs,label:'日時を確認'});
  return Object.freeze({status:ageMs>maxAgeMs?'stale':'current',ageMs:Math.max(0,ageMs),label:ageLabel(Math.max(0,ageMs))});
}

const item=(key,label,value,detail,status,statusLabel)=>Object.freeze({key,label,value,detail,status,statusLabel,ready:['current','saved'].includes(status)});

export function buildEarthquakeDataQuality({online=true,live={},catalog=null,thermal=null,now=new Date()}={}){
  const liveHasData=['network','saved'].includes(live?.source)&&Array.isArray(live?.events),catalogCount=catalog?.freshness?.storedRecords,thermalCount=thermal?.observationCount;
  const liveAge=freshness(live?.fetchedAt,now,EARTHQUAKE_DATA_FRESHNESS_LIMITS.liveMs),catalogAge=freshness(catalog?.freshness?.catalogThroughUtc,now,EARTHQUAKE_DATA_FRESHNESS_LIMITS.catalogMs),thermalAge=freshness(thermal?.coverageEndUtc,now,EARTHQUAKE_DATA_FRESHNESS_LIMITS.thermalMs);
  const catalogComplete=catalog?.freshness?.complete!==false,thermalAvailable=thermal?.status==='available';
  const liveStatus=!liveHasData?(live?.source==='loading'?'loading':'missing'):live?.source==='saved'?'saved':liveAge.status;
  const catalogStatus=!finite(catalogCount)||!catalogComplete?'missing':catalogAge.status;
  const thermalStatus=!finite(thermalCount)||!thermalAvailable?'missing':thermalAge.status;
  const connection=online?(live?.source==='network'?'通信中':'オンライン'):'オフライン';
  let state,badge;
  if(!online){state='offline';badge='オフライン'}
  else if(liveStatus==='loading'){state='loading';badge='取得中'}
  else if(liveStatus==='missing'||liveStatus==='invalid'){state='unavailable';badge='速報未取得'}
  else if(liveStatus==='saved'){state='saved';badge='保存データ'}
  else if([liveStatus,catalogStatus,thermalStatus].some(value=>['stale','missing','invalid'].includes(value))){state='attention';badge='一部更新待ち'}
  else{state='current';badge='データ最新'}
  const summary=liveHasData?`${badge}・USGS ${countLabel(live.events.length)}・取得 ${dateLabel(live.fetchedAt)}`:`${badge}・USGS速報 ${live?.source==='loading'?'取得中':'未取得'}`;
  const statusLabel=status=>({current:'最新',saved:'保存',stale:'更新待ち',missing:'未取得',invalid:'日時異常',loading:'取得中'}[status]||'確認中');
  const items=Object.freeze([
    item('connection','通信',connection,online?'自動更新を利用できます':'保存済みデータだけを表示します',online?'current':'saved',online?'接続中':'保存のみ'),
    item('live','直近30日の観測',liveHasData?countLabel(live.events.length):'未取得',liveHasData?`USGS・取得 ${dateLabel(live.fetchedAt)}・${liveAge.label}`:'平常域ではなく、データ未取得です',liveStatus,statusLabel(liveStatus)),
    item('catalog','長期カタログ',finite(catalogCount)?countLabel(catalogCount):'未取得',finite(catalogCount)?`USGS・${dayLabel(catalog?.freshness?.catalogThroughUtc)}まで・${catalogAge.label}`:'比較計算を利用できません',catalogStatus,statusLabel(catalogStatus)),
    item('thermal','地表熱（研究）',finite(thermalCount)?countLabel(thermalCount):'未取得',finite(thermalCount)?`NASA POWER・${dayLabel(thermal?.coverageEndUtc)}まで・${thermalAge.label}・地図比較用`:'研究レイヤーへ加算しません',thermalStatus,statusLabel(thermalStatus))
  ]);
  const delayed=items.filter(entry=>['stale','missing','invalid'].includes(entry.status)&&entry.key!=='connection').map(entry=>entry.label);
  const notice=delayed.length?`${delayed.join('・')}は最新ではありません。表示中の日付を確認してください。`:'各データの更新日時を確認済みです。';
  return Object.freeze({state,badge,summary,notice,items,liveReady:['current','saved'].includes(liveStatus),catalogReady:catalogStatus==='current',thermalReady:thermalStatus==='current'});
}
