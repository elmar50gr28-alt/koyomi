# Engineering Rules

## Required Reading Before Every Task

Codex must read:

- `00_KOYOMI_MASTER_SPEC.md`
- The relevant domain specification
- `DECISIONS.md`
- `14_RELEASE_CHECKLIST.md`

## Pre-Work Report

Before implementation, Codex reports:

- Specifications referenced
- Files to change
- Completion conditions
- Forbidden change areas

## Change Rules

- Do not make changes outside the specification.
- Stop if specifications conflict.
- Stop if existing data may be lost.
- Stop if Git conflicts cannot be resolved safely.
- Keep `main` stable.
- Use feature branches for major profile/storage/UI rebuilds.
- Do not change divination calculations while doing UI work.
- Do not change UI while doing documentation-only work.

## Review Rules

Every implementation report must include:

- Changed files
- Impact range
- Test method and result
- Remaining risks

