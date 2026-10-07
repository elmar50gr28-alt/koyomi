import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { interpretReadingQuestion } from '../src/reading/question-interpreter.js';

const app = await readFile('app.html', 'utf8');
const nodes = new Map(['theme', 'qFocus', 'memo', 'qRisk', 'qBodyState', 'readingModeSetting', 'koyomiReadingDate'].map(id => [id, { value: '' }]));
nodes.set('dailyTraditionalReading', { textContent: '' }); nodes.set('dailyTraditionalDetails', { hidden: true, open: false });
nodes.set('overallReading', { textContent: '' }); nodes.set('koyomiStartReading', { disabled: false, textContent: '' });
nodes.get('theme').value = 'overall'; nodes.get('qFocus').value = 'career';
const memory = new Map(), errors = [];
const profile = { id: 'fixture', personId: 'fixture', displayName: 'private-name', birthData: { date: '1990-01-01' }, nameData: { reading: 'かな' } };
let settings = { dayBoundary: 0 }, locale = 'ja', mode = 'sister', calculations = 0, opened = 0;
const ctx = {
  document: { getElementById: id => nodes.get(id) || null }, $: id => nodes.get(id) || null,
  localStorage: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) },
  sessionStorage: { removeItem() {} }, console: { error: (...args) => errors.push(args), warn() {} },
  selectedDate: new Date('2026-01-01'), lastPersonal: null, koyomiRenderedPersonalKey: '',
  LedgerState: { selectedPrimary: 'fixture' },
  fmtIso: date => date.toISOString().slice(0, 10), startOfDay: date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())), safeDate: value => value ? new Date(value) : null,
  renderCalendar() {}, koyomiRequireProfile: async () => profile, koyomiBaziReadingProfile: () => profile, koyomiDailyProfileKey: () => 'fixture-profile',
  koyomiBaziLocale: () => locale, v191zMode: () => mode, KOYOMI_BAZI_SETTINGS: () => settings,
  koyomiOpenGeneratedPersonalReading: () => opened++,
  buildPersonal: () => ({ reading: '元の鑑定', luck: { current: { score: 50 } }, divinations: {} }),
  renderPersonal: result => { ctx.lastPersonal = result; result.reading = `従来鑑定:${nodes.get('qFocus').value}:${nodes.get('memo').value}`; nodes.get('overallReading').textContent = result.reading; },
  KOYOMI_BAZI: { prepareCommonReadingThemes: async () => {}, calculateBazi: () => { calculations++; return {}; }, buildCommonReading: (_result, options) => ({ items: [], answer: interpretReadingQuestion(options.question) }), buildBaziReading: () => ({}) }
};
ctx.window = ctx; vm.createContext(ctx);
for (const file of ['src/reading/daily/daily-reading-core.js', 'src/reading/daily/daily-reading-controller.js']) vm.runInContext(await readFile(file, 'utf8'), ctx);
ctx.KOYOMI_DAILY_CONTEXT = { selectedDate: () => new Date(ctx.selectedDate), formatDate: ctx.fmtIso, dailySignal: () => ({ score: 65, title: '検証' }), dayPillar: () => ({ text: '甲子' }) };
const extract = (start, end) => app.slice(app.indexOf(start), app.indexOf(end));
ctx.v196RenderPersonalBase = ctx.renderPersonal;
const resetStart = app.indexOf('renderPersonal=function(r){v196RenderPersonalBase(r);');
vm.runInContext(app.slice(resetStart, app.indexOf('const q=', resetStart)) + '}', ctx);
for (const [start, end] of [
  ['function koyomiPersonalReadingKey(', 'function koyomiOpenGeneratedPersonalReading('],
  ['async function koyomiGeneratePersonalOnce(', 'async function koyomiStartPersonalReading('],
  ['async function koyomiStartPersonalReading(', 'function koyomiToggleDatePicker('],
  ['async function koyomiStartSelectedDateReading(', 'async function koyomiPrepareCompat(']
]) vm.runInContext(extract(start, end), ctx);
ctx.testLocaleGetter = () => locale;
vm.runInContext(`{ const koyomiBaziLocale = window.testLocaleGetter; ${extract('async function koyomiRenderBaziReading(){', 'window.KOYOMI_BAZI_READING={render:')} window.koyomiRenderBaziReading = koyomiRenderBaziReading; }`, ctx);
delete ctx.koyomiBaziLocale;
ctx.KOYOMI_BAZI_READING = { render: ctx.koyomiRenderBaziReading, locale: () => locale };
const core = ctx.KOYOMI_DAILY_READING_CORE, controller = ctx.KOYOMI_DAILY_READING;

await ctx.koyomiStartPersonalReading();
assert.equal(ctx.lastPersonal.dailyReading.domain, 'work'); assert.equal(calculations, 1);
const firstKey = ctx.koyomiRenderedPersonalKey, firstText = nodes.get('overallReading').textContent;
await ctx.koyomiStartPersonalReading();
assert.equal(calculations, 1, 'unchanged consultation reuses its reading'); assert.equal(nodes.get('overallReading').textContent, firstText);
nodes.get('overallReading').textContent = '表示を消去';
await ctx.koyomiStartPersonalReading(); assert.equal(calculations, 2, 'cleared display must not be treated as a cached full reading');
for (const [focus, domain] of [['income', 'money'], ['healthrhythm', 'health'], ['study', 'growth'], ['relocation', 'life']]) {
  nodes.get('qFocus').value = focus;
  await ctx.koyomiStartPersonalReading();
  assert.equal(ctx.lastPersonal.dailyReading.domain, domain, `actual UI selection ${focus} must reach the core`);
  assert.notEqual(ctx.koyomiRenderedPersonalKey, firstKey);
}
nodes.get('qFocus').value = 'nature'; nodes.get('memo').value = '転職を考えています';
await ctx.koyomiStartPersonalReading(); assert.equal(ctx.lastPersonal.dailyReading.domain, 'work');
nodes.get('memo').value = '睡眠と疲れについて相談したい';
await ctx.koyomiStartPersonalReading(); assert.equal(ctx.lastPersonal.dailyReading.domain, 'health'); assert.ok(ctx.lastPersonal.dailyReading.safetyNotice.includes('医療機関'));
nodes.get('memo').value = '大きな買い物の支出について相談したい';
await ctx.koyomiStartPersonalReading(); assert.equal(ctx.lastPersonal.dailyReading.domain, 'money'); assert.ok(ctx.lastPersonal.dailyReading.safetyNotice.includes('投資'));
assert.ok(!ctx.koyomiRenderedPersonalKey.includes('private-name') && !ctx.koyomiRenderedPersonalKey.includes(nodes.get('memo').value), 'render keys do not contain raw personal text');

for (const change of [() => { settings = { dayBoundary: 23 }; }, () => { mode = 'zubat'; }, () => { locale = 'en'; }, () => { profile.nameData.reading = '変更'; }, () => { nodes.get('qRisk').value = 'high'; }, () => { nodes.get('qBodyState').value = 'tired'; }]) {
  const before = calculations; change(); await ctx.koyomiStartPersonalReading();
  assert.equal(calculations, before + 1, 'settings, style, name, risk, and body changes invalidate the view');
}

// Pending work cannot borrow an old reading or label newly edited inputs as calculated.
let release;
ctx.KOYOMI_BAZI.prepareCommonReadingThemes = () => new Promise(resolve => { release = resolve; });
nodes.get('qFocus').value = 'career';
const beforePending = ctx.koyomiRenderedPersonalKey, pending = ctx.koyomiGeneratePersonalOnce(profile);
nodes.get('qFocus').value = 'income'; release();
assert.equal(await pending, null); assert.equal(ctx.koyomiRenderedPersonalKey, '', 'an edited pending request invalidates the ready view');
assert.notEqual(ctx.koyomiRenderedPersonalKey, beforePending);
ctx.KOYOMI_BAZI.prepareCommonReadingThemes = async () => {};
await ctx.koyomiStartPersonalReading(); assert.equal(ctx.lastPersonal.dailyReading.domain, 'money');
assert.ok(!nodes.get('overallReading').textContent.includes('生まれ持った傾向と総合鑑定'));
assert.ok(nodes.get('dailyTraditionalReading').textContent.startsWith('従来鑑定:'));
assert.equal(nodes.get('dailyTraditionalDetails').hidden, false);
assert.equal(nodes.get('dailyTraditionalDetails').open, false, 'new render collapses prior traditional details');
ctx.KOYOMI_BAZI.prepareCommonReadingThemes = () => new Promise(resolve => { release = resolve; });
const pendingPerson = ctx.koyomiGeneratePersonalOnce(profile);
ctx.LedgerState.selectedPrimary = 'another-person'; release();
assert.equal(await pendingPerson, null, 'person selection changes are detected even before a new result object exists');
assert.equal(ctx.koyomiRenderedPersonalKey, '');
ctx.LedgerState.selectedPrimary = 'fixture'; ctx.KOYOMI_BAZI.prepareCommonReadingThemes = async () => {};
await ctx.koyomiStartPersonalReading();

const calculate = ctx.KOYOMI_BAZI.calculateBazi;
ctx.KOYOMI_BAZI.calculateBazi = () => { throw new Error('test-unavailable'); };
nodes.get('memo').value = '失敗時の検証用の新しい相談';
const beforeFailure = ctx.koyomiRenderedPersonalKey;
assert.equal(await ctx.koyomiGeneratePersonalOnce(profile), null);
assert.equal(ctx.koyomiRenderedPersonalKey, '', 'calculation failure must invalidate the preceding view marker');
assert.equal(errors.length, 1); ctx.KOYOMI_BAZI.calculateBazi = calculate;
nodes.get('memo').value = '大きな買い物の支出について相談したい';
const beforeRestoration = calculations;
await ctx.koyomiStartPersonalReading();
assert.equal(calculations, beforeRestoration + 1, 'returning to the old consultation must restore its display after failure');
assert.equal(ctx.koyomiRenderedPersonalKey, beforeFailure);
// Replacing underlying results also invalidates reuse, even if the visible words are unchanged.
ctx.KOYOMI_LAST_BAZI_READING = { ...ctx.KOYOMI_LAST_BAZI_READING };
const beforeReplacement = calculations; await ctx.koyomiStartPersonalReading();
assert.equal(calculations, beforeReplacement + 1);
nodes.get('memo').value = '失敗後の新しい相談';
await ctx.koyomiStartPersonalReading(); assert.notEqual(ctx.koyomiRenderedPersonalKey, beforeFailure);

nodes.get('koyomiReadingDate').value = '2026-02-01';
await ctx.koyomiStartSelectedDateReading(); assert.equal(ctx.lastPersonal.dailyReading.date, '2026-02-01');
const onSelectedDate = calculations; await ctx.koyomiStartSelectedDateReading(); assert.equal(calculations, onSelectedDate);
ctx.KOYOMI_BAZI.calculateBazi = () => { throw new Error('test-date-unavailable'); };
nodes.get('koyomiReadingDate').value = '2026-02-02';
const openedBeforeDateFailure = opened;
await ctx.koyomiStartSelectedDateReading();
assert.equal(opened, openedBeforeDateFailure, 'the date route must not open a preceding or incomplete reading after failure');
ctx.KOYOMI_BAZI.calculateBazi = calculate;
nodes.get('koyomiReadingDate').value = '2026-02-01';
const beforeDateRecovery = calculations; await ctx.koyomiStartSelectedDateReading();
assert.equal(calculations, beforeDateRecovery + 1, 'the old date must rebuild its display after failed generation');

const domains = { talent: 'growth', career: 'work', changejob: 'work', business: 'work', income: 'money', purchase: 'money', encounter: 'relationship', relationship: 'relationship', marriage: 'relationship', reconcile: 'relationship', family: 'relationship', healthrhythm: 'health', study: 'growth', creative: 'growth', relocation: 'life', timing: 'life', choice: 'life' };
for (const [focusCategory, expected] of Object.entries(domains)) {
  const rows = [];
  for (let day = 1; day <= 30; day++) {
    const row = core.generate({ profileId: 'focused', date: new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10), dailyScore: [0, 50, 100][(day - 1) % 3], themeCategory: 'overall', focusCategory }, rows);
    assert.equal(row.domain, expected); assert.equal(row.intensity, row.score < 45 ? 'protect' : row.score >= 70 ? 'forward' : 'test');
    if (expected === 'money') assert.ok(row.safetyNotice.includes('投資'));
    if (expected === 'health') assert.ok(row.safetyNotice.includes('医療機関'));
    rows.unshift(row);
  }
  assert.equal(new Set(rows.map(row => row.story)).size, 30);
}
for (const unknown of ['nature', 'unknown', '__proto__', 'toString']) assert.equal(core.requestedDomain({ focusCategory: unknown, themeCategory: 'work' }), 'work');
assert.equal(core.requestedDomain({ focusCategory: 'career', questionCategory: 'health', themeCategory: 'money' }), 'work', 'explicit focus takes priority over keyword inference');
const input = { profileId: 'cache-focus', date: '2026-01-01', dailyScore: 70, themeCategory: 'overall' };
assert.notEqual(controller.cacheKey({ ...input, focusCategory: 'career' }), controller.cacheKey({ ...input, focusCategory: 'income' }));
assert.notEqual(controller.cacheKey({ ...input, questionCategory: 'work' }), controller.cacheKey({ ...input, questionCategory: 'health' }));
const moneyTargets = [/支出/, /比較/, /上限/, /食い違い/, /残高/, /サービス/, /費用/, /契約/, /資金/, /返品/, /支払い/, /誰/, /精算/, /出費/, /購入以外/, /数量/, /量/, /届いた品/, /送金/, /手数料/, /記録/, /ポイント/, /分類/, /先送り/];
const moneyRows = [];
for (let day = 1; day <= 24; day++) {
  const row = core.generate({ ...input, themeCategory: 'money', date: new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10) }, moneyRows);
  const index = Number(row.actionId.split('-').at(-1));
  assert.match(row.review, moneyTargets[index], 'each financial action keeps its own verification target');
  assert.equal(core.toText(row).split(row.action).length - 1, 1);
  moneyRows.unshift(row);
}
assert.equal(new Set(moneyRows.map(row => row.actionId)).size, 24);
assert.equal(new Set(moneyRows.map(row => row.review)).size, 24, 'a generic review must not erase financial differences');
assert.ok(opened > 0);
console.log('daily consultation consistency: ok (actual CTA/date/render paths, 510 focused readings, cache and async failures)');
