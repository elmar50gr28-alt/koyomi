# Calendar and time core extraction

## Change

The implementations formerly named `fmtIso`, `safeDate`, `startOfDay`, and
`calendarFormat` in `app.html` now live in
`src/shared/calendar-time-core.js`. The shared script loads synchronously
before the legacy application, which keeps initialization order deterministic.

`app.html` retains the existing local names as aliases. Existing call sites
and the previously published `window.KOYOMI_CALENDAR_TIME` compatibility API
therefore remain unchanged.

## Preserved behavior

- Dates are formatted from local year, month, and day values.
- Date-only input is parsed at local noon.
- Empty or invalid date-only input returns `null`.
- Start of day uses the local calendar at `00:00:00.000`.
- Alternate calendars continue to use `Intl.DateTimeFormat` with the same
  locale extension and options.
- Unsupported calendar formatting returns `この環境では未対応`.

## Excluded changes

This extraction does not change IndexedDB, the person ledger, encryption,
backup formats, UI behavior, Four Pillars calculations, or cache strategy.
The Service Worker cache version changes only to distribute the new static
core file.
