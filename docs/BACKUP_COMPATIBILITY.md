# Backup compatibility contract

## Purpose

`src/shared/backup-compat.js` provides an additive boundary around the current
ledger backup, export, and import functions. It only delegates calls to the
legacy implementation in `app.html`.

## Public API

- `createEnvelope(scope)` delegates to `ledgerEnvelope`.
- `exportJson()` delegates to `ledgerExportJson`.
- `exportCsv()` delegates to `ledgerExportCsv`.
- `exportEncrypted()` delegates to `ledgerExportEncrypted`.
- `exportProfile(id)` delegates to `ledgerExportOne`.
- `parseCsv(text)` delegates to `ledgerParseCsv`.
- `importBackup()` delegates to `ledgerImport`.

Arguments, synchronous or asynchronous return behavior, result identity, and
errors are forwarded unchanged. Existing UI handlers continue to call the
legacy functions, so this boundary does not alter current behavior.

## Frozen invariants

- Envelope schema version remains `19401`.
- Encrypted backup format remains `MITSUNOME_ENCRYPTED_BACKUP`.
- Backup key derivation remains PBKDF2-SHA256 with 300,000 iterations.
- Backup encryption remains AES-GCM with the existing salt, IV, Base64, and
  ciphertext representation.
- JSON and CSV fields, filenames, MIME types, and downloads are unchanged.
- Import validation, normalization, duplicate detection, merge/dedupe/replace
  behavior, confirmation prompts, and restore order are unchanged.
- IndexedDB schema, record encryption, person ledger, UI, and Four Pillars
  logic are unchanged.
- The service-worker strategy is unchanged; only the new static module joins
  the application shell.

## Regression guard

`tests/backup-compat.test.mjs` verifies the exact delegate mapping, argument
forwarding, return and error identity, immutable API, application wiring,
backup constants, and service-worker inclusion. The complete existing suite
must pass before integration.
