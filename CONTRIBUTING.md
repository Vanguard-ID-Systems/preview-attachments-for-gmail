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
| `src/chips.js` | Finds chips, reads name/URL/size, injects the button. |
| `src/capture.js` | Keeps files the user attaches, for network-free previews. |
| `src/fetcher.js` | Chooses the local file or fetches from Gmail. |
| `src/viewer.js` | The modal shell in the Gmail page. |
| `src/frame.*` | The extension-owned iframe that renders the file. |

## Fixing a broken chip

1. In Gmail, right-click the chip, choose Inspect, and copy its outer HTML.
2. Add a reduced version of it to `test/mock-gmail.html` (replace real URLs with `__BASE__/mail/u/0/?view=att&file=test.png`).
3. Adjust `src/selectors.js` (and `src/chips.js` only if the structure, not just the labels, changed).
4. Add an assertion in `scripts/smoke.js` and run `npm run smoke`.

Non-English Gmail is supported by matching structure rather than labels. When adding a locale case, include the chip's `aria-label` text as it appears in that language.

## Security

Attachment URLs must stay same-origin (`isSafeAttachmentUrl` in `src/chips.js`). The viewer's PDF branch navigates an iframe to a `blob:` URL with the extension's origin; never route HTML, SVG or other active content through it. Please report security issues privately via the contact in `PRIVACY.md` rather than in a public issue.

## Releasing

1. Bump `version` in `manifest.json` and add a `CHANGELOG.md` entry.
2. `npm run package` and upload the zip from `dist/` to the Chrome Web Store Developer Dashboard.
