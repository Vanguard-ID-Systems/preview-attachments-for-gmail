# Chrome Web Store listing copy

Ready to paste into the Developer Dashboard.

## Name
Compose on the Left for Gmail

## Summary (132 characters max)
Dock Gmail's compose window to the bottom-left so the email you're reading stays visible. One click moves it back.

## Description
In Gmail's split-pane layout, a new message or reply opens at the bottom-right, right on top of the email you were reading. This extension docks the compose window to the bottom-left instead, over the message list, so you can keep reading and copying from the original while you write.

• Every docked compose window opens on the left
• A ⇄ button in the window's header moves it back to the right, and left again
• Inline replies, popped-out windows and full-screen compose are not changed
• Works in any Gmail language

Privacy: nothing leaves your browser. The extension requests no permissions, stores nothing and makes no network requests. Source code: https://github.com/Vanguard-ID-Systems/compose-on-the-left-for-gmail

Not affiliated with Google. Gmail is a trademark of Google LLC.

## Category
Productivity → Workflow & Planning

## Single purpose (reviewer field)
Move Gmail's docked compose window to the left side of the page, with a button to move it back.

## Permission justifications
- Content script on `https://mail.google.com/*`: required to reposition the compose window and add the button to its header. No other hosts, no permissions requested.
- Remote code: none. All code is packaged in the extension.

## Privacy practices certification
- Does not collect user data: **true**. The extension reads page structure only and makes no network requests.
- Privacy policy URL: https://github.com/Vanguard-ID-Systems/compose-on-the-left-for-gmail/blob/main/PRIVACY.md

## Assets needed
- Icon 128×128: `icons/icon128.png` (included)
- Screenshots: at least one 1280×800 or 640×400 PNG of a compose window docked left over a split-pane inbox
- Optional promo tile 440×280

## Visibility
- First release: **Private** (your Workspace domain). Deploy via Admin console → Devices → Chrome → Apps & extensions → add by extension ID → Force install.
- Later: switch to **Public** in the same listing. The extension ID and installs are unaffected during review.
