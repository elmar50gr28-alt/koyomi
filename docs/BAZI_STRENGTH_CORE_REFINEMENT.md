# Bazi day-master strength refinement

The day-master strength core explicitly scores six dimensions and returns both
the total and the evidence behind it.

## Weight meanings

- **Month command** has the largest single weight because it represents the
  seasonal environment shared by the whole chart. Same-element and resource
  seasons support the day master; output, wealth and officer seasons consume
  or constrain it at different strengths.
- **Roots** use the hidden-stem share already stored in the chart. Position
  weights are month 1.50, day 1.25, hour 0.90 and year 0.75: closer and more
  seasonally central roots are treated as more stable.
- **Other hidden stems** use their existing main/middle/residual qi share.
  Same-element hidden stems are counted as roots, so they are not counted a
  second time in this dimension.
- **Exposed stems** omit the day stem itself. Month is weighted 1.10 and the
  more indirect year/hour stems 0.90.
- **Element distribution** compares supportive shares with output, wealth and
  officer pressure. Its total range is smaller than season and roots so raw
  counts cannot overrule the seasonal structure by themselves.
- **Qi flow** adjusts at most a small amount from the five-element generation
  chain coverage. It is supporting context, not the main decision.

The seven levels use documented score boundaries: extreme at ±5, strong/weak
at ±3, slight strength/weakness at ±1.2, and balanced between them.

When birth hour is unknown, no hour is invented. The result includes a ±1.35
score range, possible levels and lower confidence. The old candidate decision
is retained under `legacyComparison` for migration review.

Pattern and yongshen rules continue to receive the old comparison level in
this change, so their final decisions are not silently changed.
