import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appHtml = await readFile('app.html', 'utf8');
const appMain = await readFile('src/app-main.js', 'utf8');
const app = `${appHtml}\n${appMain}`;
const smoke = await readFile('smoke-test.html', 'utf8');
const index = await readFile('index.html', 'utf8');
const today = await readFile('today.html', 'utf8');

assert.ok(app.includes('koyomiEditOwnProfile'), 'own profile edit route must remain present');
assert.ok(app.includes('koyomiApplyPrimaryProfile'), 'primary profile selection must remain present');
assert.ok(app.includes('visualViewport') || app.includes('VisualViewport'), 'mobile viewport handling must remain present');
assert.ok(app.includes('KOYOMI_BAZI'), 'Bazi module hook must be present');
assert.ok(smoke.includes('bazi engine module'), 'smoke test must include Bazi module check');
assert.ok(index.includes('app.html') || index.includes('today.html'), 'index navigation must remain present');
assert.ok(today.includes('app.html') || today.includes('KOYOMI'), 'today page must remain present');

console.log('Mobile regression checks passed');
