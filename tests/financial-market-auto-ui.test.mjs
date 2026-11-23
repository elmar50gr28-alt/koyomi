import assert from 'node:assert/strict';

class Element{
 constructor(){this.textContent='';this.value='';this.hidden=false;this.dataset={};this.listeners={};this.children=[];this.attributes={};this.files=[];}
 addEventListener(name,cb){this.listeners[name]=cb;}
 append(...els){this.children.push(...els);}
 replaceChildren(...els){this.children=els;}
 setAttribute(key,value){this.attributes[key]=value;}
}
const ids=['marketInstrument','marketHorizon','marketDirection','astroDate','astroPrev','astroNext','astroToday',
 'historyAuto','historyFile','historyRun','historyStatus','historyResult','historyStatistics','historySource',
 'historyLatest','historyLatestDate','historyRange','historyRows','historyPriceCurve','historyCSVLink',
 'historyAccuracy','historyBaseline','historyCount','historyInterpretation','historyExamples','historyCrashes','historyCrashList',
 'marketRiskTag','marketRiskText','marketRiskVerdict','leadRun','leadStatus','leadResult','leadMonths','leadHeadline',
 'leadDiagnostics','leadValidation','historyAutoStatus','marketAutoStatuses'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
elements.marketInstrument.value='nasdaq';elements.astroDate.value='2026-11-23';elements.marketHorizon.value='7';
elements.marketDirection.dataset.direction='unclear';
const storage=new Map();
const calls=[],events={};
const textResponse=text=>({ok:true,status:200,headers:{get:()=>String(text.length)},text:async()=>text});
const goldJson=JSON.stringify({schema:'xaudaily.readings/v1',readings:{gold:{
 unit:'USD/oz',asOf:'2026-11-20',stale:false,
 rows:[{d:'2026-11-19',c:3550},{d:'2026-11-20',c:3541}]
}}});
const marketCSV='Date,Close\n2026-11-19,100\n2026-11-20,101\n';
const fxJSON=JSON.stringify({base:'USD',rates:{'2026-11-19':{JPY:155},'2026-11-20':{JPY:155.5}}});
const originals=Object.fromEntries(['document','window','navigator','fetch','localStorage']
 .map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
const declare=(name,value)=>Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
declare('document',{hidden:false,getElementById:id=>elements[id],
 createElement:()=>new Element(),createElementNS:()=>new Element(),
 addEventListener:(event,fn)=>{events['document:'+event]=fn;}});
declare('window',{addEventListener:(event,fn)=>{events['window:'+event]=fn;},
 setInterval:(fn,ms)=>{events.intervalMs=ms;events.intervalFn=fn;}});
declare('navigator',{onLine:true});
declare('localStorage',{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)});
declare('fetch',async(uri,options)=>{
 calls.push(uri);
 assert.equal(options.credentials,'omit','external requests must not send cookies');
 if(uri.includes('frankfurter.dev'))return textResponse(fxJSON);
 if(uri.includes('feargreedchart.com'))return textResponse(JSON.stringify({history:[
   {date:'2026-11-19',nikkei:59444.21},
   {date:'2026-11-20',nikkei:56436.65}
 ]}));
 if(uri.includes('xaudaily-data'))return textResponse(goldJson);
 return textResponse(marketCSV);
});
try{
 await import('../src/financial/market-history-page.js?auto-ui');
 const keys=['nasdaq','nikkei','usdjpy','gold'].map(m=>'koyomi-financial-market-prices-v1-'+m);
 for(let i=0;i<60 && keys.some(k=>!storage.has(k));i++)
  await new Promise(resolve=>setTimeout(resolve,10));
 assert.ok(keys.every(k=>storage.has(k)),'all four markets should import on startup without taps');
 assert.equal(calls.length,4,'one request per market when primary source succeeds');
 assert.equal(elements.marketAutoStatuses.children.length,4);
 assert.match(elements.historyAutoStatus.textContent,/保存終値 2026-11-20/);
 assert.match(elements.historySource.textContent,/Yahoo Finance/);
 assert.equal(elements.marketAutoStatuses.children[0].children[1].textContent,'56,436.65');
 assert.match(elements.marketAutoStatuses.children[0].children.at(-1).textContent,/直近の公表終値/);
 elements.marketAutoStatuses.children[0].listeners.click();
 assert.equal(elements.marketInstrument.value,'nikkei','tapping a market tile selects its forecast');
 assert.equal(events.intervalMs,6*3600*1000,'refresh only every six hours while page visible');
 assert.equal(typeof events['window:online'],'function');
 assert.equal(typeof events['document:visibilitychange'],'function');
 const copy=storage.get(keys[0]);
 globalThis.navigator.onLine=false;
 events['window:online']();
 await new Promise(resolve=>setTimeout(resolve,10));
 assert.equal(storage.get(keys[0]),copy,'offline reconnect cannot erase cached data');
 assert.match(elements.historyAutoStatus.textContent,/オフライン/);
 console.log('Market data loads all four automatically on startup, preserves cache offline, and registers reconnection/foreground refresh');
}finally{
 for(const [name,old] of Object.entries(originals)){
  if(old)Object.defineProperty(globalThis,name,old);else delete globalThis[name];
 }
}
