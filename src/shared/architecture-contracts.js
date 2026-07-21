/**
 * Stable architecture contracts used while the legacy inline application is
 * split into modules. This file is intentionally side-effect free: importing
 * it must never open storage, touch the DOM, or register a service worker.
 */
export const LEDGER_CONTRACT = Object.freeze({
  databaseName: 'mitsunome_v194_destiny_ledger',
  databaseVersion: 1,
  schemaVersion: 19401,
  stores: Object.freeze([
    'profiles',
    'locations',
    'readings',
    'drafts',
    'changes',
    'settings'
  ]),
  identityFields: Object.freeze(['id', 'personId'])
});

export const ENCRYPTION_CONTRACT = Object.freeze({
  kdf: 'PBKDF2',
  hash: 'SHA-256',
  cipher: 'AES-GCM',
  keyLength: 256,
  ivBytes: 12,
  ledgerIterations: 250000,
  backupIterations: 300000,
  backupFormat: 'MITSUNOME_ENCRYPTED_BACKUP'
});

export const BAZI_PUBLIC_CONTRACT = Object.freeze([
  'calculateBazi',
  'calculateBaziChart',
  'calculateFourPillars',
  'calculateTenGod',
  'calculateTwelveStage',
  'validateBaziResult',
  'validateBaziPhase2Result',
  'validateBaziPhase3Result'
]);

export const OFFLINE_CONTRACT = Object.freeze({
  shellFiles: Object.freeze([
    './index.html',
    './today.html',
    './app.html',
    './src/shared/calendar-time-compat.js',
    './src/shared/profile-schema-compat.js',
    './src/shared/crypto-compat.js',
    './smoke-test.html',
    './manifest.webmanifest',
    './icon.svg'
  ]),
  htmlStrategy: 'network-first',
  assetStrategy: 'stale-while-revalidate',
  sameOriginOnly: true
});
