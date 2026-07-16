# KOYOMI Bazi Calculation Spec

## Input

The engine accepts the existing KOYOMI profile shape and normalizes:

- `personId`
- display name
- birth date
- birth time
- unknown-time flag
- birthplace label
- longitude
- timezone and UTC offset

Unknown birth time is never replaced with noon. The hour pillar is omitted and confidence is lowered.

## Calendar

Phase 1 uses deterministic fixed-day solar-term boundaries to establish the engine contract. This is intentionally marked as `phase1-fixed-day`. Phase 2 should replace it with astronomical term-entry times.

## Pillars

- Year pillar changes at the spring boundary.
- Month pillar follows solar-term month branches.
- Day pillar uses a deterministic 60-cycle base date.
- Hour pillar uses the day-stem hour table and respects school configuration metadata for zi-hour policy.

## True Solar Time

`calculateTrueSolarTime` applies longitude correction:

`(birth longitude - timezone standard longitude) * 4 minutes`

When longitude is missing, the engine returns the original datetime with `precision: timezone-only` and a warning.

## Result

The result separates:

- input
- normalizedInput
- calendarCalculation
- chart
- relations
- strength
- patterns
- yongshen
- luckCycles
- schoolComparison
- evidence
- confidence
- warnings
- interpretationFacts

Natural-language interpretation must use these structured facts and evidence IDs.
