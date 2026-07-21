import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as bazi from '../src/bazi/index.js';
import {
  BAZI_PUBLIC_CONTRACT,
  ENCRYPTION_CONTRACT,
  LEDGER_CONTRACT,
  OFFLINE_CONTRACT
} from '../src/shared/architecture-contracts.js';

const app = await readFile('app.html', 'utf8');
const today = await readFile('today.html', 'utf8');
const serviceWorker = await readFile('service-worker.js', 'utf8');

for (const store of LEDGER_CONTRACT.stores) {
  assert.ok(app.includes(`'${store}'`), `ledger store contract missing: ${store}`);
}
assert.ok(app.includes(`const LEDGER_SCHEMA_VERSION=${LEDGER_CONTRACT.schemaVersion}`));
assert.ok(app.includes(`'${LEDGER_CONTRACT.databaseName}'`));

assert.ok(app.includes(`iterations=${ENCRYPTION_CONTRACT.ledgerIterations}`));
assert.ok(app.includes(`ledgerDeriveKey(pass,salt,${ENCRYPTION_CONTRACT.backupIterations})`));
assert.ok(app.includes(`name:'${ENCRYPTION_CONTRACT.cipher}'`));
assert.ok(app.includes(`hash:'${ENCRYPTION_CONTRACT.hash}'`));
assert.ok(app.includes(`format:'${ENCRYPTION_CONTRACT.backupFormat}'`));

for (const exportedName of BAZI_PUBLIC_CONTRACT) {
  assert.equal(typeof bazi[exportedName], 'function', `Bazi API missing: ${exportedName}`);
}
assert.ok(app.includes("import * as KOYOMI_BAZI from './src/bazi/index.js'"));

for (const shellFile of OFFLINE_CONTRACT.shellFiles) {
  assert.ok(serviceWorker.includes(shellFile), `offline shell missing: ${shellFile}`);
}
assert.ok(serviceWorker.includes('networkFirstHtml'));
assert.ok(serviceWorker.includes('staleWhileRevalidate'));
assert.ok(serviceWorker.includes('isSameOrigin'));

assert.ok(today.includes('function applyData(obj)'));
assert.ok(today.includes('function changeDay(delta)'));
assert.ok(today.includes('function setViewportUnit()'));

console.log('Architecture contracts passed');
