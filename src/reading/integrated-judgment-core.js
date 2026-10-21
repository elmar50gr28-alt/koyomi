(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KOYOMI_INTEGRATED_JUDGMENT=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const VERSION='1.1.0';
 const DOMAINS=['overall','work','relationship','money','health','timing','identity'];
 const EXPERTISE={
  shichu:{overall:1.25,work:1.2,health:1.05,timing:1.2},timing:{timing:1.45,work:1.1,overall:1.1},astrology:{overall:1.15,relationship:1.15,timing:1.2,identity:1.15},
  sukuyo:{relationship:1.35,timing:1.15},kyusei:{timing:1.25,work:1.05},tarot:{overall:1.05,relationship:1.15,work:1.05},runes:{overall:1.05,work:1.05},
  name:{identity:1.4,work:1.05},numerology:{identity:1.25,timing:1.05},kabbalah:{identity:1.2},rokusei:{timing:1.2,overall:1.05}
 };
 function clamp(value,min=0,max=100){const number=Number(value);return Number.isFinite(number)?Math.max(min,Math.min(max,number)):50}
 function clean(value){return String(value??'').replace(/\s+/g,' ').trim()}
 function array(value){return(Array.isArray(value)?value:[value]).map(clean).filter(Boolean)}
 function domain(value){const text=clean(value).toLowerCase(),map={career:'work',changejob:'work',purchase:'money',income:'money',love:'relationship',marriage:'relationship',reconcile:'relationship',healthrhythm:'health',choice:'overall'};return DOMAINS.includes(text)?text:(map[text]||'overall')}

 function confidenceOf(signal){const value=Object.hasOwn(signal,'confidence')?signal.confidence:signal.conf;const raw=value&&typeof value==='object'?value.score:value;if(raw===undefined)return 0.5;if(raw===null||raw===''||!Number.isFinite(Number(raw)))return 0;return clamp(raw)/100}
 function isAvailable(signal={}){const score=signal.score,validScore=(typeof score==='number'||typeof score==='string'&&score.trim()!=='')&&Number.isFinite(Number(score));return validScore&&signal.available!==false&&signal.confidence?.available!==false&&signal.conf?.available!==false&&!array(signal.evidence||signal.factors).some(item=>/判定保留|算出不可|未算出|計算不能|画数未登録|ローマ字.*未入力|生年月日.*未入力|^未入力$/.test(item))}
 function normalize(signal,index){const id=clean(signal.id||signal.key||'signal-'+index),available=isAvailable(signal),confidence=available?confidenceOf(signal):0;return{id,system:clean(signal.system||signal.label||id),score:Math.round(clamp(signal.score)),confidence,available,evidence:array(signal.evidence||signal.factors).slice(0,4),timing:array(signal.timing),supportConditions:array(signal.supportConditions),cautionConditions:array(signal.cautionConditions)}}
 function classify(score){return score>=72?'forward':score<42?'protect':'test'}
 function build(input={}){
  const target=domain(input.domain||input.focus),signals=arraySignals(input.signals).map(normalize),usable=signals.filter(item=>item.available&&item.confidence>0);
  const weights=new Map(),weighted=usable.map(signal=>{const expertise=EXPERTISE[signal.id]?.[target]||EXPERTISE[signal.id]?.overall||1,priority=array(input.priority).includes(signal.id)?1.25:1,item={...signal,expertise,weight:signal.confidence*expertise*priority};weights.set(signal,item);return item});
  const denominator=weighted.reduce((sum,item)=>sum+item.weight,0),scoreAvailable=denominator>0;
  const score=scoreAvailable?Math.round(weighted.reduce((sum,item)=>sum+item.score*item.weight,0)/denominator):50;
  const support=weighted.filter(item=>item.score>=62).sort((a,b)=>b.weight*(b.score-50)-a.weight*(a.score-50)),cautions=weighted.filter(item=>item.score<=44).sort((a,b)=>b.weight*(50-b.score)-a.weight*(50-a.score));
  const spread=weighted.length?Math.max(...weighted.map(x=>x.score))-Math.min(...weighted.map(x=>x.score)):0,contradiction=support.length>0&&cautions.length>0&&spread>=28,coverage=Math.min(1,weighted.length/7);
  const confidence=scoreAvailable?Math.round(clamp(weighted.reduce((sum,item)=>sum+item.confidence*item.weight,0)/denominator*100*0.75+coverage*25-(contradiction?10:0))):0;
  const evidence=[...support,...cautions,...weighted].flatMap(item=>item.evidence.map(text=>({system:item.system,text,score:item.score}))).filter((item,index,list)=>list.findIndex(other=>other.system===item.system&&other.text===item.text)===index).slice(0,6);
  return{schemaId:'koyomi-integrated-judgment',version:VERSION,domain:target,status:scoreAvailable?'ready':'insufficient',scoreAvailable,score,state:classify(score),confidence,coverage:Number(coverage.toFixed(2)),contradiction,spread,
   withheldSystems:[...new Set(signals.filter(item=>!item.available||item.confidence<=0).map(item=>item.system))],supportingSystems:support.slice(0,3).map(x=>x.system),cautionSystems:cautions.slice(0,3).map(x=>x.system),
   timing:[...new Set(weighted.flatMap(x=>x.timing))].slice(0,3),supportConditions:[...new Set([...support,...weighted].flatMap(x=>x.supportConditions))].slice(0,4),cautionConditions:[...new Set([...cautions,...weighted].flatMap(x=>x.cautionConditions))].slice(0,4),evidence,
   signals:signals.map(signal=>{const item=weights.get(signal)||signal;return{id:signal.id,system:signal.system,score:signal.score,confidence:Number(signal.confidence.toFixed(2)),available:signal.available,expertise:item.expertise||0,weight:Number((item.weight||0).toFixed(3))}})}
 }
 function summarizeLegacy(methods,relevance=()=>1){
  const usable=methods.filter(item=>isAvailable(item)&&confidenceOf(item)>0),denominator=usable.reduce((sum,item)=>sum+relevance(item)*confidenceOf(item),0);
  const score=denominator>0?Math.round(usable.reduce((sum,item)=>sum+item.score*relevance(item)*confidenceOf(item),0)/denominator):50,sorted=[...usable].sort((a,b)=>b.score-a.score),spread=sorted.length?sorted[0].score-sorted[sorted.length-1].score:0;
  return{score,scoreAvailable:denominator>0,methods,best:sorted.slice(0,3),warn:[...sorted].reverse().slice(0,3),spread,agreement:usable.length<2?'比較不足':spread<=18?'高':spread<=34?'中':'低',withheldSystems:methods.filter(item=>!usable.includes(item)).map(item=>item.label||item.system||item.key)}
 }
 function arraySignals(value){return Array.isArray(value)?value:[]}
 return Object.freeze({VERSION,DOMAINS,EXPERTISE,build,classify,isAvailable,summarizeLegacy});
});
