import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateBazi, buildCommonReading } from '../src/bazi/index.js';
import { interpretReadingQuestion, setCommonReadingThemes } from '../src/reading/index.js';

const themes = JSON.parse(await readFile(new URL('../data/reading/common_reading_themes.json', import.meta.url), 'utf8'));
setCommonReadingThemes(themes);

const result = calculateBazi({
  displayName: 'Concrete Answer Test',
  birthData: {
    date: '1984-02-05',
    time: '12:00',
    place: { label: 'Tokyo', longitude: 139.767, utcOffset: 9, timezone: 'Asia/Tokyo' }
  }
});

assert.deepEqual(interpretReadingQuestion('転職すべきか迷っています'), {
  question: '転職すべきか迷っています', category: 'work', intent: 'decision', hasQuestion: true, sensitive: false
});
assert.equal(interpretReadingQuestion('彼といつ話せますか').category, 'love');
assert.equal(interpretReadingQuestion('彼といつ話せますか').intent, 'timing');
assert.equal(interpretReadingQuestion('最近疲れて眠れません').sensitive, true);

const work = buildCommonReading(result, { tone: 'mitsunome', question: '転職すべきか迷っています' });
assert.equal(work.answer.available, true);
assert.equal(work.answer.category, 'work');
assert.equal(work.answer.intent, 'decision');
assert.match(work.answer.directAnswer, /結論/);
assert.equal(work.answer.actionPlan.length, 2);
assert.match(work.answer.actionPlan[0].when, /今日/);
assert.ok(work.answer.reason.length > 10);
assert.ok(work.answer.stop.length > 0);
assert.match(work.answer.review, /確認する/);

const health = buildCommonReading(result, { tone: 'standard', question: '疲れと痛みが続く理由は何ですか' });
assert.equal(health.answer.category, 'health');
assert.equal(health.answer.intent, 'reason');
assert.match(health.answer.disclaimer, /医療機関/);
assert.doesNotMatch(health.answer.directAnswer, /診断|治療できる|必ず治る/);

const noQuestion = buildCommonReading(result, { tone: 'mitsunome' });
assert.equal(noQuestion.answer.hasQuestion, false);
assert.match(noQuestion.answer.directAnswer, /結論から言うわね/);

console.log('Common reading concrete answer passed');
