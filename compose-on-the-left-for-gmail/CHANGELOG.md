# Changelog

## 0.1.0 — 2026-11-12

Initial release.

- Docked compose windows open on the bottom-left instead of the bottom-right.
- ⇄ button in the compose header moves all docked windows to the right and back; not remembered across reloads.
- Full-screen compose, inline replies and popped-out windows are untouched.
- Structural detection of Gmail's dock and header (class names are hints only), so it works in any Gmail language.
- No permissions, no storage, no network requests.
