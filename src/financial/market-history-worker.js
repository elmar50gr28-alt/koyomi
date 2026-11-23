// Dedicated module worker: historical ephemeris calculations must not freeze the phone UI.
import '../../vendor/astronomy-engine/2.1.19/astronomy.browser.min.js';
import {readFinancialSky} from './astrology-core.js';
import {forecastLeadMonths} from './market-lead-forecast.js';
import {backtestMarketDirection} from './market-history.js';
import {studyHistoricalCrashes} from './market-crash-research.js';

const DAY_MS=86400000;
self.addEventListener('message',event=>{
  const {market,horizon,prices,requestId,mode,asOfDate}=event.data||{};
  try{
    if(typeof globalThis.Astronomy?.SunPosition!=='function')throw new Error('天文計算モジュールが起動できません。');
    const cache=new Map();
    const readWindow=(date,count)=>{
      const days=[];
      for(let i=0;i<count;i++){
        const key=new Date(date.getTime()+i*DAY_MS).toISOString().slice(0,10);
        if(!cache.has(key)){
          const at=new Date(key+'T03:00:00Z');
          const reading=readFinancialSky(at,globalThis.Astronomy);
          cache.set(key,{...reading,date:key});
        }
        days.push(cache.get(key));
      }
      return days;
    };
    if(mode==='lead-months'){
      const readSky=key=>{
        if(!cache.has(key)){
          const [year,month,day]=key.split('-').map(Number);
          const date=new Date(year,month-1,day,12);
          const reading=readFinancialSky(date,globalThis.Astronomy);
          cache.set(key,{...reading,date:key});
        }
        return cache.get(key);
      };
      const forecast=forecastLeadMonths({prices,market,asOfDate,readSky});
      self.postMessage({requestId,ok:true,result:forecast});
      return;
    }
    const result=backtestMarketDirection({prices,market,horizon,readWindow});
    const crises=studyHistoricalCrashes({prices,market,readWindow,horizon:14});
    self.postMessage({requestId,ok:true,result:{...result,cases:result.cases.slice(-12),crises}});
  }catch(error){
    self.postMessage({requestId,ok:false,error:String(error?.message||error)});
  }
});
