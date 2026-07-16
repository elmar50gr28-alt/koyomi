# KOYOMI Bazi Implementation Status

## Phase 1 Complete

- Data directory created under `data/bazi`.
- Deterministic API directory created under `src/bazi`.
- Stem, branch, element, hidden-stem, ten-god, relation, school, rule, source, terminology, and test-case seed data added.
- Required public API functions exported from `src/bazi/index.js`.
- Additional Phase 1 API aliases exported: `calculateFourPillars`, `calculateTenGod`, `calculateTwelveStage`, `getHiddenStems`, `evaluateBasicStemRelations`, `evaluateBasicBranchRelations`, `validateBaziResult`.
- GitHub Actions workflow files added for static validation, Bazi engine tests, mobile regression, and Pages readiness.
- Node-based regression tests added under `tests/`.
- Result structure separates calculation facts, evidence, confidence, warnings, and interpretation facts.
- Unknown birth time is treated as partial and does not assume noon.
- Existing profile and person data are not mutated.
- Browser validation page added.

## Phase 2 Remaining

- Astronomical 24 solar-term calculation with term entry times.
- Verified historical calendar case corpus.
- Full twelve-stage source review beyond the Phase 1 deterministic matrix.
- Full storage opening, dark-combination, and competing-relation resolution.
- Professional pattern establishment/break/rescue rule set.
- Full yongshen conflict resolution and source review.
- Luck start date precision from solar-term distance.
- UI view for professional Bazi detail panels.
- Manual approval before merging this feature branch to `main`.

## Phase 2 Added

- Month command, roots, exposed stems, element distribution, climate, qi flow, and day-master strength are evaluated as separate structured factors.
- Pattern candidates, follow-pattern candidates, and transformation-pattern candidates are separated from final establishment.
- Yongshen methods are separated into support-control, climate, mediation, illness-medicine, pattern, and assistant-god.
- Favorable/unfavorable element classification is returned as contextual structured data.
- Luck cycles include direction rule, approximate start age/date, cycle stems/branches, confidence, and warnings.
- Phase 2 data files and regression test cases were added.

## Human Review Required

- Final格局 establishment.
- 従格 and transformation pattern strict establishment.
- Final用神 when methods conflict.
- Exact大運 start timing.
