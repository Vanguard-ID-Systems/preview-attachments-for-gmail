# Changelog

## 0.1.2 — 2026-11-12

- The float-right group of windows sits inside a shrink-wrapped flex item that Gmail aligns to the right, so floating the group alone changed nothing. Every ancestor between the group and the full-width strip is now pinned left (float, auto margins, flex order, justify-content), and the strip itself gets `justify-content: flex-start`.
- The "windows not moved" diagnostic now prints the computed layout of that chain instead of raw HTML.

## 0.1.1 — 2026-11-12

Fixes from the first live-Gmail test.

- Gmail's compose strip is a full-width `position: absolute` element with the windows in a `float: right` group, not a fixed container. Detection now targets the float-right ancestor and floats it left.
- Content scripts are now plain scripts listed in the manifest instead of a loader doing a dynamic `import()`; the import could fail ("Failed to fetch dynamically imported module") and left the extension inactive.
- Header search covers Gmail's `img` icons (`alt`/`aria-label`) and the window's positioned box, not only the dialog element.

## 0.1.0 — 2026-11-12

Initial release.

- Docked compose windows open on the bottom-left instead of the bottom-right.
- ⇄ button in the compose header moves all docked windows to the right and back; not remembered across reloads.
- Full-screen compose, inline replies and popped-out windows are untouched.
- Structural detection of Gmail's dock and header (class names are hints only), so it works in any Gmail language.
- No permissions, no storage, no network requests.
