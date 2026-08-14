import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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
