import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile('app.html', 'utf8');
const index = await readFile('index.html', 'utf8');
const today = await readFile('today.html', 'utf8');
const manifest = JSON.parse(await readFile('manifest.webmanifest', 'utf8'));

assert.ok(app.includes('id="qmGuidedEntry"'), 'guided Qimen entry must exist');
assert.equal((app.match(/data-qm-guide-purpose=/g) || []).length, 5, 'guided entry must offer five clear purposes');
assert.equal((app.match(/data-qm-guide-when=/g) || []).length, 3, 'guided entry must offer three time choices');
assert.equal((app.match(/data-qm-guide-move=/g) || []).length, 3, 'guided entry must offer three movement choices');
assert.ok(app.includes('id="qmGuidedResult"'), 'plain-language result must exist before the expert board');
assert.ok(app.indexOf('id="qmGuidedResult"') < app.indexOf('class="qm-dashboard"'), 'plain-language result must precede the expert board');
assert.ok(app.includes("qmdjGuidedRender(state)"), 'existing Qimen result must feed the guided summary');
assert.ok(app.includes("$('qmGuidedGenerate').onclick=qmdjGenerate"), 'guided confirmation must reuse the existing full calculation');
assert.match(index, /<h1>こよみ<\/h1>/);
assert.match(app, /<h1>こよみ<\/h1>/);
assert.match(today, /<title>こよみ — 今日を見る<\/title>/);
assert.equal(manifest.name, 'こよみ');
assert.equal(manifest.short_name, 'こよみ');

console.log('Qimen guided entry and visible branding passed');
