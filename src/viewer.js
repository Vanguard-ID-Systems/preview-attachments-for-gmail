// The modal shell that lives in the Gmail page. The actual file is rendered in an
// extension-owned iframe (frame.html) so Gmail's Content Security Policy cannot
// interfere with blob: URLs, and Gmail's CSS cannot bleed into the viewer.
const FRAME_PATH = 'src/frame.html';

const STYLE = `
  :host { all: initial; }
  .overlay {
    position: fixed; inset: 0; z-index: 2147483647;
    background: rgba(0, 0, 0, 0.6);
    display: flex; align-items: center; justify-content: center;
  }
  .overlay[hidden] { display: none; }
  iframe {
    width: min(1100px, 92vw); height: 90vh; border: 0; border-radius: 8px;
    background: #fff; box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
  }
`;

export class Viewer {
  constructor() {
    this.host = null;
    this.overlay = null;
    this.frame = null;
    this.ready = false;
    this.queue = [];
    this.open = false;
    this.token = 0;
    this.controller = null;
    this.returnFocus = null;
    this.frameUrl = chrome.runtime.getURL(FRAME_PATH);
    this.frameOrigin = new URL(this.frameUrl).origin;
  }

  ensure() {
    if (this.host) return;
    this.host = document.createElement('div');
    this.host.id = 'gap-host';
    const shadow = this.host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.overlay = document.createElement('div');
    this.overlay.className = 'overlay';
    this.overlay.hidden = true;
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'Attachment preview');
    this.frame = document.createElement('iframe');
    this.frame.src = this.frameUrl;
    this.frame.title = 'Attachment preview';
    this.overlay.appendChild(this.frame);
    shadow.append(style, this.overlay);
    document.body.appendChild(this.host);

    window.addEventListener('message', (e) => {
      // Only our own iframe document may talk to us.
      if (!this.frame || e.source !== this.frame.contentWindow || e.origin !== this.frameOrigin) return;
      const msg = e.data || {};
      if (msg.type === 'ready') {
        this.ready = true;
        this.queue.splice(0).forEach((m) => this.post(m));
      } else if (msg.type === 'close') {
        this.close();
      }
    });
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', (e) => {
      if (this.open && e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  post(msg) {
    if (!this.ready) { this.queue.push(msg); return; }
    this.frame.contentWindow.postMessage(msg, this.frameOrigin);
  }

  // Opens the modal in a loading state. Returns { token, signal }: later calls must pass
  // the token back so a result for a closed/replaced preview is ignored, and the signal
  // aborts the fetch when the preview is replaced or closed.
  showLoading(name, trigger = null) {
    this.ensure();
    if (this.controller) this.controller.abort();
    this.controller = new AbortController();
    this.returnFocus = trigger || document.activeElement;
    this.open = true;
    this.overlay.hidden = false;
    this.token += 1;
    this.post({ type: 'loading', name });
    this.frame.focus();
    return { token: this.token, signal: this.controller.signal };
  }

  show(token, { blob, name, mime }) {
    if (!this.open || token !== this.token) return;
    this.post({ type: 'show', blob, name, mime });
  }

  showError(token, chip, err) {
    if (!this.open || token !== this.token) return;
    const message = err && err.message ? err.message : String(err);
    this.post({ type: 'error', name: chip.name, message, url: chip.url || '' });
  }

  close() {
    if (!this.open) return;
    this.open = false;
    if (this.controller) { this.controller.abort(); this.controller = null; }
    this.overlay.hidden = true;
    this.post({ type: 'clear' });
    const el = this.returnFocus;
    this.returnFocus = null;
    if (el && typeof el.focus === 'function' && el.isConnected) el.focus();
  }
}
