# Changelog

## 0.2.0 — 2026-11-12

Pre-release hardening for public distribution.

- Chip detection is now structural (the download link inside a compose form), so it works in any Gmail language.
- Attachment URLs are validated: only same-origin `mail.google.com/mail/…` links are ever fetched or offered for download.
- The viewer iframe and the page only accept messages from each other (source and origin checks).
- Locally captured files are used only when their size matches the chip, so two same-named attachments cannot show the wrong file.
- File capture is limited to compose windows, 50 files and 256 MB.
- Buttons use delegated handlers, so chips cloned by Gmail (pop-out, full screen, reopened drafts) keep working.
- Keyboard: Enter/Space on the eye opens the preview without triggering Gmail's download; Tab cycles inside the viewer; focus returns to the chip on close.
- Dark-theme support in the viewer; `aria-live` status; dialog semantics on the overlay.
- Closing the viewer aborts an in-flight download.
- Renamed to "Preview Attachments for Gmail"; added privacy policy, CI, packaging script.

## 0.1.0 — 2026-11-12

Initial MVP: preview images, PDFs and text attachments in Gmail compose.
