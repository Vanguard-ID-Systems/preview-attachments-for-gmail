# Chrome Web Store listing copy

Ready to paste into the Developer Dashboard.

## Name
Compose on the Left for Gmail

## Summary (132 characters max)
One click moves Gmail's compose window to the bottom-left so the email you're reading stays visible. Click again to move it back.

## Description
In Gmail's split-pane layout, a new message or reply opens at the bottom-right, right on top of the email you were reading. This extension adds a ⇄ button to the compose window's header. Click it and the window moves to the bottom-left, over the message list, so you can keep reading and copying from the original while you write. Click again to move it back.

• Gmail's normal behaviour is unchanged until you click the button
• The ⇄ button sits next to minimize / full screen / close
• Nothing is remembered: once your compose windows are closed, the next one opens as usual
• Inline replies, popped-out windows and full-screen compose are not changed
• Works in any Gmail language

Privacy: nothing leaves your browser. The extension requests no permissions, stores nothing and makes no network requests. Source code: https://github.com/Vanguard-ID-Systems/compose-on-the-left-for-gmail

Not affiliated with Google. Gmail is a trademark of Google LLC.

## Category
Productivity → Workflow & Planning

## Single purpose (reviewer field)
Add a button to Gmail's compose window that moves it to the left side of the page and back.

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
