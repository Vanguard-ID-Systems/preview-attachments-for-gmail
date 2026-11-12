// Keeps hold of File objects as the user attaches them (file picker, drag-and-drop, paste),
// so a preview needs no network request and works before the upload has finished.
import { SEL } from './selectors.js';

const MAX_FILES = 50;
const MAX_BYTES = 256 * 1024 * 1024;

export class FileStore {
  constructor(root = document) {
    this.root = root;
    this.byName = new Map();
    this.bytes = 0;
    const opts = { capture: true, passive: true };
    root.addEventListener('change', (e) => this.onChange(e), opts);
    root.addEventListener('drop', (e) => this.onTransfer(e, e.dataTransfer), opts);
    root.addEventListener('paste', (e) => this.onTransfer(e, e.clipboardData), opts);
  }

  // Only record files that plausibly belong to a compose window: the input/target is inside
  // a compose form, or at least a compose form is open. This keeps unrelated uploads
  // (profile photo, Drive) out of memory.
  isComposeContext(target) {
    if (target instanceof Element && target.closest(SEL.composeForm)) return true;
    return !!this.root.querySelector(SEL.composeForm);
  }

  onChange(e) {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.type === 'file' && this.isComposeContext(t)) {
      // Gmail clears/recreates the input after upload, so copy the list immediately.
      this.addAll(t.files);
    }
  }

  onTransfer(e, data) {
    if (data && this.isComposeContext(e.target)) this.addAll(data.files);
  }

  addAll(files) {
    if (!files) return;
    for (const f of Array.from(files)) this.add(f);
  }

  add(file) {
    if (!file || !file.name) return;
    this.remove(file.name);
    this.byName.set(file.name, file);
    this.bytes += file.size;
    // Evict oldest until within limits (the newest entry is always kept).
    for (const name of this.byName.keys()) {
      if (this.byName.size <= MAX_FILES && this.bytes <= MAX_BYTES) break;
      if (name === file.name) break;
      this.remove(name);
    }
  }

  remove(name) {
    const existing = this.byName.get(name);
    if (!existing) return;
    this.byName.delete(name);
    this.bytes -= existing.size;
  }

  get(name) {
    return this.byName.get(name) || null;
  }
}
