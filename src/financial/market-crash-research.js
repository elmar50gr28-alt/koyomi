// Crash research and conservative price-risk overlay.
// IMPORTANT: all risk features are calculated from closes available on/before asOf.
// No future prices, crash-window labels, or astrological outcomes enter risk scoring.
import {validatePriceRows} from './market-history.js';
import {forecastMarketDirection} from './market-direction.js';

const DAY_MS=86400000;
const dateMillis=date=>Date.parse(date+'T00:00:00Z');
const round=(value,digits=2)=>Number(value.toFixed(digits));
const pct=(a,b)=>round((a/b-1)*100);
const thresholds=Object.freeze({
  cautionDrawdown:-8,caution10d:-6,caution1d:-4,
  highDrawdown:-15,high10d:-12,high1d:-7
});
export const CRASH_RISK_RULES=Object.freeze({
  id:'koyomi-historical-price-risk-guard-v1',
  thresholds,
  minimumTradingDays:20,maxStaleCalendarDays:7,
  status:'fixed-conservative-thresholds-not-backtest-optimized',
  disclaimer:'これは既に観測された値下がりへの警戒表示です。未発生の暴落を予言する能力は検証されていません。'
});
// Historical event WINDOWS are named in advance. They never feed the indicator.
export const HISTORICAL_CRASH_WINDOWS=Object.freeze([
  {id:'nikkei-2008',market:'nikkei',title:'2008年 世界金融危機',from:'2008-09-01',to:'2008-11-28',checkpoint:'2008-09-12'},
  {id:'nikkei-2011',market:'nikkei',title:'2011年 東日本大震災後の急落',from:'2011-03-01',to:'2011-04-15',checkpoint:'2011-03-10'},
  {id:'nasdaq-2020',market:'nasdaq',title:'2020年 コロナショック',from:'2020-02-03',to:'2020-04-15',checkpoint:'2020-02-19'},
  {id:'nasdaq-2022',market:'nasdaq',title:'2022年 金融引き締め相場',from:'2022-01-03',to:'2022-07-15',checkpoint:'2022-01-03'}
]);
function indexAtOrBefore(rows,date) {
  let lo=0,hi=rows.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(rows[mid].date<=date)lo=mid+1;else hi=mid;}
  return lo-1;
}
export function priceRiskAt(prices,asOfDate) {
  validatePriceRows(prices);
  const asOfMs=dateMillis(asOfDate);
  if(!Number.isFinite(asOfMs))throw new RangeError('判定日が不正です。');
  const idx=indexAtOrBefore(prices,asOfDate);
  if(idx<19)return {level:'unavailable',label:'データ不足',available:false,
    reason:'過去20営業日以上の終値が必要です。'};
  const last=prices[idx],lag=(asOfMs-dateMillis(last.date))/DAY_MS;
  if(lag<0||lag>CRASH_RISK_RULES.maxStaleCalendarDays)return {
    level:'unavailable',label:'価格が古い',available:false,lastDate:last.date,
    reason:'選択日から7暦日以内の終値がなく、補正を保留しています。'
  };
  const closes=prices.slice(Math.max(0,idx-59),idx+1).map(x=>x.close);
  const peak=Math.max(...closes);
  const drawdown60=pct(last.close,peak);
  const change10=idx>=10?pct(last.close,prices[idx-10].close):null;
  const change1=pct(last.close,prices[idx-1].close);
  const strong=drawdown60<=thresholds.highDrawdown||change10<=thresholds.high10d||change1<=thresholds.high1d;
  const warn=strong||drawdown60<=thresholds.cautionDrawdown||change10<=thresholds.caution10d||change1<=thresholds.caution1d;
  const level=strong?'high':warn?'caution':'normal';
  const terms=[
    '直近60営業日以内の高値から'+drawdown60.toFixed(1)+'%',
    '直近10営業日'+change10.toFixed(1)+'%',
    '直近1営業日'+change1.toFixed(1)+'%'
  ];
  const labels={high:'急落警戒（実測）',caution:'下落警戒（実測）',normal:'明確な下落警戒なし'};
  return {available:true,level,label:labels[level],lastDate:last.date,close:last.close,
    drawdown60,change10,change1,reason:terms.join(' ／ '),warning:warn,
    explanation:warn?'価格の下落がすでに観測されています。暴落前に予知したことにはなりません。':
      '固定閾値に該当する下落は観測されません。将来の安全を保証しません。'};
}
function futureCrash(prices,index,horizon,threshold) {
  const start=prices[index],end=dateMillis(start.date)+horizon*DAY_MS;
  const endDate=new Date(end).toISOString().slice(0,10);
  // Require market prices covering the full horizon, not just an early partial interval.
  if(prices.at(-1).date<endDate)return null;
  let min=Infinity,observations=0;
  for(let i=index+1;i<prices.length && dateMillis(prices[i].date)<=end;i++){
    min=Math.min(min,prices[i].close);observations++;
  }
  if(!observations)return null;
  const worstPct=pct(min,start.close);
  return {crash:worstPct<=threshold,worstPct};
}
function rates(tp,fp,fn){
  const precision=tp+fp?round(tp/(tp+fp)*100):null;
  const recall=tp+fn?round(tp/(tp+fn)*100):null;
  return {alerts:tp+fp,trueAlerts:tp,falseAlerts:fp,missed:fn,precision,recall};
}
export function studyHistoricalCrashes({prices,market,readWindow,horizon=14,dropThreshold=-8,
  windows=HISTORICAL_CRASH_WINDOWS}) {
  validatePriceRows(prices);
  if(typeof readWindow!=='function'||horizon!==14||dropThreshold!==-8)throw new Error('暴落検証は14暦日・8%下落で固定しています。');
  const relevant=windows.filter(w=>w.market===market);
  const result=[];
  for(const window of relevant){
    const series=prices.map((row,i)=>({...row,index:i})).filter(x=>x.date>=window.from&&x.date<=window.to);
    if(!series.length){result.push({id:window.id,title:window.title,status:'not-covered'});continue;}
    let peak=-Infinity,trough=0;
    for(const row of series){peak=Math.max(peak,row.close);trough=Math.min(trough,(row.close/peak-1)*100);}
    let positives=0,negatives=0,astroTp=0,astroFp=0,guardTp=0,guardFp=0,
      total=0,checkpoint=null,firstCrisisDate=null,firstGuardDate=null;
    for(const row of series){
      const future=futureCrash(prices,row.index,horizon,dropThreshold);
      if(!future)continue;
      const asOf=new Date(row.date+'T03:00:00Z');
      const astronomy=forecastMarketDirection(readWindow(asOf,horizon),market,horizon);
      const risk=priceRiskAt(prices,row.date);
      const astroAlarm=astronomy.direction==='down',riskAlarm=risk.warning===true;
      if(future.crash)positives++;else negatives++;
      if(astroAlarm){if(future.crash)astroTp++;else astroFp++;}
      if(riskAlarm){if(future.crash)guardTp++;else guardFp++;}
      if(riskAlarm && !firstGuardDate)firstGuardDate=row.date;
      if(future.crash && !firstCrisisDate)firstCrisisDate=row.date;
      if(row.date===window.checkpoint)checkpoint={date:row.date,astro:astronomy.label,
        priceRisk:risk.label,futureWorstPct:future.worstPct};
      total++;
    }
    // If the landmark is a holiday, use last known close on/before the checkpoint.
    if(!checkpoint){
      const idx=indexAtOrBefore(prices,window.checkpoint);
      if(idx>=19 && prices[idx].date>=window.from){
        const row=prices[idx],future=futureCrash(prices,idx,horizon,dropThreshold);
        if(future){
          const forecast=forecastMarketDirection(readWindow(new Date(row.date+'T03:00:00Z'),horizon),market,horizon);
          checkpoint={date:row.date,astro:forecast.label,priceRisk:priceRiskAt(prices,row.date).label,
            futureWorstPct:future.worstPct};
        }
      }
    }
    result.push({
      id:window.id,title:window.title,from:window.from,to:window.to,status:total?'evaluated':'not-covered',
      n:total,crashCases:positives,nonCrashCases:negatives,observedDrawdownPct:round(trough),
      astro:rates(astroTp,astroFp,positives-astroTp),
      priceGuard:rates(guardTp,guardFp,positives-guardTp),
      checkpoint,firstCrisisDate,firstGuardDate,
      note:'同一イベント内の毎営業日評価は重複するため、標本は独立ではありません。'
    });
  }
  return {
    market,ruleId:CRASH_RISK_RULES.id,horizon,dropThreshold,events:result,
    warning:'出来事の前の占断と、下落が始まってからの価格警戒を区別。価格警戒は実測への反応であり事前の予言ではありません。'
  };
}
