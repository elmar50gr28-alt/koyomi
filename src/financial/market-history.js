// Local-only historical research: no market prices enter the astrology prediction model.
import {MARKET_PERIODS, forecastMarketDirection} from './market-direction.js';

const DAY_MS = 86400000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEADERS = ['close','adj close','adj_close','price','value','nikkei225','nasdaq100','dexjpus','goldamgbd228nlbm','goldpmgbd228nlbm'];
const LIMIT_BYTES = 3500000;
export const MARKET_PRICE_SOURCE = Object.freeze({
  nasdaq: {
    label: 'NASDAQ100 (^NDX)',
    // Unofficial Yahoo Finance mirror. The app fetches directly; it does not redistribute the original CSV.
    url: 'https://raw.githubusercontent.com/Chief-rich/nasdaq100-data/main/data/ndx_daily/history.csv',
    attribution: 'Yahoo Finance ^NDX / Chief-rich/nasdaq100-data（第三者ミラー、公式保証なし）'
  }
});
export const OFFICIAL_CSV_LINKS = Object.freeze({
  nikkei: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=NIKKEI225',
  nasdaq: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=NASDAQ100',
  usdjpy: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXJPUS',
  gold: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=GOLDAMGBD228NLBM'
});
function normalizeHeader(value) {
  return String(value).replace(/^\uFEFF/,'').trim().toLowerCase().replace(/\s+/g,' ');
}
function splitCSV(text) {
  const rows=[], row=[];let field='',quotes=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(quotes&&text[i+1]==='"'){field+='"';i++;}
      else quotes=!quotes;
    }else if(!quotes&&ch===','){row.push(field);field='';}
    else if(!quotes&&(ch==='\n'||ch==='\r')){
      row.push(field);if(row.some(v=>v.trim()))rows.push([...row]);
      row.length=0;field='';
      if(ch==='\r'&&text[i+1]==='\n')i++;
    }else field+=ch;
  }
  if(quotes)throw new Error('CSVの引用符が閉じられていません。');
  row.push(field);if(row.some(v=>v.trim()))rows.push([...row]);
  return rows;
}
function dateMs(key) {
  if(!DATE_RE.test(key))return NaN;
  const value=Date.parse(key+'T00:00:00Z');
  return Number.isFinite(value)&&new Date(value).toISOString().slice(0,10)===key?value:NaN;
}
export function parseMarketCSV(text) {
  if(typeof text!=='string'||!text.trim()||text.length>LIMIT_BYTES)throw new RangeError('CSVファイルは3.5MB以下にしてください。');
  const rows=splitCSV(text);
  if(rows.length<3)throw new Error('最低2件の終値データが必要です。');
  const head=rows[0].map(normalizeHeader);
  const dateIdx=head.findIndex(s=>['date','observation_date','datetime','timestamp'].includes(s));
  const valueIdx=head.findIndex(s=>HEADERS.includes(s));
  if(dateIdx<0||valueIdx<0)throw new Error('CSVに日付列と終値（Close / VALUE / 指数ID）が必要です。');
  const data=new Map();
  for(const row of rows.slice(1)){
    const raw=String(row[dateIdx]??'').trim(),day=raw.slice(0,10);
    if(!Number.isFinite(dateMs(day)))continue;
    const number=Number(String(row[valueIdx]??'').trim().replace(/,/g,''));
    if(!Number.isFinite(number)||number<=0)continue;
    data.set(day,Number(number.toFixed(8)));
  }
  const values=[...data].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,close])=>({date,close}));
  if(values.length<2)throw new Error('有効な終値が2件以上ありません。');
  if(values.length>25000)throw new RangeError('時系列が長すぎます。');
  return values;
}
export function validatePriceRows(rows) {
  if(!Array.isArray(rows)||rows.length<2)throw new Error('終値データが不足しています。');
  let previous='';
  for(const row of rows){
    if(!row||!Number.isFinite(dateMs(row.date))||!Number.isFinite(row.close)||row.close<=0||row.date<=previous)
      throw new Error('終値の日付順序または値が不正です。');
    previous=row.date;
  }
  return rows;
}
const plusDays=(date,days)=>new Date(dateMs(date)+days*DAY_MS).toISOString().slice(0,10);
const pct=(a,b)=>Math.round(a/b*10000)/100;
function nextIndex(rows,day,start){
  let lo=start,hi=rows.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(rows[mid].date<day)lo=mid+1;else hi=mid;}
  return lo;
}
export function backtestMarketDirection({prices,market='nikkei',horizon=7,readWindow,onProgress}){
  validatePriceRows(prices);
  if(!MARKET_PERIODS.includes(horizon)||typeof readWindow!=='function')throw new Error('検証条件が不正です。');
  const cases=[];let neutral=0,skipped=0,lastEnd='';
  for(let i=0;i<prices.length-1;i++){
    const origin=prices[i];
    if(origin.date<lastEnd)continue; // no overlapping forecast periods: avoid pseudo-independent trials.
    const targetDay=plusDays(origin.date,horizon);
    const targetIdx=nextIndex(prices,targetDay,i+1);
    if(targetIdx>=prices.length)break;
    const terminal=prices[targetIdx];
    if((dateMs(terminal.date)-dateMs(targetDay))/DAY_MS>5){skipped++;continue;}
    // Noon JST (03:00 UTC), known before the start-date closing price.
    const startDate=new Date(origin.date+'T03:00:00Z');
    const window=readWindow(startDate,horizon);
    if(!Array.isArray(window)||window.length!==horizon){skipped++;continue;}
    const prediction=forecastMarketDirection(window,market,horizon);
    const change=(terminal.close/origin.close-1)*100;
    const outcome=change>0?'up':change<0?'down':'flat';
    if(prediction.direction==='unclear'||outcome==='flat'){
      neutral++;
    }else{
      cases.push({
        start:origin.date,end:terminal.date,prediction:prediction.direction,actual:outcome,
        correct:prediction.direction===outcome,returnPct:Number(change.toFixed(3)),
        baselineCorrect:outcome==='up',score:prediction.symbolicScore
      });
    }
    lastEnd=targetDay; // dates are calendar-day horizons, not trading-session counts.
    if(typeof onProgress==='function'&&i%200===0)onProgress(i,prices.length);
  }
  const n=cases.length,wins=cases.filter(x=>x.correct).length,up=cases.filter(x=>x.actual==='up').length;
  const modelAccuracy=n?pct(wins,n):null,baselineAccuracy=n?pct(up,n):null;
  const upPredictions=cases.filter(x=>x.prediction==='up').length;
  const downPredictions=cases.filter(x=>x.prediction==='down').length;
  return {
    market,horizon,sourceStart:prices[0].date,sourceEnd:prices.at(-1).date,
    sourceRows:prices.length, evaluated:n,correct:wins,upPredictions,downPredictions,
    neutralOrFlat:neutral,skipped,modelAccuracy,baselineAccuracy,
    differencePoints:n?Number((modelAccuracy-baselineAccuracy).toFixed(2)):null,
    testStatus:n<30?'insufficient':'exploratory',
    cases,
    note:'非重複期間・終値から目標日以降の最初の営業日終値までで比較。市場データは占断の入力に使わず、事後照合のみ。'
  };
}
