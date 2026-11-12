# Chrome Web Store listing copy

Ready to paste into the Developer Dashboard.

## Name
Preview Attachments for Gmail

## Summary (132 characters max)
See the images, PDFs and text files you've attached to a Gmail draft without downloading them.

## Description
Gmail lets you attach a file to a draft, but not look at it: clicking the chip downloads the file again. This extension adds a small eye button to every attachment in the compose window. Click it and the attachment opens in a viewer right inside Gmail.

• Images: fit to window or actual size
• PDFs: Chrome's built-in viewer
• Text, CSV, JSON: shown as text
• Other files: file name, size and a download button

Works in new messages, replies, forwards and reopened drafts, in any Gmail language.

Privacy: nothing leaves your browser. The extension requests no permissions, stores nothing, and talks only to mail.google.com to fetch the attachment you asked to see. Source code: https://github.com/Vanguard-ID-Systems/preview-attachments-for-gmail

Not affiliated with Google. Gmail is a trademark of Google LLC.

## Category
Productivity → Workflow & Planning

## Single purpose (reviewer field)
Display a preview of files attached to a Gmail draft inside the compose window.

## Permission justifications
- Content script on `https://mail.google.com/*`: required to add the preview button to attachment chips and to show the viewer inside the Gmail page. No other hosts, no permissions requested.
- Remote code: none. All code is packaged in the extension.

## Privacy practices certification
- Does not collect user data: **true**. Attachment contents are read in memory only when the user clicks preview and are discarded when the viewer closes.
- Privacy policy URL: https://github.com/Vanguard-ID-Systems/preview-attachments-for-gmail/blob/main/PRIVACY.md (or the GitHub Pages URL once enabled)

## Assets needed
- Icon 128×128: `icons/icon128.png` (included)
- Screenshots: at least one 1280×800 or 640×400 PNG of the viewer open over a compose window
- Optional promo tile 440×280

## Visibility
- First release: **Private** (your Workspace domain). Deploy via Admin console → Devices → Chrome → Apps & extensions → add by extension ID → Force install.
- Later: switch to **Public** in the same listing. The extension ID and installs are unaffected during review.
