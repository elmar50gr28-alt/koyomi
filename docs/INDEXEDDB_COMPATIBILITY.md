# IndexedDB compatibility contract

## Purpose

`src/shared/indexeddb-compat.js` establishes a small, stable boundary around
the current ledger persistence functions while the legacy application remains
in `app.html`. It delegates every call to the existing implementation and does
not contain IndexedDB or encryption logic.

## Public API

- `list(store)` delegates to `ledgerList`.
- `get(store, id)` delegates to `ledgerGet`.
- `put(store, data, forceEncrypted?)` delegates to `ledgerPut`.
- `delete(store, id)` delegates to `ledgerRawDelete`.
- `clear(store)` delegates to `ledgerRawClear`.

Arguments, return values, asynchronous behavior, and errors are forwarded
unchanged. Existing application call sites continue to call the legacy
functions; this boundary is additive only.

## Frozen invariants

- Database name remains `mitsunome_v194_destiny_ledger`.
- IndexedDB version remains `1` and ledger schema version remains `19401`.
- Stores remain `profiles`, `locations`, `readings`, `drafts`, `changes`,
  and `settings` with their existing key paths and indexes.
- No database opening, migration, transaction, or record rewrite is added.
- Encryption selection, key derivation, ciphertext envelope, and plaintext
  compatibility remain owned by the existing ledger functions.
- Person ledger behavior, UI behavior, and Four Pillars logic are unchanged.
- Existing service-worker fetch and cache strategies are unchanged; only this
  new static module is added to the application shell.

## Regression guard

`tests/indexeddb-compat.test.mjs` verifies exact delegation, result and error
identity, immutable API shape, application wiring, frozen ledger constants,
and service-worker inclusion. The full existing regression suite must also
pass before this boundary is integrated.
