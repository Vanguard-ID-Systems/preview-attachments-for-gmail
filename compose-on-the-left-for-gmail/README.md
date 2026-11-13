# Compose on the Left for Gmail

A Chrome / Edge extension that adds a **⇄ button** to Gmail's compose window header. Click it and the compose window moves from Gmail's usual bottom-right position to the **bottom-left**, so the email you are reading in the preview pane stays visible while you write. Click again to move it back.

<!-- TODO: add docs/screenshot.png (1280x800) of a compose window docked left over a split-pane inbox; the same image serves as the Web Store screenshot. -->

- Gmail's normal behaviour is unchanged: new messages, replies and forwards open at the bottom-right as usual.
- The ⇄ button sits in the compose header next to minimize / full screen / close. It moves all docked compose windows to the left, and back.
- Nothing is remembered. Once every docked compose window is closed, the next one opens on the right again.
- Inline replies, popped-out windows and full-screen compose are left exactly as Gmail draws them.
- Works in any Gmail language.
- **Nothing leaves your browser.** No permissions, no storage, no analytics. See [PRIVACY.md](PRIVACY.md).
- No build step, no dependencies.

## Install

**From the Chrome Web Store** — link to come.

**Unpacked (development or personal use)**
1. Download or clone this repository.
2. Open `chrome://extensions` (Edge: `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the repository folder.
4. Reload any open Gmail tab.

## How it works

Gmail keeps all docked compose windows in a full-width strip along the bottom of the page; inside it, the group of windows is floated right.

1. `src/dock.js` finds that group structurally: the compose form, then its nearest ancestor with `float: right`. When the left side is requested, it marks the group (`data-gcl-row`) and every ancestor up to the full-width strip (`data-gcl-pin`, `data-gcl-strip`), and a small injected stylesheet pins them to the left: float, auto margins, flex order and `justify-content`. On the right side the markers are set to `right` and the stylesheet does nothing.
2. `src/toggle.js` adds the ⇄ button to each docked window's header and flips the side when clicked. The side is a variable in memory, starts as `right`, and resets to `right` when the last docked window closes.
3. If a window is wider than 60% of the viewport (Gmail's full-screen compose), the group is released so Gmail can centre it.

All Gmail DOM dependencies live in `src/selectors.js`. Detection is structural; Gmail's minified class names are hints only. The four files in `src/` are plain content scripts that share one scope (no modules, no dynamic imports, no web-accessible resources).

## Limitations

- Docked windows move together. With two windows open, the ⇄ button moves both, and a window opened while the others are on the left opens on the left too.
- On the left, the window covers the message list (in split-pane layouts) or the label list, and the chat/Meet panel if shown.
- Gmail's own "Default to full-screen" setting bypasses docking entirely; this extension does nothing in that mode.

## If the button is missing or the window does not move

1. Reload the Gmail tab.
2. Open DevTools (F12) → Console. You should see `[Compose on the Left] active`. If not, open `chrome://extensions`, find the extension and click **Errors**.
3. If the message is there but clicking ⇄ leaves the window on the right, the console also contains `[Compose on the Left] windows not moved` followed by the relevant HTML. Open an issue and paste it in; it almost always needs only a change to `src/selectors.js`.

## Deploy to a Google Workspace organization

1. Publish the extension to the Chrome Web Store (see [docs/store-listing.md](docs/store-listing.md)). Set visibility to **Private** for your domain, or **Public**.
2. In the Google Admin console: **Devices → Chrome → Apps & extensions → Users & browsers**, select the organizational unit, add the extension by its ID, and choose **Force install** or **Allow install**.
3. Updates roll out automatically when a new version is approved on the store.

Edge honours the same policy when configured to use the Chrome Web Store, or the same zip can be published to the Edge Add-ons store.

## Development

```bash
npm ci && npx playwright install chromium
npm run check    # manifest + syntax checks
npm run smoke    # end-to-end test against test/mock-gmail.html
npm run package  # builds dist/<name>-<version>.zip for the store
```

The smoke test loads the content-script modules on a mock page that reproduces Gmail's dock structure and exercises every code path except Gmail's live markup. Verify against real Gmail after changing `src/selectors.js`.

## License

[MIT](LICENSE). Not affiliated with Google. Gmail is a trademark of Google LLC.
