import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PROFILE_SCHEMA_API,
  createProfileSchemaCompatibility
} from '../src/shared/profile-schema-compat.js';

const calls = [];
const normalized = Object.freeze({ id: 'person_existing', displayName: '既存人物' });
const validation = Object.freeze(['既存エラー']);
const legacy = {
  normalizeProfile: (...args) => {
    calls.push({ name: 'normalizeProfile', args });
    return normalized;
  },
  validateProfile: (...args) => {
    calls.push({ name: 'validateProfile', args });
    return validation;
  }
};
const compat = createProfileSchemaCompatibility(legacy);
const profile = {
  id: 'person_existing',
  personId: 'person_existing',
  displayName: '既存人物',
  unknownFields: { futureField: 'preserve-by-legacy-contract' }
};

assert.equal(compat.normalizeProfile(profile), normalized);
assert.deepEqual(calls.at(-1), { name: 'normalizeProfile', args: [profile] });
assert.equal(compat.validateProfile(normalized), validation);
assert.deepEqual(calls.at(-1), { name: 'validateProfile', args: [normalized] });
assert.ok(Object.isFrozen(compat), 'compatibility API must be immutable');
assert.deepEqual(PROFILE_SCHEMA_API, ['normalizeProfile', 'validateProfile']);
assert.throws(() => createProfileSchemaCompatibility({}), /normalizeProfile/);

const legacyError = new Error('legacy profile failure');
const failing = {
  normalizeProfile: () => { throw legacyError; },
  validateProfile: () => []
};
assert.throws(() => createProfileSchemaCompatibility(failing).normalizeProfile(profile), error => error === legacyError);

const app = await readFile('app.html', 'utf8');
assert.ok(app.includes('window.KOYOMI_PROFILE_SCHEMA_LEGACY=Object.freeze'));
assert.ok(app.includes('normalizeProfile:ledgerNormalizeProfile'));
assert.ok(app.includes('validateProfile:ledgerValidateProfile'));
assert.ok(app.includes("from './src/shared/profile-schema-compat.js'"));
assert.ok(app.includes('window.KOYOMI_PROFILE_SCHEMA=createProfileSchemaCompatibility'));

console.log('Profile schema compatibility tests passed');
