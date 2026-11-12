# Privacy Policy — Preview Attachments for Gmail

_Last updated: 2026-11-12_

**Summary: this extension does not collect, store or transmit any data. Everything happens inside your browser.**

## What the extension does

When you open a Gmail compose window, the extension adds a preview button to each attachment chip. When you click it, the extension shows the attachment in a viewer inside the Gmail tab.

## What data it accesses

- **Attachment contents.** To display a preview, the extension reads the attachment file. It uses the copy already in your browser if you attached the file in the current tab; otherwise it requests the file from Gmail's own servers (`mail.google.com`) using your existing signed-in session, exactly as Gmail does when you click the chip yourself.
- **The Gmail page.** The extension reads the compose window's structure to find attachment chips.

## What data it stores

Nothing. Attachment contents are held in memory only while the viewer is open and are released when it closes. The extension has no settings, no local storage and no cookies.

## What data it transmits

Nothing. The extension makes requests only to `mail.google.com`, and only to fetch the attachment you asked to preview. It never contacts any other server. There is no analytics, telemetry, crash reporting or advertising.

## Permissions

The extension requests no Chrome permissions. It runs a content script on `https://mail.google.com/*` only.

## Third parties

No data is shared with third parties.

## Changes

Changes to this policy are published in this repository with an updated date above.

## Contact

Questions can be raised by opening an issue in this repository.
