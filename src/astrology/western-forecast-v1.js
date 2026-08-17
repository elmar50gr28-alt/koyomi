(function(root){
'use strict';
function build(core,input={}){if(typeof input.ephemeris!=='function')return{available:false,periods:[]};const start=new Date(input.targetDate||Date.now()),periods=[];for(let month=0;month<36;month++){const date=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+month,15)),hits=root.WesternTransitsV1.scan(core?.natal?.placements,input.ephemeris,date,2),score=hits.reduce((n,x)=>n+(x.name==='スクエア'||x.name==='オポジション'?-1:1)*(x.importance||50),0),strength=hits.reduce((n,x)=>n+(x.importance||0),0);if(hits.length)periods.push({month:date.toISOString().slice(0,7),score,strength,kind:score>30?'活用期':score<-30?'調整期':'転換期',sources:hits.slice(0,4).map(x=>`${x.tp}→${x.np} ${x.name}`)})}periods.sort((a,b)=>b.strength-a.strength);return{available:true,rangeMonths:36,periods:periods.slice(0,12)}}
root.WesternForecastV1={build};
})(globalThis);
