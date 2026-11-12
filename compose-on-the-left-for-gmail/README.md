# Compose on the Left for Gmail

A Chrome / Edge extension that docks Gmail's compose window to the **bottom-left** of the page instead of the bottom-right, so the email you are reading in the preview pane stays visible while you write. A ⇄ button in the compose header moves the window back to the right at any time.

<!-- TODO: add docs/screenshot.png (1280x800) of a compose window docked left over a split-pane inbox; the same image serves as the Web Store screenshot. -->

- Every new message, reply or forward that opens as a docked window appears on the left.
- Click ⇄ in the window's header (next to minimize / full screen / close) to move all docked windows to the right, and again to move them back. The choice lasts until the Gmail tab reloads, then it defaults to left again.
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

Gmail keeps all docked compose windows in one `position: fixed` strip anchored to the bottom-right corner.

1. `src/dock.js` finds that strip structurally: the compose form, then its nearest fixed-position ancestor. It marks the strip with a `data-gcl-dock` attribute and injects a small stylesheet that pins it to the left edge and mirrors the window order, so the newest window is nearest the edge, as on the right.
2. `src/toggle.js` adds the ⇄ button to each docked window's header and flips the side when clicked. The side is a variable in memory; nothing is saved.
3. If a window is wider than 60% of the viewport (Gmail's full-screen compose), the strip is released so Gmail can centre it.

All Gmail DOM dependencies live in `src/selectors.js`. Detection is structural; Gmail's minified class names are hints only.

## Limitations

- Docked windows move together. With two windows open, the ⇄ button moves both.
- The window covers the left of the page (the message list in split-pane layouts, or the label list). That is the point, but it means the chat/Meet panel is covered too.
- Gmail's own "Default to full-screen" setting bypasses docking entirely; this extension does nothing in that mode.

## If the window does not move

1. Reload the Gmail tab.
2. Open DevTools (F12) → Console. You should see `[Compose on the Left] active`. If not, open `chrome://extensions`, find the extension and click **Errors**.
3. If the message is there but the window stays on the right, the console also contains `[Compose on the Left] dock not moved` followed by the dock's HTML. Open an issue and paste it in; it almost always needs only a change to `src/selectors.js`.

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
