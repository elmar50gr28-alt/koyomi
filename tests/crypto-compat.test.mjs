import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  CRYPTO_COMPAT_API,
  createCryptoCompatibility
} from '../src/shared/crypto-compat.js';

const calls = [];
const key = Object.freeze({ type: 'legacy-key' });
const encrypted = Object.freeze({ iv: 'legacy-iv', data: 'legacy-ciphertext' });
const decrypted = Object.freeze({ id: 'person_existing' });
const values = { deriveKey: key, encryptObject: encrypted, decryptObject: decrypted };
const legacy = Object.fromEntries(
  CRYPTO_COMPAT_API.map(name => [name, (...args) => {
    calls.push({ name, args });
    return Promise.resolve(values[name]);
  }])
);
const compat = createCryptoCompatibility(legacy);
const salt = new Uint8Array([1, 2, 3, 4]);

assert.equal(await compat.deriveKey('pin', salt, 250000), key);
assert.deepEqual(calls.at(-1), { name: 'deriveKey', args: ['pin', salt, 250000] });
assert.equal(await compat.encryptObject(decrypted, key), encrypted);
assert.deepEqual(calls.at(-1), { name: 'encryptObject', args: [decrypted, key] });
assert.equal(await compat.decryptObject(encrypted, key), decrypted);
assert.deepEqual(calls.at(-1), { name: 'decryptObject', args: [encrypted, key] });
assert.ok(Object.isFrozen(compat), 'compatibility API must be immutable');
assert.throws(() => createCryptoCompatibility({}), /deriveKey/);

const legacyError = new Error('legacy crypto failure');
const failing = {
  deriveKey: () => Promise.reject(legacyError),
  encryptObject: () => Promise.resolve(encrypted),
  decryptObject: () => Promise.resolve(decrypted)
};
await assert.rejects(createCryptoCompatibility(failing).deriveKey('pin', salt), error => error === legacyError);

const app = await readFile('app.html', 'utf8');
assert.ok(app.includes('window.KOYOMI_CRYPTO_LEGACY=Object.freeze'));
assert.ok(app.includes('deriveKey:ledgerDeriveKey'));
assert.ok(app.includes('encryptObject:ledgerEncryptObject'));
assert.ok(app.includes('decryptObject:ledgerDecryptObject'));
assert.ok(app.includes("from './src/shared/crypto-compat.js'"));
assert.ok(app.includes('window.KOYOMI_CRYPTO=createCryptoCompatibility'));

console.log('Crypto compatibility tests passed');
