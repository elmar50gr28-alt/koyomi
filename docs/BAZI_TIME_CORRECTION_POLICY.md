# Bazi birth-time correction policy

Birth-time correction follows the existing `solar` school setting:

- `true` (and the historical default) applies longitude correction.
- `standard` keeps the entered standard time unchanged.
- Missing longitude keeps the entered time and emits `longitude-missing`.

This change is limited to the modular Bazi calculation path. It does not
change the profile ledger, persistence, encryption, backup, service worker or
the current screen markup.
