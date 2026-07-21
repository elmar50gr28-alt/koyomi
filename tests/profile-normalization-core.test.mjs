import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { OFFLINE_CONTRACT } from '../src/shared/architecture-contracts.js';

const source = await readFile('src/shared/profile-normalization-core.js', 'utf8');
const window = {};
vm.runInNewContext(source, { window, Date, Number, Set, TypeError });
const core = window.KOYOMI_PROFILE_NORMALIZATION_CORE;
assert.ok(Object.isFrozen(core));
assert.deepEqual(Object.keys(core), ['createProfileNormalizer']);

let sequence = 0;
const text = (value, max = 4000) => String(value ?? '').replace(/[<>]/g, '').trim().slice(0, max);
const normalizer = core.createProfileNormalizer({
  schemaVersion: 19401,
  relations: ['family', 'friend'],
  text,
  createId: prefix => `${prefix}_${++sequence}`,
  clone: value => value == null ? value : JSON.parse(JSON.stringify(value)),
  autoNameData: (displayName, nameData) => ({ ...nameData, autoDisplayName: displayName }),
  now: () => '2026-07-21T00:00:00.000Z'
});

const input = {
  displayName: ' <Alice Example> ',
  relationshipTags: ['friend', 'invalid', 'friend'],
  gender: 'invalid',
  isMain: true,
  birthData: { date: '2000-01-02', place: { latitude: '35.5', longitude: '', precision: '<city>' } },
  nameData: { middleName: '<Beth>', transliterationSystem: '' },
  optionalData: { occupationMajor: '<Tech>' },
  unknownFields: { imported: true },
  futureField: { preserved: true }
};
const snapshot = JSON.parse(JSON.stringify(input));
const result = normalizer(input);

assert.deepEqual(input, snapshot, 'normalization must not mutate its input');
assert.equal(result.id, 'person_1');
assert.equal(result.personId, 'person_1');
assert.equal(result.schemaVersion, 19401);
assert.equal(result.displayName, 'Alice Example');
assert.deepEqual([...result.relationshipTags], ['friend']);
assert.equal(result.gender, '');
assert.equal(result.isPrimaryPerson, true);
assert.equal(result.birthData.place.latitude, 35.5);
assert.equal(result.birthData.place.longitude, null);
assert.equal(result.birthData.place.precision, 'city');
assert.equal(result.nameData.middleName, 'Beth');
assert.equal(result.nameData.transliterationSystem, 'auto');
assert.equal(result.nameData.autoDisplayName, 'Alice Example');
assert.equal(result.optionalData.occupationMajor, 'Tech');
assert.deepEqual(JSON.parse(JSON.stringify(result.unknownFields)), { imported: true, futureField: { preserved: true } });
assert.equal(result.createdAt, '2026-07-21T00:00:00.000Z');
assert.equal(result.updatedAt, '2026-07-21T00:00:00.000Z');

assert.throws(() => core.createProfileNormalizer({}), /requires text/);

const app = await readFile('app.html', 'utf8');
const scriptPath = './src/shared/profile-normalization-core.js';
const coreScriptIndex = app.indexOf(`<script src="${scriptPath}"></script>`);
const applicationScriptIndex = app.indexOf("(function(){'use strict';");
assert.ok(coreScriptIndex >= 0 && coreScriptIndex < applicationScriptIndex);
assert.ok(app.includes('const ledgerNormalizeProfile=window.KOYOMI_PROFILE_NORMALIZATION_CORE.createProfileNormalizer'));
assert.ok(!app.includes('function ledgerNormalizeProfile('));
assert.ok(!app.includes('ledgerNormalizeProfile=function('));

const serviceWorker = await readFile('service-worker.js', 'utf8');
assert.ok(serviceWorker.includes(`'${scriptPath}'`));
assert.ok(OFFLINE_CONTRACT.shellFiles.includes(scriptPath));

console.log('Profile normalization core extraction tests passed');
