import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile('app.html', 'utf8');

assert.ok(app.includes('function koyomiBaziGuardrailHtml(reading,ja)'), 'public Bazi transparency renderer missing');
assert.ok(app.includes('この鑑定の読み方'), 'Japanese transparency heading missing');
assert.ok(app.includes('判定の一致度'), 'method agreement label missing');
assert.ok(app.includes('不確実性'), 'uncertainty label missing');
assert.ok(app.includes('断定を控えた内容'), 'withheld claims label missing');
assert.ok(app.includes('活用方法'), 'practical-use label missing');
assert.ok(app.includes('koyomiEscapeHtml(agreement)'), 'agreement output must be escaped');
assert.ok(app.includes('koyomiEscapeHtml(uncertaintyText)'), 'uncertainty output must be escaped');
assert.ok(app.includes('${transparency}\n    ${detailHtml}'), 'transparency panel must appear before detailed sections');

console.log('Bazi reading transparency UI passed');
