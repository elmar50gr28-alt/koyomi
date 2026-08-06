(function(root){
'use strict';
const has=(aspects,a,b,names)=>aspects.some(x=>((x.a===a&&x.b===b)||(x.a===b&&x.b===a))&&names.includes(x.name));
function triples(names){const out=[];for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++)for(let k=j+1;k<names.length;k++)out.push([names[i],names[j],names[k]]);return out}
function build(core){const p=core?.natal?.placements||{},aspects=core?.natal?.aspects||[],names=Object.keys(p),items=[];const bySign={};Object.entries(p).forEach(([name,x])=>(bySign[x.sign]??=[]).push(name));Object.entries(bySign).forEach(([sign,members])=>{if(members.length>=3)items.push({type:'ステリウム',sign,members})});for(const trio of triples(names)){const pairs=[[trio[0],trio[1]],[trio[0],trio[2]],[trio[1],trio[2]]];if(pairs.every(x=>has(aspects,...x,['トライン'])))items.push({type:'グランドトライン',members:trio});const opposition=pairs.find(x=>has(aspects,...x,['オポジション']));if(opposition){const apex=trio.find(x=>!opposition.includes(x));if(opposition.every(x=>has(aspects,apex,x,['スクエア'])))items.push({type:'Tスクエア',members:trio,apex})}}return{items,note:'主要アスペクトの成立条件を満たしたパターンのみ表示'}}
root.WesternPatternsV1={build};
})(globalThis);
