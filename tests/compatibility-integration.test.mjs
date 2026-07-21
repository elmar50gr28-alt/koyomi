import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  CALENDAR_TIME_API,
  createCalendarTimeCompatibility
} from '../src/shared/calendar-time-compat.js';
import {
  PROFILE_SCHEMA_API,
  createProfileSchemaCompatibility
} from '../src/shared/profile-schema-compat.js';
import {
  CRYPTO_COMPAT_API,
  createCryptoCompatibility
} from '../src/shared/crypto-compat.js';
import {
  INDEXEDDB_COMPAT_API,
  createIndexedDbCompatibility
} from '../src/shared/indexeddb-compat.js';
import {
  BACKUP_COMPAT_API,
  createBackupCompatibility
} from '../src/shared/backup-compat.js';
import { OFFLINE_CONTRACT } from '../src/shared/architecture-contracts.js';

const boundaries = [
  {
    name: 'CALENDAR_TIME',
    modulePath: './src/shared/calendar-time-compat.js',
    api: CALENDAR_TIME_API,
    create: createCalendarTimeCompatibility
  },
  {
    name: 'PROFILE_SCHEMA',
    modulePath: './src/shared/profile-schema-compat.js',
    api: PROFILE_SCHEMA_API,
    create: createProfileSchemaCompatibility
  },
  {
    name: 'CRYPTO',
    modulePath: './src/shared/crypto-compat.js',
    api: CRYPTO_COMPAT_API,
    create: createCryptoCompatibility
  },
  {
    name: 'INDEXEDDB',
    modulePath: './src/shared/indexeddb-compat.js',
    api: INDEXEDDB_COMPAT_API,
    create: createIndexedDbCompatibility
  },
  {
    name: 'BACKUP',
    modulePath: './src/shared/backup-compat.js',
    api: BACKUP_COMPAT_API,
    create: createBackupCompatibility
  }
];

const app = await readFile('app.html', 'utf8');
const serviceWorker = await readFile('service-worker.js', 'utf8');

for (const boundary of boundaries) {
  const sentinels = Object.fromEntries(
    boundary.api.map(operation => [operation, Object.freeze({ boundary: boundary.name, operation })])
  );
  const legacy = Object.fromEntries(
    boundary.api.map(operation => [operation, () => sentinels[operation]])
  );
  const compat = boundary.create(legacy);

  assert.ok(Object.isFrozen(boundary.api), `${boundary.name} API contract must be frozen`);
  assert.ok(Object.isFrozen(compat), `${boundary.name} facade must be frozen`);
  assert.deepEqual(Object.keys(compat), [...boundary.api]);
  for (const operation of boundary.api) {
    assert.equal(compat[operation](), sentinels[operation]);
  }

  const legacyBridge = `window.KOYOMI_${boundary.name}_LEGACY=Object.freeze`;
  const publicBridge = `window.KOYOMI_${boundary.name}=create`;
  const legacyIndex = app.indexOf(legacyBridge);
  const moduleIndex = app.indexOf(`from '${boundary.modulePath}'`);
  const publicIndex = app.indexOf(publicBridge);

  assert.ok(legacyIndex >= 0, `${boundary.name} legacy bridge missing`);
  assert.ok(moduleIndex > legacyIndex, `${boundary.name} module must load after legacy bridge declaration`);
  assert.ok(publicIndex > moduleIndex, `${boundary.name} public facade must be created after import`);
  assert.ok(serviceWorker.includes(`'${boundary.modulePath}'`), `${boundary.name} missing from service worker shell`);
  assert.ok(OFFLINE_CONTRACT.shellFiles.includes(boundary.modulePath), `${boundary.name} missing from offline contract`);
}

const shellModules = OFFLINE_CONTRACT.shellFiles.filter(path => path.startsWith('./src/shared/'));
assert.deepEqual(shellModules, [
  './src/shared/calendar-time-core.js',
  './src/shared/profile-validation-core.js',
  './src/shared/profile-normalization-core.js',
  './src/shared/profile-save-core.js',
  ...boundaries.map(boundary => boundary.modulePath)
]);

console.log(`Compatibility integration passed: boundaries=${boundaries.length}`);
