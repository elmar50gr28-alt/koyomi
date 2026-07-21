import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { OFFLINE_CONTRACT } from '../src/shared/architecture-contracts.js';

const source = await readFile('src/shared/profile-validation-core.js', 'utf8');
const window = {};
vm.runInNewContext(source, { window, Date, Number });

const core = window.KOYOMI_PROFILE_VALIDATION_CORE;
assert.ok(Object.isFrozen(core));
assert.deepEqual(Object.keys(core), ['validateProfile']);

const validProfile = {
  displayName: 'Existing',
  birthData: {
    date: '2000-02-29',
    time: '23:59',
    place: { latitude: 35.6812, longitude: 139.7671 }
  }
};
assert.deepEqual([...core.validateProfile(validProfile)], []);

const invalidProfile = {
  displayName: '   ',
  birthData: {
    date: 'not-a-date',
    time: '24:00',
    place: { latitude: 90.1, longitude: -180.1 }
  }
};
assert.deepEqual([...core.validateProfile(invalidProfile)], [
  '表示名を入力してください',
  '存在しない生年月日です',
  '出生時刻が不正です',
  '緯度は-90〜90で入力してください',
  '経度は-180〜180で入力してください'
]);

const futureProfile = {
  displayName: 'Future',
  birthData: {
    date: '2999-01-01',
    time: '',
    place: { latitude: null, longitude: null }
  }
};
assert.deepEqual([...core.validateProfile(futureProfile)], ['未来の生年月日は保存できません']);

const app = await readFile('app.html', 'utf8');
const scriptPath = './src/shared/profile-validation-core.js';
const coreScriptIndex = app.indexOf(`<script src="${scriptPath}"></script>`);
const applicationScriptIndex = app.indexOf("(function(){'use strict';");
assert.ok(coreScriptIndex >= 0, 'profile validation core script missing');
assert.ok(coreScriptIndex < applicationScriptIndex, 'profile validation core must load before the legacy application');
assert.ok(app.includes('const ledgerValidateProfile=window.KOYOMI_PROFILE_VALIDATION_CORE.validateProfile'));
assert.ok(!app.includes('function ledgerValidateProfile('));

const serviceWorker = await readFile('service-worker.js', 'utf8');
assert.ok(serviceWorker.includes(`'${scriptPath}'`));
assert.ok(OFFLINE_CONTRACT.shellFiles.includes(scriptPath));

console.log('Profile validation core extraction tests passed');
