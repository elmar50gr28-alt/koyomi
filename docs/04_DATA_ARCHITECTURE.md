# Data Architecture

## Storage Policy

KOYOMI is offline-first. Personal data is stored on device by default using browser storage such as localStorage and IndexedDB.

## Data Classes

- Person profiles
- Birthplace/location records
- Reading snapshots
- User settings
- Evidence/reference data
- Cache and PWA assets

## Compatibility

- Existing person data must remain readable.
- Unknown fields should be preserved.
- Migrations must be idempotent.
- Storage corruption must not stop the whole app.
- Do not delete user data during UI cleanup.

## Shared Profile Flow

1. User creates or edits one profile.
2. Data is saved by `personId`.
3. Each divination system reads required fields.
4. Readiness engine reports missing/partial information.
5. Calculation engine produces deterministic result.
6. Explanation layer shows evidence, school, confidence, and plain-language translation.

## Readiness Engine

Each divination system must expose:

- `ready`
- `partial`
- `unavailable`
- `confidence`

Missing information is grouped as:

- Required
- Improves precision
- Expert setting

Example display:

- Shichusuimei: ready.
- Western astrology: house precision is low because birth time is unknown.
- Name divination: reading/glyph form not confirmed.
- Sukuyo: ready.

Do not blame the user for missing data. Explain what improves when the user adds it. Prefer system-by-system readiness over a single generic progress gauge.

## Service Worker

- Keep offline startup.
- Use versioned caches.
- Remove old caches on activate.
- Prefer freshness for HTML where practical.
- Ensure GitHub Pages updates can be seen after reload.
