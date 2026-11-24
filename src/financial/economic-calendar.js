import {formatJapaneseDate} from '../shared/japanese-date-display.js';
export const CALENDAR_URL=new URL('../../data/financial/economic-calendar.json',import.meta.url);
export const CALENDAR_SOURCES=Object.freeze({
  estat:{name:'e-Stat（政府統計の総合窓口）',country:'JP',url:'https://www.e-stat.go.jp/release-calendar'},
  bea:{name:'米国経済分析局（BEA）',country:'US',url:'https://www.bea.gov/news/schedule'}
});
const DAY=86400000;
export function validDay(day){
  if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
  const date=new Date(day+'T00:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===day;
}
export function japanDateTime(utc){
  const d=new Date(Date.parse(utc)+9*3600000);
  if(!Number.isFinite(d.getTime()))throw new Error('発表日時が不正です。');
  return {date:d.toISOString().slice(0,10),time:d.toISOString().slice(11,16)};
}
export function validateCalendar(data){
  if(data?.schemaVersion!==1||!Array.isArray(data.events)||data.events.length>5000||
    !Number.isFinite(Date.parse(data.generatedAt))||!Array.isArray(data.sources))throw new Error('経済カレンダーの形式が不正です。');
  const ids=new Set();
  for(const source of data.sources){
    if(!CALENDAR_SOURCES[source.id]||!Number.isFinite(Date.parse(source.checkedAt))||
      !['ok','error'].includes(source.status))throw new Error('出典情報が不正です。');
  }
  if(data.sources.length!==2||new Set(data.sources.map(s=>s.id)).size!==2)throw new Error('出典が不足しています。');
  for(const e of data.events){
    const source=CALENDAR_SOURCES[e.source];
    if(!source||e.country!==source.country||typeof e.id!=='string'||ids.has(e.id)||
      typeof e.title!=='string'||!e.title.trim()||e.title.length>600||!validDay(e.date)||
      !(e.time===null||typeof e.time==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time))||
      typeof e.url!=='string'||!e.url.startsWith(source.url))throw new Error('経済指標データが不正です。');
    const link=new URL(e.url),official=new URL(source.url);
    if(link.origin!==official.origin||link.username||link.password)throw new Error('出典URLが不正です。');
    ids.add(e.id);
  }
  return data;
}
export function calendarWindow(data,{start,country='all',days=30}={}){
  validateCalendar(data);
  if(!validDay(start)||![7,30,90].includes(days)||!['all','JP','US'].includes(country))throw new Error('表示期間を確認してください。');
  const end=new Date(Date.parse(start+'T00:00:00Z')+(days-1)*DAY).toISOString().slice(0,10);
  return {start,end,events:data.events.filter(e=>e.date>=start&&e.date<=end&&(country==='all'||e.country===country))
    .sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99')||a.title.localeCompare(b.title))};
}
export function calendarFreshness(data,now=new Date()){
  const age=now-Date.parse(data.generatedAt);
  return age>3*DAY||age< -300000||data.sources.some(s=>s.status!=='ok'||now-Date.parse(s.checkedAt)>3*DAY);
}
export function eventDateLabel(e){return formatJapaneseDate(e.date)+' '+(e.time===null?'時刻未定':e.time+' JST');}
