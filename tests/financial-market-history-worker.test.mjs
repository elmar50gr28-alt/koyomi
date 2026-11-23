import assert from 'node:assert/strict';
const original=Object.getOwnPropertyDescriptor(globalThis,'self');
const listeners=new Map(),messages=[];
Object.defineProperty(globalThis,'self',{configurable:true,value:{
  addEventListener:(type,listener)=>listeners.set(type,listener),
  postMessage:message=>messages.push(message)
}});
try {
  await import('../src/financial/market-history-worker.js?worker-test');
  assert.equal(typeof globalThis.Astronomy?.SunPosition,'function','browser astronomy bundle available in module worker');
  const prices=[];
  for(let i=0;i<60;i++){
    const d=new Date(Date.UTC(2025,0,1+i));
    if(d.getUTCDay()===0||d.getUTCDay()===6)continue;
    prices.push({date:d.toISOString().slice(0,10),close:100+i});
  }
  listeners.get('message')({data:{requestId:11,market:'nasdaq',horizon:7,prices}});
  assert.equal(messages.length,1);
  assert.equal(messages[0].requestId,11);
  assert.equal(messages[0].ok,true,messages[0].error);
  assert.ok(messages[0].result.evaluated>=0);
  assert.ok(messages[0].result.cases.length<=12,'worker sends summary not bulk price data');
  assert.equal(messages[0].result.horizon,7);
  assert.equal(messages[0].result.crises.market,'nasdaq');
  assert.equal(messages[0].result.crises.events.length,3);
  const asOfDate=prices.at(-1).date;
  listeners.get('message')({data:{mode:'lead-months',requestId:12,market:'nasdaq',asOfDate,prices}});
  assert.equal(messages.length,2);
  assert.equal(messages[1].requestId,12);
  assert.equal(messages[1].ok,true,messages[1].error);
  assert.ok(['experimental','unavailable'].includes(messages[1].result.status));
}finally{
  if(original)Object.defineProperty(globalThis,'self',original);
  else delete globalThis.self;
}
console.log('Browser module worker initializes real ephemeris and posts local market audit without UI blocking');
