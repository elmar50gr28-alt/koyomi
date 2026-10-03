import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const cases = [
  ['2026-07-13T20:30', 9, 139.7671], ['2026-12-31T23:30', 9, 139.7671],
  ['2027-01-01T00:30', 0, 0], ['2026-03-08T02:30', -5, -74],
  ['2026-11-01T01:30', -5, -74], ['2026-06-21T00:05', 5.75, 85.32],
  ['2026-01-01T00:05', 14, 179], ['2026-12-31T23:55', -12, -179]
];
function engine() {
  const app = readFileSync('app.html', 'utf8'), lines = app.split(/\r?\n/);
  const context = vm.createContext({ window: {}, console });
  vm.runInContext(readFileSync('src/shared/qimen-time-core.js', 'utf8'), context);
  const selected = ['const DAY=', 'const STEMS=', 'const STEM_ELEMENT=', 'const BRANCH_ELEMENT=', 'const TERM_NAMES=']
    .map(prefix => lines.find(line => line.startsWith(prefix)));
  const funcs = ['solarLongitude', 'yearPillar', 'monthPillar', 'qmdjLocalInputValue', 'qmdjHistoryKey', 'qmdjSaveCurrent'].map(name => lines.find(line => line.startsWith('function ' + name + '(')));
  const core = app.slice(app.indexOf("const QMDJ_VERSION="), app.indexOf('function qmdjGenerateReading('));
  vm.runInContext(selected.join('\n') + '\nfunction mod(n,m){return((n%m)+m)%m}function jd(d){return d.getTime()/DAY+2440587.5}function fmtIso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}\n' +
    funcs.join('\n') + '\n' + core + '\nthis.api={qmdjChart,qmdjTimeSlots,qmdjInputDate,qmdjLocalInputValue,qmdjHistoryKey,qmdjSaveCurrent,QMDJ_PURPOSE_GROUPS};', context);
  return context;
}
if (process.argv.includes('--worker')) {
  const context = engine(), api = context.api, time = context.window.KOYOMI_QIMEN_TIME_CORE;
  const rows = [];
  for (const [value, tz, lon] of cases) {
    context.$ = id => ({ value: id === 'qmTimezone' ? String(tz) : value });
    const date = api.qmdjInputDate();
    const expected = new Date(value + ':00Z').getTime() - tz * 3600000;
    assert.equal(date.getTime(), expected, value + ': UTC instant');
    assert.equal(api.qmdjLocalInputValue(date), value);
    for (const basis of ['standard', 'local', 'solar']) for (const boundary of [0,23]) for (const school of ['chaibu','fixed']) {
      const input = { date, tz, lon, basis, boundary, school, purpose: { key:'contract', ...api.QMDJ_PURPOSE_GROUPS.contract } };
      const chart = api.qmdjChart(input), slots = api.qmdjTimeSlots(input);
      assert.equal(slots.length, 12);
      assert.equal(slots[0].start.getHours(), 23);
      assert.ok(slots.every(s => s.end - s.start === 7200000));
      slots.forEach((slot, i) => {
        const wall = new Date(value + ':00Z');
        wall.setUTCHours(23 + i * 2, 0, 0, 0);
        assert.equal(slot.start.getTime(), wall.getTime() - tz * 3600000, 'slot day and instant');
      });
      assert.equal(time.inputValue(chart.raw, tz), value);
      rows.push({ value, tz, basis, boundary, school, digest: createHash('sha256').update(JSON.stringify({chart,slots})).digest('hex') });
    }
  }
  assert.throws(() => time.parseInput('2026-02-30T12:00', 9), /日時/);
  assert.throws(() => time.parseInput('bad', 9), /日時/);
  assert.throws(() => time.parseInput('2026-01-01T00:00', 15), /UTC/);
  assert.equal(time.parseInput('', 0, new Date('2026-01-01T01:00:00Z')).getHours(), 1);
  assert.equal(time.inputValue(new Date('2026-01-01T01:00:00Z'), 5.75), '2026-01-01T06:45', 'now in selected offset');
  context.$ = id => ({ value: id === 'qmTimezone' ? '' : '2026-07-13T20:30' });
  assert.equal(api.qmdjInputDate().toISOString(), '2026-07-13T11:30:00.000Z', 'blank offset uses default UTC+9 consistently');
  const existing = { id:'legacy', key:'legacy-key', date:'2026-07-01 12:00', futureField:{ keep:true } };
  let saved;
  context.storageJson = () => [existing];
  context.storageSet = (kind, key, value) => { saved = JSON.parse(value); };
  context.qmdjRenderHistory = () => {};
  context.toast = () => {};
  const input = { date:time.parseInput('2026-07-13T20:30',9), tz:9, lat:35.6812, lon:139.7671, basis:'standard', boundary:23, school:'chaibu',
    location:'Tokyo', question:'test', purpose:{key:'contract',label:'contract',...api.QMDJ_PURPOSE_GROUPS.contract} };
  const chart = api.qmdjChart(input);
  context.savedState = { input, chart, ev:{rank:{label:'test'},overall:50,best:{dir:'北'},scored:chart.palaces},text:{bestRange:'23:00〜01:00',reading:'test'} };
  vm.runInContext('QMDJ_LAST=this.savedState;', context);
  api.qmdjSaveCurrent();
  assert.deepEqual(saved[1], existing, 'legacy and unknown history fields preserved');
  assert.equal(saved[0].date, '2026-07-13 20:30', 'saved wall clock');
  assert.notEqual(api.qmdjHistoryKey(input), api.qmdjHistoryKey({...input,tz:0}), 'offsets must not share a history key');
  // Independent wall-clock boundary checks; retain the existing 0/23 policy.
  const stems = '甲乙丙丁戊己庚辛壬癸'.split(''), branches = '子丑寅卯辰巳午未申酉戌亥'.split('');
  const late = time.parseInput('2026-12-31T23:30', 9), early = time.parseInput('2027-01-01T00:30', 9);
  assert.equal(time.hourPillar(late,23,9,stems,branches).branch, '子');
  assert.equal(time.hourPillar(late,23,9,stems,branches).dayPillar.text, time.hourPillar(early,23,9,stems,branches).dayPillar.text);
  assert.notEqual(time.hourPillar(late,0,9,stems,branches).dayPillar.text, time.hourPillar(early,0,9,stems,branches).dayPillar.text);
  process.stdout.write(JSON.stringify(rows));
} else {
  const app = readFileSync('app.html', 'utf8'), sw = readFileSync('service-worker.js', 'utf8');
  assert.ok(app.includes('<script src="./src/shared/qimen-time-core.js"></script>'));
  assert.ok(sw.includes("'./src/shared/qimen-time-core.js'"), 'time module cached for offline use');
  let baseline;
  for (const TZ of ['Asia/Tokyo','UTC','America/New_York','Pacific/Auckland']) {
    const run = spawnSync(process.execPath, [process.argv[1], '--worker'], { env: { ...process.env, TZ }, encoding:'utf8', maxBuffer: 20 * 1024 * 1024 });
    assert.equal(run.status, 0, run.stderr);
    const rows = JSON.parse(run.stdout);
    if (baseline) assert.deepEqual(rows, baseline, 'full charts and time slots must not depend on host timezone: ' + TZ);
    else baseline = rows;
  }
  console.log('Qimen timezone regression passed: 4 hosts, 8 inputs, 3 bases, 2 boundaries, 2 schools, full charts and 12 time slots.');
}
