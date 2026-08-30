# Stable mundane map selection

## UI contract

- Natural-environment and conflict themes show grid colors by default, not ranking pins.
- The selected reading and geographic point survive pan, zoom, viewport refinement and list-scope changes.
- Only an explicit selection changes the reading location. The separate return button moves the camera.
- World pins use the first three entries of the world list and never use viewport ranking. They are optional; a selected pin replaces a coincident numbered pin.
- The legend and selected reading are outside the map. A collapsed region browser follows the reading, with world/viewport scopes and ten-at-a-time expansion.
- Date changes retain the location, hide old results during calculation and rebuild the reading for the new date. A theme change clears selection. Obsolete deferred date requests are ignored.
- Use GeoJSON properties.cellId before the renderer's feature id: H3 strings must not be interpreted as numeric renderer ids.

## Validation on 2026-08-31

- In-app browser, actual app.html and actual map renderer, desktop and 390 x 844 viewport.
- Natural environment: initial pins hidden; list selection; explicit camera move; drag; refined viewport; world/viewport list switch; date update preserving location; selection clear; direct grid tap.
- Conflict: theme reset, direct grid tap and date update at the selected location.
- Visual inspection: map not covered by reading/list panels; one selected pin; legend below map; mobile action buttons fit the width.
- Executable regression uses production selection/global-ranking functions to check that viewport scans preserve selection and world pin coordinates; pins are off by default.
- Cache generation bumped. Offline asset registration is checked by tests; no browser network-offline simulation was performed.

The existing Japan boundary checksum test now normalizes CRLF to LF before hashing, retaining its original expected content hash. The boundary dataset was not changed.
