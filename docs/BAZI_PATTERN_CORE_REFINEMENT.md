# Bazi pattern core refinement

The pattern core evaluates candidates without forcing every chart into one pattern.

## Evidence order

1. Month command hidden stems are primary. Main qi is weighted above middle and residual qi.
2. Exposure in the month, year, or hour stem makes month-command qi visible. The month stem is nearest to the command.
3. Roots confirm that the same ten-god element is supported elsewhere. They cannot create a regular pattern without month evidence.
4. The precise day-master strength result is supporting evidence only.
5. Month-branch clash, punishment, harm, destruction, stem relations, and month void can obstruct establishment.
6. Unknown birth hour reduces score and confidence instead of inventing an hour pillar.

The exported `PATTERN_WEIGHTS` names each weight by meaning. A school may override weights and thresholds through `schoolConfig.patternWeights` and `schoolConfig.patternThresholds`. Follow and transformation establishment remain disabled unless a school explicitly enables them.

## Status policy

- `candidate`: enough month-command evidence, but establishment is not secure.
- `established`: adequate score, visible month qi, and no breaking factor.
- `not-established`: insufficient evidence.
- `mixed`: competing candidates are too close to select safely.
- `broken`: a sufficiently supported candidate has multiple obstruction factors.

`legacyComparison` retains the former month-stem-only result. Pattern output is refined, while yongshen final-selection rules are unchanged.
