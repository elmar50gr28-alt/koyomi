import { VOLCANO_FRESHNESS } from './config.js';

const finite=value=>Number.isFinite(Number(value));
const unavailable=(status,reason)=>Object.freeze({status,classification:null,relativeChange:null,persistenceDays:null,confidence:0,reason});

export function evaluateHeatTransfer(observations,{asOf=new Date(),maxAgeHours=VOLCANO_FRESHNESS.thermalMaxAgeHours}={}){
  const cutoff=new Date(asOf).getTime();
  if(!Number.isFinite(cutoff))throw new TypeError('asOf must be a valid date');
  const usable=(Array.isArray(observations)?observations:[]).filter(item=>finite(item?.value)&&Number.isFinite(Date.parse(item?.timeUtc))&&Date.parse(item.timeUtc)<=cutoff).sort((a,b)=>Date.parse(a.timeUtc)-Date.parse(b.timeUtc));
  if(usable.length<4)return unavailable('data-unavailable','比較に必要な観測が不足しています');
  const latest=usable.at(-1),ageHours=(cutoff-Date.parse(latest.timeUtc))/36e5;
  if(ageHours>maxAgeHours)return unavailable('stale-data','熱観測の更新が止まっています');
  if(latest.weatherQuality==='poor')return unavailable('partial-data','雲や気象条件の影響が大きいため保留します');
  const baseline=usable.slice(0,-2).map(item=>Number(item.value)).sort((a,b)=>a-b),middle=baseline[Math.floor(baseline.length/2)];
  if(!finite(middle)||middle===0)return unavailable('data-unavailable','比較基準を作れません');
  const relativeChange=(Number(latest.value)-middle)/Math.abs(middle),elevated=usable.slice(-2).filter(item=>(Number(item.value)-middle)/Math.abs(middle)>=.2).length;
  const classification=relativeChange>=.2?(elevated>=2?'persistent-change':'single-change'):'baseline-range';
  return Object.freeze({status:'available',classification,relativeChange:Math.round(relativeChange*1000)/1000,persistenceDays:elevated,confidence:latest.weatherQuality==='good'?1:.65,reason:classification==='persistent-change'?'複数回の観測で基準より高い状態が続いています':classification==='single-change'?'直近だけに変化が見られます':'保存済み基準の範囲内です'});
}
