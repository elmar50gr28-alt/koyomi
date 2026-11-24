import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
const economicData=JSON.parse(readFileSync(new URL('../data/financial/economic-calendar.json',import.meta.url),'utf8'));
if(!globalThis.crypto)globalThis.crypto=webcrypto;
class Element{
 constructor(){
  this.textContent='';this.value='';this.hidden=false;this.dataset={};this.listeners={};this.children=[];
  this.attributes={};this.files=[];this.type='button';
 }
 addEventListener(type,fn){this.listeners[type]=fn;}
 append(...elements){this.children.push(...elements);}
 replaceChildren(...elements){this.children=elements;}
 setAttribute(key,value){this.attributes[key]=value;}
}
const keys=['economicCalendarList','economicCalendarMore','economicCalendarRange','economicCalendarStatus','economicCalendarCoverage','economicCalendarCountry','economicCalendarDays','economicCalendarRefresh','stockDateDisplay','stockReferenceDateDisplay','stockQuery','stockSearchStatus','stockResults','stockManualCode','stockManualName',
 'stockManualSave','stockReading','selectedStockName','selectedStockCode','selectedStockSector',
 'selectedStockSource','stockFavorite','stockDate','stockReferenceType','stockReferenceDate',
 'stockRead','stockStatus','stockForecast','stockForecastHeading','stockBasis','stockMonths','stockReferenceExplanation',
 'stockNumerology','stockNumerologyText','stockNumerologyReason','stockTarotDraw','stockTarotResult',
 'stockCSV','stockPriceStatus','stockPriceResult','stockLastClose','stockPriceDate','stockPriceWarning'];
const els=Object.fromEntries(keys.map(k=>[k,new Element()]));
els.stockReferenceType.value='listing';
els.economicCalendarCountry.value='all';els.economicCalendarDays.value='30';
const storage=new Map(),originals=Object.fromEntries(
 ['document','window','navigator','fetch','localStorage'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
const declare=(name,value)=>Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
const start=new Date('2026-01-01T12:00:00Z');
const diff=d=>(d-start)/86400000;
const longs={Mercury:50,Venus:60,Mars:20,Jupiter:220,Saturn:300,Uranus:15,Neptune:35,Pluto:235};
const astrology={
 Body:Object.fromEntries(Object.keys(longs).map(k=>[k,k])),
 SunPosition:d=>({elon:(100+diff(d))%360}),
 EclipticGeoMoon:d=>({lon:(90+diff(d)*12)%360}),
 GeoVector:(body,date)=>({body,date}),
 Ecliptic:v=>({elon:longs[v.body]})
};
const fakeCSV=['コード,銘柄名,33業種区分'];
for(let i=1300;i<2400;i++)fakeCSV.push(i+',企業'+i+',業種未分類');
declare('document',{getElementById:id=>els[id],createElement:()=>new Element()});
declare('window',{Astronomy:astrology,location:{search:'?code=6480'}});
declare('navigator',{serviceWorker:{register:async()=>{}}});
declare('localStorage',{getItem:k=>storage.get(k)||null,
 setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)});
declare('fetch',async(url,opts)=>{
 if(String(url).includes('/data/financial/economic-calendar.json'))return {ok:true,json:async()=>economicData};
 assert.ok(url.includes('ticker-master-japan'));
 assert.equal(opts.credentials,'omit');
 return {ok:true,headers:{get:()=>null},text:async()=>fakeCSV.join('\n')};
});
try{
 await import('../src/financial/stock-reading-page.js?test-ui');
 assert.equal(els.stockReading.hidden,false,'query parameter selects the known equity');
 assert.equal(els.selectedStockCode.textContent,'6480');
 assert.equal(els.selectedStockName.textContent,'日本トムソン');
 assert.equal(els.stockForecast.hidden,false);
 assert.equal(els.stockMonths.children.length,3);
 assert.match(els.stockBasis.textContent,/コード数秘/,'unknown founding date is not fabricated');
 assert.match(els.stockForecastHeading.textContent,/銘柄コード数秘/);
 assert.equal(els.stockMonths.children[0].children[3].className,'period-number');
 const firstCardNumerology=els.stockMonths.children[0].children[3].textContent;
 assert.ok(els.stockMonths.children.every(el=>el.children.some(child=>
   child.className==='market-context')),
   'universal market astrology is labeled as shared context, not a company-specific result');
 assert.equal(String(els.stockNumerology.textContent),'9','ticker-based numerology is separate');
 els.stockReferenceDate.value='2020-01-01';
 els.stockReferenceDate.listeners.change();
 assert.match(els.stockBasis.textContent,/企業の上場日/);
 assert.equal(els.stockReferenceDateDisplay.textContent,'2020-01-01（令和2年1月1日）');
 els.stockReferenceDate.value='1989-01-08';
 els.stockDate.value='2019-04-29';els.stockDate.listeners.change();
 assert.match(els.stockStatus.textContent,/2019-04-29（平成31年4月29日）/);
 assert.match(els.stockMonths.children[0].children[0].textContent,/2019-05-29（令和元年5月29日）/);
 els.stockDate.value='2019-05-01';els.stockDate.listeners.change();
 assert.equal(els.stockDateDisplay.textContent,'2019-05-01（令和元年5月1日）');
 els.stockReferenceDate.value='';els.stockReferenceDate.listeners.input();
 assert.equal(els.stockReferenceDateDisplay.textContent,'');
 assert.match(els.stockForecastHeading.textContent,/企業占星術とコード数秘/);
 els.stockFavorite.listeners.click();
 assert.equal(els.stockFavorite.attributes['aria-pressed'],'true');
 els.stockTarotDraw.listeners.click();
 assert.match(els.stockTarotResult.textContent,/株価/);
 const csv='Date,Close\n2026-11-19,100\n2026-11-20,98';
 els.stockCSV.files=[{name:'6480.csv',size:csv.length,text:async()=>csv}];
 await els.stockCSV.listeners.change();
 assert.equal(els.stockPriceResult.hidden,false);
 assert.equal(els.stockLastClose.textContent,'98');
 assert.equal(els.stockPriceDate.textContent,'2026-11-20（令和8年11月20日） 終値');
 assert.ok(storage.get('koyomi-stock-reading-close-v1-6480'));
 els.stockManualCode.value='555A';els.stockManualName.value='テスト企業';
 els.stockManualSave.listeners.click();
 assert.equal(els.selectedStockCode.textContent,'555A');
 assert.equal(els.stockPriceResult.hidden,true,'another ticker never inherits previous close data');
 assert.match(els.stockBasis.textContent,/555A/);
 assert.notEqual(els.stockMonths.children[0].children[3].textContent,firstCardNumerology,
  'different ticker should change visible numerological cycle evidence');
 assert.match(els.stockPriceStatus.textContent,/未取得/);
 await new Promise(r=>setTimeout(r,20));
 els.stockQuery.value='日本トムソン';
 els.stockQuery.listeners.input();
 assert.ok(els.stockResults.children.some(b=>b.children[0].textContent==='6480'),
   '83 packaged equities remain accessible even after online catalog refresh');
 assert.ok(els.stockSearchStatus.textContent);
 assert.match(els.economicCalendarRange.textContent,/2019-05-01/,'calendar follows changed reading date');
 declare('fetch',async()=>{throw new Error('offline');});
 await import('../src/financial/stock-reading-page.js?test-offline');
 await new Promise(r=>setTimeout(r,20));
 assert.equal(els.selectedStockCode.textContent,'6480');
 assert.equal(els.stockPriceDate.textContent,'2026-11-20（令和8年11月20日） 終値');
 assert.match(els.stockDateDisplay.textContent,/令和/);
 assert.match(els.economicCalendarStatus.textContent,/保存済みデータ/,'offline calendar restores validated local snapshot');
 assert.equal(els.stockForecast.hidden,false);
 console.log('Stock browser UI: query selection, company date, forecast, tarot, favorites, price isolation, cached full-list lookup passed');
}finally{
 for(const [name,descriptor]of Object.entries(originals)){
  if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];
 }
}
