---
name: Preview button missing or not working
about: The eye icon does not appear on an attachment, or clicking it does nothing
title: "Preview button: "
labels: bug
---

**Gmail display language**
(Gmail settings → General → Language)

**Browser and version**
(e.g. Chrome 130, Edge 130)

**Where it happens**
- [ ] New message
- [ ] Reply / inline reply
- [ ] Forward with existing attachments
- [ ] Reopened draft
- [ ] Pop-out / full-screen compose

**Chip HTML**
Right-click the attachment chip → Inspect → right-click the highlighted element → Copy → Copy outerHTML. Paste below. Remove the long `ik=`/`permmsgid=` values from the URL if you prefer.

```html

```

**Console output**
Open DevTools (F12) → Console. Is `[Preview Attachments] active` present? Paste any red lines mentioning `chrome-extension://`.

```

```
