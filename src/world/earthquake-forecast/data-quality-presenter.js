const finite=value=>value!=null&&Number.isFinite(Number(value));
const validDate=value=>Number.isFinite(Date.parse(value));
const countLabel=value=>finite(value)?`${Number(value).toLocaleString('ja-JP')}件`:'未取得';
const dateLabel=value=>validDate(value)?new Date(value).toLocaleString('ja-JP',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'日時不明';
const dayLabel=value=>validDate(value)?new Date(value).toLocaleDateString('ja-JP',{year:'numeric',month:'numeric',day:'numeric'}):'期間不明';

export function buildEarthquakeDataQuality({online=true,live={},catalog=null,thermal=null}={}){
  const liveReady=['network','saved'].includes(live?.source)&&Array.isArray(live?.events),catalogCount=catalog?.freshness?.storedRecords,thermalCount=thermal?.observationCount;
  const connection=online?(live?.source==='network'?'通信中':'オンライン'):'オフライン';
  const state=!online?'offline':live?.source==='network'?'current':live?.source==='saved'?'saved':live?.source==='loading'?'loading':'unavailable';
  const summary=liveReady?`${connection}・USGS ${countLabel(live.events.length)}・取得 ${dateLabel(live.fetchedAt)}`:`${connection}・USGS速報 ${live?.source==='loading'?'取得中':'未取得'}`;
  const items=Object.freeze([
    Object.freeze({key:'connection',label:'通信',value:connection,detail:online?'自動更新を利用できます':'保存済みデータだけを表示します'}),
    Object.freeze({key:'live',label:'直近30日の観測',value:liveReady?countLabel(live.events.length):'未取得',detail:liveReady?`USGS・取得 ${dateLabel(live.fetchedAt)}`:'平常域ではなく、データ未取得です'}),
    Object.freeze({key:'catalog',label:'長期カタログ',value:finite(catalogCount)?countLabel(catalogCount):'未取得',detail:finite(catalogCount)?`USGS・${dayLabel(catalog?.freshness?.catalogThroughUtc)}まで`:'比較計算を利用できません'}),
    Object.freeze({key:'thermal',label:'地表熱（研究）',value:finite(thermalCount)?countLabel(thermalCount):'未取得',detail:finite(thermalCount)?`NASA POWER・${dayLabel(thermal?.coverageEndUtc)}まで・地図比較用`:'研究レイヤーへ加算しません'})
  ]);
  return Object.freeze({state,summary,items,liveReady,catalogReady:finite(catalogCount),thermalReady:finite(thermalCount)});
}
