# Profile save core extraction

Profile duplicate matching and important-field change calculation now live in
`src/shared/profile-save-core.js`. Both operations are deterministic and do not
touch the DOM, IndexedDB, settings, encryption, notifications, or rendering.

The legacy save workflow keeps responsibility for confirmation, main-profile
updates, change-record persistence, draft cleanup, and UI refresh. This keeps
the current behavior stable while establishing the next boundary for a profile
application service.
