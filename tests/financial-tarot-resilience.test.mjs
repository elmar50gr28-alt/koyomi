import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const RealDate=Date;
let day=22;
globalThis.Date=class extends RealDate { constructor(...args){super(...(args.length?args:[2026,10,day,12]));} };
let serial=0;
async function fresh(){return import('../src/financial/tarot.js?storage='+serial++);}
try {
  const saved=new Map();
  globalThis.localStorage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)};
  let api=await fresh();
  const first=api.getDaily();
  assert.deepEqual(api.getDaily(),first);
  assert.deepEqual((await fresh()).getDaily(),first,'daily card survives reload');
  first[0].id='invalid';
  assert.notEqual(api.getDaily()[0].id,'invalid','callers cannot mutate daily memory');
  day=23;
  api.getDaily();
  assert.equal(saved.size,2,'local date rollover creates a new daily key');
  for(const corrupt of ['{','[null]','[]','[{"id":"unknown","reversed":true}]','[{"id":"major-0","reversed":"yes"}]']){
    saved.set('koyomi-financial-tarot-v1-2026-11-23',corrupt);
    api=await fresh();
    const result=api.getDaily();
    assert.deepEqual(JSON.parse(saved.get('koyomi-financial-tarot-v1-2026-11-23')),result,'corrupt cache is repaired');
  }
  for(const failure of ['read','write']){
    globalThis.localStorage={getItem(){if(failure==='read')throw Error('denied');return null;},setItem(){throw Error('quota');}};
    api=await fresh();
    assert.deepEqual(api.getDaily(),api.getDaily(),failure+' failure preserves card for this page');
  }
} finally {globalThis.Date=RealDate;delete globalThis.localStorage;}

// Execute the real worker install and fetch handlers with an offline cache.
const source=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
const listeners=new Map(),cached=new Map();
const origin='https://example.test/koyomi/';
const key=request=>new URL(typeof request==='string'?request:request.url,origin).href;
const cache={add:async asset=>cached.set(key(asset),new Response(asset)),put:async(request,response)=>cached.set(key(request),response),match:async request=>cached.get(key(request))?.clone()};
const context={URL,Response,console,fetch:async()=>{throw Error('offline');},caches:{open:async()=>cache,match:cache.match},self:{location:{origin:new URL(origin).origin},skipWaiting:async()=>{},addEventListener:(type,listener)=>listeners.set(type,listener)}};
vm.runInNewContext(source,context);
let installed;
listeners.get('install')({waitUntil:p=>installed=p});
await installed;
for(const asset of ['financial.html','src/financial/tarot.js']){
  let response;
  listeners.get('fetch')({request:{url:origin+asset,method:'GET',mode:asset.endsWith('.html')?'navigate':'cors',headers:new Headers()},respondWith:p=>response=p});
  assert.equal(await (await response).text(),'./'+asset,'offline worker serves '+asset);
}
console.log('Financial tarot storage, rollover, corruption and offline checks passed');
