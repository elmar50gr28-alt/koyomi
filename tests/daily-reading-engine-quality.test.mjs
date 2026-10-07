import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = {};
vm.runInNewContext(await readFile('src/reading/daily/daily-reading-core.js', 'utf8'), context);
const core = context.KOYOMI_DAILY_READING_CORE;
const history = [];
const readings = [];
for (let day = 0; day < 90; day++) {
  const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
  const reading = core.generate({
    profileId: 'quality-profile', date, dayKey: `pillar-${day % 60}`,
    dailyScore: 30 + ((day * 17) % 61), themeCategory: ['overall', 'work', 'love', 'money'][day % 4],
    evidence: [`日運${day}`, `主要信号${day % 7}`]
  }, history.slice(0, 30));
  readings.push(reading);
  history.unshift({ profileId: reading.profileId, date, focusId: reading.focusId, focusLabel: reading.focusLabel, actionId: reading.actionId, cautionId: reading.cautionId, structureId: reading.structureId });
}

assert.ok(new Set(readings.slice(0, 30).map(item => item.focusId)).size >= 12, '30 days need at least 12 distinct readings');
assert.ok(new Set(readings.map(item => item.actionId)).size >= 35, 'actions must vary semantically, not just by wording');
assert.ok(new Set(readings.map(item => item.structureId)).size >= 10, 'most composition patterns should appear');
for (let i = 2; i < readings.length; i++) assert.ok(!(readings[i].focusId === readings[i - 1].focusId && readings[i].focusId === readings[i - 2].focusId), 'same focus must not appear three days running');
assert.ok(readings.every(item => item.evidence.length && item.grounding && item.blocks.map(block => block.role).join('|') === core.STRUCTURES.find(pattern => pattern.id === item.structureId).order.join('|')));

const health = core.generate({ profileId: 'safe', date: '2026-05-01', dayKey: 'low', dailyScore: 10, themeCategory: 'health' }, []);
assert.equal(health.domain, 'health');
assert.ok(health.safetyNotice.includes('医療機関'));
const ordinary = core.generate({ profileId: 'bold', date: '2026-05-01', dayKey: 'high', dailyScore: 90, themeCategory: 'work' }, []);
assert.equal(ordinary.safetyNotice, '', 'ordinary work advice must not be weakened by a generic disclaimer');
assert.ok(ordinary.conclusion.length > 20 && !ordinary.conclusion.includes('かもしれません'));
assert.ok(readings.every(item => item.blocks.find(block => block.role === 'caution')?.label === '気をつけること'));
assert.ok(readings.every(item => item.blocks.find(block => block.role === 'action')?.label === '今日やること'));
assert.ok(readings.every(item => !item.conclusion.includes('そこ、勢いで決めないの')));

const sameA = core.generate({ profileId: 'stable', date: '2026-05-02', dayKey: 'same', dailyScore: 72, themeCategory: 'love' }, []);
const sameB = core.generate({ profileId: 'stable', date: '2026-05-02', dayKey: 'same', dailyScore: 72, themeCategory: 'love' }, []);
assert.equal(JSON.stringify(sameA), JSON.stringify(sameB), 'same inputs must stay deterministic');
console.log('daily reading engine quality: ok');

// The visible reading must differ in its reasoning, not merely section order.
for (const themeCategory of ['work', 'love', 'money', 'health', 'growth', 'decision']) {
  const chain = [], rows = [];
  for (let day = 1; day <= 30; day++) {
    const row = core.generate({ profileId: 'narrative-' + themeCategory, date: new Date(Date.UTC(2026, 3, day)).toISOString().slice(0, 10), themeCategory, dailyScore: 50 }, chain);
    const text = core.toText(row);
    assert.ok(!text.includes('時刻の吉凶') && !text.includes('前日の記録がない') && !text.includes('昨日の主題'), 'unavailable timing and unchanged daily comparisons do not pad every reading');
    assert.ok(!/下の一手|一手を下に|今日は「.+」を意識してみて/.test(text), 'avoid position-dependent instructions and the old universal formula');
    assert.equal(text.split(row.action).length - 1, 1);
    assert.ok(/なら|たら/.test(row.story), 'a scene is conditional, never a claimed personal event');
    rows.push(row); chain.unshift(row);
  }
  assert.equal(new Set(rows.map(row => row.story)).size, 30);
  assert.ok(new Set(rows.map(row => row.structureId)).size >= 10);
  assert.deepEqual([...new Set(rows.map(row => core.toText(row).split('【').length - 1))].sort(), [3, 4], 'short and reflective readings have different visible depth');
}
const timed = core.generate({ profileId: 'timed', date: '2026-04-01', dailyScore: 50, recommendedTime: '入力された時刻の案内' });
assert.ok(core.toText(timed).includes('入力された時刻の案内'), 'provided timing remains visible');
const changedStrength = core.generate({ profileId: 'transition', date: '2026-04-02', dailyScore: 90, themeCategory: 'work' }, [{ profileId: 'transition', date: '2026-04-01', intensity: 'protect', focusId: 'prepare' }]);
assert.ok(core.toText(changedStrength).includes('昨日の強度は「負担を増やさず確認する」、今日は「条件が揃う一件を進める」'));
assert.ok(!core.toText(changedStrength).includes('できたから'), 'history never proves the user performed a suggested action');
console.log('daily narrative depth: ok (180 fixed-signal readings, conditional scenes, variable visible depth, timing and strength transitions)');
