# KOYOMI Codex Rules

## Low-credit development policy

- One task = one purpose.
- Search before reading files.
- Do not read `app.html` in full unless explicitly required.
- Do not scan the whole repository unless explicitly requested.
- Read only the files and ranges relevant to the task.
- Prefer existing modules under `src/`.
- Do not add new business logic directly to `app.html`.
- Do not perform unrelated refactoring.
- Do not redesign working code without a concrete reason.
- Run only the tests related to the changed area during development.
- Run the full test suite only before merge or release.
- Stop when the requested task is complete.
- Report extra improvement ideas separately instead of implementing them automatically.

## Relevant documentation

Read documentation only when the task requires it.

- `ARCHITECTURE.md`: architecture or module-boundary changes
- `ROADMAP.md`: roadmap or priority decisions
- `DECISIONS.md`: decisions that may conflict with an existing policy
- `VISION.md`: product-direction changes
- `PROJECT_MANAGER.md`: project-management tasks

Do not read all of these files for routine code changes.

## Main app policy

`app.html` is legacy integration code and should not be expanded unnecessarily.

New logic should normally go into:

- `src/bazi/`
- `src/world/`
- `src/mundane/`
- `src/ui/`
- `src/shared/`
- `src/reading/`
- `src/persona/`

Keep changes to `app.html` to the minimum integration code required.

## Validation

Use targeted tests first.

Examples:

- earthquake prediction: `npm run test:prediction-engine`
- world map: `npm run test:world-map-detail`
- Bazi: relevant `test:bazi*` command
- UI/mobile: corresponding UI or mobile regression test

Do not run `npm test` after every small change.
