import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  INDEXEDDB_COMPAT_API,
  createIndexedDbCompatibility
} from '../src/shared/indexeddb-compat.js';
import { LEDGER_CONTRACT, OFFLINE_CONTRACT } from '../src/shared/architecture-contracts.js';

const calls = [];
const results = Object.fromEntries(
  INDEXEDDB_COMPAT_API.map(name => [name, Object.freeze({ operation: name })])
);
const legacy = Object.fromEntries(
  INDEXEDDB_COMPAT_API.map(name => [name, (...args) => {
    calls.push({ name, args });
    return Promise.resolve(results[name]);
  }])
);
const compat = createIndexedDbCompatibility(legacy);
const record = Object.freeze({ id: 'person_existing', name: 'Existing' });

assert.equal(await compat.list('profiles'), results.list);
assert.deepEqual(calls.at(-1), { name: 'list', args: ['profiles'] });
assert.equal(await compat.get('profiles', record.id), results.get);
assert.deepEqual(calls.at(-1), { name: 'get', args: ['profiles', record.id] });
assert.equal(await compat.put('profiles', record, true), results.put);
assert.deepEqual(calls.at(-1), { name: 'put', args: ['profiles', record, true] });
assert.equal(await compat.delete('profiles', record.id), results.delete);
assert.deepEqual(calls.at(-1), { name: 'delete', args: ['profiles', record.id] });
assert.equal(await compat.clear('drafts'), results.clear);
assert.deepEqual(calls.at(-1), { name: 'clear', args: ['drafts'] });
assert.ok(Object.isFrozen(compat), 'compatibility API must be immutable');
assert.throws(() => createIndexedDbCompatibility({}), /list/);

const legacyError = new Error('legacy persistence failure');
const failing = Object.fromEntries(
  INDEXEDDB_COMPAT_API.map(name => [name, () => (
    name === 'get' ? Promise.reject(legacyError) : Promise.resolve(results[name])
  )])
);
await assert.rejects(
  createIndexedDbCompatibility(failing).get('profiles', record.id),
  error => error === legacyError
);

assert.equal(LEDGER_CONTRACT.databaseName, 'mitsunome_v194_destiny_ledger');
assert.equal(LEDGER_CONTRACT.databaseVersion, 1);
assert.equal(LEDGER_CONTRACT.schemaVersion, 19401);
assert.deepEqual(LEDGER_CONTRACT.stores, [
  'profiles', 'locations', 'readings', 'drafts', 'changes', 'settings'
]);

const app = await readFile('app.html', 'utf8');
assert.ok(app.includes('window.KOYOMI_INDEXEDDB_LEGACY=Object.freeze'));
assert.ok(app.includes('list:ledgerList'));
assert.ok(app.includes('get:ledgerGet'));
assert.ok(app.includes('put:ledgerPut'));
assert.ok(app.includes('delete:ledgerRawDelete'));
assert.ok(app.includes('clear:ledgerRawClear'));
assert.ok(app.includes("from './src/shared/indexeddb-compat.js'"));
assert.ok(app.includes('window.KOYOMI_INDEXEDDB=createIndexedDbCompatibility'));

const modulePath = './src/shared/indexeddb-compat.js';
const serviceWorker = await readFile('service-worker.js', 'utf8');
assert.ok(serviceWorker.includes(`'${modulePath}'`));
assert.ok(OFFLINE_CONTRACT.shellFiles.includes(modulePath));

console.log('IndexedDB compatibility tests passed');
