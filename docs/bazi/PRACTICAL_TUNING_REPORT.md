# KOYOMI Bazi Practical Tuning Report

Version: bazi-practical-tuning-20260717

## Scope

This phase tunes the existing Bazi calculation, knowledge database, and reading-generation engine for practical reading use.

No new divination system was added. No new large calculation method was added. The work focuses on reading structure, explanation quality, evidence visibility, timing integration, Mitsunome input quality, and mobile reading ergonomics.

## Audited Representative Cases

20 synthetic regression profiles were added in `data/bazi/practical-audit-cases.json`.

Covered conditions:

- exact birth time
- approximate birth time
- unknown birth time
- Japan birth place
- overseas birth place
- strong day-master candidate
- weak day-master candidate
- strength conflict
- regular pattern candidate
- follow-pattern candidate
- pattern conflict
- yongshen and climate aligned
- yongshen and climate conflicting
- before decade-luck switch
- after decade-luck switch
- annual tailwind
- annual caution
- large school difference
- occupation present
- occupation missing
- iPhone long-reading display

## Reading Categories Improved

- overall conclusion
- essence and personality
- talent
- weakness and caution
- career
- finance
- love
- marriage
- relationships
- family
- health tendency
- learning
- creation
- decade luck
- annual luck
- monthly luck
- important timing
- good fortune advice

Each section now keeps:

- conclusion
- evidence
- opposing factors
- conditions
- timing
- action
- caution
- avoidance path
- confidence
- sourceIds
- schoolIds
- reviewStatus
- unresolvedFactors

## Practical Reading Rules

- The overall conclusion appears before detailed sections.
- Low-confidence readings use softer language.
- Health text is limited to lifestyle tendencies and is not medical advice.
- Timing is expressed as ranges and overlays, not exact-date certainty.
- Occupation is used only to translate wording into daily life. It does not change calculation logic.
- School differences remain visible when strength, climate, pattern, and luck-cycle rules may diverge.
- Mitsunome input separates normal mode and direct mode, and both include an avoidance or recovery path.

## UI Tuning

The existing Bazi reading area now renders:

- overall conclusion
- important theme
- current luck flow
- action from today
- avoid item
- confidence

Long sections are collapsed with `details` elements for iPhone readability. Expert evidence is also collapsed.

## Known Limitations

- The 20 practical cases are synthetic regression profiles, not adopted real-life cases.
- Some pattern and yongshen conflicts still require human review.
- Annual and monthly luck readings remain lower confidence until more source-reviewed cases are added.
- The browser smoke test is static in local environments without a full browser automation runtime.

## Human Review Waiting

Human review is intentionally retained for:

- follow-pattern candidates
- pattern conflict cases
- strength conflict cases
- yongshen versus climate conflicts
- large school-difference cases
- health tendency wording
- annual and monthly luck interpretation
