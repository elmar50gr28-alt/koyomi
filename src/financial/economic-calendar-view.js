import {CALENDAR_URL,CALENDAR_SOURCES,validateCalendar,calendarWindow,calendarFreshness,eventDateLabel,japanDateTime} from './economic-calendar.js';
import {formatJapaneseDate} from '../shared/japanese-date-display.js';
const KEY='koyomi-economic-calendar-v1';
function readSaved(store){try{return validateCalendar(JSON.parse(store?.getItem(KEY)||'null'));}catch{return null;}}
export async function loadCalendar({fetcher=fetch,store}={}){
  const previous=readSaved(store);
  try{
    const response=await fetcher(CALENDAR_URL,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=validateCalendar(await response.json());
    // An older deployed/cached response must not replace a newer saved snapshot.
    if(previous&&Date.parse(previous.generatedAt)>Date.parse(data.generatedAt))return {data:previous,saved:true};
    try{store?.setItem(KEY,JSON.stringify(data));}catch{}
    return {data,saved:false};
  }catch(error){if(previous)return {data:previous,saved:true};throw error;}
}
const japaneseTitle=title=>/^(Gross Domestic Product|GDP)/.test(title)?'米国 国内総生産（GDP）':
  /^Personal Income and Outlays/.test(title)?'米国 個人所得・個人消費支出（PCE関連）':
  /^U.S. International Trade/.test(title)?'米国 貿易収支':null;
export function setupEconomicCalendar({document,fetcher=fetch,store,now=()=>new Date()}={}){
  const get=id=>document.getElementById(id);
  const make=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
  let data=null,saved=false,limit=30,busy=false;
  function render(){
    const list=get('economicCalendarList');list.replaceChildren();get('economicCalendarMore').hidden=true;
    if(!data)return;
    try{
      const view=calendarWindow(data,{start:get('stockDate').value,country:get('economicCalendarCountry').value,
        days:Number(get('economicCalendarDays').value)});
      get('economicCalendarRange').textContent=formatJapaneseDate(view.start)+'〜'+formatJapaneseDate(view.end)+'（日本時間）';
      const stale=calendarFreshness(data,now());
      get('economicCalendarStatus').textContent=(saved?'保存済みデータ。':'取得済みデータ。')+
        (stale?'更新が古い、または一部の出典の取得に失敗しています。公式予定を確認してください。':'予定は変更されることがあります。')+
        ' データ作成：'+eventDateLabel({...japanDateTime(data.generatedAt)})+' ／ '+view.events.length+'件';
      get('economicCalendarStatus').dataset.stale=String(stale);
      get('economicCalendarCoverage').textContent=data.sources.map(s=>{
        const dates=data.events.filter(e=>e.source===s.id).map(e=>e.date).sort();
        return CALENDAR_SOURCES[s.id].name+'：収録日程 '+(dates.length?dates[0]+'〜'+dates.at(-1):'該当なし')+
          ' ／ 確認 '+eventDateLabel({...japanDateTime(s.checkedAt)})+(s.status==='error'?'（再取得失敗・以前の予定を保持）':'');
      }).join('。');
      for(const event of view.events.slice(0,limit)){
        const row=make('li','','economic-event');
        row.append(make('p',(event.country==='JP'?'日本':'米国')+' · '+eventDateLabel(event),'economic-event-date'));
        const title=japaneseTitle(event.title);
        row.append(make('strong',title||event.title));
        if(title)row.append(make('p',event.title,'subnote'));
        const passed=event.time!==null&&Date.parse(event.date+'T'+event.time+':00+09:00')<=now().getTime();
        row.append(make('p',passed?'予定時刻経過（発表済み・結果値は未確認）':'発表予定','subnote'));
        const link=make('a',CALENDAR_SOURCES[event.source].name+'で詳細・結果を確認');
        link.href=event.url;link.target='_blank';link.rel='noopener noreferrer';row.append(link);list.append(row);
      }
      if(!view.events.length)list.append(make('li','この期間・国の発表予定は収録されていません。予定がないことを保証するものではありません。公式カレンダーも確認してください。','subnote'));
      get('economicCalendarMore').hidden=view.events.length<=limit;
    }catch{
      get('economicCalendarRange').textContent='';get('economicCalendarStatus').textContent='有効な鑑定基準日を入力してください。';
    }
  }
  async function refresh(){
    if(busy)return;busy=true;get('economicCalendarRefresh').disabled=true;
    get('economicCalendarStatus').textContent='経済カレンダーを読み込んでいます。';
    try{({data,saved}=await loadCalendar({fetcher,store}));render();}
    catch{get('economicCalendarStatus').textContent='経済カレンダーを取得できません。公式カレンダーのリンクをご利用ください。';}
    finally{busy=false;get('economicCalendarRefresh').disabled=false;}
  }
  for(const id of ['economicCalendarCountry','economicCalendarDays'])get(id).addEventListener('change',()=>{limit=30;render();});
  get('economicCalendarMore').addEventListener('click',()=>{limit+=30;render();});
  get('economicCalendarRefresh').addEventListener('click',refresh);
  void refresh();
  return {render};
}
