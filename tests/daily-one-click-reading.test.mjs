import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = {};
vm.runInNewContext(await readFile('src/reading/daily/daily-reading-core.js', 'utf8'), context);
vm.runInNewContext(await readFile('src/reading/daily/daily-reading-controller.js', 'utf8'), context);
const controller = context.KOYOMI_DAILY_READING;
const memory = new Map();
const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
const base = { profileId: 'person-1', settingsHash: 'profile-v1', dayKey: '甲子 整える日', dailyScore: 61, themeCategory: 'overall', evidence: ['日運61', '甲子'] };

const first = controller.getOrCreate({ ...base, date: '2026-08-01' }, { storage });
const second = controller.getOrCreate({ ...base, date: '2026-08-01' }, { storage });
assert.equal(first.source, 'generated');
assert.equal(second.source, 'cache');
assert.equal(JSON.stringify(second.reading), JSON.stringify(first.reading), 'same profile and date must remain stable');

const readings = [first.reading];
for (let day = 2; day <= 14; day++) {
  readings.push(controller.getOrCreate({ ...base, date: `2026-08-${String(day).padStart(2, '0')}`, dailyScore: 35 + day * 3, dayKey: `day-${day}` }, { storage }).reading);
}
assert.ok(new Set(readings.map(item => item.focusId)).size >= 8, '14 days should expose at least eight focuses');
for (let index = 1; index < readings.length; index++) assert.notEqual(readings[index].focusId, readings[index - 1].focusId, 'focus must not repeat on consecutive days');
assert.ok(readings.slice(1).every(item => item.difference.includes('昨日の中心')));
assert.ok(readings.every(item => item.action && item.caution && item.recommendedTime && item.evidence.length));

const changed = controller.getOrCreate({ ...base, date: '2026-08-01', settingsHash: 'profile-v2' }, { storage });
assert.equal(changed.source, 'generated', 'profile changes must invalidate the same-day cache');
assert.ok(controller.recent('person-1', { storage }).length <= 30);
assert.ok(![...memory.values()].join('').includes('profile-v1'), 'raw profile settings must not appear in cache keys');

const pastAfterFuture = controller.getOrCreate({ ...base, date: '2026-07-31' }, { storage }).reading;
assert.ok(!pastAfterFuture.difference.includes('昨日の中心'), 'a future history entry must not be described as yesterday');
console.log('daily one-click reading: ok');
