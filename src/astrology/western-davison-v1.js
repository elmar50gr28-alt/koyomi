(function(root){
'use strict';
function build(core,input={}){const a=input.birthMoment&&new Date(input.birthMoment),b=input.partnerMoment&&new Date(input.partnerMoment);if(!(a instanceof Date)||Number.isNaN(a.getTime())||!(b instanceof Date)||Number.isNaN(b.getTime())||typeof input.ephemeris!=='function')return{available:false,placements:{},confidence:'unavailable'};const moment=new Date((a.getTime()+b.getTime())/2),raw=input.ephemeris(moment)||{},placements={};Object.entries(raw).forEach(([k,lon])=>{if(Number.isFinite(lon))placements[k]={lon:root.WesternCoreV1.mod(lon),sign:root.WesternCoreV1.signOf(lon),degree:root.WesternCoreV1.degreeOf(lon)}});return{available:Object.keys(placements).length>0,moment:moment.toISOString(),placements,aspects:root.WesternCoreV1.aspects(placements),confidence:input.partnerTimeKnown?'standard':'limited'}}
root.WesternDavisonV1={build};
})(globalThis);
