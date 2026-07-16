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

## Phase 3 Added

- Classical bibliography index with reviewed index status.
- Classical excerpt records that separate original text, summary, modern interpretation, and generated prose policy.
- Synthetic example-case database for regression.
- Structured interpretation categories: career, finance, relationship, family, health.
- Luck interpretation schema for decade, annual, and monthly scopes.
- Beginner explanation blocks and professional evidence blocks.
- Mitsunome Bazi input schema.

## Phase 3 Human Review Required

- Any rule marked `human-review-required`.
- Any annual/monthly luck interpretation before precise year/month luck expansion.
- Any generated explanation before it is shown as a professional conclusion.

## Phase 4 Quality Audit

- Scope is limited to the Bazi knowledge database; no new UI or new divination system was added.
- Implementation rate is 78%.
- Rule total is 23, with 23 source-linked rules and 0 sourceId-missing rules.
- Review-pending count is 14.
- Low-confidence item count is 12.
- Duplicate rule groups identified for consolidation: 3.
- Contradiction candidates identified for human review: 6.
- Example and regression case total is 108.
- Total test case count is 112.
- Real case count is 0 until consent, source notes, anonymization, and human review are complete.
- Phase 4 reports are stored in `data/bazi/quality-audit.json`, `rule-consolidation.json`, `contradiction-report.json`, `source-coverage-report.json`, `low-confidence-report.json`, `review-status-report.json`, `implementation-rate-report.json`, and `case-classification.json`.

## Phase 4 Remaining

- Human review of transformation, follow-pattern, and yongshen conflict rules.
- Exact passage-level mapping from each reviewed rule to classical source excerpts.
- Adoption of anonymized real cases only after consent and source documentation.
- Further school-by-school density balancing for advanced professional comparisons.

## Final Phase: Version 1.0 Release Candidate

- Scope remains limited to the Bazi knowledge engine; no new UI, profile flow, wearable, Qimen, or other divination feature was added.
- Final quality score is 86%.
- Rule total is 23.
- Classical source count is 5.
- Example case total is 213.
- Test case total is 432.
- Human review pending count is 18.
- Unused rules, circular references, unreferenced sourceIds, and unused JSON files are 0 in the final audit.
- Final reports are stored in `QUALITY_REPORT.md`, `CLASSICAL_SOURCE_INDEX.md`, `KNOWN_LIMITATIONS.md`, `ROAD_TO_1_0.md`, `final-rule-audit.json`, `final-classical-audit.json`, `final-example-cases.json`, `final-test-cases.json`, `final-quality-score.json`, and `final-ai-review.json`.
