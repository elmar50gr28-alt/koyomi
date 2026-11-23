// Pre-event monthly crash risk research. Only PAST closes and PRE-COMPUTABLE
// astronomy are used for prediction. Labels may use future closes during training.
// Every fit and threshold is learned without held-out future outcomes.
import {validatePriceRows} from './market-history.js';
import {marketDaySignal} from './market-direction.js';

export const LEAD_RESEARCH_POLICY=Object.freeze({
 id:'koyomi-crash-lead-v2-inner-purged-selection',
 horizons:[{start:1,end:30,label:'今後1〜30日'},{start:31,end:60,label:'31〜60日先'},{start:61,end:90,label:'61〜90日先'}],
 targetDropPct:-8,method:'first-crossing-of-eight-percent-from-asof-close',stepTradingDays:15,priorTradingDays:60,purgeCalendarDays:90,
 minTrain:28,minPositive:4,minNegative:8,minHoldout:8,
 optimization:'inner-forward-validation-purged-90d-regularization-and-feature-ablation',
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
 const barrier=prices[idx].close*(1+LEAD_RESEARCH_POLICY.targetDropPct/100);
 let firstCross=null,count=0;
 for(let i=idx+1;i<prices.length;i++){
  if(prices[i].date>end||prices[i].date>latestAllowedDate)break;
  if(prices[i].date>=start)count++;
  if(firstCross===null&&prices[i].close<=barrier)firstCross=prices[i].date;
 }
 if(count<4)return null;
 // Classify the FIRST crossing: a drop in month one cannot be labeled anew
 // in months two and three just because prices remained depressed.
 return Number(firstCross!==null&&firstCross>=start&&firstCross<=end);
}
export function historicalFirstCrashBucket(prices,originIndex,latestAllowedDate) {
 validatePriceRows(prices);
 if(!Number.isInteger(originIndex)||originIndex<0||originIndex>=prices.length||!validDate(latestAllowedDate))
  throw new RangeError('暴落の発生時期を判定できません。');
 return LEAD_RESEARCH_POLICY.horizons.map(bucket=>outcome(prices,originIndex,bucket,latestAllowedDate));
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
const BASE_INDICES=Object.freeze([0,1,2,3,4,5]);
const ONE_SKY=Object.freeze([0,1,2,3,4,5,6]);
const THREE_SKY=Object.freeze([0,1,2,3,4,5,6,7,8]);
const CANDIDATES=Object.freeze({
 price:[0.1,0.5,2].map(l2=>({l2,indices:BASE_INDICES,kind:'price-only'})),
 combined:[0.1,0.5,2].flatMap(l2=>[
  {l2,indices:ONE_SKY,kind:'price-plus-astro-mean'},
  {l2,indices:THREE_SKY,kind:'price-plus-all-astro'}
 ])
});
export const LEAD_CANDIDATE_COUNT=Object.freeze({
 price:CANDIDATES.price.length,combined:CANDIDATES.combined.length
});
function fit(rows,type,options) {
 if(rows.length<LEAD_RESEARCH_POLICY.minTrain)return null;
 const pos=rows.filter(x=>x.y).length,neg=rows.length-pos;
 if(pos<LEAD_RESEARCH_POLICY.minPositive||neg<LEAD_RESEARCH_POLICY.minNegative)return null;
 const config=options??(type==='price'?CANDIDATES.price[1]:CANDIDATES.combined[2]);
 const columns=config.indices;
 const means=columns.map(j=>mean(rows.map(x=>x[type][j])));
 const std=columns.map((j,k)=>Math.max(0.15,Math.sqrt(mean(rows.map(x=>(x[type][j]-means[k])**2)))));
 const x=rows.map(r=>columns.map((j,k)=>clip((r[type][j]-means[k])/std[k],-5,5)));
 const b=clip(pos/rows.length,0.01,0.99);
 const w=Array(columns.length+1).fill(0);w[0]=Math.log(b/(1-b));
 // Fixed L2-regularized logistic regression, deterministic and trained on rows only.
 for(let epoch=0;epoch<180;epoch++){
  const grad=Array(columns.length+1).fill(0);
  for(let i=0;i<rows.length;i++){
   const p=sig(w[0]+x[i].reduce((v,z,j)=>v+z*w[j+1],0));
   const e=p-rows[i].y;grad[0]+=e;
   for(let j=0;j<columns.length;j++)grad[j+1]+=e*x[i][j];
  }
  const step=0.18/(1+epoch/200);
  w[0]-=step*grad[0]/rows.length;
  for(let j=1;j<w.length;j++)w[j]-=step*(grad[j]/rows.length+config.l2*w[j]);
 }
 return {type,w,means,std,indices:columns,l2:config.l2,kind:config.kind,
   trainN:rows.length,positives:pos,baseRate:pos/rows.length};
}
function score(model,row){
 if(!model)return null;
 const xs=model.indices.map((j,k)=>clip((row[model.type][j]-model.means[k])/model.std[k],-5,5));
 return sig(model.w[0]+xs.reduce((s,v,j)=>s+v*model.w[j+1],0));
}
function validationFolds(rows) {
 // Validation is always later than training, with a 90d embargo of ALL labels.
 const n=rows.length,folds=[];
 for(const frac of [0.58,0.72,0.86]){
  const from=Math.floor(n*frac);
  const end=Math.min(n,from+Math.max(8,Math.floor(n*0.12)));
  const first=rows[from]?.date;
  if(!first)continue;
  const earlier=rows.filter(x=>ms(x.date)+LEAD_RESEARCH_POLICY.purgeCalendarDays*DAY<ms(first));
  const later=rows.slice(from,end);
  const positives=earlier.filter(x=>x.y).length;
  if(earlier.length>=LEAD_RESEARCH_POLICY.minTrain &&
    positives>=LEAD_RESEARCH_POLICY.minPositive &&
    earlier.length-positives>=LEAD_RESEARCH_POLICY.minNegative &&
    later.length>=LEAD_RESEARCH_POLICY.minHoldout)folds.push({earlier,later,first});
 }
 return folds;
}
function chooseModel(rows,type) {
 const configs=CANDIDATES[type],folds=validationFolds(rows),evaluations=[];
 // Do not pick hyperparameters based on outer test outcomes.
 if(folds.length>=2) {
  for(const config of configs) {
   const errors=[];
   for(const fold of folds){
    const m=fit(fold.earlier,type,config);
    if(!m)continue;
    errors.push(mean(fold.later.map(r=>(score(m,r)-r.y)**2)));
   }
   if(errors.length===folds.length){
    const avg=mean(errors);
    const se=Math.sqrt(mean(errors.map(x=>(x-avg)**2))/errors.length);
    evaluations.push({config,avg,se});
   }
  }
 }
 // The one-standard-error rule favors simplicity rather than chasing tiny gains.
 let selected,choice='not-enough-inner-folds';
 if(evaluations.length) {
  const best=[...evaluations].sort((a,b)=>a.avg-b.avg)[0];
  const eligible=evaluations.filter(x=>x.avg<=best.avg+best.se);
  eligible.sort((a,b)=>a.config.indices.length-b.config.indices.length||
    b.config.l2-a.config.l2||a.avg-b.avg);
  selected=eligible[0].config;choice='inner-cv-one-standard-error';
 }else{
  selected=type==='price'?CANDIDATES.price[2]:CANDIDATES.combined.at(-1);
 }
 const model=fit(rows,type,selected);
 if(model){
  const history=rows.map(r=>score(model,r)).sort((a,b)=>a-b);
  // Predeclared 80th percentile alert budget; fitted on TRAINING predictions only.
  model.alertThreshold=history[Math.floor(0.8*(history.length-1))];
 }
 return {model,optimization:{
  selection:choice,folds:folds.length,candidates:configs.length,
  regularization:selected.l2,featureSet:selected.kind,
  featureCount:selected.indices.length,
  innerBrier:evaluations.find(x=>x.config===selected)?.avg??null
 }};
}
function chooseArchitecture(astro,price) {
 const astroLoss=astro.optimization.innerBrier,priceLoss=price.optimization.innerBrier;
 // Architecture is chosen ONLY by inner folds, BEFORE the outer holdout is scored.
 // Even a slight sky improvement is too easy to data-mine, so require a fixed margin.
 const skyUseful=!!astro.model&&!!price.model&&astro.optimization.folds>=2&&
   Number.isFinite(astroLoss)&&Number.isFinite(priceLoss)&&astroLoss<priceLoss-0.003;
 return {model:skyUseful?astro.model:price.model,usesAstronomy:skyUseful,
   reason:skyUseful?'内側の時系列検証で天体特徴量の追加が価格のみを0.003以上改善':
     '内側の時系列検証で天体の上乗せ効果を確認できず、価格のみを優先'};
}
function metric(model,testRows,baseRate) {
 if(testRows.length<LEAD_RESEARCH_POLICY.minHoldout)return {n:testRows.length,brier:null,baseBrier:null,recall:null,precision:null,alerts:0,events:0};
 const predictions=testRows.map(row=>({truth:row.y,p:score(model,row)}));
 const prevalence=predictions.filter(x=>x.truth).length;
 const brier=mean(predictions.map(x=>(x.p-x.truth)**2));
 const baseBrier=mean(predictions.map(x=>(baseRate-x.truth)**2));
 // Fixed alert rule from training prevalence, never tuned using test labels.
 const threshold=model.alertThreshold;
 const flagged=predictions.filter(x=>x.p>=threshold),hits=flagged.filter(x=>x.truth).length;
 return {
  n:predictions.length,events:prevalence,alerts:flagged.length,falseAlerts:flagged.length-hits,
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
  const chosenCombined=chooseModel(train,'combined'),chosenPrice=chooseModel(train,'price');
  const arch=chooseArchitecture(chosenCombined,chosenPrice);
  const combined=arch.model,price=chosenPrice.model;
  if(!combined||!price)return {bucket:bucket.label,status:'insufficient',trainN:train.length,testN:test.length};
  const model=metric(combined,test,combined.baseRate),priceOnly=metric(price,test,price.baseRate);
  return {bucket:bucket.label,status:model.brier===null?'insufficient':'evaluated',
   splitDate,lastTrainDate:train.at(-1)?.date??null,firstHoldoutDate:test[0]?.date??null,
   trainN:train.length,trainEvents:combined.positives,testN:test.length,
   optimization:{combined:chosenCombined.optimization,priceOnly:chosenPrice.optimization,
     usedAstronomy:arch.usesAstronomy,reason:arch.reason},
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
  const trainRows=past.filter(x=>x.buckets[j]).map(x=>({date:x.date,...x.buckets[j]}));
  const fitCombined=chooseModel(trainRows,'combined'),fitPrice=chooseModel(trainRows,'price');
  const arch=chooseArchitecture(fitCombined,fitPrice);
  const model=arch.model,priceModel=fitPrice.model;
  if(!model||!priceModel)return {period:h.label,start:dateAdd(last.date,h.start),end:dateAdd(last.date,h.end),
    status:'insufficient',score:null,reason:'過去の暴落事例が少なく、この月のリスクを学習できません。'};
  const features={price,combined:[...price,...astroFeatures(last.date,h,readSky,cache)]};
  const scoreCombined=score(model,features),scorePrice=score(priceModel,features);
  const diagnostic=reports.results[j];
  const verified=diagnostic.status==='evaluated'&&diagnostic.beatPriceOnly&&diagnostic.beatConstant;
  return {period:h.label,start:dateAdd(last.date,h.start),end:dateAdd(last.date,h.end),
    status:'experimental',riskScore:Math.round(100*scoreCombined),
    priceOnlyScore:Math.round(100*scorePrice),
    selection:{combined:fitCombined.optimization,priceOnly:fitPrice.optimization,
      usedAstronomy:arch.usesAstronomy,reason:arch.reason},
    alertCutoff:Math.round(model.alertThreshold*100),
    baselineScore:Math.round(100*model.baseRate),
    classification:scoreCombined>=model.alertThreshold?'注意候補':
      scoreCombined<=model.baseRate*.7?'低め':'通常',
    verifiedOutOfSampleAdvantage:verified,
    testN:diagnostic.testN??0,holdoutBrier:diagnostic.model?.brier??null,
    priceOnlyBrier:diagnostic.priceOnly?.brier??null,
    description:arch.usesAstronomy?'過去価格と未来の天体配置を使う研究スコア。暴落確率ではありません。':
      '過学習回避により天体特徴量を不採用。過去価格のみで算出した研究スコア。暴落確率ではありません。'};
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
