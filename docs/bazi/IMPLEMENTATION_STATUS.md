# KOYOMI Bazi Implementation Status

## Phase 1 Complete

- Data directory created under `data/bazi`.
- Deterministic API directory created under `src/bazi`.
- Stem, branch, element, hidden-stem, ten-god, relation, school, rule, source, terminology, and test-case seed data added.
- Required public API functions exported from `src/bazi/index.js`.
- Result structure separates calculation facts, evidence, confidence, warnings, and interpretation facts.
- Unknown birth time is treated as partial and does not assume noon.
- Existing profile and person data are not mutated.
- Browser validation page added.

## Phase 2 Remaining

- Astronomical 24 solar-term calculation with term entry times.
- Verified historical calendar case corpus.
- Full twelve-stage integration into chart output.
- Full storage opening, dark-combination, and competing-relation resolution.
- Professional pattern establishment/break/rescue rule set.
- Full yongshen conflict resolution and source review.
- Luck start date precision from solar-term distance.
- UI view for professional Bazi detail panels.
