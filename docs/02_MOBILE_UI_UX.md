# Mobile UI/UX Specification

## Fixed Requirements

- iPhone portrait is the baseline.
- No horizontal scroll at a minimum width of 320px.
- One-handed thumb operation is the default.
- Tap targets must be at least 44x44px equivalent.
- Body text should generally be 16px or larger.
- One screen should have one clear purpose.
- Bottom fixed navigation must be hidden while input, select, or textarea is focused.
- The software keyboard must not hide the focused input.
- Support Visual Viewport API when available.
- Support `safe-area-inset-*`.
- Do not depend only on `100vh`; use `100dvh`, `100svh`, or measured viewport values as appropriate.
- Do not call `scrollIntoView` unconditionally on focus.
- Scroll only the minimum needed when the focused input is actually hidden.
- The first input must not be hidden by fixed headers.
- Autosave must not redraw the whole form or change scroll position.
- Do not replace the focused DOM node while the user is typing.
- Fixed UI elements must not overlap each other.
- Do not show a large success toast for every save.
- Save failures must be clearly shown.
- Admin or pro operations must not be lined up on general user screens.
- iPhone Safari real-device or equivalent mobile verification is required.

## General-Screen Removal Candidates

Remove these from general screens while preserving internal capabilities and data:

- Duplicate
- Manual save
- Sample input
- Input save
- Result copy
- Input clear
- Save current input to ledger
- Record this reading to person ledger

If needed, move them to expert/developer areas or detailed settings.

## Keyboard Behavior

When input starts:

- Hide bottom nav.
- Hide nonessential fixed buttons.
- Keep the focused field visible above the keyboard.
- Preserve scroll stability.

When input ends:

- Restore bottom nav.
- Do not jump the page.

