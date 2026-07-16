# Release Checklist

Do not publish to `main` unless applicable items are checked.

## Data

- [ ] Existing person data can be loaded.
- [ ] Unknown fields are not lost.
- [ ] Same person is not duplicated by edit.
- [ ] Saved content remains after reload.
- [ ] Saved content remains after app restart.
- [ ] Migration is idempotent.

## Mobile

- [ ] iPhone SE equivalent.
- [ ] Standard iPhone equivalent.
- [ ] Pro Max equivalent.
- [ ] Android Chrome equivalent.
- [ ] No horizontal scroll.
- [ ] Keyboard does not hide input.
- [ ] First input is not hidden by header.
- [ ] Autosave does not jump the screen.
- [ ] Bottom nav hides during input.
- [ ] Bottom nav returns after keyboard closes.

## Function

- [ ] Basic profile input.
- [ ] Birthplace search.
- [ ] Birth time unknown.
- [ ] Detailed settings.
- [ ] 家族・大切な人 screen.
- [ ] Transition to reading screen.
- [ ] Readiness state per divination system.

## Quality

- [ ] JavaScript errors: 0.
- [ ] Service Worker update confirmed.
- [ ] Offline startup maintained.
- [ ] Latest GitHub Pages version confirmed.
- [ ] Major work verified on feature branch before main.

