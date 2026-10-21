(function(root,factory){root.KOYOMI_TRADITIONAL_CALENDAR=factory(()=>root.Astronomy)})(typeof globalThis!=='undefined'?globalThis:this,function(astronomy){
 'use strict';
 const VERSION='1.0.0',DAY=86400000,OFFSET=9*3600000,cache=new Map();
 const LODGES=['昴宿','畢宿','觜宿','参宿','井宿','鬼宿','柳宿','星宿','張宿','翼宿','軫宿','角宿','亢宿','氐宿','房宿','心宿','尾宿','箕宿','斗宿','女宿','虚宿','危宿','室宿','壁宿','奎宿','婁宿','胃宿'];
 const MONTH_STARTS=[22,24,26,1,3,5,8,11,13,15,18,20];
 const STARS=['一白水星','二黒土星','三碧木星','四緑木星','五黄土星','六白金星','七赤金星','八白土星','九紫火星'];
 const mod=(n,m)=>((n%m)+m)%m;
 const eventDay=date=>Math.floor((date.getTime()+OFFSET)/DAY);
 function civilDay(date){if(!date||!Number.isFinite(date.getTime()))throw new TypeError('valid civil date required');return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/DAY)}
 function dateString(day){return new Date(day*DAY).toISOString().slice(0,10)}
 function engine(){const a=astronomy();if(!a?.SearchMoonPhase||!a?.SearchSunLongitude||!a?.Seasons)throw new Error('local astronomy engine unavailable');return a}
 function checkedYear(y){if(y<1900||y>2200)throw new RangeError('supported civil years: 1900–2200')}
 function remember(key,make){if(!cache.has(key)){if(cache.size>=96)cache.delete(cache.keys().next().value);cache.set(key,make())}return cache.get(key)}
 function lunarCycle(year){return remember('moon-'+year,()=>{
  const a=engine(),winter=a.Seasons(year).dec_solstice.date,nextWinter=a.Seasons(year+1).dec_solstice.date;
  const start=eventDay(winter),end=eventDay(nextWinter),moons=[];
  let cursor=new Date(winter.getTime()-40*DAY);
  for(let i=0;i<16;i++){const moon=a.SearchMoonPhase(0,cursor,40);if(!moon)throw Error('new moon search failed');const day=eventDay(moon.date);moons.push(day);cursor=new Date(moon.date.getTime()+DAY);if(day>end+30)break}
  const first=moons.findIndex((day,i)=>day<=start&&moons[i+1]>start),last=moons.findIndex((day,i)=>day<=end&&moons[i+1]>end);
  if(first<0||![12,13].includes(last-first))throw Error('invalid lunisolar cycle');
  const starts=moons.slice(first,last+1),terms=[];
  for(let k=-2;k<=13;k++){const angle=mod(270+k*30,360),estimate=winter.getTime()+k*(365.2422/12)*DAY;const term=a.SearchSunLongitude(angle,new Date(estimate-10*DAY),25);if(!term)throw Error('solar term search failed');terms.push({angle,day:eventDay(term.date)})}
  let month=11,lunarYear=year,leapUsed=false;const rows=[];
  for(let i=0;i<starts.length-1;i++){
   const inMonth=terms.filter(t=>t.day>=starts[i]&&t.day<starts[i+1]);
   const leap=i>0&&starts.length===14&&!leapUsed&&!inMonth.length;
   if(i&&!leap){month=month%12+1;if(month===1)lunarYear++}if(leap)leapUsed=true;
   const quarterMismatch=inMonth.some(t=>({0:2,90:5,180:8,270:11})[t.angle]!=null&&({0:2,90:5,180:8,270:11})[t.angle]!==month);
   rows.push({start:starts[i],end:starts[i+1],year:lunarYear,month,leap,quarterMismatch,cycleYear:year});
  }
  // Winter-solstice priority is explicit; it does not claim to resolve every Tenpo rule.
  const calendarDifference=rows.some(r=>r.quarterMismatch);
  return rows.map(r=>({...r,calendarDifference}));
 })}
 function lunar(date){engine();const day=civilDay(date),year=date.getFullYear();checkedYear(year);const rows=[...lunarCycle(year-1),...lunarCycle(year)];const row=rows.find(r=>r.start<=day&&day<r.end);if(!row)throw Error('lunisolar month unavailable');const inheritedDifference=(row.month>=11||row.month<=2)&&lunarCycle(row.cycleYear-1).some(r=>r.quarterMismatch);return{year:row.year,month:row.month,day:day-row.start+1,leap:row.leap,monthStart:dateString(row.start),calendarDifference:row.calendarDifference||inheritedDifference,policy:'jst-winter-solstice-first',zone:'Asia/Tokyo'};}
 function sukuyo(date){const calendar=lunar(date),index=mod(MONTH_STARTS[calendar.month-1]+calendar.day-1,27);return{index,lodge:LODGES[index],calendar,version:VERSION,basis:`日本時間の旧暦${calendar.leap?'閏':''}${calendar.month}月${calendar.day}日・二十七宿表`,notes:[calendar.leap?'閏月は同名の本月と同じ起点を採用':'月初の宿から日数を配当',...(calendar.calendarDifference?['冬至優先の月配当。天保暦の二至二分条件と差が出る期間']:[])]}}
 function sexagenary(day){return mod(day+2440588+49,60)}
 function anchor(year,summer){const date=engine().Seasons(year)[summer?'jun_solstice':'dec_solstice'].date,day=eventDay(date),index=sexagenary(day);return{day:day+(index<=29?-index:60-index),direction:summer?-1:1,solstice:dateString(day)}}
 function kyusei(date){engine();const day=civilDay(date),year=date.getFullYear();checkedYear(year);const anchors=remember('nine-'+year,()=>[year-1,year,year+1].flatMap(y=>[anchor(y,false),anchor(y,true)]).sort((a,b)=>a.day-b.day));const i=anchors.findIndex((a,j)=>a.day<=day&&anchors[j+1]?.day>day);if(i<0)throw Error('nine-star interval unavailable');const left=anchors[i],right=anchors[i+1],length=right.day-left.day;if(![180,240].includes(length))throw Error('invalid nine-star interval');const offset=day-left.day;
  const reverse=length===240&&offset>=210;
  const number=reverse?mod((right.direction===1?1:9)-1+right.direction*(day-right.day),9)+1:mod((left.direction===1?1:9)-1+left.direction*offset,9)+1;
  return{number,label:STARS[number-1],direction:(reverse?right:left).direction===1?'陽遁':'陰遁',intercalary:length===240&&offset>=180,anchor:dateString(left.day),nextAnchor:dateString(right.day),policy:'nearest-kinoene-split-intercalation',version:VERSION,basis:'至近の甲子で転遁・240日間隔は後半60日を分割して置閏',notes:['日家九星の置閏には流派差があります']};
 }
 function relation(left,right){const distance=mod(right-left,27),role=distance===0?'命':distance===9?'業':distance===18?'胎':['','栄','衰','安','危','成','壊','友','親'][distance%9],group=({命:'命',業:'業胎',胎:'業胎',栄:'栄親',親:'栄親',衰:'友衰',友:'友衰',安:'安壊',壊:'安壊',危:'危成',成:'危成'})[role];return{distance,role,group}}
 return Object.freeze({VERSION,lunar,sukuyo,kyusei,relation,civilDay,sexagenary,LODGES,STARS});
});
