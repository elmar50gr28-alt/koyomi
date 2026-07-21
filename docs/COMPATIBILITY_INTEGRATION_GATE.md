# Compatibility integration gate

## Purpose

The first modularization stage exposes five additive compatibility boundaries:

1. calendar and local time;
2. profile normalization and validation;
3. ledger cryptography;
4. IndexedDB ledger persistence;
5. backup, export, and import.

`tests/compatibility-integration.test.mjs` is the shared gate that prevents
these boundaries from drifting apart while the legacy application remains the
behavioral source of truth.

## Gate requirements

For every boundary, the test verifies that:

- its declared API and created facade are immutable;
- every public operation delegates and preserves the returned value;
- the classic-script legacy bridge exists before the module import;
- the public facade is created after the module import;
- the module is present in both the service-worker shell and offline contract;
- the offline contract contains the complete ordered set of shared modules.

## Change policy

This checkpoint does not replace the domain-specific equivalence tests. A
future extraction must first preserve those tests, then change one boundary at
a time. IndexedDB schema, stored records, person-ledger behavior, encryption
formats, backup formats, UI behavior, Four Pillars decisions, and cache
strategies require separate explicitly reviewed changes.

No production behavior is changed by this gate.
