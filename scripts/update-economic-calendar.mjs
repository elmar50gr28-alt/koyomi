import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {CALENDAR_SOURCES,validateCalendar,japanDateTime,validDay} from '../src/financial/economic-calendar.js';
const OUTPUT=resolve('data/financial/economic-calendar.json');
export const BEA_ICS='https://www.bea.gov/news/schedule/ics/online-calendar-subscription.ics';
const text=value=>value.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const unescapeICS=value=>value.replace(/\\([nN,;\\])/g,(_,c)=>c.toLowerCase()==='n'?' ':c).trim();
export function parseBEA(ics){
  if(!ics.includes('BEGIN:VCALENDAR')||!ics.includes('END:VCALENDAR'))throw new Error('BEAカレンダーを取得できません。');
  const unfolded=ics.replace(/\r?\n[ \t]/g,'');
  const events=[];
  for(const match of unfolded.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)){
    const lines=match[1].split(/\r?\n/),field=name=>lines.find(l=>l.split(/[;:]/)[0]===name)?.replace(/^[^:]*:/,'');
    if(field('STATUS')==='CANCELLED')continue;
    const raw=field('DTSTART'),title=field('SUMMARY'),uid=field('UID');
    // Official BEA feed publishes UTC instants; never guess floating times.
    if(!raw||!/^\d{8}T\d{6}Z$/.test(raw)||!title||!uid)throw new Error('BEA発表日時の形式が変わりました。');
    const utc=raw.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,'$1-$2-$3T$4:$5:$6Z');
    if(!validDay(utc.slice(0,10))||!Number.isFinite(Date.parse(utc)))throw new Error('BEA日付が不正です。');
    const {date,time}=japanDateTime(utc);
    events.push({id:'bea-'+uid,source:'bea',country:'US',title:unescapeICS(title),date,time,url:CALENDAR_SOURCES.bea.url});
  }
  if(!events.length)throw new Error('BEAの日程がありません。');
  return events;
}
const PRINCIPAL=/消費者物価|小売物価|労働力調査|毎月勤労|家計調査|鉱工業|商業動態|国内総生産|四半期別ＧＤＰ|四半期別GDP|景気動向|機械受注|貿易統計|国際収支|法人企業|サービス産業動態|第３次産業活動|第3次産業活動/;
export function parseEstat(html){
  const events=[];let rows=0;
  for(const match of html.matchAll(/<li class="stat-list-row">([\s\S]*?)<\/li>/g)){
    rows++;
    const row=match[1],when=text(row.match(/class="stat-announce-keisaiday"[^>]*>([\s\S]*?)<\/span>/)?.[1]||'');
    const link=row.match(/<a[^>]*href="([^"<>]+)"[^>]*>([\s\S]*?)<\/a>/);
    if(!link)throw new Error('e-Statの形式が変わりました。');
    const title=text(link[2]);if(!PRINCIPAL.test(title))continue;
    // Month-only and approximate dates are not exact release days.
    if(/^\d{4}-\d{2}(?:月末|月上旬|月中旬|月下旬)?(?: \d{2}:\d{2})?$/.test(when))continue;
    if(!/^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?$/.test(when))throw new Error('e-Statの日時形式が変わりました。');
    const date=when.slice(0,10),time=when.slice(11),url=new URL(link[1],'https://www.e-stat.go.jp/').href;
    events.push({id:'estat-'+url+'-'+title,source:'estat',country:'JP',title,date,time:!time||time==='00:00'?null:time,url});
  }
  if(!rows&&!html.includes('該当する公表予定はありません'))throw new Error('e-Statの公表予定を確認できません。');
  return events;
}
async function getText(fetcher,url){
  const response=await fetcher(url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'koyomi-economic-calendar/1.0'}});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const result=await response.text();if(result.length>6000000)throw new Error('カレンダーのサイズが過大です。');return result;
}
export async function buildCalendar({fetcher=fetch,now=new Date(),previous=null}={}){
  const stamp=now.toISOString(),today=japanDateTime(stamp).date,events=[],sources=[];
  for(const id of Object.keys(CALENDAR_SOURCES)){
    try{
      let next;
      if(id==='bea')next=parseBEA(await getText(fetcher,BEA_ICS));
      else{
        next=[];
        // Four calendar months cover the 90-day display window, including year rollover.
        for(let offset=0;offset<4;offset++){
          const month=new Date(Date.UTC(Number(today.slice(0,4)),Number(today.slice(5,7))-1+offset,1));
          const value=month.toISOString().slice(0,7).replace('-','');
          next.push(...parseEstat(await getText(fetcher,CALENDAR_SOURCES.estat.url+'?page_month='+value)));
        }
      }
      events.push(...next.filter(e=>e.date>=today));sources.push({id,status:'ok',checkedAt:stamp});
    }catch(error){
      console.error(id+': '+error.message);
      const old=previous?.sources.find(s=>s.id===id);
      if(!old)throw new Error(id+'の初回取得に失敗しました。');
      events.push(...previous.events.filter(e=>e.source===id));
      sources.push({id,status:'error',checkedAt:old.checkedAt});
    }
  }
  return validateCalendar({schemaVersion:1,generatedAt:stamp,sources,
    events:[...new Map(events.map(e=>[e.id,e])).values()].sort((a,b)=>a.date.localeCompare(b.date))});
}
export async function updateCalendar(options={}){
  let previous=null;try{previous=validateCalendar(JSON.parse(await readFile(OUTPUT,'utf8')));}catch{}
  const data=await buildCalendar({...options,previous});
  await mkdir(dirname(OUTPUT),{recursive:true});
  await writeFile(OUTPUT+'.tmp',JSON.stringify(data,null,2)+'\n','utf8');await rename(OUTPUT+'.tmp',OUTPUT);
  console.log('Economic calendar: '+data.events.length+' events; '+data.sources.map(s=>s.id+'='+s.status).join(', '));
  return data;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await updateCalendar();
