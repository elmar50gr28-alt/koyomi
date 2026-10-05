import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const context = { Math: Object.assign(Object.create(Math), { random() { throw new Error('random is forbidden'); } }) };
vm.runInNewContext(await readFile('src/reading/daily/daily-reading-core.js', 'utf8'), context);
vm.runInNewContext(await readFile('src/reading/daily/daily-reading-controller.js', 'utf8'), context);
const core = context.KOYOMI_DAILY_READING_CORE, controller = context.KOYOMI_DAILY_READING;
const legacyActions = core.FOCI.map(focus => ({ id: focus.id, actions: focus.actions.slice(0, ({ money: 12, rest: 6, health: 6 })[focus.id] || 3) }));
assert.equal(createHash('sha256').update(JSON.stringify(legacyActions)).digest('hex'), '24e341ec18bd7342971b2b457c704c751a57eac4b7c5d93c4c9d8e7c1d76b238', 'all v3.0 action texts and saved ID positions remain unchanged');
const allActions = core.FOCI.flatMap(focus => focus.actions);
assert.equal(new Set(allActions).size, allActions.length, 'do not count duplicated action text as a new meaning');
const memory = new Map();
const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
const base = { profileId: 'continuity', date: '2026-01-31', dayKey: '甲子', dailyScore: 70, themeCategory: 'overall' };
const date = day => new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
const metrics = [];
for (const themeCategory of ['overall', 'work', 'love', 'money', 'health', 'family', 'decision', 'future']) {
  const rows = [], history = [];
  for (let day = 1; day <= 30; day++) {
    const input = { ...base, profileId: themeCategory, date: date(day), themeCategory, dailyScore: [0, 44, 45, 69, 70, 100][(day - 1) % 6] };
    const row = controller.getOrCreate(input, { storage }).reading;
    assert.equal(JSON.stringify(controller.getOrCreate(input, { storage }).reading), JSON.stringify(row));
    assert.equal(JSON.stringify(core.generate(input, history)), JSON.stringify(row));
    assert.ok(row.story.includes(row.focusLabel) && row.mainTheme === row.focusId);
    assert.ok(row.action === core.FOCI.find(focus => focus.id === row.focusId).actions[Number(row.actionId.split('-').at(-1))], 'reuse complete authored actions, never synonym substitution');
    assert.ok(row.caution === core.FOCI.find(focus => focus.id === row.focusId).cautions[Number(row.cautionId.split('-').at(-1))] + 'ことは避けて。', 'cautions must explicitly discourage the hazardous behavior');
    assert.ok(!/後半ほど|昨日までの正解|引きずる|必ず|絶対|運が弱いことじゃない/.test(core.toText(row)), 'no invented events, blame, or time predictions');
    assert.ok(!row.recommendedTime.includes('夕方以降') && !row.recommendedTime.includes('午前中'));
    assert.equal(row.intensity, input.dailyScore < 45 ? 'protect' : input.dailyScore >= 70 ? 'forward' : 'test');
    if (row.intensity === 'protect') assert.ok(!['complete', 'contact', 'create', 'focus', 'move'].includes(row.focusId));
    const requiredDomain = { work: 'work', love: 'relationship', money: 'money', health: 'health', family: 'relationship', decision: 'life', future: 'life' }[themeCategory];
    if (requiredDomain) assert.equal(row.domain, requiredDomain, 'novelty cannot override the question domain');
    // A finite asset may recur only after all variants have been used, then use the least frequent.
    for (const [key, prefix, size] of [['actionId', row.focusId, core.FOCI.find(focus => focus.id === row.focusId).actions.length], ['cautionId', row.focusId, 3], ['sceneId', row.domain, 3]]) {
      const counts = Array.from({ length: size }, (_, index) => history.filter(item => item[key] === `${prefix}-${index}`).length);
      assert.equal(history.filter(item => item[key] === row[key]).length, Math.min(...counts));
    }
    rows.push(row); history.unshift(row);
  }
  const exact = rows.length - new Set(rows.map(row => core.toText(row))).size;
  const stories = rows.length - new Set(rows.map(row => row.story)).size;
  const actionRepeats = rows.length - new Set(rows.map(row => row.actionId)).size;
  const sceneSwitches = rows.slice(1).filter((row, index) => row.sceneId !== rows[index].sceneId).length;
  assert.equal(exact, 0); assert.equal(stories, 0); assert.ok(sceneSwitches >= 20);
  assert.ok(actionRepeats / 30 <= 0.2, `${themeCategory}: varied-signal action repetition must stay at or below 20%`);
  metrics.push({ themeCategory, days: 30, fullTextDuplicates: exact, storyDuplicates: stories, semanticActionRepeatRate: Number((actionRepeats / 30).toFixed(3)), sceneSwitches });
}
const mixedHistory = [
  { ...base, date: '2026-01-31', focusId: 'complete' },
  { ...base, date: '2026-02-01', focusId: 'complete' },
  { ...base, profileId: 'someone-else', date: '2026-01-30', focusId: 'complete' },
  { ...base, date: '2025-12-31', focusId: 'complete' }
];
assert.equal(JSON.stringify(core.generate(base, mixedHistory)), JSON.stringify(core.generate(base, [])), 'same-day, future, other-profile, and expired history ignored');
const thirty = { ...base, date: '2026-01-01', focusId: 'complete' };
assert.equal(core.recentHistory(base, [thirty]).length, 1, 'exactly 30 days retained');
assert.equal(JSON.stringify(core.generate(base, [thirty, { ...thirty, date: '2026-01-30' }])), JSON.stringify(core.generate(base, [{ ...thirty, date: '2026-01-30' }, thirty])), 'history order irrelevant');
for (const extra of [{ contradiction: true }, { longTermScore: 20 }, { confidence: 0.2 }]) assert.equal(core.generate({ ...base, dailyScore: 100, ...extra }).intensity, 'test');
assert.equal(core.generate({ ...base, dailyScore: 0 }).score, 0);
assert.equal(core.generate({ ...base, dailyScore: NaN }).score, 50);
const grounded = core.rankFocus({ ...base, themeIds: ['RELATIONSHIP_SET_BOUNDARIES'] }, []);
assert.ok(grounded.find(item => item.focus.id === 'boundary').breakdown.evidenceFit > 0);
const exhaustedWork = core.FOCI.find(focus => focus.id === 'focus');
const usedWork = exhaustedWork.actions.map((_, index) => ({ ...base, date: date(30 - index), focusId: 'focus', actionId: `focus-${index}` }));
assert.equal(core.rankFocus(base, usedWork).find(item => item.focus.id === 'focus').breakdown.actionNovelty, -18);
assert.equal(core.rankFocus(base, usedWork.map(row => ({ ...row, date: '2025-01-01' }))).find(item => item.focus.id === 'focus').breakdown.actionNovelty, 0, 'expired action use cannot penalize a theme');
const same = controller.getOrCreate(base, { storage }).reading;
assert.equal(JSON.stringify(controller.getOrCreate(base, { storage, force: true }).reading), JSON.stringify(same), 'force ignores own same-day history');
assert.equal(controller.getOrCreate({ ...base, themeCategory: 'money' }, { storage }).reading.domain, 'money', 'category invalidates cache');
assert.equal(controller.getOrCreate({ ...base, dailyScore: 0 }, { storage }).reading.intensity, 'protect', 'signal invalidates cache');
for (let day = 1; day <= 100; day++) controller.getOrCreate({ ...base, profileId: 'other', date: date(day) }, { storage });
assert.equal(controller.recent('other', { storage }).length, 90);
assert.equal(controller.recent('money', { storage }).length, 30, 'another profile cannot evict history');
for (const corrupt of ['null', '{"history":{}}', '{"cache":[],"history":[null]}', 'broken']) {
  memory.set(controller.STORAGE_KEY, corrupt);
  assert.ok(controller.getOrCreate(base, { storage }).reading.action);
}
const app = await readFile('app.html', 'utf8');
assert.ok(app.includes("overall.textContent=lastPersonal.reading"));
assert.ok(app.includes('KOYOMI_DAILY_READING_CORE.toText(dailyReading)'));
assert.ok(app.includes('themeIds:commonReading.items?.map(item=>item.themeId)'));
assert.ok((await readFile('service-worker.js', 'utf8')).includes('daily-story-v3'));
// Exercise the actual integration function with a minimal DOM, rather than only matching source strings.
const integrationSource = app.slice(app.indexOf('async function koyomiRenderBaziReading(){'), app.indexOf('window.KOYOMI_BAZI_READING={render:'));
const overall = { textContent: '' }, target = { reading: '従来の三層鑑定', luck: { current: { score: 20 } } };
const ui = {
  ...context, lastPersonal: target, document: { getElementById: id => id === 'overallReading' ? overall : id === 'theme' ? { value: 'work' } : null },
  koyomiBaziReadingProfile: () => ({ personId: 'fixture', birthData: {} }), koyomiDailyProfileKey: () => 'ui-profile', koyomiBaziLocale: () => 'ja',
  KOYOMI_BAZI: { prepareCommonReadingThemes: async () => {}, calculateBazi: () => ({}), buildCommonReading: () => ({ items: [{ themeId: 'WORK_STEADY_PROGRESS' }] }), buildBaziReading: () => ({}) },
  KOYOMI_DAILY_CONTEXT: { selectedDate: () => new Date('2026-01-01'), formatDate: () => '2026-01-01', dailySignal: () => ({ score: 90, title: 'fixture' }), dayPillar: () => ({ text: '甲子' }) },
  KOYOMI_DAILY_READING: { getOrCreate: input => ({ reading: core.generate(input) }) }, console
};
ui.window = ui; vm.createContext(ui); vm.runInContext(integrationSource, ui);
await ui.koyomiRenderBaziReading();
assert.equal(target.dailyReading.intensity, 'test', 'long-term weakness reaches the UI');
assert.ok(overall.textContent.includes(target.dailyReading.story) && overall.textContent.endsWith('従来の三層鑑定'));
await ui.koyomiRenderBaziReading();
assert.equal((overall.textContent.match(/生まれ持った傾向と総合鑑定/g) || []).length, 1, 'repeat renders do not duplicate the traditional reading');
let release;
ui.KOYOMI_BAZI.prepareCommonReadingThemes = () => new Promise(resolve => { release = resolve; });
const pending = ui.koyomiRenderBaziReading();
ui.lastPersonal = { reading: '別の人物' }; release(); await pending;
assert.equal(ui.lastPersonal.reading, '別の人物', 'async rendering cannot overwrite a newly selected person');
const fixedMetrics = [];
for (const themeCategory of ['overall', 'work', 'love', 'money', 'health', 'family', 'decision', 'future']) {
  for (const dailyScore of [0, 50, 100]) {
    const rows = [];
    for (let day = 1; day <= 30; day++) rows.unshift(core.generate({ ...base, themeCategory, dailyScore, date: date(day) }, rows));
    assert.equal(new Set(rows.map(row => row.story)).size, 30, `${themeCategory}/${dailyScore}: fixed signals still suppress story repetition`);
    fixedMetrics.push({ themeCategory, dailyScore, actionRepeatRate: Number((1 - new Set(rows.map(row => row.actionId)).size / 30).toFixed(3)) });
  }
}
for (const profileId of ['second-person', 'third-person', 'fourth-person', 'fifth-person']) {
  for (const themeCategory of ['overall', 'work', 'love', 'money', 'health', 'family', 'decision', 'future']) {
    const rows = [];
    for (let day = 1; day <= 30; day++) rows.unshift(core.generate({ ...base, profileId, themeCategory, dailyScore: [0, 44, 45, 69, 70, 100][(day - 1) % 6], date: new Date(Date.UTC(2026, 3, 20 + day)).toISOString().slice(0, 10) }, rows));
    assert.ok(1 - new Set(rows.map(row => row.actionId)).size / 30 <= 0.2 + Number.EPSILON, `${profileId}/${themeCategory}: repeats cannot be hidden by changing profile or date`);
    assert.equal(new Set(rows.map(row => row.story)).size, 30, `${profileId}/${themeCategory}: stories stay distinct across date boundaries`);
  }
}
console.log(JSON.stringify(metrics, null, 2));
console.log(JSON.stringify(fixedMetrics));
console.log('daily reading continuity: ok (1920 readings, preserved v3 action IDs, no random/network APIs, actual UI integration)');
