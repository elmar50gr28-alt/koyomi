import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../src/data/name-strokes.js');
const strokes = globalThis.KOYOMI_NAME_STROKES;
assert.ok(Object.isFrozen(strokes), 'stroke dictionary must be immutable');
assert.ok(Object.keys(strokes).length >= 6400, 'stroke dictionary must cover Joyo, Jinmeiyo and JIS kanji');
for (const [character, expected] of [['山', 3], ['藤', 18], ['邉', 17], ['凜', 15], ['龍', 16]]) {
  assert.equal(strokes[character], expected, `${character} stroke count must match Unicode kTotalStrokes`);
}

const app = await readFile(new URL('../app.html', import.meta.url), 'utf8');
const worker = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');
assert.ok(app.includes('src/data/name-strokes.js'), 'app must load the generated stroke dictionary');
assert.ok(app.includes('return Number.isInteger(NAME_STROKES[ch])?NAME_STROKES[ch]:null'), 'unknown characters must not use guessed strokes');
assert.ok(app.includes('【姓名判断は判定保留】'), 'unknown characters must produce a withheld result');
assert.ok(app.includes('【採用した文字別画数】'), 'reading must disclose per-character stroke counts');
assert.ok(worker.includes("'./src/data/name-strokes.js'"), 'stroke dictionary must be available offline');
console.log(`Name stroke dictionary passed: entries=${Object.keys(strokes).length}`);
