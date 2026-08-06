import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = {};
vm.runInNewContext(await readFile('src/reading/universal-reading-engine.js', 'utf8'), context);
const engine = context.KOYOMI_UNIVERSAL_READING;

for (const type of ['personal', 'compatibility', 'timeline', 'oracle', 'qimen', 'mundane', 'today']) {
  const answer = engine.build({
    type,
    question: '今どう動くべきですか',
    subject: '今回の相談',
    score: 63,
    evidence: ['根拠A', '根拠B'],
    actions: ['一つ確認する', '結果を記録する']
  });
  assert.equal(answer.type, type);
  assert.match(answer.directAnswer, /結論から言うわね/);
  assert.match(answer.reason, /根拠A／根拠B/);
  assert.equal(answer.actionPlan.length, 2);
  assert.ok(answer.stop);
  assert.ok(answer.review);
  assert.match(engine.toText(answer), /【相談への答え】/);
  assert.match(engine.toHtml(answer), /data-reading-type/);
}

const guarded = engine.build({ type: 'unknown', score: 999, evidence: [], actions: [] });
assert.equal(guarded.type, 'personal');
assert.equal(guarded.score, 100);
assert.equal(guarded.actionPlan.length, 1);

const escaped = engine.toHtml(engine.build({ question: '<script>alert(1)</script>' }));
assert.doesNotMatch(escaped, /<script>/);
assert.match(escaped, /&lt;script&gt;/);

console.log('universal reading engine: ok');
