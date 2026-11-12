# Contributing

Thanks for helping. This project is deliberately small: no build step, no runtime dependencies.

## Setup

```bash
npm ci
npx playwright install chromium
```

## Checks

```bash
npm run check   # manifest + syntax checks
npm run smoke   # Playwright end-to-end test against test/mock-gmail.html
npm run package # builds dist/<name>-<version>.zip for the store
```

CI runs `check` and `smoke` on every pull request.

## Where things live

| File | Purpose |
|---|---|
| `src/selectors.js` | Every Gmail DOM dependency. Change this first when Gmail changes its markup. |
| `src/dock.js` | Finds the docked-compose strip, pins it left, releases it for full-screen compose, holds the current side. |
| `src/toggle.js` | The ⇄ header button: placement, labels, delegated click/keyboard handling. |
| `test/mock-gmail.html` | A reduced copy of Gmail's dock structure used by the smoke test. |

## Fixing a dock that no longer moves

1. In Gmail, open DevTools → Console and copy the HTML printed after `[Compose on the Left] dock not moved` (or right-click the compose window → Inspect and walk up to the `position: fixed` ancestor).
2. Add a reduced version of it to `test/mock-gmail.html`.
3. Adjust `src/selectors.js` (and `src/dock.js` only if the structure, not just the class names, changed).
4. Add an assertion in `scripts/smoke.js` and run `npm run smoke`.
