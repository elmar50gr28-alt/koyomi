// Extended independent timeline with FRED Nikkei 225 data.
// Does not redistribute price observations. Historic dates were predeclared.
// Invocation: npm run evaluate:market-nikkei-long
import fs from 'node:fs';
import vm from 'node:vm';
import {parseMarketCSV} from '../src/financial/market-history.js';
import {readFinancialSky} from '../src/financial/astrology-core.js';
import {forecastLeadMonths} from '../src/financial/market-lead-forecast.js';

const uri='https://fred.stlouisfed.org/graph/fredgraph.csv?id=NIKKEI225';
const response=await fetch(uri,{headers:{'User-Agent':'koyomi-research/1.0'},signal:AbortSignal.timeout(40000)});
if(!response.ok)throw new Error('FRED returned HTTP '+response.status);
const prices=parseMarketCSV(await response.text()).filter(row=>row.date>='1970-01-01');
if(prices.length<9000||prices[0].date>'1981-01-01'||prices.at(-1).date<'2024-08-30')
 throw new Error('Insufficient FRED 1987-2024 history: refuse to fabricate results.');

const js=fs.readFileSync(new URL('../vendor/astronomy-engine/2.1.19/astronomy.browser.min.js',import.meta.url),'utf8');
const context={module:{exports:{}},exports:{},Date,Math,console};
vm.runInNewContext(js,context,{timeout:100000});
const astro=context.module.exports;
if(typeof astro?.SunPosition!=='function')throw new Error('Astronomy engine missing');
const skyCache=new Map();
const readSky=day=>{
 let p=skyCache.get(day);
 if(!p){
  const [y,m,d]=day.split('-').map(Number);
  p=readFinancialSky(new Date(Date.UTC(y,m-1,d,12)),astro);
  skyCache.set(day,p);
 }
 return p;
};
const checkpoints=[
 ['1987 ブラックマンデー約1か月前','1987-09-18'],
 ['2008 金融危機 約1か月前','2008-08-15'],
 ['2011 震災 約1か月前','2011-02-10'],
 ['2020 コロナショック 約1か月前','2020-01-24'],
 ['2024 日本株急落 約1か月前','2024-07-05'],
 ['2026年 現在の予測',prices.at(-1).date]
];
const report=[];
for(const [title,date] of checkpoints){
 const f=forecastLeadMonths({prices,asOfDate:date,market:'nikkei',readSky});
 const origin=prices.filter(p=>p.date<=date).at(-1);
 const months=(f.buckets??[]).map(x=>{
  const future=prices.filter(p=>p.date>=x.start && p.date<=x.end);
  const minClose=future.length?Math.min(...future.map(p=>p.close)):null;
  return {
   period:x.period,dateFrom:x.start,dateTo:x.end,
   score:x.riskScore??null,priceOnly:x.priceOnlyScore??null,
   truthWorstDropPercent:minClose===null?null:Math.round((minClose/origin.close-1)*10000)/100,
   reason:x.status
  };
 });
 report.push({title,asOf:origin?.date??date,status:f.status,leadingPeriod:f.leadingPeriod??null,
  canClaimVerified:f.canClaimVerified??false,months,
  independentHoldout:f.diagnostics?.map(y=>({
   period:y.bucket,status:y.status,
   sampleCount:y.testN,brier:y.model?.brier??null,
   onlyPricesBrier:y.priceOnly?.brier??null,constantBrier:y.model?.baseBrier??null,
   warningPrecision:y.model?.precision??null,warningRecall:y.model?.recall??null,
   warningFalseAlarms:y.model?.falseAlerts??null
  }))??[]});
}
console.log('KOYOMI FRED NIKKEI LONG HISTORY PRE-CRASH LEAD TEST');
console.log(JSON.stringify({from:prices[0].date,to:prices.at(-1).date,rows:prices.length,source:uri,events:report},null,2));
if(process.env.GITHUB_STEP_SUMMARY){
 const rows=['## FRED日経平均（長期履歴）の事前時期予測研究',
 '対象終値：'+prices[0].date+'〜'+prices.at(-1).date+'、'+prices.length+'件',
 '',
 '|事例・事前時点|予測した期間|研究スコア|実際の期間最大下落|',
 '|---|---|---:|---:|',
 ...report.flatMap(r=>r.months.map(m=>
  '|'+r.title+'（'+r.asOf+'）|'+m.period+'|'+(m.score??'判定保留')+
  '|'+(m.truthWorstDropPercent===null?'未到達':m.truthWorstDropPercent+'%')+'|')),
 '',
 '> 事後に選んだ著名な暴落日での回顧的検証。将来の値動きを当該時点の学習に混ぜない。スコアは実証済み確率ではない。',
 '',
 '出典：'+uri];
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,rows.join('\n')+'\n');
}
