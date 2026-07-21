# Profile validation core extraction

## Change

The implementation formerly named `ledgerValidateProfile` in `app.html` now
lives in `src/shared/profile-validation-core.js`. The shared script loads
synchronously before the legacy application. `app.html` keeps the existing
name as an alias, so all save and import call sites remain unchanged.

## Preserved validation

The core returns the same ordered Japanese error messages for:

- a missing display name;
- an invalid or future birth date;
- an invalid 24-hour birth time;
- latitude outside -90 through 90;
- longitude outside -180 through 180.

The input object is not normalized, cloned, encrypted, or persisted by this
core.

## Excluded changes

Profile normalization, person-ledger fields, IndexedDB schema and records,
encryption, backup import behavior, UI, Four Pillars logic, and cache strategy
are unchanged. The Service Worker cache version changes only to distribute the
new static core file.
