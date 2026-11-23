import assert from 'node:assert/strict';
import {
  AUTO_MARKET_SOURCES, AUTO_REFRESH_INTERVAL_MS, AUTO_STALE_AFTER_DAYS,
  ageOfLastClose, parseFrankfurterRates,parseGoldReadings,parseGanaseNikkeiCSV,
  fetchAutomaticMarket,reconcileMarketHistory
} from '../src/financial/market-auto-import.js';

const date=new Date('2026-11-23T05:00:00Z');
const prices=[
 {date:'2026-11-19',close:100},
 {date:'2026-11-20',close:101}
];
assert.equal(AUTO_REFRESH_INTERVAL_MS,6*3600*1000);
assert.equal(AUTO_STALE_AFTER_DAYS,7);
assert.deepEqual(Object.keys(AUTO_MARKET_SOURCES).sort(),['gold','nasdaq','nikkei','usdjpy']);
const nikkeiArchiveFixture=[
 'index_id,date,open,high,low,close,source,fetched_at',
 'nikkei225,2026-04-10,56924.11,56265.77,57012.77,56251.18,public,2026-04-11',
 'nikkei225,2026-04-13,56502.77,56421.46,56765.72,56232.78,public,2026-04-14'
].join('\n');
assert.deepEqual(parseGanaseNikkeiCSV(nikkeiArchiveFixture),[
 {date:'2026-04-10',close:56924.11},{date:'2026-04-13',close:56502.77}
], 'ganase CSV mislabels close as open and low as close');
assert.throws(()=>parseGanaseNikkeiCSV(nikkeiArchiveFixture.replace('57012.77','55000.00')),/矛盾/,
 'reject misleading malformed index OHLC');
assert.equal(ageOfLastClose(prices,date).stale,false);
assert.equal(ageOfLastClose([{date:'2026-10-20',close:100},{date:'2026-10-21',close:101}],date).stale,true);

assert.deepEqual(parseFrankfurterRates({base:'USD',rates:{
 '2026-11-20':{JPY:158.2},'2026-11-19':{JPY:158.1},'2026-11-18':{JPY:null}
}}),[{date:'2026-11-19',close:158.1},{date:'2026-11-20',close:158.2}]);
assert.throws(()=>parseFrankfurterRates({base:'JPY',rates:{'2026-11-20':{USD:1}}}),/米ドル/);
const gold={schema:'xaudaily.readings/v1',readings:{gold:{unit:'USD/oz',asOf:'2026-11-20',stale:true,
 rows:[{d:'2026-11-19',c:3600},{d:'2026-11-20',c:3500}]}}};
assert.equal(parseGoldReadings(gold).upstreamStale,true);
assert.equal(parseGoldReadings(gold).rows.at(-1).close,3500);
assert.throws(()=>parseGoldReadings({readings:{gold:{rows:[]}}}),/形式/);
assert.throws(()=>parseGoldReadings({...gold,readings:{gold:{...gold.readings.gold,asOf:'2026-11-19'}}}),/一致/);

function response(text) {
 return {ok:true,status:200,headers:{get:()=>String(text.length)},text:async()=>text};
}
const csv='Date,Open,Close\n2026-11-19,1,15820\n2026-11-20,2,15832\n';
const ndx=await fetchAutomaticMarket('nasdaq',{
 now:date,fetcher:async(uri,options)=>{
  assert.ok(uri.startsWith('https://raw.githubusercontent.com/'));
  assert.equal(options.credentials,'omit');
  assert.equal(options.mode,'cors');
  return response(csv);
 }
});
assert.equal(ndx.stale,false);
assert.equal(ndx.instrument,'NASDAQ100');
assert.equal(ndx.asOf,'2026-11-20');
assert.equal(ndx.rows.length,2);
assert.match(ndx.source,/Yahoo Finance/);

const fx=await fetchAutomaticMarket('usdjpy',{now:date,fetcher:async(uri)=>{
 assert.ok(uri.includes('base=USD'));
 return response(JSON.stringify({base:'USD',rates:{
   '2026-11-19':{JPY:158.1},'2026-11-20':{JPY:158.2}}}));
}});
assert.equal(fx.instrument,'USDJPY');
assert.equal(fx.rows[1].close,158.2);
assert.equal(fx.sourceType,'reference-rate');

const gc=await fetchAutomaticMarket('gold',{now:date,fetcher:async()=>response(JSON.stringify(gold))});
assert.equal(gc.upstreamStale,true);
assert.equal(gc.stale,true,'provider stale flag is not suppressed by recent date');
assert.equal(gc.instrument,'COMEX-GC');
assert.match(gc.source,/先物/);
let calls=[];
const nikkei=await fetchAutomaticMarket('nikkei',{now:date,fetcher:async(uri)=>{
 calls.push(uri);
 if(uri.includes('fred.stlouisfed.org'))throw new Error('CORS rejected');
 return response(nikkeiArchiveFixture);
}});
assert.equal(calls.length,2,'attempt FRED before falling back to a stale third-party archive');
assert.equal(nikkei.stale,true);
assert.equal(nikkei.asOf,'2026-04-13');
assert.equal(nikkei.rows.at(-1).close,56502.77, 'the correct published CLOSE, never the LOW');
assert.match(nikkei.errors.join(' '),/CORS/);
await assert.rejects(fetchAutomaticMarket('nasdaq',{now:date,fetcher:async()=>response('Not found')}),/終値データ|CSV/);
await assert.rejects(fetchAutomaticMarket('unknown',{now:date}),/不正/);

const merged=reconcileMarketHistory(
 {rows:[{date:'2026-11-18',close:99},{date:'2026-11-19',close:100}],instrument:'NASDAQ100'},
 {...ndx,rows:[{date:'2026-11-19',close:100},{date:'2026-11-20',close:101}]}
);
assert.equal(merged.updated,true);
assert.equal(merged.data.rows.length,3);
assert.equal(merged.data.rows.at(-1).date,'2026-11-20');
assert.equal(reconcileMarketHistory(
 {rows:[{date:'2026-11-20',close:100},{date:'2026-11-21',close:101}]},ndx
).reason,'older','never erase newer local prices with an outdated download');
const conflict=reconcileMarketHistory(
 {rows:prices,instrument:'NASDAQ100'},
 {...ndx,rows:[{date:'2026-11-20',close:10000},{date:'2026-11-23',close:10000}]}
);
assert.equal(conflict.reason,'conflict');
assert.equal(conflict.updated,false);
const notSame=reconcileMarketHistory(
 {rows:prices,instrument:'LBMA-GOLD'},
 {...gc,downloadedAt:date.toISOString()}
);
assert.equal(notSame.reason,'different-instrument');
assert.equal(notSame.updated,false);
console.log('Automatic 4-market feeds, provider identity, FRED CORS fallback, stale handling and offline merge safety passed');
