# Bazi chart foundation extraction

The year, month, day and hour pillar calls are now grouped in
`src/bazi/chart/foundation.js`. The existing calendar functions remain the
single calculation implementation, so the extraction does not introduce a
second formula or change results.

The chart builder still resolves profile input, timezone and true-solar-time
correction before calling the new foundation. Interpretation, rendering,
ledger storage, encryption and backup behavior are unchanged.

Equivalence tests compare the previous call sequence with the new foundation
at Risshun, monthly solar-term and 23:00/00:00 boundaries.
