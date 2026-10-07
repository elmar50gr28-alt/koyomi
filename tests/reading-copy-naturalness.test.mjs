import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [app, adapter] = await Promise.all([
  readFile('app.html', 'utf8'),
  readFile('src/persona/conversation-adapter.js', 'utf8')
]);

assert.ok(!app.includes('【占術の意味】'), 'an explanatory section with no reading value must not be generated');
assert.ok(!app.includes('今回は「${focus}」を軸に'), 'mechanical axis phrasing must stay removed');
assert.ok(!adapter.includes('を軸に、出た結果を現実の動きへ訳す'));
for (const label of ['最初にすること', '動く時間', '今日の一手']) assert.ok(app.includes(label));
for (const noise of ['・持ち物：${items.item}', '・食べ物：${items.food}', '・色：${items.color}', '・気分転換：${items.refresh}']) assert.ok(!app.includes(noise), `${noise} should not clutter every reading`);
assert.match(app, /なぜそう読むのか[\s\S]*今日どう行動するか/);
console.log('reading copy naturalness: ok');

// Exercise the generated text and the real legacy advice input, not only source markers.
const context = {};
for (const file of ['src/reading/app-narrative-engine.js', 'src/reading/universal-reading-engine.js', 'src/reading/daily/daily-reading-core.js']) vm.runInNewContext(await readFile(file, 'utf8'), context);
vm.runInNewContext(app.slice(app.indexOf('function v196CategoryAdvice('), app.indexOf('function v196Avoid(')), context);
const microTask = /小さく|最小の|一つだけ|一件だけ|\d+分だけ|最初の\d+分/;
for (const category of ['love', 'marriage', 'work', 'money', 'health', 'family', 'relation', 'dream', 'loss', 'rest', 'general']) for (const score of [0, 50, 85]) {
  const action = context.v196CategoryAdvice(category, score);
  assert.doesNotMatch(action, microTask, category + '/' + score + ': avoid arbitrary time or quantity tasks');
  const result = context.KOYOMI_APP_NARRATIVE.compose({ domain: category, score, actions: [action], seed: category + score });
  assert.equal(result.meta.quality.pass, true);
  assert.doesNotMatch(result.text, microTask);
  assert.ok(result.blocks.some(block => block.role === 'action' && block.text === action), 'supplied advice is preserved rather than rewritten by a synonym filter');
}
assert.equal(context.KOYOMI_APP_NARRATIVE.frame({score:0}).direction, 'protect', 'zero is protective, not a missing medium score');
const core = context.KOYOMI_DAILY_READING_CORE;
assert.equal(core.FOCI.flatMap(focus => focus.actions).length, 177);
assert.equal(new Set(core.FOCI.flatMap(focus => focus.actions)).size, 177);
for (const focus of core.FOCI) for (const action of focus.actions) assert.doesNotMatch(action, microTask);
let copyCases = 0;
for (const themeCategory of ['work', 'money', 'health', 'love', 'growth', 'decision']) for (const dailyScore of [0, 50, 85]) {
  const history = [], actions = new Set();
  for (let day = 1; day <= 30; day++) {
    const row = core.generate({ profileId: 'copy-' + themeCategory + dailyScore, date: new Date(Date.UTC(2026, 1, day)).toISOString().slice(0, 10), themeCategory, dailyScore }, history);
    assert.doesNotMatch(core.toText(row), microTask);
    assert.doesNotMatch(row.story, /今回の一手|分かっている.+について分かっている|置き去りになりやすい|取り消せる範囲で試し/);
    assert.ok(row.story.split(/[。！？]/).every(sentence => sentence.trim().length <= 60), 'keep prose sentences readable rather than joining long noun fragments');
    assert.equal(core.toText(row).split(row.action).length - 1, 1);
    assert.ok(!row.caution.includes('ことは避けて'), 'cautions are authored complete sentences');
    actions.add(row.actionId); history.unshift(row); copyCases++;
  }
  assert.ok(actions.size >= 6, 'fixed conditions must still select distinct existing action outcomes');
}
const fallback = {};
vm.runInNewContext(await readFile('src/reading/universal-reading-engine.js', 'utf8'), fallback);
const answer = fallback.KOYOMI_UNIVERSAL_READING.build({type:'today',score:50});
assert.doesNotMatch(answer.directAnswer + answer.actionPlan.map(item => item.action).join(''), microTask);
assert.doesNotMatch(answer.directAnswer, /正解/);
console.log('reading outcome copy: ok (' + copyCases + ' continuous readings, real legacy advice, common composer and fallback)');
