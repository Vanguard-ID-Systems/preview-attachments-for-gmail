// Runs inside the extension-owned iframe. Receives a Blob from the content script
// and renders it. Only messages from the parent window on an allowed origin are accepted.
(() => {
  const GMAIL_ORIGIN = 'https://mail.google.com';
  // location.origin is accepted so the smoke test can drive the page from a local server.
  const ALLOWED_ORIGINS = new Set([GMAIL_ORIGIN, location.origin]);
  const MAX_TEXT_BYTES = 1024 * 1024;

  const stage = document.getElementById('stage');
  const nameEl = document.getElementById('name');
  const sizeEl = document.getElementById('size');
  const downloadEl = document.getElementById('download');
  const zoomEl = document.getElementById('zoom');
  const closeEl = document.getElementById('close');

  let parentOrigin = null;
  let objectUrl = null;

  function reply(msg) {
    if (parentOrigin) window.parent.postMessage(msg, parentOrigin);
  }

  function formatSize(bytes) {
    if (!Number.isFinite(bytes)) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${i === 0 ? n : n.toFixed(1)} ${units[i]}`;
  }

  function clear() {
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    stage.replaceChildren();
    stage.classList.remove('zoomed', 'top');
    downloadEl.hidden = true;
    downloadEl.removeAttribute('href');
    zoomEl.hidden = true;
    zoomEl.onclick = null;
    nameEl.textContent = '';
    sizeEl.textContent = '';
  }

  function card(title, text, extra, isError) {
    const el = document.createElement('div');
    el.className = 'card' + (isError ? ' error' : '');
    const h = document.createElement('h2');
    h.textContent = title;
    const p = document.createElement('p');
    p.textContent = text;
    el.append(h, p);
    if (extra) el.append(extra);
    return el;
  }

  function setHeader(name, size) {
    nameEl.textContent = name || '';
    nameEl.title = name || '';
    sizeEl.textContent = size != null ? formatSize(size) : '';
  }

  function showLoading(name) {
    clear();
    setHeader(name);
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Loading…';
    stage.append(p);
  }

  async function show({ blob, name, mime }) {
    clear();
    setHeader(name, blob.size);
    const type = mime || blob.type || 'application/octet-stream';
    const typed = blob.type === type ? blob : new Blob([blob], { type });
    objectUrl = URL.createObjectURL(typed);
    downloadEl.href = objectUrl;
    downloadEl.download = name || 'attachment';
    downloadEl.hidden = false;

    if (type.startsWith('image/') && type !== 'image/svg+xml') {
      const img = document.createElement('img');
      img.className = 'preview';
      img.alt = name || '';
      img.src = objectUrl;
      const toggle = () => {
        const zoomed = stage.classList.toggle('zoomed');
        stage.classList.toggle('top', zoomed);
        zoomEl.textContent = zoomed ? 'Fit to window' : 'Actual size';
      };
      img.addEventListener('click', toggle);
      zoomEl.textContent = 'Actual size';
      zoomEl.hidden = false;
      zoomEl.onclick = toggle;
      stage.append(img);
      return;
    }

    if (type === 'application/pdf') {
      // SECURITY INVARIANT: a blob: URL navigated in an iframe runs with this extension's
      // origin. This branch is safe only because it is gated on application/pdf, which
      // Chrome renders in its sandboxed PDF viewer. Never route HTML, SVG or other active
      // content through an iframe here; render them inert (e.g. as text) instead.
      // (<embed>/<object> would be blocked by the extension's object-src policy.)
      const frame = document.createElement('iframe');
      frame.className = 'preview';
      frame.title = name || 'PDF';
      frame.src = objectUrl;
      stage.append(frame);
      // Keystrokes inside the PDF viewer do not reach this page, so keep focus on Close.
      closeEl.focus();
      return;
    }

    if (type.startsWith('text/') || type === 'application/json' || type === 'image/svg+xml') {
      const pre = document.createElement('pre');
      pre.className = 'preview';
      const slice = blob.size > MAX_TEXT_BYTES ? blob.slice(0, MAX_TEXT_BYTES) : blob;
      pre.textContent = await slice.text() + (blob.size > MAX_TEXT_BYTES ? '\n\n… (truncated)' : '');
      stage.classList.add('top');
      stage.append(pre);
      return;
    }

    stage.append(card('No preview available', `${type} files cannot be previewed here. ` +
      'Use Download to open the file in another app.'));
  }

  function showError({ name, message, url }) {
    clear();
    setHeader(name);
    let link = null;
    if (url && parentOrigin && url.startsWith(parentOrigin + '/')) {
      link = document.createElement('a');
      link.className = 'btn';
      link.href = url;
      link.textContent = 'Download instead';
      link.target = '_blank';
      link.rel = 'noopener';
    }
    stage.append(card('Could not load this attachment', message || 'Unknown error', link, true));
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window.parent || !ALLOWED_ORIGINS.has(e.origin)) return;
    parentOrigin = e.origin;
    const msg = e.data || {};
    switch (msg.type) {
      case 'loading': showLoading(msg.name); break;
      case 'show': show(msg).catch((err) => showError({ name: msg.name, message: err.message })); break;
      case 'error': showError(msg); break;
      case 'clear': clear(); break;
      default: break;
    }
  });

  closeEl.addEventListener('click', () => reply({ type: 'close' }));

  // Esc closes; Tab cycles within the toolbar so focus stays inside the modal.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { reply({ type: 'close' }); return; }
    if (e.key !== 'Tab') return;
    const items = [downloadEl, zoomEl, closeEl].filter((el) => !el.hidden);
    const i = items.indexOf(document.activeElement);
    let next;
    if (e.shiftKey) next = i <= 0 ? items[items.length - 1] : items[i - 1];
    else next = i < 0 || i === items.length - 1 ? items[0] : items[i + 1];
    e.preventDefault();
    next.focus();
  });

  // Announce readiness to the embedding page. The payload carries no data; the target is
  // Gmail in production and this origin's http server in the smoke test.
  const readyTarget = location.protocol === 'http:' ? '*' : GMAIL_ORIGIN;
  window.parent.postMessage({ type: 'ready' }, readyTarget);
})();
