# Bazi yongshen core refinement

The refined core compares six methods without forcing a weakly supported chart into one final yongshen.

## Priority and weights

- Pattern and month-command evidence lead ordinary selection because they describe the chart's operating structure.
- Climate urgency remains a separate axis. Explicit heat or cold may lead even without two-method agreement; ordinary dryness or wetness cannot.
- Support/control uses the precise strength score but does not mechanically map every weak chart to resource/companion or every strong chart to output/wealth/officer.
- Mediation requires two active controlling elements. Distribution shortage alone is not enough.
- Illness/medicine records the disease and medicine separately and gains weight only for actual excess or blocked flow.
- Agreement between independent methods adds confidence. Close candidates that control each other cause a withheld decision.

`YONGSHEN_WEIGHTS` exposes named method weights, the agreement bonus, thresholds, and the unknown-hour penalty. Schools can override them through `schoolConfig.yongshenWeights`. Special follow/transformation patterns stay conservative unless `allowSpecialPatternYongshen` is enabled.

## Compatibility

The former result remains under `legacyComparison`, and its existing top-level fields remain available to the current reading generator. New comparison fields use names such as `primaryYongshen`, `methodResults`, `consensus`, and `scoreBreakdown`.
