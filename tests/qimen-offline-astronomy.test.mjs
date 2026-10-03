import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const path='vendor/astronomy-engine/2.1.19/astronomy.browser.min.js';
const engine=readFileSync(path,'utf8'),app=readFileSync('app.html','utf8'),sw=readFileSync('service-worker.js','utf8');
const expectedHash='f41139a87941ea017ab902b954c9389fa27ea72083d7fab4971756d7769d14e6';
assert.equal(createHash('sha256').update(engine).digest('hex'),expectedHash,'unaltered official browser artifact');
assert.ok(engine.includes('MIT License'));
assert.ok(readFileSync('vendor/astronomy-engine/2.1.19/LICENSE','utf8').includes('Copyright (c) 2019-2023 Don Cross'));
assert.ok(app.includes('<script src="./'+path+'"></script>'));
assert.ok(!app.includes('src="https://cdn.jsdelivr.net/npm/astronomy-engine@'));
const listeners=new Map(),stores=new Map();
const origin='https://example.test',base=origin+'/koyomi/';
const key=request=>new URL(typeof request==='string'?request:request.url,base).href;
const caches={
  async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);
    return {async add(asset){store.set(key(asset),new Response(asset==='./'+path?engine:'cached shell',{status:200}))},
      async put(req,res){store.set(key(req),res)},async match(req){return store.get(key(req))?.clone()}};
  },
  async match(req){for(const store of stores.values())if(store.has(key(req)))return store.get(key(req)).clone()},
  async keys(){return [...stores.keys()]},async delete(name){return stores.delete(name)}
};
const swContext=vm.createContext({URL,Response,Request,Headers,console,caches,fetch:async()=>{throw Error('offline')},
  self:{location:{origin},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(type,fn)=>listeners.set(type,fn)}});
vm.runInContext(sw,swContext);
let installation;
listeners.get('install')({waitUntil:p=>{installation=p}});
await installation;
let response;
listeners.get('fetch')({request:new Request(base+path),respondWith:p=>{response=p}});
const cached=await response;
assert.equal(cached.status,200,'cached library served with all network requests failing');
const offlineEngine=await cached.text();
assert.equal(createHash('sha256').update(offlineEngine).digest('hex'),expectedHash);

const lines=app.split(/\r?\n/),ctx=vm.createContext({window:{},Date,DAY:86400000,auditFallbackCalls:0});
vm.runInContext(offlineEngine,ctx);
const functions=['solarLongitude','qmdjMod','qmdjSignedAngle','qmdjTermStart','v191zEphemerisActive'].map(n=>lines.find(l=>l.startsWith('function '+n+'(')));
assert.ok(functions.every(Boolean));
const runtime=lines.find(l=>l.startsWith('solarLongitude=function(d)'));
vm.runInContext('function mod(n,m){return((n%m)+m)%m}function jd(d){return d.getTime()/DAY+2440587.5}\n'+
  lines.find(l=>l.startsWith('const TERM_NAMES='))+'\n'+functions.join('\n')+
  '\nconst approximateSolarLongitude=solarLongitude;const v191zSolarLongitudeFallback=d=>{auditFallbackCalls++;return approximateSolarLongitude(d)};\n'+
  runtime+'\nthis.termStart=qmdjTermStart;',ctx);
assert.equal(ctx.v191zEphemerisActive(),true,'offline engine is active');
const official=JSON.parse(readFileSync('data/qimen/naoj-solar-terms-2026.json','utf8'));
for(const term of official.terms){
  const instant=Date.parse(term.datetime),result=ctx.termStart(new Date(instant+86400000));
  assert.equal(result.name,term.name);
  // 2026 regression guard against returning to the old multi-minute fallback.
  // Official fixtures have minute resolution; this is not an all-year accuracy guarantee.
  assert.ok(Math.abs(result.start-instant)<90000,term.name+': 2026 regression limit');
}
assert.equal(ctx.auditFallbackCalls,0,'no silent approximation fallback while offline');
console.log('Offline Astronomy Engine passed: unchanged licensed artifact, service-worker cached response under network failure, 24 official terms and no fallback.');
