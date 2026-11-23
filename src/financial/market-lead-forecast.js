// Pre-event monthly crash risk research. Only PAST closes and PRE-COMPUTABLE
// astronomy are used for prediction. Labels may use future closes during training.
// Every fit and threshold is learned without held-out future outcomes.
import {validatePriceRows} from './market-history.js';
import {marketDaySignal} from './market-direction.js';

export const LEAD_RESEARCH_POLICY=Object.freeze({
 id:'koyomi-crash-lead-v1',
 horizons:[{start:1,end:30,label:'今後1〜30日'},{start:31,end:60,label:'31〜60日先'},{start:61,end:90,label:'61〜90日先'}],
 targetDropPct:-8,stepTradingDays:15,priorTradingDays:60,purgeCalendarDays:90,
 minTrain:28,minPositive:4,minNegative:8,minHoldout:8,
 status:'experimental-unvalidated',
 disclaimer:'表示される0〜100の値は学習モデルの研究スコアで、検証済みの暴落確率ではありません。'
});
const DAY=86400000;
const ms=key=>Date.parse(key+'T00:00:00Z');
const dateAdd=(key,n)=>new Date(ms(key)+n*DAY).toISOString().slice(0,10);
const clip=(x,a,b)=>Math.max(a,Math.min(b,x));
const pct=(now,prior)=>Math.log(now/prior)*100;
const mean=arr=>arr.reduce((s,x)=>s+x,0)/arr.length;
const sig=x=>1/(1+Math.exp(-clip(x,-30,30)));
function validDate(date) {
 return typeof date==='string'&&/^\d{4}-\d\d-\d\d$/.test(date)&&Number.isFinite(ms(date))&&new Date(ms(date)).toISOString().slice(0,10)===date;
}
function priceFeatures(prices,idx) {
 const last=prices[idx].close;
 const look=prices.slice(idx-59,idx+1).map(r=>r.close);
 const one=prices.slice(idx-20,idx+1).map(r=>r.close);
 const returns=one.slice(1).map((v,i)=>Math.log(v/one[i])*100);
 const vola=Math.sqrt(mean(returns.map(v=>(v-mean(returns))**2)));
 return [
  pct(last,prices[idx-5].close),
  pct(last,prices[idx-20].close),
  pct(last,prices[idx-60].close),
  (last/Math.max(...look)-1)*100,
  vola,
  returns.filter(v=>v<0).length/returns.length
 ];
}
function astroFeatures(key,bucket,readSky,cache) {
 const values=[];
 for(let offset=bucket.start;offset<=bucket.end;offset+=7) {
  const day=dateAdd(key,offset);
  let info=cache.get(day);
  if(!info){info=marketDaySignal(readSky(day));cache.set(day,info);}
  values.push(info.score);
 }
 return [clip(mean(values),-20,20),values.filter(v=>v<=-2).length/values.length,
    values.filter(v=>v>=2).length/values.length];
}
function outcome(prices,idx,bucket,latestAllowedDate) {
 const start=dateAdd(prices[idx].date,bucket.start);
 const end=dateAdd(prices[idx].date,bucket.end);
 if(end>latestAllowedDate)return null;
 let low=Infinity,count=0;
 for(let i=idx+1;i<prices.length;i++){
  if(prices[i].date>end||prices[i].date>latestAllowedDate)break;
  if(prices[i].date>=start){low=Math.min(low,prices[i].close);count++;}
 }
 if(count<4)return null;
 return Number(low/prices[idx].close-1<=LEAD_RESEARCH_POLICY.targetDropPct/100);
}
function rowAtOrBefore(prices,date) {
 let lo=0,hi=prices.length;
 while(lo<hi){const mid=(lo+hi)>>1;if(prices[mid].date<=date)lo=mid+1;else hi=mid;}
 return lo-1;
}
function samples(prices,readSky,latestLabelDate) {
 const cache=new Map(),result=[];
 const step=prices.length>7000?30:LEAD_RESEARCH_POLICY.stepTradingDays;
 for(let i=LEAD_RESEARCH_POLICY.priorTradingDays;i<prices.length;i+=step){
  if(prices[i].date>latestLabelDate)break;
  const pricesPart=priceFeatures(prices,i);
  const byBucket=LEAD_RESEARCH_POLICY.horizons.map(bucket=>{
    const y=outcome(prices,i,bucket,latestLabelDate);
    if(y===null)return null;
    return {y,price:pricesPart,combined:[...pricesPart,...astroFeatures(prices[i].date,bucket,readSky,cache)]};
  });
  result.push({date:prices[i].date,buckets:byBucket});
 }
 return result;
}
function fit(rows,type) {
 if(rows.length<LEAD_RESEARCH_POLICY.minTrain)return null;
 const pos=rows.filter(x=>x.y).length,neg=rows.length-pos;
 if(pos<LEAD_RESEARCH_POLICY.minPositive||neg<LEAD_RESEARCH_POLICY.minNegative)return null;
 const cols=type==='combined'?9:6;
 const means=Array.from({length:cols},(_,j)=>mean(rows.map(x=>x[type][j])));
 const std=means.map((m,j)=>Math.max(0.15,Math.sqrt(mean(rows.map(x=>(x[type][j]-m)**2)))));
 const x=rows.map(r=>r[type].map((v,j)=>clip((v-means[j])/std[j],-5,5)));
 const b=clip(pos/rows.length,0.01,0.99);
 const w=Array(cols+1).fill(0);w[0]=Math.log(b/(1-b));
 // Fixed L2-regularized batch logistic regression. No random initialization.
 for(let epoch=0;epoch<300;epoch++){
  const grad=Array(cols+1).fill(0);
  for(let i=0;i<rows.length;i++){
   const p=sig(w[0]+x[i].reduce((v,z,j)=>v+z*w[j+1],0));
   const e=p-rows[i].y;grad[0]+=e;
   for(let j=0;j<cols;j++)grad[j+1]+=e*x[i][j];
  }
  const step=0.18/(1+epoch/200);
  w[0]-=step*grad[0]/rows.length;
  for(let j=1;j<w.length;j++)w[j]-=step*(grad[j]/rows.length+0.25*w[j]);
 }
 return {type,w,means,std,trainN:rows.length,positives:pos,baseRate:pos/rows.length};
}
function score(model,row){
 if(!model)return null;
 const xs=row[model.type].map((v,j)=>clip((v-model.means[j])/model.std[j],-5,5));
 return sig(model.w[0]+xs.reduce((s,v,j)=>s+v*model.w[j+1],0));
}
function metric(model,testRows,baseRate) {
 if(testRows.length<LEAD_RESEARCH_POLICY.minHoldout)return {n:testRows.length,brier:null,baseBrier:null,recall:null,precision:null,alerts:0,events:0};
 const predictions=testRows.map(row=>({truth:row.y,p:score(model,row)}));
 const prevalence=predictions.filter(x=>x.truth).length;
 const brier=mean(predictions.map(x=>(x.p-x.truth)**2));
 const baseBrier=mean(predictions.map(x=>(baseRate-x.truth)**2));
 // Fixed alert rule from training prevalence, never tuned using test labels.
 const threshold=Math.max(0.2,baseRate*1.5);
 const flagged=predictions.filter(x=>x.p>=threshold),hits=flagged.filter(x=>x.truth).length;
 return {
  n:predictions.length,events:prevalence,alerts:flagged.length,
  brier:Number(brier.toFixed(4)),baseBrier:Number(baseBrier.toFixed(4)),
  precision:flagged.length?Number((100*hits/flagged.length).toFixed(1)):null,
  recall:prevalence?Number((100*hits/prevalence).toFixed(1)):null,
  threshold:Number(threshold.toFixed(3))
 };
}
function splits(observations,bucketIndex) {
 const usable=observations.filter(row=>row.buckets[bucketIndex]).map(row=>({
  date:row.date,...row.buckets[bucketIndex]
 }));
 if(usable.length<LEAD_RESEARCH_POLICY.minTrain+LEAD_RESEARCH_POLICY.minHoldout)return {train:usable,test:[]};
 const start=usable[Math.floor(usable.length*0.7)].date;
 return {
  // Purge 90 days: no training outcomes can overlap with the held-out period.
  train:usable.filter(x=>ms(x.date)+LEAD_RESEARCH_POLICY.purgeCalendarDays*DAY<ms(start)),
  test:usable.filter(x=>x.date>=start),
  splitDate:start
 };
}
export function evaluateLeadModels({prices,readSky,latestDate=prices.at(-1)?.date}) {
 validatePriceRows(prices);
 if(typeof readSky!=='function'||!validDate(latestDate))throw new Error('学習条件が不正です。');
 const cutoff=Math.min(ms(latestDate),ms(prices.at(-1).date));
 const date=new Date(cutoff).toISOString().slice(0,10);
 const obs=samples(prices,readSky,date);
 const results=LEAD_RESEARCH_POLICY.horizons.map((bucket,j)=>{
  const {train,test,splitDate}=splits(obs,j);
  const combined=fit(train,'combined'),price=fit(train,'price');
  if(!combined||!price)return {bucket:bucket.label,status:'insufficient',trainN:train.length,testN:test.length};
  const model=metric(combined,test,combined.baseRate),priceOnly=metric(price,test,price.baseRate);
  return {bucket:bucket.label,status:model.brier===null?'insufficient':'evaluated',
   splitDate,lastTrainDate:train.at(-1)?.date??null,firstHoldoutDate:test[0]?.date??null,
   trainN:train.length,trainEvents:combined.positives,testN:test.length,
   model,priceOnly,beatPriceOnly:model.brier!==null&&model.brier<priceOnly.brier,
   beatConstant:model.brier!==null&&model.brier<model.baseBrier};
 });
 return {latestDate:date,sampleN:obs.length,results};
}
export function forecastLeadMonths({prices,asOfDate,readSky,market='nikkei'}){
 validatePriceRows(prices);
 if(typeof readSky!=='function'||!validDate(asOfDate))throw new Error('予測条件が不正です。');
 const idx=rowAtOrBefore(prices,asOfDate);
 if(idx<LEAD_RESEARCH_POLICY.priorTradingDays)return {status:'unavailable',reason:'事前学習に必要な過去60営業日以上の終値がありません。'};
 const last=prices[idx];
 if(ms(asOfDate)-ms(last.date)>7*DAY)return {status:'unavailable',reason:'最新の終値が7日超古いため、今後の予測を表示できません。'};
 // Strict historical as-of fence: future closes are removed before training.
 const known=prices.slice(0,idx+1);
 const past=samples(known,readSky,last.date);
 const cache=new Map(),price=priceFeatures(known,idx);
 const reports=evaluateLeadModels({prices:known,readSky,latestDate:last.date});
 const buckets=LEAD_RESEARCH_POLICY.horizons.map((h,j)=>{
  const trainRows=past.filter(x=>x.buckets[j]).map(x=>x.buckets[j]);
  const model=fit(trainRows,'combined'),priceModel=fit(trainRows,'price');
  if(!model||!priceModel)return {period:h.label,start:dateAdd(last.date,h.start),end:dateAdd(last.date,h.end),
    status:'insufficient',score:null,reason:'過去の暴落事例が少なく、この月のリスクを学習できません。'};
  const features={price,combined:[...price,...astroFeatures(last.date,h,readSky,cache)]};
  const scoreCombined=score(model,features),scorePrice=score(priceModel,features);
  const diagnostic=reports.results[j];
  const verified=diagnostic.status==='evaluated'&&diagnostic.beatPriceOnly&&diagnostic.beatConstant;
  return {period:h.label,start:dateAdd(last.date,h.start),end:dateAdd(last.date,h.end),
    status:'experimental',riskScore:Math.round(100*scoreCombined),
    priceOnlyScore:Math.round(100*scorePrice),
    baselineScore:Math.round(100*model.baseRate),
    classification:scoreCombined>=Math.max(.2,model.baseRate*1.5)?'注意候補':
      scoreCombined<=model.baseRate*.7?'低め':'通常',
    verifiedOutOfSampleAdvantage:verified,
    testN:diagnostic.testN??0,holdoutBrier:diagnostic.model?.brier??null,
    priceOnlyBrier:diagnostic.priceOnly?.brier??null,
    description:'価格の過去指標と、計算可能な未来の天体配置を使った研究スコア。実際の暴落確率ではありません。'};
 });
 const valid=buckets.filter(x=>Number.isFinite(x.riskScore));
 const leader=valid.length?[...valid].sort((a,b)=>b.riskScore-a.riskScore)[0]:null;
 return {
  status:leader?'experimental':'unavailable',
  market,asOf:last.date,trainingRecords:past.length,
  leadingPeriod:leader?.period??null,highestRiskScore:leader?.riskScore??null,
  buckets,diagnostics:reports.results,
  canClaimVerified:!!leader&&buckets.every(x=>x.verifiedOutOfSampleAdvantage),
  notice:'月ごとの研究用リスク指数です。事前に予測する設計ですが、過去の未使用期間で安定した有効性が確認されるまで金融判断には使用しないでください。',
  modelId:LEAD_RESEARCH_POLICY.id
 };
}
