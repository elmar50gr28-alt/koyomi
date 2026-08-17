(function(root){
'use strict';
const signs=['牡羊座','牡牛座','双子座','蟹座','獅子座','乙女座','天秤座','蠍座','射手座','山羊座','水瓶座','魚座'];
const mod=(n,m=360)=>((Number(n)||0)%m+m)%m;
const signOf=lon=>signs[Math.floor(mod(lon)/30)];
const degreeOf=lon=>mod(lon,30);
const aspectDefs=[['合',0,8],['セクスタイル',60,5],['スクエア',90,7],['トライン',120,7],['オポジション',180,8]];
function aspects(placements){const entries=Object.entries(placements||{}),out=[];for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){const diff=Math.abs(mod(entries[i][1].lon-entries[j][1].lon+180)-180);for(const [name,angle,orb] of aspectDefs){const delta=Math.abs(diff-angle);if(delta<=orb){out.push({a:entries[i][0],b:entries[j][0],name,angle,orb:delta});break}}}return out.sort((a,b)=>a.orb-b.orb)}
function build(input={}){const raw=input.placements||input.planets||{},placements={};Object.entries(raw).forEach(([name,value])=>{const lon=typeof value==='number'?value:value?.lon;if(Number.isFinite(lon))placements[name]={...(typeof value==='object'?value:{}),lon:mod(lon),sign:signOf(lon),degree:degreeOf(lon)}});return{schemaVersion:'western-120-v1',input:input.input||{},calculationMeta:{engine:input.engine||'koyomi-offline',offlineCapable:true,offlineLevel:'B',birthTimeKnown:input.birthTimeKnown!==false,generatedAt:new Date().toISOString()},natal:{placements,angles:input.angles||{},cusps:input.cusps||[],aspects:input.aspects||aspects(placements)}}}
root.WesternCoreV1={build,aspects,mod,signOf,degreeOf,signs};
})(globalThis);
