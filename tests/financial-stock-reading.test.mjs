import assert from 'node:assert/strict';
import {
  BUILTIN_STOCKS,STOCK_CATALOG_META,stockSearch,lookupStock,normalizeStockCode,
  parseStockCatalogCSV,makeManualStock,updateStockCatalog
} from '../src/financial/stock-directory.js';
import {
  STOCK_READING_META,codeNumerology,codeCycleAt,companyDateAspects,readStockSymbolic
} from '../src/financial/stock-reading-core.js';
import {DECK,interpret,drawCards} from '../src/financial/tarot.js';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;

assert.ok(BUILTIN_STOCKS.length>=80);
assert.equal(lookupStock('6480')?.name,'日本トムソン');
assert.equal(lookupStock('7203')?.name,'トヨタ自動車');
assert.equal(lookupStock('9432')?.name,'ＮＴＴ');
assert.equal(lookupStock('ソフトバンク')?.code,'9434');
assert.equal(lookupStock('ソフトバンクグループ')?.code,'9984');
assert.equal(lookupStock('130a')?.code,'130A');
assert.equal(normalizeStockCode('７２０３．ｔ'),'7203');
assert.equal(normalizeStockCode('12'),null);
assert.equal(normalizeStockCode('xxzz'),null);
assert.deepEqual(stockSearch('6480')[0].code,'6480');
assert.equal(stockSearch('NTT').length>0,true);
assert.equal(lookupStock('7203').code,stockSearch('トヨタ自動車')[0].code);
assert.equal(lookupStock('不存在の会社'),null);
const duplicates=parseStockCatalogCSV('code,name,sector\n2222,"株式会社, A",X\n1111,"株式会社, A",Y\n3333,企業C,Z');
assert.equal(duplicates.length,3);
assert.equal(lookupStock('株式会社, A',duplicates),null,'ambiguous name is never auto-selected');
assert.equal(lookupStock('1111',duplicates)?.name,'株式会社, A');
assert.throws(()=>parseStockCatalogCSV('date,stock\n2026-11-23,7203'),/コード/);
assert.throws(()=>parseStockCatalogCSV('code,name\n1111,"bad'),/引用符/);
assert.equal(makeManualStock('４５６Ａ','架空のサンプル企業').code,'456A');
assert.throws(()=>makeManualStock('123','企業名'),/証券コード/);
assert.match(STOCK_CATALOG_META.limitations,/保証しません/);

const mockDate=new Date('2026-01-01T12:00:00Z');
const delta=d=>(d-mockDate)/86400000;
const longitudes={
 Mercury:65,Venus:45,Mars:10,Jupiter:220,Saturn:300,
 Uranus:15,Neptune:35,Pluto:235
};
const astronomy={
 Body:Object.fromEntries(Object.keys(longitudes).map(key=>[key,key])),
 SunPosition:d=>({elon:(100+delta(d))%360}),
 EclipticGeoMoon:d=>({lon:(60+delta(d)*12)%360}),
 GeoVector:(body,date)=>({body,date}),
 Ecliptic:vector=>({elon:longitudes[vector.body]})
};
const stock=lookupStock('6480');
const params={stock,asOfDate:'2026-11-23',astronomy};
const general=readStockSymbolic(params);
assert.equal(general.basis,'code-numerology-only');
assert.ok(general.periods.every(p=>p.symbolicBasis==='ticker-code-numerology'));
assert.ok(general.periods.every(p=>p.marketContext.includes('市場天体象徴')));
assert.ok(general.periods.every(p=>p.grounds[0].includes('証券コード 6480')));
assert.ok(general.periods.every(p=>p.codeCycle.basis.includes('6480')));
const otherTicker=lookupStock('7203');
const another=readStockSymbolic({...params,stock:otherTicker});
assert.notDeepEqual(general.periods.map(p=>[p.mood,p.message,p.codeCycle.number]),
  another.periods.map(p=>[p.mood,p.message,p.codeCycle.number]),
  'different codes MUST NOT re-use identical market-wide results as individual readings');
assert.deepEqual(general.periods,
  readStockSymbolic({...params}).periods,'same code and day must be deterministic');
assert.equal(codeCycleAt('6480','2026-12-15',0).number,
  codeCycleAt('6480','2026-12-15',0).number);
assert.notEqual(codeCycleAt('6480','2026-12-15',0).basis,
  codeCycleAt('7203','2026-12-15',0).basis,
  'number symbolism documents ticker input, even if labels sometimes coincide');
assert.throws(()=>codeCycleAt('6480','2026-02-30',0),/日付/);
assert.throws(()=>codeCycleAt('6480','2026-11-23',3),/期間/);
assert.equal(general.periods.length,3);
assert.ok(general.periods.every(x=>x.companySpecific===false));
assert.ok(general.periods.every(x=>x.from< x.to));
assert.match(general.referenceNote,/企業固有の星回りは計算していません/);
assert.match(general.meta.warning,/株価/);
assert.match(general.meta.differentiation,/数秘/);
const enterprise=readStockSymbolic({...params,referenceDate:'2026-01-01',referenceType:'listing'});
assert.equal(enterprise.basis,'company-date');
assert.ok(enterprise.periods.every(p=>p.symbolicBasis==='company-date-astrology'));
const sameNatalOtherStock=readStockSymbolic({...params,stock:otherTicker,referenceDate:'2026-01-01'});
assert.deepEqual(enterprise.periods.map(p=>p.grounds),
  sameNatalOtherStock.periods.map(p=>p.grounds),
  'same input date means the astronomical geometry is necessarily the same');
assert.notDeepEqual(enterprise.periods.map(p=>p.codeCycle),
  sameNatalOtherStock.periods.map(p=>p.codeCycle),
  'distinct ticker numerology is shown alongside same-date astrology, never disguised as astronomy');
assert.equal(enterprise.periods.length,3);
assert.ok(enterprise.periods.every(x=>x.companySpecific));
assert.match(enterprise.referenceNote,/12:00 UTC/);
assert.ok(enterprise.periods.some(p=>p.grounds.length));
const other=readStockSymbolic({...params,referenceDate:'2026-01-10'});
assert.notDeepEqual(
 enterprise.periods.map(p=>p.grounds),
 other.periods.map(p=>p.grounds),
 'different enterprise reference dates produce different company-specific aspect evidence'
);
assert.ok(companyDateAspects('2026-01-01','2026-11-23',astronomy).length);
assert.deepEqual(enterprise.periods.map(x=>x.label),['1〜30日後','31〜60日後','61〜90日後']);
assert.deepEqual(general.periods.map(x=>x.companySpecific),[false,false,false]);
assert.equal(codeNumerology('7203').number,3);
assert.equal(codeNumerology('130A').number,5);
assert.match(codeNumerology('7203').note,/株価/);
assert.deepEqual(
 readStockSymbolic({...params,stock:{...stock,price:123456}}).periods,general.periods,
 'future or current market prices never enter the symbolic module'
);
assert.throws(()=>readStockSymbolic({...params,asOfDate:'2026-02-30'}),/日付/);
assert.throws(()=>readStockSymbolic({...params,referenceDate:'2027-01-01'}),/未来/);
assert.throws(()=>readStockSymbolic({...params,referenceType:'unknown'}),/種類/);
assert.equal(DECK.length,78);
const card=interpret(drawCards(1)[0],'銘柄に向き合う視点');
assert.ok(card.card.name);
assert.ok(card.message);
const generated=[['code','name','sector']];
for(let i=1300;i<2400;i++)generated.push([String(i),'企業'+i,'その他']);
const fakeCSV=generated.map(row=>row.join(',')).join('\n');
const cache=new Map();
const storage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)};
const fetcher=async(_,options)=>{
 assert.equal(options.credentials,'omit');
 assert.equal(options.mode,'cors');
 return {ok:true,headers:{get:()=>String(fakeCSV.length)},text:async()=>fakeCSV};
};
const imported=await updateStockCatalog({fetcher,store:storage,now:new Date('2026-11-23T00:00:00Z')});
assert.equal(imported.items.length,1100);
assert.ok(imported.cached);
const repeat=await updateStockCatalog({fetcher:async()=>{throw Error('unexpected network');},
 store:storage,now:new Date('2026-11-24T00:00:00Z')});
assert.equal(repeat.items.length,1100);
assert.equal(repeat.refreshAttempted,false);
const failure=await updateStockCatalog({fetcher:async()=>{throw Error('no connection');},
 store:storage,now:new Date('2026-12-05T00:00:00Z')});
assert.equal(failure.items.length,1100,'offline fallback preserves cached company list');
assert.match(failure.error,/no connection/);
console.log('Stock directory, code/name search, numerology, enterprise astrology, no-price-leakage and offline catalog tested');
