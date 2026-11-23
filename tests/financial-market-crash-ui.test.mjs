import assert from 'node:assert/strict';

class Element {
  constructor(){this.textContent='';this.value='';this.hidden=false;this.dataset={};this.listeners={};this.children=[];this.attributes={};this.files=[];}
  addEventListener(type,fn){this.listeners[type]=fn;}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
  setAttribute(k,v){this.attributes[k]=v;}
}
const ids=['marketInstrument','marketHorizon','marketDirection','astroDate','astroPrev','astroNext','astroToday',
  'historyAuto','historyFile','historyRun','historyStatus','historyResult','historyStatistics','historySource',
  'historyLatest','historyLatestDate','historyRange','historyRows','historyPriceCurve','historyCSVLink',
  'historyAccuracy','historyBaseline','historyCount','historyInterpretation','historyExamples','historyCrashes','historyCrashList',
  'marketRiskTag','marketRiskText','marketRiskVerdict','leadRun','leadStatus','leadResult','leadMonths','leadHeadline','leadDiagnostics','historyAutoStatus','marketAutoStatuses'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
elements.marketInstrument.value='nikkei';elements.marketHorizon.value='7';elements.marketDirection.dataset.direction='up';
const start=new Date('2026-01-01T00:00:00Z');const rows=[];
for(let i=0;i<90;i++){
 const d=new Date(start.getTime()+i*86400000);
 if(d.getUTCDay()===0||d.getUTCDay()===6)continue;
 const j=rows.length,close=j<35?100:100-(j-35)*.85;
 rows.push([d.toISOString().slice(0,10),close]);
}
elements.astroDate.value=rows[30][0];
const storage=new Map([['koyomi-financial-market-prices-v1-nikkei',JSON.stringify({rows,source:'LOCAL_TEST'})]]);
const oldDoc=Object.getOwnPropertyDescriptor(globalThis,'document');
const oldStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
Object.defineProperty(globalThis,'document',{configurable:true,value:{
  getElementById:id=>elements[id],createElement:()=>new Element(),createElementNS:()=>new Element()
}});
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
  getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)
}});
try{
 await import('../src/financial/market-history-page.js?risk-ui');
 assert.match(elements.marketRiskTag.textContent,/警戒なし/);
 elements.astroDate.value=rows[55][0];elements.astroDate.listeners.change();
 assert.ok(/警戒/.test(elements.marketRiskTag.textContent),'actual ongoing downtrend triggers price-only caution');
 assert.match(elements.marketRiskVerdict.textContent,/星は上昇占断ですが/,'explicitly overrule the usability of an unproven bullish fortune');
 assert.match(elements.marketRiskText.textContent,/直近10営業日/);
 elements.astroDate.value='2027-01-01';elements.astroDate.listeners.change();
 assert.match(elements.marketRiskTag.textContent,/価格が古い/,'stale data may never be used as current guidance');
 elements.marketInstrument.value='gold';elements.marketInstrument.listeners.change();
 assert.match(elements.marketRiskTag.textContent,/価格未取得/,'without prices risk is unknown, never safe');
 elements.marketInstrument.value='nikkei';elements.marketInstrument.listeners.change();
 elements.astroDate.value=rows[55][0];elements.astroDate.listeners.change();
 assert.match(elements.marketRiskTag.textContent,/警戒/);
}finally{
 if(oldDoc)Object.defineProperty(globalThis,'document',oldDoc);else delete globalThis.document;
 if(oldStorage)Object.defineProperty(globalThis,'localStorage',oldStorage);else delete globalThis.localStorage;
}
console.log('Market risk UI differentiates astrology, observed crash caution, stale prices, and missing data');
