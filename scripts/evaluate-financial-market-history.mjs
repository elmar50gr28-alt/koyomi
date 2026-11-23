// Run via Node 22+: npm run evaluate:market-history
// Downloads (without republishing) public ^NDX daily closes. All calculations are deterministic.
import fs from 'node:fs';
import vm from 'node:vm';
import {readFinancialWindow} from '../src/financial/astrology-core.js';
import {backtestMarketDirection,MARKET_PRICE_SOURCE,parseMarketCSV} from '../src/financial/market-history.js';

function loadAstronomy(){
  const source=fs.readFileSync(new URL('../vendor/astronomy-engine/2.1.19/astronomy.browser.min.js',import.meta.url),'utf8');
  const context={module:{exports:{}},exports:{},Date,Math,console};
  vm.runInNewContext(source,context,{timeout:120000,filename:'astronomy.browser.min.js'});
  const astronomy=context.module.exports;
  if(typeof astronomy?.SunPosition!=='function')throw new Error('Astronomy Engine loading failed');
  return astronomy;
}
const selectedMarket=process.argv.find(x=>x.startsWith('--market='))?.slice(9)||'nasdaq';
const ARCHIVE_NIKKEI='https://raw.githubusercontent.com/it-ces/Datasets/main/Nikkei225.csv';
if(!['nikkei','nasdaq'].includes(selectedMarket))throw new Error('Unsupported audit market');
async function getCSV(){
  const path=process.argv.find(x=>x.startsWith('--csv='))?.slice(6);
  if(path)return {content:fs.readFileSync(path,'utf8'),source:'local CSV'};
  const link=selectedMarket==='nikkei'?ARCHIVE_NIKKEI:MARKET_PRICE_SOURCE.nasdaq.url;
  const response=await fetch(link,{headers:{'User-Agent':'KOYOMI historical model audit (public data read-only)'},signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw new Error('External CSV returned HTTP '+response.status);
  return {content:await response.text(),source:selectedMarket==='nikkei'
    ? 'Historical Nikkei 225 close sample / it-ces/Datasets (2008–2018 archive; publisher not official)'
    : MARKET_PRICE_SOURCE.nasdaq.attribution};
}
const {content,source}=await getCSV();
const prices=parseMarketCSV(content);
if(prices.length<500)throw new Error('Insufficient real market history');
const astronomy=loadAstronomy();
const cache=new Map(),readWindow=(date,days)=>{
  const result=[];
  for(let d=0;d<days;d++){
    const current=new Date(date.getTime());current.setUTCDate(current.getUTCDate()+d);
    const key=current.toISOString().slice(0,10);
    if(!cache.has(key))cache.set(key,readFinancialWindow(current,astronomy,1)[0]);
    result.push(cache.get(key));
  }
  return result;
};
const reports=[1,7,14].map(horizon=>
  backtestMarketDirection({prices,market:selectedMarket,horizon,readWindow}));
const summary={
  evaluatedAt:new Date().toISOString(),
  market:selectedMarket,source,sourceStart:prices[0].date,sourceEnd:prices.at(-1).date,
  sourceRows:prices.length,methodId:'koyomi-market-symbolic-direction-v1',
  horizons:reports.map(({horizon,evaluated,correct,modelAccuracy,baselineAccuracy,differencePoints,
   neutralOrFlat,upPredictions,downPredictions,testStatus})=>({
    horizon,evaluated,correct,modelAccuracy,baselineAccuracy,differencePoints,neutralOrFlat,
    upPredictions,downPredictions,testStatus
  })),
  methodology:'No overlapping periods. Prediction uses only deterministic ephemeris, never future prices. Outcome uses next close on/after +N calendar days. Accuracy excludes neutral predictions.',
  caveat:'Retrospective non-registered rule. Statistics are descriptive, not prospective accuracy proof. Third-party Yahoo Finance ^NDX mirror, not official.'
};
console.log('KOYOMI ACTUAL MARKET HISTORY AUDIT');
console.log(JSON.stringify(summary,null,2));
if(process.env.GITHUB_STEP_SUMMARY){
  const lines=['## KOYOMI 金融占星術・実市場の過去照合 '+selectedMarket,
    '',
    '対象：'+selectedMarket+'（'+summary.sourceStart+'〜'+summary.sourceEnd+'）、実終値 '+summary.sourceRows+'件',
    '',
    '|期間（暦日）|判定数|的中率|常に上昇予想|差|',
    '|---|---:|---:|---:|---:|',
    ...summary.horizons.map(r=>'|'+r.horizon+'|'+r.evaluated+'|'+
     (r.modelAccuracy===null?'–':r.modelAccuracy+'%')+'|'+(r.baselineAccuracy===null?'–':r.baselineAccuracy+'%')+'|'+
     (r.differencePoints===null?'–':r.differencePoints+'pt')+'|'),
    '',
    '> 後知恵による過去照合であり、予測能力は証明されていません。方向感なしは的中率から除外。',
    '',
    '出典：'+summary.source
  ];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
}
