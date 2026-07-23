(function(root){
'use strict';
const ELEMENT_JA={wood:'木',fire:'火',earth:'土',metal:'金',water:'水'};
const LAYER_GROUPS={
 basic:['solarTerms','branchRing','elementRing','elementEnergy','timeProgress'],
 expert:['solarTerms','sexagenaryGear','branchRing','stemRing','elementRing','yinYangRing','arms','elementEnergy','timeProgress'],
 flow:['solarTerms','branchRing','arms','elementEnergy','timeProgress','luckLayer'],
 all:['solarTerms','sexagenaryGear','branchRing','stemRing','elementRing','yinYangRing','arms','elementEnergy','timeProgress','luckLayer']
};
const ALL_GROUPS=[...new Set(Object.values(LAYER_GROUPS).flat())];
function array(v){return Array.isArray(v)?v:[]}
function kanji(v){return v?.kanji||v?.text||v?.label||v||''}
function pillarText(v){if(!v)return'';if(typeof v==='string')return v;return v.text||`${kanji(v.stem)}${kanji(v.branch)}`}
function hiddenText(p){return array(p?.branch?.hiddenStems||p?.hiddenStems).map(x=>kanji(x.stem||x)).filter(Boolean).join('・')}
function pillarPatch(p){if(!p)return null;return{stem:kanji(p.stem),branch:kanji(p.branch),element:ELEMENT_JA[p.stem?.element]||p.element||'',yinYang:p.stem?.yinYang==='yang'?'陽':p.stem?.yinYang==='yin'?'陰':p.yinYang||'',hidden:hiddenText(p)||p.hidden||'',relation:p.stem?.tenGod?.label||p.tenGod?.label||p.relation||'',strength:p.strength}}
function elementPatch(balance){const rows=array(balance),max=Math.max(1,...rows.map(x=>Number(x.value)||0)),out={};rows.forEach(x=>out[x.element]=Math.round((Number(x.value)||0)/max*100));return out}
function fromBaziResult(result,date){
 const integrated=result?.integratedReadingData||result?.mitsunomeInput?.structuredResult?.integratedReadingData;
 const chart=integrated?.basic?.chart||result?.chart?.pillars||{};
 const analysis=integrated?.analysis||{};
 const luck=integrated?.luck||result?.luckCycles||null;
 const patch={date:date||new Date().toISOString().slice(0,10),layerSource:'人物の本鑑定結果',luckCycles:luck};
 for(const role of ['year','month','day','hour']){const p=pillarPatch(chart[role]);if(p)patch[`${role}Pillar`]=p}
 const elements=elementPatch(analysis.elementBalance||result?.chart?.elementBalance);if(Object.keys(elements).length)patch.fiveElements=elements;
 const favorable=array(analysis.favorableElements||result?.favorableElements?.favorable).map(kanji).filter(Boolean);
 if(favorable.length)patch.favorableElements=favorable;
 return patch;
}
function period(source){if(!source)return null;const raw=source.period||source;return{pillar:pillarText(raw.pillar||raw),startAge:raw.startAge,endAge:raw.endAge,startDate:raw.startDate,endDate:raw.endDate,confidence:raw.confidence,favorableMatches:array(source.favorableMatches||raw.favorableMatches).map(x=>ELEMENT_JA[x]||kanji(x)),unfavorableMatches:array(source.unfavorableMatches||raw.unfavorableMatches).map(x=>ELEMENT_JA[x]||kanji(x))}}
function luckPeriods(data){const l=data?.luckCycles;if(!l)return[];const decades=array(l.decades||l.cycles);const reference=new Date(`${data.date||new Date().toISOString().slice(0,10)}T12:00:00`).getTime();const active=l.currentDecade||decades.find(x=>{const s=Date.parse(x.startDate),e=Date.parse(x.endDate);return Number.isFinite(s)&&Number.isFinite(e)&&reference>=s&&reference<=e})||decades[0];return[['大運',period(active)],['歳運',period(l.currentAnnual||array(l.annual)[0])],['月運',period(l.currentMonthly||array(l.monthly)[0])]].filter(([,p])=>p&&p.pillar)}
function facts(data,layer){
 if(layer==='basic')return[{label:'今日の干支',value:`${data.dayPillar?.stem||''}${data.dayPillar?.branch||''}`},{label:'節気',value:data.solarTerm||'--'},{label:'強い五行',value:data.strongElement||'--'}];
 if(layer==='expert')return['year','month','day','hour'].map((role,i)=>{const p=data[`${role}Pillar`]||{};return{label:['年柱','月柱','日柱','時柱'][i],value:`${p.stem||''}${p.branch||''}・${p.relation||'通変星未取得'}・蔵干 ${p.hidden||'未取得'}`}});
 if(layer==='flow'||layer==='all'){const periods=luckPeriods(data);return periods.length?periods.map(([label,p])=>({label,value:[p.pillar,p.startAge!=null?`${p.startAge}〜${p.endAge}歳`:'',p.favorableMatches.length?`追い風 ${p.favorableMatches.join('・')}`:'',p.unfavorableMatches.length?`注意 ${p.unfavorableMatches.join('・')}`:''].filter(Boolean).join('／')})):[{label:'運の層',value:'人物の本鑑定後に「今日の暦」を開くと表示されます'}]}
 return[];
}
 function build(data,layer){const implemented=['basic','expert','flow','all'].includes(layer);return{layer,implemented,groups:LAYER_GROUPS[layer]||[],facts:facts(data,layer),periods:luckPeriods(data),source:data?.layerSource||'今日の暦データ',message:implemented?'':layer==='qimen'?'奇門遁甲は方位・時刻データ仕様の確定後に接続します':'宿曜・星は対人・天文データ仕様の確定後に接続します'}}
 root.KOYOMI_TODAY_LAYER_RENDERER={ALL_GROUPS,LAYER_GROUPS,build,fromBaziResult,luckPeriods};
})(typeof window!=='undefined'?window:globalThis);
