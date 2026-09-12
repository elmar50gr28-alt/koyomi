import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
const listeners=new Map(),putCalls=[],matchCalls=[],fetchCalls=[],addedAssets=[];
let fetchImplementation=async()=>new Response('fresh module',{status:200}),cachedResponse=null,skipWaitingCount=0,claimCount=0;

const cache={
  add:async asset=>{addedAssets.push(asset);if(asset==='./data/world/validation-events.json')throw new Error('simulated optional cache miss')},
  match:async()=>null,
  put:async(request,response)=>{putCalls.push({request,response})}
};
const context={
  URL,Response,Request,Headers,console,
  fetch:async(request,options)=>{fetchCalls.push({request,options});return fetchImplementation(request,options)},
  caches:{
    open:async()=>cache,
    match:async(request,options)=>{matchCalls.push({request,options});return cachedResponse},
    keys:async()=>[],
    delete:async()=>true
  },
  self:{
    location:{origin:'https://example.test'},
    clients:{claim:async()=>{claimCount+=1}},
    skipWaiting:async()=>{skipWaitingCount+=1},
    addEventListener:(type,listener)=>listeners.set(type,listener)
  }
};
vm.createContext(context);
vm.runInContext(`${source}\nself.__worldStartupTest={isApplicationCodeRequest,networkFirstApplicationCode};`,context,{filename:'service-worker.js'});

const {isApplicationCodeRequest,networkFirstApplicationCode}=context.self.__worldStartupTest;
const moduleRequest=new Request('https://example.test/src/world/world-map-ui.js?v=new');
assert.equal(isApplicationCodeRequest(moduleRequest),true);
assert.equal(isApplicationCodeRequest(new Request('https://example.test/src/world/world-map.css?v=new')),true);
assert.equal(isApplicationCodeRequest(new Request('https://example.test/data/world/catalog.json')),false);

const fresh=await networkFirstApplicationCode(moduleRequest);
assert.equal(await fresh.text(),'fresh module');
assert.equal(fetchCalls.at(-1).options.cache,'no-store','application code must bypass the HTTP cache');
assert.equal(putCalls.length,1,'a successful module response must refresh the runtime cache');

cachedResponse=new Response('offline module',{status:200});
fetchImplementation=async()=>{throw new Error('simulated offline')};
const fallback=await networkFirstApplicationCode(moduleRequest);
assert.equal(await fallback.text(),'offline module');
assert.equal(matchCalls.at(-1).options.ignoreSearch,true,'offline fallback must tolerate a changed module query');

cachedResponse=null;
const unavailable=await networkFirstApplicationCode(moduleRequest);
assert.equal(unavailable.status,503);
assert.match(await unavailable.text(),/更新ファイルを取得できません/);

let installPromise;
listeners.get('install')({waitUntil:promise=>{installPromise=promise}});
await installPromise;
assert.equal(skipWaitingCount,1,'one failed optional shell asset must not block worker activation');
assert.ok(addedAssets.includes('./data/world/validation-events.json'));

let activatePromise;
listeners.get('activate')({waitUntil:promise=>{activatePromise=promise}});
await activatePromise;
assert.equal(claimCount,1,'the activated worker must take control immediately');

console.log('Service Worker network-first runtime regression passed');
