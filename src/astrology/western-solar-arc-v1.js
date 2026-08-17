(function(root){
'use strict';
function build(core,input={}){const natal=core?.natal?.placements||{},progressed=input.progressions?.placements||{},sun=natal.太陽?.lon,psun=progressed.太陽?.lon;if(!Number.isFinite(sun)||!Number.isFinite(psun))return{available:false,placements:{},aspects:[]};const arc=root.WesternCoreV1.mod(psun-sun),placements={};Object.entries(natal).forEach(([k,v])=>placements[k]={...v,lon:root.WesternCoreV1.mod(v.lon+arc),sign:root.WesternCoreV1.signOf(v.lon+arc),degree:root.WesternCoreV1.degreeOf(v.lon+arc)});const directed=Object.fromEntries(Object.entries(placements).map(([k,v])=>[`SA${k}`,v]));return{available:true,arc,placements,aspects:root.WesternCoreV1.aspects({...natal,...directed}).filter(x=>x.a.startsWith('SA')!==x.b.startsWith('SA'))}}
root.WesternSolarArcV1={build};
})(globalThis);
