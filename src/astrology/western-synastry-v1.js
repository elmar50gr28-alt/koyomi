(function(root){
'use strict';
const defs=[['合',0,6],['セクスタイル',60,4],['スクエア',90,5],['トライン',120,5],['オポジション',180,6]];
function compare(a,b){const out=[];for(const [pa,av] of Object.entries(a||{}))for(const [pb,bv] of Object.entries(b||{})){const x=typeof av==='number'?av:av.lon,y=typeof bv==='number'?bv:bv.lon;if(!Number.isFinite(x)||!Number.isFinite(y))continue;const diff=Math.abs(root.WesternCoreV1.mod(x-y+180)-180);for(const [name,angle,limit] of defs){const orb=Math.abs(diff-angle);if(orb<=limit){out.push({a:pa,b:pb,name,orb,supportive:['合','セクスタイル','トライン'].includes(name)});break}}}return out.sort((x,y)=>x.orb-y.orb)}
function build(core,input={}){const partner=input.partnerPlacements||{},items=compare(core?.natal?.placements,partner),supportive=items.filter(x=>x.supportive).length,challenging=items.length-supportive;return{available:Object.keys(partner).length>0,items,score:Math.max(0,Math.min(100,50+supportive*4-challenging*3)),note:Object.keys(partner).length?'二人の天体間アスペクトを比較':'相手の出生情報を入力すると表示'}}
root.WesternSynastryV1={build,compare};
})(globalThis);
