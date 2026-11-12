# Preview Attachments for Gmail

A Chrome / Edge extension that adds a **preview button** to every attachment in a Gmail compose window. Click it to see the image, PDF or text file in a viewer, instead of downloading it to check what you attached.

<!-- TODO: add docs/screenshot.png (1280x800) of the viewer open over a real compose window; the same image serves as the Web Store screenshot. -->

- Works in new messages, replies, forwards and reopened drafts, in any Gmail language.
- Images (fit or actual size), PDFs (Chrome's viewer), text/CSV/JSON. Other types get a card with name, size and a download button.
- **Nothing leaves your browser.** No permissions, no storage, no analytics. See [PRIVACY.md](PRIVACY.md).
- No build step, no dependencies.

> Also in this repository: [Compose on the Left for Gmail](compose-on-the-left-for-gmail/), a separate extension that docks the compose window to the bottom-left.

## Install

**From the Chrome Web Store** — link to come.

**Unpacked (development or personal use)**
1. Download or clone this repository.
2. Open `chrome://extensions` (Edge: `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the repository folder.
4. Reload any open Gmail tab.

## How it works

1. `src/capture.js` keeps hold of files as you attach them (picker, drag-and-drop, paste), so most previews need no network request.
2. `src/chips.js` watches compose windows for attachment chips and injects the eye button.
3. `src/fetcher.js` uses the captured file if its size matches the chip; otherwise it fetches Gmail's own download link with your existing session.
4. `src/viewer.js` shows a modal; the file is rendered in `src/frame.html`, an extension-owned iframe, so Gmail's Content Security Policy cannot block it and Gmail's CSS cannot bleed in.

All Gmail DOM dependencies live in `src/selectors.js`. Chips are found by structure (the download link inside the compose form), not by Gmail's minified class names or English labels.

## Limitations

- Google Drive attachments are not previewed (Gmail exposes no download link for them).
- An attachment whose upload has not finished, and that was not attached in this tab, cannot be previewed until the upload completes.
- Office documents are not previewed; use the Download button.
- If Chrome's built-in PDF viewer is disabled by policy, PDFs download instead.
- While a PDF has keyboard focus, press the × button or click outside the viewer to close it (Esc cannot reach the extension from inside Chrome's PDF viewer).

## If no eye icon appears

1. Reload the Gmail tab.
2. Open DevTools (F12) → Console. You should see `[Preview Attachments] active`. If not, open `chrome://extensions`, find the extension and click **Errors**.
3. If the message is there but a chip has no icon, open an issue using the "Preview button missing" template and include the chip's HTML.

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

The smoke test loads the content-script modules on a mock compose page and exercises every code path except Gmail's live markup. Verify against real Gmail after changing `src/selectors.js` or `src/chips.js`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Not affiliated with Google. Gmail is a trademark of Google LLC.
