import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  BACKUP_COMPAT_API,
  createBackupCompatibility
} from '../src/shared/backup-compat.js';
import { ENCRYPTION_CONTRACT, LEDGER_CONTRACT, OFFLINE_CONTRACT } from '../src/shared/architecture-contracts.js';

const calls = [];
const results = Object.fromEntries(
  BACKUP_COMPAT_API.map(name => [name, Object.freeze({ operation: name })])
);
const legacy = Object.fromEntries(
  BACKUP_COMPAT_API.map(name => [name, (...args) => {
    calls.push({ name, args });
    return results[name];
  }])
);
const compat = createBackupCompatibility(legacy);
const cases = [
  ['createEnvelope', ['profiles']],
  ['exportJson', []],
  ['exportCsv', []],
  ['exportEncrypted', []],
  ['exportProfile', ['person_existing']],
  ['parseCsv', ['id,displayName\np1,Existing']],
  ['importBackup', []]
];

for (const [name, args] of cases) {
  assert.equal(compat[name](...args), results[name]);
  assert.deepEqual(calls.at(-1), { name, args });
}

assert.ok(Object.isFrozen(compat), 'compatibility API must be immutable');
assert.throws(() => createBackupCompatibility({}), /createEnvelope/);

const legacyError = new Error('legacy backup failure');
const failing = Object.fromEntries(
  BACKUP_COMPAT_API.map(name => [name, () => {
    if (name === 'importBackup') throw legacyError;
    return results[name];
  }])
);
assert.throws(
  () => createBackupCompatibility(failing).importBackup(),
  error => error === legacyError
);

const rejecting = {
  ...legacy,
  createEnvelope: () => Promise.reject(legacyError)
};
await assert.rejects(
  createBackupCompatibility(rejecting).createEnvelope('all'),
  error => error === legacyError
);

assert.equal(LEDGER_CONTRACT.schemaVersion, 19401);
assert.equal(ENCRYPTION_CONTRACT.backupIterations, 300000);
assert.equal(ENCRYPTION_CONTRACT.backupFormat, 'MITSUNOME_ENCRYPTED_BACKUP');

const app = await readFile('app.html', 'utf8');
assert.ok(app.includes('window.KOYOMI_BACKUP_LEGACY=Object.freeze'));
assert.ok(app.includes('createEnvelope:ledgerEnvelope'));
assert.ok(app.includes('exportJson:ledgerExportJson'));
assert.ok(app.includes('exportCsv:ledgerExportCsv'));
assert.ok(app.includes('exportEncrypted:ledgerExportEncrypted'));
assert.ok(app.includes('exportProfile:ledgerExportOne'));
assert.ok(app.includes('parseCsv:ledgerParseCsv'));
assert.ok(app.includes('importBackup:ledgerImport'));
assert.ok(app.includes("from './src/shared/backup-compat.js'"));
assert.ok(app.includes('window.KOYOMI_BACKUP=createBackupCompatibility'));

const modulePath = './src/shared/backup-compat.js';
const serviceWorker = await readFile('service-worker.js', 'utf8');
assert.ok(serviceWorker.includes(`'${modulePath}'`));
assert.ok(OFFLINE_CONTRACT.shellFiles.includes(modulePath));

console.log('Backup compatibility tests passed');
