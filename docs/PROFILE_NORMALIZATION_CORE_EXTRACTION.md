# Profile normalization core extraction

The complete person-profile normalization pipeline now lives in
`src/shared/profile-normalization-core.js`. The legacy application injects its
existing text sanitizer, ID generator, clone helper, name enrichment helper,
schema version, and relationship vocabulary, then keeps the established
`ledgerNormalizeProfile` call sites unchanged.

The core preserves nested ledger fields, unknown top-level fields, timestamps,
identity aliases, name enrichment, and the existing default and coercion rules.
It does not touch the DOM, IndexedDB, encryption, import/export, or Four Pillars
logic, and it does not mutate the supplied profile.
