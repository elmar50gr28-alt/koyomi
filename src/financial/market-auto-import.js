// Browser-only opt-in network on page startup; no keys, proxy, or server-side price redistribution.
// Data never enters forecast as a future observation. Provenance and source dates remain visible.
import {parseMarketCSV,validatePriceRows} from './market-history.js';

const MAX_BYTES=3500000;
const MS_DAY=86400000;
export const AUTO_REFRESH_INTERVAL_MS=6*60*60*1000;
export const AUTO_STALE_AFTER_DAYS=7;
export const AUTO_MARKET_SOURCES=Object.freeze({
  nikkei: Object.freeze([
    Object.freeze({
      id:'fred-nikkei225',format:'csv',
      url:'https://fred.stlouisfed.org/graph/fredgraph.csv?id=NIKKEI225',
      label:'FRED / 日経平均（Nikkei Indexes。ブラウザのCORS制限で取得できない場合あり）',
      class:'official-series',instrument:'NIKKEI225'
    }),
    Object.freeze({
      id:'ganase-nikkei225',format:'csv',
      url:'https://raw.githubusercontent.com/ganase/stock_market_index/main/data/indexes/nikkei225/daily.csv',
      label:'Nikkei Indexesの公開終値を収集した第三者アーカイブ（更新停止に注意）',
      class:'third-party-archive',instrument:'NIKKEI225'
    })
  ]),
  nasdaq: Object.freeze([
    Object.freeze({
      id:'chief-rich-ndx',format:'csv',
      url:'https://raw.githubusercontent.com/Chief-rich/nasdaq100-data/main/data/ndx_daily/history.csv',
      label:'Yahoo Finance ^NDX / Chief-rich/nasdaq100-data（第三者ミラー）',
      class:'third-party-archive',instrument:'NASDAQ100'
    })
  ]),
  usdjpy: Object.freeze([
    Object.freeze({
      id:'frankfurter-ecb-usdjpy',format:'frankfurter',
      url:'https://api.frankfurter.dev/v1/2000-01-01..?base=USD&symbols=JPY',
      label:'Frankfurter / 欧州中央銀行の参考為替レート USD→JPY（日次、リアルタイムではない）',
      class:'reference-rate',instrument:'USDJPY'
    })
  ]),
  gold: Object.freeze([
    Object.freeze({
      id:'xaudaily-comex-gc',format:'xaudaily',
      url:'https://raw.githubusercontent.com/Wangxian111/xaudaily-data/main/data/latest/readings.json',
      label:'xaudaily.com（CC BY 4.0）/ COMEX金先物 GC、USD/oz。現物金・LBMAとは別系列',
      class:'futures',instrument:'COMEX-GC'
    })
  ])
});
const isoDay=date=>date.toISOString().slice(0,10);
const validNumber=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
export function ageOfLastClose(rows,at=new Date()){
  validatePriceRows(rows);
  if(!(at instanceof Date)||!Number.isFinite(at.getTime()))throw new Error('現在時刻を確認できません。');
  const today=isoDay(at);
  const last=rows.at(-1).date;
  const days=Math.floor((Date.parse(today+'T00:00:00Z')-Date.parse(last+'T00:00:00Z'))/MS_DAY);
  return {lastDate:last,daysOld:days,stale:days>AUTO_STALE_AFTER_DAYS};
}
export function parseFrankfurterRates(payload) {
  if(!payload||payload.base!=='USD'||!payload.rates||typeof payload.rates!=='object'||Array.isArray(payload.rates)) {
    throw new Error('米ドル基準の為替履歴を取得できませんでした。');
  }
  const rows=Object.entries(payload.rates).map(([date,rates])=>({date,close:rates?.JPY}))
    .filter(row=>validNumber(row.close))
    .sort((a,b)=>a.date.localeCompare(b.date));
  return validatePriceRows(rows);
}
export function parseGoldReadings(payload){
  const gold=payload?.readings?.gold;
  if(!payload||payload.schema!=='xaudaily.readings/v1'||gold?.unit!=='USD/oz'||!Array.isArray(gold?.rows)){
    throw new Error('金先物のデータ形式が変わりました。');
  }
  const rows=gold.rows
    .map(r=>({date:r.d,close:r.c}))
    .filter(r=>validNumber(r.close))
    .sort((a,b)=>a.date.localeCompare(b.date));
  validatePriceRows(rows);
  if(gold.asOf && rows.at(-1).date!==gold.asOf)throw new Error('金の終値基準日と履歴が一致しません。');
  return {rows,upstreamStale:gold.stale===true};
}
function validateIncoming(rows,now){
  validatePriceRows(rows);
  if(rows.length>25000)throw new Error('価格データが多すぎます。');
  const tomorrow=isoDay(new Date(now.getTime()+MS_DAY));
  if(rows.at(-1).date>tomorrow)throw new Error('将来の日付が含まれているため破棄しました。');
  if(rows[0].date<'1900-01-01')throw new Error('異常な履歴の開始日です。');
  return rows;
}
async function readSource(source,fetcher,now,timeoutMs){
  const controller=typeof AbortController==='function'?new AbortController():null;
  let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{
    controller?.abort();reject(new Error('通信時間の上限を超えました。'));
  },timeoutMs);});
  try{
    const response=await Promise.race([
      fetcher(source.url,{mode:'cors',cache:'no-store',credentials:'omit',signal:controller?.signal}),
      timeout
    ]);
    if(!response?.ok)throw new Error('取得先 HTTP '+(response?.status||'不明'));
    const len=Number(response.headers?.get?.('content-length'));
    if(Number.isFinite(len)&&len>MAX_BYTES)throw new Error('取得データが大きすぎます。');
    const body=await Promise.race([response.text(),timeout]);
    if(typeof body!=='string'||body.length>MAX_BYTES)throw new Error('取得データが大きすぎます。');
    let rows,upstreamStale=false;
    if(source.format==='csv')rows=parseMarketCSV(body);
    else {
      let parsed;
      try{parsed=JSON.parse(body);}catch{throw new Error('データがJSONとして解析できません。');}
      if(source.format==='frankfurter')rows=parseFrankfurterRates(parsed);
      else if(source.format==='xaudaily'){
        const result=parseGoldReadings(parsed);
        rows=result.rows;upstreamStale=result.upstreamStale;
      }else throw new Error('未対応の価格系列です。');
    }
    validateIncoming(rows,now);
    const age=ageOfLastClose(rows,now);
    return {rows,sourceId:source.id,source:source.label,
      instrument:source.instrument,sourceType:source.class,
      asOf:age.lastDate,stale:age.stale||upstreamStale,
      daysOld:age.daysOld,upstreamStale};
  }finally{clearTimeout(timer);}
}
export async function fetchAutomaticMarket(market,{fetcher=fetch,now=new Date(),timeoutMs=6000}={}){
  const sources=AUTO_MARKET_SOURCES[market];
  if(!sources)throw new Error('対象市場が不正です。');
  if(typeof fetcher!=='function')throw new Error('通信機能がありません。');
  const errors=[];
  let best=null;
  for(const source of sources){
    try{
      const value=await readSource(source,fetcher,now,timeoutMs);
      if(!best||value.asOf>best.asOf)best=value;
      // Prefer fresh verified primary sources. Never silently claim a stale mirror is current.
      if(!value.stale)break;
    }catch(error){errors.push(source.id+': '+(error?.message||String(error)));}
  }
  if(!best)throw new Error(errors.join(' / ')||'自動取得できるデータがありません。');
  return {...best,errors,market,downloadedAt:now.toISOString()};
}
// Don't overwrite a manually imported or newer history with an outdated mirror.
// Reconcile only if prices agree on overlapping days and both mean the SAME instrument.
export function reconcileMarketHistory(previous,incoming){
  validateIncoming(incoming.rows,new Date(incoming.downloadedAt||Date.now()));
  if(!previous?.rows?.length)return {data:incoming,updated:true,reason:'initial'};
  validatePriceRows(previous.rows);
  const oldLast=previous.rows.at(-1).date,newLast=incoming.rows.at(-1).date;
  if(newLast<oldLast)return {data:previous,updated:false,reason:'older'};
  if(newLast===oldLast && incoming.rows.length<=previous.rows.length)
    return {data:previous,updated:false,reason:'unchanged'};
  const differentInstrument=previous.instrument&&incoming.instrument&&previous.instrument!==incoming.instrument;
  if(differentInstrument)return {data:previous,updated:false,reason:'different-instrument'};
  const overlaps=new Map(previous.rows.map(r=>[r.date,r.close]));
  let common=0;
  for(const row of incoming.rows){
    if(!overlaps.has(row.date))continue;
    common++;
    if(Math.abs(row.close/overlaps.get(row.date)-1)>0.003){
      return {data:previous,updated:false,reason:'conflict'};
    }
  }
  if(common>0 && !differentInstrument){
    const combined=new Map(previous.rows.map(r=>[r.date,r.close]));
    for(const row of incoming.rows)combined.set(row.date,row.close);
    const rows=[...combined].sort((a,b)=>a[0].localeCompare(b[0]))
      .slice(-15000).map(([date,close])=>({date,close}));
    return {data:{...incoming,rows},updated:true,reason:'merged'};
  }
  // No overlapping dates: cannot guarantee two sources are the same instrument.
  // An unknown legacy file is preserved if its source cannot be confirmed.
  if(previous.instrument && previous.instrument===incoming.instrument && newLast>oldLast){
    return {data:incoming,updated:true,reason:'replaced-nonoverlap'};
  }
  return {data:previous,updated:false,reason:'unverified-source'};
}
