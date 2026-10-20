import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';import {execFileSync} from 'node:child_process';import {calculateBazi} from '../src/bazi/index.js';
const ctx={};vm.runInNewContext(await readFile('src/ui/reading-date-navigation.js','utf8'),ctx);const dates=ctx.KOYOMI_READING_DATES;
if(process.env.KOYOMI_DATE_NAV_TZ){console.log(JSON.stringify(['2024-02-28','2026-12-31','2026-03-08','2026-11-01'].map(d=>dates.shift(d,1))));process.exit(0);}
for(const [date,delta,expected] of [['2024-02-28',1,'2024-02-29'],['2024-02-29',1,'2024-03-01'],['2026-02-28',1,'2026-03-01'],['2026-12-31',1,'2027-01-01'],['2027-01-01',-1,'2026-12-31'],['0001-01-01',-1,null],['9999-12-31',1,null],['0099-12-31',1,'0100-01-01']])assert.equal(dates.shift(date,delta),expected);
for(const value of ['',null,'2026-02-29','2026-04-31','2026-13-01','0000-01-01','2026-1-01','2026-01-01T12:00:00'])assert.equal(dates.parse(value),null);
for(const [date,relative] of [['2026-10-19','昨日'],['2026-10-20','今日'],['2026-10-21','明日'],['2026-10-22','明後日'],['2026-10-23','']])assert.equal(dates.describe(date,'2026-10-20').relative,relative);
assert.equal(dates.describe('0099-01-02','0099-01-01').relative,'明日');
const raw='【今日の一歩】\n昨日の結果と今日を比べ、明日も続けられるか、今夜考える。';
assert.equal(dates.text(raw,'2026-10-20','2026-10-20'),raw);
assert.equal(dates.text(raw,'2026-10-21','2026-10-20'),'【明日の一歩】\n前日の結果と明日を比べ、翌日も続けられるか、明日の夜考える。');
for(const tz of ['Asia/Tokyo','America/Los_Angeles','Europe/Berlin'])assert.deepEqual(JSON.parse(execFileSync(process.execPath,['tests/reading-date-navigation.test.mjs'],{encoding:'utf8',env:{...process.env,TZ:tz,KOYOMI_DATE_NAV_TZ:'1'}})),['2024-02-29','2027-01-01','2026-03-09','2026-11-02']);
let release,calls=[],states=[],restored=0,current='2026-10-20';
const control=dates.createController({getDate:()=>current,now:()=> '2026-10-20',capture:()=>({id:'reading-tarot'}),restore:a=>{assert.equal(a.id,'reading-tarot');restored++;},onState:s=>states.push({...s}),generate:async date=>{calls.push(date);current=date;if(calls.length===1)await new Promise(resolve=>release=resolve);return true;}});
control.renderedAt(current);
const pending=control.step(1);await Promise.resolve();assert.equal(calls[0],'2026-10-21');
control.step(1);control.step(1);assert.equal(control.state().date,'2026-10-23');release();assert.equal(await pending,true);
assert.deepEqual(calls,['2026-10-21','2026-10-23']);assert.deepEqual(states.filter(s=>s.phase==='ready').map(s=>s.rendered),['2026-10-20','2026-10-23']);assert.equal(restored,1);
await control.today();assert.equal(control.state().rendered,'2026-10-20');assert.equal(await control.request('2026-02-30'),false);assert.equal(control.state().rendered,'2026-10-20');
let succeed=false;const failing=dates.createController({getDate:()=> '2026-01-01',generate:async()=>succeed});
assert.equal(await failing.step(1),false);assert.equal(failing.state().phase,'error');succeed=true;assert.equal(await failing.retry(),true);assert.equal(failing.state().rendered,'2026-01-02');
const profile={displayName:'Date fixture',gender:'male',birthData:{date:'1990-06-15',time:'08:20',place:{longitude:135,latitude:35,utcOffset:9,timezone:'Asia/Tokyo'}}};
const a=calculateBazi(profile,{}, {referenceDate:new Date('2026-06-01T12:00:00+09:00')}),b=calculateBazi(profile,{}, {referenceDate:new Date('2027-06-01T12:00:00+09:00')});
assert.deepEqual(a.chart,b.chart,'the natal chart must not change with the reading date');assert.notEqual(a.luckCycles.annual[0].label,b.luckCycles.annual[0].label);
const app=await readFile('app.html','utf8'),worker=await readFile('service-worker.js','utf8');
for(const file of ['src/ui/reading-date-navigation.js','src/ui/reading-date-navigation.css']){assert.ok(app.includes(file));assert.ok(worker.includes(file));}
assert.ok(app.includes('personalResult.readingDate=dateKey'));assert.ok(app.includes('KOYOMI_PERSONAL_DATE_NAV?.rendered(dateKey)'));assert.ok(app.includes('luck=calcLuck(p,i.birthDate,selectedDate)'));
console.log('Reading date navigation: strict civil dates, DST, boundaries, latest request, retry, date wording, natal invariance and reference-year calculation passed');

assert.ok(app.includes("selectedDate=startOfDay(window.KOYOMI_READING_DATES.parse(date))"),"date navigation must use the same midnight as home/calendar to preserve daily scores");
