import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import * as h3 from '../vendor/h3-js/4.5.0/h3-js.es.js';
import { runDecayNeighborModel } from '../src/world/earthquake-forecast/model.js';

const DAY=86_400_000;
const resolution=2;
const horizons=[1,3,7,14,30];
const trainStart=Date.parse('2005-01-01T00:00:00Z');
const tuningStart=Date.parse('2010-01-01T00:00:00Z');
const confirmationStart=Date.parse('2013-01-01T00:00:00Z');
const developmentEnd=Date.parse('2015-01-01T00:00:00Z');
const samplingStepDays=7;
const events=new Map();
const sources=[];

for(let year=2005;year<=2014;year+=1){
  const url=`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time-asc&starttime=${year}-01-01T00:00:00Z&endtime=${year+1}-01-01T00:00:00Z&minmagnitude=4.5&eventtype=earthquake&limit=20000`;
  const response=await fetch(url);
  if(!response.ok)throw new Error(`USGS ${year}: ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const payload=JSON.parse(new TextDecoder().decode(bytes));
  sources.push({year,url,recordCount:payload.features.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  for(const feature of payload.features){
    const [longitude,latitude]=feature.geometry?.coordinates||[];
    const magnitude=Number(feature.properties?.mag),time=Number(feature.properties?.time);
    if(Number.isFinite(latitude)&&Number.isFinite(longitude)&&Number.isFinite(magnitude)&&Number.isFinite(time)){
      events.set(feature.id,{time,magnitude,cell:h3.latLngToCell(latitude,longitude,resolution)});
    }
  }
}

const catalog=[...events.values()].sort((a,b)=>a.time-b.time);
const training=catalog.filter(event=>event.time<tuningStart);
const trainingDays=(tuningStart-trainStart)/DAY;
const cellCounts=new Map();
for(const event of training)cellCounts.set(event.cell,(cellCounts.get(event.cell)||0)+1);
const cells=[...cellCounts].filter(([,count])=>count>=3).map(([cell])=>cell);
const cellSet=new Set(cells);
const targetCounts=new Map();
for(const event of training){
  if(event.magnitude>=6.5&&cellSet.has(event.cell))targetCounts.set(event.cell,(targetCounts.get(event.cell)||0)+1);
}

const nearbyByCell=new Map(cells.map(cell=>[cell,[]]));
const targetsByCell=new Map(cells.map(cell=>[cell,[]]));
for(const event of catalog){
  if(event.magnitude>=6.5&&targetsByCell.has(event.cell))targetsByCell.get(event.cell).push(event.time);
  for(const [ring,ringCells] of h3.gridDiskDistances(event.cell,2).entries()){
    for(const cell of ringCells){
      if(nearbyByCell.has(cell))nearbyByCell.get(cell).push({...event,ring});
    }
  }
}

const parameterGrid=[];
for(const productivityScale of [.000005,.00001,.00002,.00004,.00008,.00016,.00032]){
  for(const temporalPower of [.5,.7,.9,1.1,1.3]){
    parameterGrid.push({productivityScale,temporalPower,spatialDecayRings:1,temporalOffsetDays:.5,magnitudeExponent:.8,maxRing:0});
  }
}

const clamp=probability=>Math.min(1-1e-12,Math.max(1e-12,probability));
const emptyScore=()=>({n:0,events:0,logloss:0,brier:0});
const add=(score,probability,outcome)=>{
  const p=clamp(probability);
  score.n+=1;score.events+=outcome;
  score.logloss-=outcome*Math.log(p)+(1-outcome)*Math.log(1-p);
  score.brier+=(p-outcome)**2;
};
const finalize=score=>({n:score.n,targetWindows:score.events,logloss:score.logloss/score.n,brier:score.brier/score.n});
const tuningScores=new Map();
const selectedByHorizon=new Map();

function samples(start,end,visit){
  for(let day=start;day<end;day+=samplingStepDays*DAY){
    for(const cell of cells){
      const history=nearbyByCell.get(cell).filter(event=>event.time<day&&event.time>=day-60*DAY);
      const nearbyEvents=history.map(event=>({ageDays:(day-event.time)/DAY,ring:event.ring,magnitude:event.magnitude}));
      const own=history.filter(event=>event.ring===0);
      const background=(targetCounts.get(cell)||.25)/(trainingDays+2500);
      const ordinaryRate=cellCounts.get(cell)/trainingDays;
      const recent7=own.filter(event=>event.time>=day-7*DAY).length;
      const recent30=own.filter(event=>event.time>=day-30*DAY).length;
      const activity=Math.min(4,Math.max(.25,((recent7/7)/ordinaryRate+(recent30/30)/ordinaryRate)/2));
      for(const horizon of horizons){
        const outcome=targetsByCell.get(cell).some(time=>time>=day&&time<day+horizon*DAY)?1:0;
        const baseline=1-Math.exp(-background*activity*horizon);
        visit({day,horizon,outcome,baseline,background,nearbyEvents});
      }
    }
  }
}

samples(tuningStart,confirmationStart,({horizon,outcome,baseline,background,nearbyEvents})=>{
  const baselineKey=`${horizon}:baseline`;
  if(!tuningScores.has(baselineKey))tuningScores.set(baselineKey,emptyScore());
  add(tuningScores.get(baselineKey),baseline,outcome);
  for(const [index,parameters] of parameterGrid.entries()){
    const key=`${horizon}:candidate:${index}`;
    if(!tuningScores.has(key))tuningScores.set(key,emptyScore());
    add(tuningScores.get(key),runDecayNeighborModel({targetBackgroundDailyRate:background,nearbyEvents},horizon,parameters).modelProbability,outcome);
  }
});

for(const horizon of horizons){
  const baseline=finalize(tuningScores.get(`${horizon}:baseline`));
  let bestIndex=0,bestUtility=-Infinity;
  for(const [index] of parameterGrid.entries()){
    const candidate=finalize(tuningScores.get(`${horizon}:candidate:${index}`));
    const loglossGain=(baseline.logloss-candidate.logloss)/baseline.logloss;
    const brierGain=(baseline.brier-candidate.brier)/baseline.brier;
    const utility=Math.min(loglossGain,brierGain);
    if(utility>bestUtility){bestUtility=utility;bestIndex=index;}
  }
  selectedByHorizon.set(horizon,{index:bestIndex,parameters:parameterGrid[bestIndex]});
}

const confirmationScores=new Map();
const yearlyScores=new Map();
samples(confirmationStart,developmentEnd,({day,horizon,outcome,baseline,background,nearbyEvents})=>{
  const year=new Date(day).getUTCFullYear();
  const candidate=runDecayNeighborModel({targetBackgroundDailyRate:background,nearbyEvents},horizon,selectedByHorizon.get(horizon).parameters).modelProbability;
  for(const [collection,key] of [[confirmationScores,`${horizon}`],[yearlyScores,`${year}:${horizon}`]]){
    if(!collection.has(key))collection.set(key,{baseline:emptyScore(),candidate:emptyScore()});
    add(collection.get(key).baseline,baseline,outcome);
    add(collection.get(key).candidate,candidate,outcome);
  }
});

const results=horizons.map(horizon=>{
  const tuningBaseline=finalize(tuningScores.get(`${horizon}:baseline`));
  const tuningCandidate=finalize(tuningScores.get(`${horizon}:candidate:${selectedByHorizon.get(horizon).index}`));
  const confirmationBaseline=finalize(confirmationScores.get(`${horizon}`).baseline);
  const confirmationCandidate=finalize(confirmationScores.get(`${horizon}`).candidate);
  const yearly=[2013,2014].map(year=>{
    const scores=yearlyScores.get(`${year}:${horizon}`);
    const baseline=finalize(scores.baseline),candidate=finalize(scores.candidate);
    return {year,baseline,candidate,informationGain:baseline.logloss-candidate.logloss,brierImprovement:baseline.brier-candidate.brier};
  });
  const informationGain=confirmationBaseline.logloss-confirmationCandidate.logloss;
  const brierImprovement=confirmationBaseline.brier-confirmationCandidate.brier;
  const {productivityScale,temporalPower}=selectedByHorizon.get(horizon).parameters;
  const gridInterior=productivityScale>.000005&&productivityScale<.00032&&temporalPower>.5&&temporalPower<1.3;
  const developmentPassed=informationGain>0&&brierImprovement>0&&yearly.every(item=>item.informationGain>0)&&gridInterior;
  return {horizonDays:horizon,parameters:selectedByHorizon.get(horizon).parameters,tuning:{baseline:tuningBaseline,candidate:tuningCandidate},confirmation:{baseline:confirmationBaseline,candidate:confirmationCandidate,informationGain,brierImprovement},yearly,developmentPassed};
});

const report={
  schemaId:'koyomi-earthquake-development-evaluation-v2',
  periods:{training:['2005-01-01','2009-12-31'],tuning:['2010-01-01','2012-12-31'],confirmation:['2013-01-01','2014-12-31']},
  sampling:{stepDays:samplingStepDays,historyWindowDays:60,cellSelection:'training-only count >= 3'},
  targetMagnitude:6.5,h3Resolution:resolution,parameterGridSize:parameterGrid.length,
  acceptance:'confirmation logloss and Brier improve; information gain positive in both 2013 and 2014; every selected parameter is inside the search grid',
  realHoldoutExecuted:false,sources,results
};
await mkdir(new URL('../data/research/',import.meta.url),{recursive:true});
await writeFile(new URL('../data/research/earthquake-development-evaluation-v2.json',import.meta.url),`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(results.map(({horizonDays,parameters,confirmation,yearly,developmentPassed})=>({horizonDays,parameters,confirmation,yearly,developmentPassed})),null,2));
