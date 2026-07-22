import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile('app.html', 'utf8');
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
assert.ok(app.includes('id="koyomiChoosePerson"'), 'home must provide a person-based reading entry');
assert.ok(app.includes('id="koyomiChooseTheme"'), 'home must provide a theme-based reading entry');
assert.ok(app.includes("$('koyomiChoosePerson').onclick=koyomiOpenPersonPicker"), 'person entry must open the profile selector');
assert.ok(app.includes("const panel=target?.closest('details');if(panel)panel.open=true"), 'theme entry must reveal its containing panel');
assert.ok(app.includes('id="koyomiOpenResult"'), 'home must provide a previous-result entry');
assert.ok(app.includes('id="koyomiMobileResult"'), 'mobile navigation must provide a result destination');
const mobileNav=app.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)?.[0]||'';
assert.equal((mobileNav.match(/<button/g)||[]).length,4,'mobile navigation must contain exactly four primary destinations');
for(const label of ['ホーム','鑑定','結果','人物帳'])assert.ok(mobileNav.includes(label),`${label} must remain in mobile navigation`);

console.log('Mobile regression checks passed');
