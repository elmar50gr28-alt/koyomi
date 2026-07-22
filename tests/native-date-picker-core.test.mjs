import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile('src/shared/native-date-picker-core.js', 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const core = context.window.KOYOMI_NATIVE_DATE_PICKER_CORE;

assert.equal(core.parseIsoDate('1996-01-01').iso, '1996-01-01');
assert.equal(core.parseIsoDate('2000-02-29').day, 29);
assert.equal(core.parseIsoDate('1900-02-29'), null);
assert.equal(core.parseIsoDate('2023-02-29'), null);
assert.equal(core.parseIsoDate('2024-04-31'), null);
assert.equal(core.formatJapaneseDate('1996-01-01'), '1996年1月1日');
assert.equal(core.normalizeIsoDate('2026-07-22', { max: '2026-07-22' }), '2026-07-22');
assert.equal(core.normalizeIsoDate('2026-07-23', { max: '2026-07-22' }), '');

console.log('native date picker core tests passed');
