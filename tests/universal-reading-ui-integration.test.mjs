import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile('app.html', 'utf8');
const today = await readFile('today.html', 'utf8');
const worker = await readFile('service-worker.js', 'utf8');

assert.match(app, /src\/reading\/universal-reading-engine\.js/);
for (const token of ['v201RenderCompatBase', 'v201RenderTimelineBase', 'v201RunOracleBase', 'v201QimenGenerateBase', 'v201MundaneGenerateBase']) {
  assert.ok(app.includes(token), `${token} is wired`);
}
for (const type of ["type:'compatibility'", "type:'timeline'", "type:'oracle'", "type:'qimen'", "type:'mundane'"]) {
  assert.ok(app.includes(type), `${type} uses universal answers`);
}
assert.ok(app.includes('common.answer||{}'), 'personal reading keeps its richer Bazi common answer without a duplicate card');
assert.match(today, /renderUniversalTodayReading/);
assert.match(today, /type:'today'/);
assert.match(worker, /common-reading-v5-universal/);
assert.match(worker, /universal-reading-engine\.js/);

console.log('universal reading UI integration: ok');
