// Dedicated module worker: historical ephemeris calculations must not freeze the phone UI.
import '../../vendor/astronomy-engine/2.1.19/astronomy.browser.min.js';
import {readFinancialSky} from './astrology-core.js';
import {backtestMarketDirection} from './market-history.js';

const DAY_MS=86400000;
self.addEventListener('message',event=>{
  const {market,horizon,prices,requestId}=event.data||{};
  try{
    if(typeof self.Astronomy?.SunPosition!=='function')throw new Error('天文計算モジュールが起動できません。');
    const cache=new Map();
    const readWindow=(date,count)=>{
      const days=[];
      for(let i=0;i<count;i++){
        const key=new Date(date.getTime()+i*DAY_MS).toISOString().slice(0,10);
        if(!cache.has(key)){
          const at=new Date(key+'T03:00:00Z');
          const reading=readFinancialSky(at,self.Astronomy);
          cache.set(key,{...reading,date:key});
        }
        days.push(cache.get(key));
      }
      return days;
    };
    const result=backtestMarketDirection({prices,market,horizon,readWindow});
    self.postMessage({requestId,ok:true,result:{...result,cases:result.cases.slice(-12)}});
  }catch(error){
    self.postMessage({requestId,ok:false,error:String(error?.message||error)});
  }
});
