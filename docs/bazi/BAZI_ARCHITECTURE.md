# KOYOMI Bazi Architecture

Phase 1 adds a deterministic Shichu Suimei foundation without changing the existing profile UI, saved people, or current divination flows.

## Layers

- `data/bazi`: auditable seed data for stems, branches, relations, schools, rules, sources, and test cases.
- `src/bazi/calendar`: date normalization, fixed Phase 1 solar-term boundaries, true solar time, and pillar cycles.
- `src/bazi/chart`: four-pillar chart, hidden stems, ten gods, month command, empty void, and element balance.
- `src/bazi/relations`: heavenly-stem and earthly-branch relation evaluation.
- `src/bazi/strength`: dimensional strength evaluation. It does not collapse schools into one score.
- `src/bazi/patterns`: pattern candidates with met/failed conditions.
- `src/bazi/yongshen`: separate balance, climate, passage, illness-medicine, pattern, and assistant-god methods.
- `src/bazi/luck`: deterministic luck-cycle shell with school-aware direction and start metadata.
- `src/bazi/evidence`: rule/source lookup for explainability.
- `src/bazi/schools`: school profiles and comparison API.
- `src/bazi/validation`: result schema validation and browser smoke test.

## Public API

`src/bazi/index.js` exports all required Phase 1 functions:

- `calculateBaziChart(profile, schoolConfig)`
- `calculateSolarTerms(datetime, timezone)`
- `calculateTrueSolarTime(datetime, longitude)`
- `calculateLuckCycles(chart, schoolConfig)`
- `evaluateStemRelations(chart, schoolConfig)`
- `evaluateBranchRelations(chart, schoolConfig)`
- `evaluateStrength(chart, schoolConfig)`
- `evaluatePatterns(chart, schoolConfig)`
- `evaluateYongshen(chart, schoolConfig)`
- `compareSchools(profile, schoolIds)`
- `explainRule(ruleId)`
- `getEvidence(entityId)`
- `validateChartResult(result)`

`calculateBazi(profile, schoolConfig)` is a convenience wrapper that returns chart, relations, strength, patterns, yongshen, luck cycles, validation, evidence, and interpretation facts.

## Data Protection

The engine consumes the existing person profile object. It does not create, mutate, or delete people. Personal data remains in browser storage controlled by the existing app.
