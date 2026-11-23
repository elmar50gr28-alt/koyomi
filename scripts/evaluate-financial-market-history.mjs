// Run via Node 22+: npm run evaluate:market-history
// Downloads public historical closes for research, without republishing. Astronomy rules remain fixed.
import fs from 'node:fs';
import vm from 'node:vm';
import {readFinancialWindow} from '../src/financial/astrology-core.js';
import {backtestMarketDirection,MARKET_PRICE_SOURCE,parseMarketCSV} from '../src/financial/market-history.js';
import {studyHistoricalCrashes} from '../src/financial/market-crash-research.js';
import {forecastLeadMonths} from '../src/financial/market-lead-forecast.js';

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
  caveat:'Retrospective non-registered rule. Statistics are descriptive, not prospective accuracy proof. External third-party historical data; independent market-source validation is not complete.'
};
console.log('KOYOMI ACTUAL MARKET HISTORY AUDIT');
console.log(JSON.stringify(summary,null,2));
const crisis=studyHistoricalCrashes({prices,market:selectedMarket,readWindow,horizon:14});
console.log('KOYOMI HISTORICAL MAJOR CRASH AUDIT');
console.log(JSON.stringify(crisis,null,2));
const lead=forecastLeadMonths({
 prices,market:selectedMarket,asOfDate:prices.at(-1).date,
 readSky:key=>readWindow(new Date(key+'T12:00:00Z'),1)[0]
});
console.log('KOYOMI MONTHLY PRE-CRASH LEAD MODEL HOLDOUT');
console.log(JSON.stringify({
 market:selectedMarket,asOf:lead.asOf,status:lead.status,
 sampleN:lead.trainingRecords,highestRiskPeriod:lead.leadingPeriod,
 months:lead.buckets?.map(({period,start,end,status,riskScore,priceOnlyScore,baselineScore})=>
  ({period,start,end,status,riskScore,priceOnlyScore,baselineScore})),
 diagnostics:lead.diagnostics,canClaimVerified:lead.canClaimVerified
},null,2));
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
    '出典：'+summary.source,
    '',
    '### 1〜3か月先の事前学習モデル（研究段階）',
    '',
    '|時期|学習状況|未使用期間Brier（天体+価格）|価格だけBrier|一定予測Brier|',
    '|---|---|---:|---:|---:|',
    ...lead.diagnostics.map(d=>'|'+d.bucket+'|'+d.status+
      '|'+(d.model?.brier??'–')+'|'+(d.priceOnly?.brier??'–')+'|'+
      (d.model?.baseBrier??'–')+'|'),
    '',
    '> 時系列の未使用期間を使って性能比較。Brierは小さい方が優秀。星を使った予測が価格だけの予測を上回らない場合、予測力があるとは判定しない。' ,
    '',
    '### 大暴落の個別検証',
    '',
    '|過去事例|観測DD|下落例 / 評価数|占星術警戒（再現率 / 誤警戒）|実価格警戒（再現率 / 誤警戒）|直前チェック地点|',
    '|---|---:|---:|---|---|---|',
    ...crisis.events.map(e=>e.status!=='evaluated'
      ? '|'+e.title+'|対象期間データなし|–|–|–|–|'
      : '|'+e.title+'|'+e.observedDrawdownPct+'%|'+e.crashCases+'/'+e.n+'|'+
        (e.astro.recall??'–')+'% / '+e.astro.falseAlerts+'件|'+
        (e.priceGuard.recall??'–')+'% / '+e.priceGuard.falseAlerts+'件|'+
        (e.checkpoint?.date||'–')+'：星 '+(e.checkpoint?.astro||'–')+' ／ 価格 '+(e.checkpoint?.priceRisk||'–')+'|'),
    '',
    '> 14暦日以内に終値が8%以上下がる事例を別途検証。価格警戒は下落済み情報のみ使用。イベント内の毎営業日評価は重複し、標本独立ではありません。'
  ];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
}
