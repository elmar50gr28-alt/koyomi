import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseMarketCSV,backtestMarketDirection,validatePriceRows,MARKET_PRICE_SOURCE,OFFICIAL_CSV_LINKS} from '../src/financial/market-history.js';
const fred='observation_date,NIKKEI225\n2026-11-18,50000.12\n2026-11-19,.\n2026-11-20,51000.34\n';
assert.deepEqual(parseMarketCSV(fred),[
  {date:'2026-11-18',close:50000.12},{date:'2026-11-20',close:51000.34}
]);
assert.deepEqual(parseMarketCSV('Date,Close\n2026-11-20,99\n2026-11-19,98\n2026-11-20,100'),[
  {date:'2026-11-19',close:98},{date:'2026-11-20',close:100}
],'same day deduplicated, sorted');
assert.equal(parseMarketCSV('Date,Price\n2026-11-19,"38,100.2"\n2026-11-20,"38,400.5"')[1].close,38400.5);
assert.equal(parseMarketCSV('Date,Close\n2026-11-19,100\n2026-11-20,101')[0].close,100);
assert.throws(()=>parseMarketCSV('Date,Price\n2026-11-19,.\n2026-11-20,.'),/終値/);
assert.throws(()=>parseMarketCSV('Date,Price\n2026-11-19,"invalid\n2026-11-20,123'),/引用符/);
assert.throws(()=>parseMarketCSV('Date,Cost\n2026-11-19,10\n2026-11-20,20'),/終値/);
assert.throws(()=>validatePriceRows([{date:'2026-11-20',close:100},{date:'2026-11-19',close:200}]),/日付順序/);
assert.ok(MARKET_PRICE_SOURCE.nasdaq.url.includes('ndx_daily/history.csv'));
assert.ok(OFFICIAL_CSV_LINKS.nikkei.includes('NIKKEI225'));

const dates=[];
for(let n=0;n<80;n++){
  const date=new Date(Date.UTC(2026,7,3+n));
  if([0,6].includes(date.getUTCDay()))continue;
  dates.push({date:date.toISOString().slice(0,10),close:100+n});
}
const bullishWindow=(date,horizon)=>Array.from({length:horizon},(_,i)=>({
  date:new Date(date.getTime()+i*86400000).toISOString().slice(0,10),
  aspects:[{bodies:['Venus','Jupiter'],type:'trine',orb:0.2,label:'金星×木星',aspect:'トライン'}],
  retrogrades:[]
}));
const outcome=backtestMarketDirection({prices:dates,market:'nikkei',horizon:7,readWindow:bullishWindow});
assert.ok(outcome.evaluated>=5,'non-overlapping weekly samples');
assert.equal(outcome.correct,outcome.evaluated);
assert.equal(outcome.modelAccuracy,100);
assert.equal(outcome.baselineAccuracy,100);
assert.equal(outcome.differencePoints,0,'rising market alone is not evidence of superiority');
assert.ok(outcome.cases.every(v=>v.end>=v.start));
assert.equal(outcome.cases[0].start,'2026-08-03');
assert.equal(outcome.cases[0].end,'2026-08-10','next close on or after 7 calendar days');
const bearishWindow=(date,horizon)=>Array.from({length:horizon},(_,i)=>({
  date:new Date(date.getTime()+i*86400000).toISOString().slice(0,10),
  aspects:[{bodies:['Saturn','Mars'],type:'square',orb:0.2,label:'土星×火星',aspect:'スクエア'}],
  retrogrades:[]
}));
const misses=backtestMarketDirection({prices:dates,market:'nikkei',horizon:7,readWindow:bearishWindow});
assert.equal(misses.modelAccuracy,0);
assert.equal(misses.baselineAccuracy,100);
const flat=backtestMarketDirection({prices:dates,market:'nikkei',horizon:7,readWindow:(date,horizon)=>Array.from({length:horizon},()=>({
  date:'2026-08-03',aspects:[],retrogrades:[]
}))});
assert.equal(flat.evaluated,0);
assert.equal(flat.modelAccuracy,null);
assert.ok(flat.neutralOrFlat>0,'neutral cases counted separately');
const html=fs.readFileSync('financial-astrology.html','utf8'),css=fs.readFileSync('src/financial/astrology-page.css','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
for(const name of ['historyAuto','historyFile','historyRun','historyAccuracy','historyBaseline','historyCount','historyPriceCurve'])
  assert.ok(html.includes('id="'+name+'"'),name+' UI missing');
assert.ok(html.includes('./src/financial/market-history-page.js'));
for(const asset of ['./src/financial/market-history.js','./src/financial/market-history-page.js','./src/financial/market-history-worker.js','./src/financial/market-crash-research.js'])
  assert.ok(sw.includes("'"+asset+"'"),asset+' offline asset missing');
assert.match(css,/\.history-metrics/);
assert.match(css,/\.market-risk-panel/);
assert.match(html,/id="marketRiskTag"/);
assert.match(html,/id="historyCrashList"/);
assert.match(html,/id="leadRun"/);
assert.match(html,/id="leadMonths"/);
assert.ok(html.indexOf('id="leadHeading"')<html.indexOf('id="marketForecastTitle"'),'future months must come before daily astrology');
assert.ok(sw.includes("'./src/financial/market-lead-forecast.js'"));
assert.ok(html.indexOf('id="marketRiskPanel"')<html.indexOf('id="marketDaily"'),'price crash warning must be visible ahead of chart details');
assert.match(css,/min-height:48px/);
assert.match(fs.readFileSync('src/financial/market-history-page.js','utf8'),/new Worker/);
assert.match(fs.readFileSync('src/financial/market-history-worker.js','utf8'),/readFinancialSky/);
console.log('CSV parsing, real-price backtest accounting, neutral exclusion, naive baseline, and offline UI contracts passed');
