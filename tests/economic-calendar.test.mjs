import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCalendar,calendarWindow,japanDateTime,calendarFreshness,eventDateLabel} from '../src/financial/economic-calendar.js';
import {parseBEA,parseEstat,buildCalendar} from '../scripts/update-economic-calendar.mjs';
import {loadCalendar,setupEconomicCalendar} from '../src/financial/economic-calendar-view.js';
const stamp='2026-11-24T00:00:00Z';
const ics=`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Personal Income and Outlays\\, October
 2026
DTSTART:20261125T133000Z
UID:test
END:VEVENT
BEGIN:VEVENT
SUMMARY:Cancelled
DTSTART:20261126T133000Z
UID:cancelled
STATUS:CANCELLED
END:VEVENT
END:VCALENDAR`;
const events=parseBEA(ics);
assert.equal(events.length,1);assert.equal(events[0].time,'22:30');assert.equal(events[0].title,'Personal Income and Outlays, October2026');
assert.equal(japanDateTime('2026-07-30T12:30:00Z').time,'21:30','US summer release in JST');
assert.deepEqual(japanDateTime('2026-12-31T18:00:00Z'),{date:'2027-01-01',time:'03:00'});
assert.throws(()=>parseBEA(ics.replace('20261125T133000Z','20261125T133000')),'floating timezone rejected');
const html=(date,title='消費者物価指数 全国')=>`<li class="stat-list-row"><span class="stat-announce-keisaiday">${date}</span><a href="./release-calendar/detail/00200573/202611270830">${title}</a></li>`;
const jp=parseEstat(html('2026-11-27 08:30'));
assert.equal(jp[0].time,'08:30');assert.equal(parseEstat(html('2026-11-27'))[0].time,null);
assert.equal(parseEstat(html('2026-11月末 08:30')).length,0,'approximate date is never converted into a definite date');
assert.equal(parseEstat(html('2026-11-27 08:30','無関係な統計')).length,0);
assert.throws(()=>parseEstat('<html>error</html>'));
const dataset=validateCalendar({schemaVersion:1,generatedAt:stamp,sources:[{id:'estat',status:'ok',checkedAt:stamp},{id:'bea',status:'ok',checkedAt:stamp}],events:[...events,...jp]});
assert.equal(calendarWindow(dataset,{start:'2026-11-24',days:7}).events.length,2);
assert.equal(calendarWindow(dataset,{start:'2026-11-24',country:'JP',days:7}).events.length,1);
assert.equal(calendarWindow(dataset,{start:'2026-11-26',days:7}).events.length,1);
assert.equal(calendarWindow(dataset,{start:'2026-12-31',days:90}).end,'2027-03-30');
assert.throws(()=>calendarWindow(dataset,{start:'2026-02-30',days:7}));
assert.equal(calendarFreshness(dataset,new Date('2026-11-25')),false);
assert.equal(calendarFreshness(dataset,new Date('2026-11-28')),true);
assert.match(eventDateLabel(jp[0]),/2026-11-27（令和8年11月27日） 08:30 JST/);
const bad=structuredClone(dataset);bad.events[0].url='https://www.bea.gov.evil.example/news/schedule';assert.throws(()=>validateCalendar(bad));
const duplicate=structuredClone(dataset);duplicate.events.push(duplicate.events[0]);assert.throws(()=>validateCalendar(duplicate));
const storage=new Map(),store={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
await loadCalendar({store,fetcher:async()=>({ok:true,json:async()=>dataset})});
const offline=await loadCalendar({store,fetcher:async()=>{throw new Error('offline');}});
assert.equal(offline.saved,true);assert.equal(offline.data.events.length,2);
const newer=structuredClone(dataset);newer.generatedAt='2026-11-25T00:00:00Z';store.setItem('koyomi-economic-calendar-v1',JSON.stringify(newer));
assert.equal((await loadCalendar({store,fetcher:async()=>({ok:true,json:async()=>dataset})})).saved,true);
await assert.rejects(loadCalendar({fetcher:async()=>{throw new Error('offline');}}));
const built=await buildCalendar({now:new Date(stamp),fetcher:async url=>({ok:true,text:async()=>String(url).includes('bea.gov')?ics:html('2026-11-27 08:30')})});
assert.equal(built.events.length,2,'duplicates across e-Stat pages removed');
const fallback=await buildCalendar({now:new Date(stamp),previous:dataset,fetcher:async()=>{throw new Error('offline');}});
assert.equal(fallback.events.length,2);assert.ok(fallback.sources.every(s=>s.status==='error'));
class Element{
 constructor(){this.value='';this.textContent='';this.children=[];this.dataset={};this.listeners={};}
 append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}
 addEventListener(type,fn){this.listeners[type]=fn;}
}
const ids=['stockDate','economicCalendarList','economicCalendarMore','economicCalendarRange','economicCalendarStatus','economicCalendarCoverage','economicCalendarCountry','economicCalendarDays','economicCalendarRefresh'];
const els=Object.fromEntries(ids.map(id=>[id,new Element()]));
els.stockDate.value='2026-11-24';els.economicCalendarCountry.value='all';els.economicCalendarDays.value='30';
const controller=setupEconomicCalendar({document:{getElementById:id=>els[id],createElement:()=>new Element()},store,
 fetcher:async()=>({ok:true,json:async()=>dataset}),now:()=>new Date(stamp)});
await new Promise(r=>setTimeout(r,0));
assert.equal(els.economicCalendarList.children.length,2);
assert.match(els.economicCalendarList.children[0].children[0].textContent,/22:30 JST/);
els.economicCalendarCountry.value='JP';els.economicCalendarCountry.listeners.change();assert.equal(els.economicCalendarList.children.length,1);
els.stockDate.value='2027-01-01';controller.render();assert.match(els.economicCalendarList.children[0].textContent,/収録されていません/);
els.stockDate.value='';controller.render();assert.match(els.economicCalendarStatus.textContent,/有効な鑑定基準日/);assert.equal(els.economicCalendarList.children.length,0);
const bundled=validateCalendar(JSON.parse(readFileSync(new URL('../data/financial/economic-calendar.json',import.meta.url),'utf8')));
assert.ok(bundled.events.some(e=>e.source==='bea')&&bundled.events.some(e=>e.source==='estat'));
const sw=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
for(const asset of ['src/financial/economic-calendar.js','src/financial/economic-calendar-view.js','data/financial/economic-calendar.json'])assert.ok(sw.includes("'./"+asset+"'"));
console.log('Economic calendar: official parsers, timezone/year boundaries, filters, stale data, offline fallback and UI passed');
