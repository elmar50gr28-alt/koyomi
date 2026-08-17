(function(root){
'use strict';
const stars=[['Regulus',150.09],['Spica',204.17],['Arcturus',204.25],['Algol',56.16],['Aldebaran',69.79],['Antares',249.77],['Sirius',104.08],['Fomalhaut',333.86]];
function build(core,input={}){const year=new Date(input.birthMoment||Date.now()).getUTCFullYear(),precession=(year-2000)*50.29/3600,items=[];for(const [name,j2000] of stars){const lon=root.WesternCoreV1.mod(j2000+precession);for(const [planet,p] of Object.entries(core?.natal?.placements||{})){const orb=Math.abs(root.WesternCoreV1.mod(p.lon-lon+180)-180);if(orb<=1)items.push({star:name,planet,lon,orb})}}return{available:true,epochYear:year,orb:1,items,note:'J2000黄経を歳差補正した主要恒星の合のみ'}}
root.WesternFixedStarsV1={build,stars};
})(globalThis);
