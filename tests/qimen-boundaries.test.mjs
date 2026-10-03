import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const app = readFileSync('app.html', 'utf8'), lines = app.split(/\r?\n/);
const context = vm.createContext({ window: {}, DAY:86400000 });
vm.runInContext(readFileSync('src/shared/qimen-time-core.js','utf8'), context);
const names = ['qmdjMod','qmdjSignedAngle','qmdjTermStart','qmdjDun','qmdjYuan'];
const definitions = names.map(name => lines.find(line => line.startsWith('function ' + name + '(')));
assert.ok(definitions.every(Boolean));
vm.runInContext(lines.find(line => line.startsWith('const TERM_NAMES=')) + '\n' + definitions.join('\n') +
  '\nthis.api={qmdjTermStart,qmdjDun,qmdjYuan};',context);
const { api } = context, time = context.window.KOYOMI_QIMEN_TIME_CORE;
const anchor = Date.parse('2026-01-01T00:00:00Z'), DAY=86400000;
// Synthetic linear longitude with an independently specified crossing instant.
// This checks the selector/root-search boundary behavior, not ephemeris accuracy.
for (const [angle, previous, current, beforeDun, afterDun] of [
  [0,'啓蟄','春分','陽遁','陽遁'], [90,'芒種','夏至','陽遁','陰遁'],
  [180,'白露','秋分','陰遁','陰遁'], [270,'大雪','冬至','陰遁','陽遁']
]) {
  context.solarLongitude = d => ((angle + (d.getTime()-anchor)/DAY) % 360 + 360) % 360;
  const before = api.qmdjTermStart(new Date(anchor-1000));
  const exact = api.qmdjTermStart(new Date(anchor));
  const after = api.qmdjTermStart(new Date(anchor+1000));
  assert.equal(before.name,previous);
  assert.equal(exact.name,current);
  assert.equal(after.name,current);
  assert.ok(Math.abs(exact.start.getTime()-anchor)<=2,'crossing instant');
  assert.ok(Math.abs(after.start.getTime()-anchor)<=2,'root must remain stable after crossing');
  assert.equal(api.qmdjDun(before.name),beforeDun);
  assert.equal(api.qmdjDun(after.name),afterDun);
}
const term={start:new Date(anchor)};
for (const [elapsed,yuan] of [[0,0],[5*DAY-1,0],[5*DAY,1],[10*DAY-1,1],[10*DAY,2]]) {
  assert.equal(api.qmdjYuan(new Date(anchor+elapsed),term,'fixed',23,9).yuan,yuan,'fixed yuan threshold');
}
const stems='甲乙丙丁戊己庚辛壬癸'.split(''),branches='子丑寅卯辰巳午未申酉戌亥'.split('');
for (const tz of [-12,-5,0,5.75,9,14]) {
  const at = value => time.parseInput(value,tz);
  const late=at('2026-12-31T23:00'), earlier=at('2026-12-31T22:59'), midnight=at('2027-01-01T00:00');
  const hp=(d,b)=>time.hourPillar(d,b,tz,stems,branches);
  assert.equal(hp(earlier,23).branch,'亥');
  assert.equal(hp(late,23).branch,'子');
  assert.equal(hp(late,23).dayPillar.text,hp(midnight,23).dayPillar.text);
  assert.equal((hp(late,23).dayPillar.index-hp(earlier,23).dayPillar.index+60)%60,1);
  assert.equal(hp(late,0).dayPillar.text,hp(earlier,0).dayPillar.text);
  assert.equal((hp(midnight,0).dayPillar.index-hp(late,0).dayPillar.index+60)%60,1);
  // Longitude correction applied once, including crossing the year/day boundary.
  const raw=at('2026-12-31T23:50'), lon=tz*15+5;
  if(lon<=180 && lon>=-180){
    const local=time.adjustedTime(raw,lon,tz,'local');
    assert.equal(local.correction,20);
    assert.equal(time.inputValue(local.date,tz),'2027-01-01T00:10');
    assert.equal(local.date.getTime()-raw.getTime(),20*60000);
  }
  const solar=time.adjustedTime(at('2026-12-31T23:50'),0,tz,'solar');
  assert.ok(Math.abs((solar.date-at('2026-12-31T23:50'))/60000-solar.localMinutes-solar.eot)<1/60000);
}
console.log('Qimen boundaries passed: 4 synthetic seasonal crossings, fixed-yuan 5/10-day thresholds, 23/0-hour boundaries and corrected year rollover across 6 offsets.');
