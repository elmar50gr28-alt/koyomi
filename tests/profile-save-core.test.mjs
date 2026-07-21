import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { OFFLINE_CONTRACT } from '../src/shared/architecture-contracts.js';

const source = await readFile('src/shared/profile-save-core.js', 'utf8');
const window = {};
vm.runInNewContext(source, { window, Object, String, JSON });
const core = window.KOYOMI_PROFILE_SAVE_CORE;

assert.ok(Object.isFrozen(core));
assert.deepEqual(Object.keys(core), ['findDuplicateProfiles', 'collectProfileChanges']);

const candidate = {
  id: 'candidate',
  displayName: ' 山田 太郎 ',
  birthData: { date: '2000-01-02', place: { city: '新宿区' } }
};
const profiles = [
  { id: 'same', displayName: '山田太郎', birthData: { date: '2000-01-02', place: { city: '新宿区' } } },
  { id: 'other-date', displayName: '山田太郎', birthData: { date: '2001-01-02', place: { city: '新宿区' } } },
  { id: 'other-city', displayName: '山田太郎', birthData: { date: '2000-01-02', place: { city: '渋谷区' } } },
  candidate
];
assert.deepEqual([...core.findDuplicateProfiles(profiles, candidate)].map(profile => profile.id), ['same']);
assert.deepEqual([...core.findDuplicateProfiles(profiles, { ...candidate, birthData: { date: '', place: { city: '' } } })].map(profile => profile.id), ['same', 'other-date', 'other-city']);

const previous = { displayName: 'Before', birthData: { date: '2000-01-01', place: { city: null } } };
const next = { displayName: 'After', birthData: { date: '2000-01-01', place: { city: 'Tokyo' } } };
const fields = { displayName: '表示名', 'birthData.date': '生年月日', 'birthData.place.city': '市区町村' };
assert.deepEqual(JSON.parse(JSON.stringify(core.collectProfileChanges(previous, next, fields))), [
  { field: 'displayName', label: '表示名', before: 'Before', after: 'After' },
  { field: 'birthData.place.city', label: '市区町村', before: '', after: 'Tokyo' }
]);
assert.deepEqual([...core.collectProfileChanges(null, next, fields)], []);

const app = await readFile('app.html', 'utf8');
const scriptPath = './src/shared/profile-save-core.js';
assert.ok(app.indexOf(`<script src="${scriptPath}"></script>`) < app.indexOf("(function(){'use strict';"));
assert.ok(app.includes('KOYOMI_PROFILE_SAVE_CORE.findDuplicateProfiles'));
assert.ok(app.includes('KOYOMI_PROFILE_SAVE_CORE.collectProfileChanges'));
assert.ok(!app.includes("const all=await ledgerList('profiles'),norm="));

const serviceWorker = await readFile('service-worker.js', 'utf8');
assert.ok(serviceWorker.includes(`'${scriptPath}'`));
assert.ok(OFFLINE_CONTRACT.shellFiles.includes(scriptPath));

console.log('Profile save core extraction tests passed');
