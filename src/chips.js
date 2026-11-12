// Finds attachment chips inside compose windows and injects a preview button into each one.
import { SEL } from './selectors.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const BUTTON_CSS = `
.${SEL.buttonClass} {
  position: absolute; right: 30px; top: 50%; transform: translateY(-50%);
  width: 22px; height: 22px; margin: 0; padding: 0; border: 0; border-radius: 50%;
  background: rgba(0, 0, 0, 0.06); color: #444; cursor: pointer; z-index: 2;
  display: inline-flex; align-items: center; justify-content: center;
}
.${SEL.buttonClass}:hover { background: rgba(0, 0, 0, 0.12); }
.${SEL.buttonClass}:focus-visible { outline: 2px solid #1a73e8; outline-offset: 1px; }
.${SEL.buttonClass} svg { width: 14px; height: 14px; }
`;

// Only same-origin Gmail URLs under /mail/ may be fetched with the user's session.
export function isSafeAttachmentUrl(url) {
  try {
    const u = new URL(url, location.href);
    return u.origin === location.origin && u.pathname.startsWith(SEL.attachmentPath);
  } catch {
    return false;
  }
}

// Parses Gmail's download_url attribute: "<mime>:<filename>:<url>".
export function parseDownloadUrl(value) {
  if (!value) return null;
  const first = value.indexOf(':');
  const urlStart = value.lastIndexOf(':http');
  if (first < 0 || urlStart <= first) return null;
  const url = value.slice(urlStart + 1);
  return {
    mime: value.slice(0, first),
    name: value.slice(first + 1, urlStart),
    url: isSafeAttachmentUrl(url) ? url : '',
  };
}

// Parses a size label such as "(1,758K)", "(2.3M)" or "(950 B)" into an approximate
// byte count and the unit used, so a locally captured file can be sanity-checked.
// Returns null when the text is not recognised.
export function parseSizeLabel(text) {
  if (!text) return null;
  const m = text.match(/([\d.,  ]+)\s*([KMG]?)B?\)?\s*$/i);
  if (!m) return null;
  let digits = m[1].replace(/[  ]/g, '');
  // "1,758" and "1.758" are thousands groups; "2,3" and "2.3" are decimals.
  const sep = digits.match(/[.,](\d+)$/);
  if (sep && sep[1].length === 3 && digits.replace(/[^.,]/g, '').length === 1) {
    digits = digits.replace(/[.,]/g, '');
  } else {
    digits = digits.replace(/,/g, '.');
  }
  const n = parseFloat(digits);
  if (!Number.isFinite(n)) return null;
  const unit = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3 }[m[2].toUpperCase()];
  return { bytes: n * unit, unit };
}

function textWithout(el, selector) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll(selector).forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

// Returns { mime, name, url, size } for a chip. url is '' when Gmail has not exposed a
// usable link (upload in progress, Drive attachment, or an off-origin link). mime is ''
// when unknown. size is { bytes, unit } from the chip's label, or null.
export function chipInfo(chip) {
  const size = parseSizeLabel(chip.querySelector(SEL.chipSize)?.textContent);
  const parsed = parseDownloadUrl(chip.getAttribute(SEL.downloadUrlAttr));
  if (parsed) return { ...parsed, size };

  const link = chip.matches(SEL.chipLink) ? chip : chip.querySelector(SEL.chipLink);
  const url = link && isSafeAttachmentUrl(link.href) ? link.href : '';

  let name = chip.querySelector(SEL.chipName)?.textContent.trim() || '';
  if (!name) {
    const label = chip.getAttribute('aria-label') || '';
    if (label.startsWith(SEL.chipAriaPrefix)) {
      const end = label.indexOf(SEL.chipAriaSuffix);
      name = label.slice(SEL.chipAriaPrefix.length, end > 0 ? end : undefined).trim();
    }
  }
  if (!name) {
    const junk = `button, [role="button"], ${SEL.chipSize}, .${SEL.buttonClass}`;
    name = textWithout(link || chip, junk).replace(/\s*\([^()]*\)\s*$/, '');
  }
  return { mime: '', name, url, size };
}

function chipContainerFor(link) {
  return link.closest(SEL.chipLabelled) || link.closest(`[${SEL.downloadUrlAttr}]`) || link.parentElement;
}

// Candidate chips: inside compose forms only. The download link is the primary signal;
// labelled containers and download_url elements are accepted as well.
export function findChips(root) {
  const chips = new Set();
  for (const form of root.querySelectorAll(SEL.composeForm)) {
    for (const link of form.querySelectorAll(SEL.chipLink)) {
      if (link.closest(SEL.editor)) continue;
      const chip = chipContainerFor(link);
      if (chip) chips.add(chip);
    }
    for (const el of form.querySelectorAll(`${SEL.chipLabelled}, [${SEL.downloadUrlAttr}]`)) {
      if (!el.closest(SEL.editor)) chips.add(el);
    }
  }
  return chips;
}

function ensureStyles(doc) {
  if (doc.getElementById(SEL.styleId)) return;
  const style = doc.createElement('style');
  style.id = SEL.styleId;
  style.textContent = BUTTON_CSS;
  (doc.head || doc.documentElement).appendChild(style);
}

function eyeIcon(doc) {
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = doc.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z');
  const circle = doc.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '3');
  svg.append(path, circle);
  return svg;
}

export function decorate(chip) {
  // Gmail sometimes clones chip DOM; a clone keeps our marker and button, so the only
  // state that matters is whether a button is present. Listeners are delegated (below).
  if (chip.querySelector(`:scope > .${SEL.buttonClass}`)) return;
  const doc = chip.ownerDocument;
  ensureStyles(doc);
  chip.setAttribute(SEL.decoratedAttr, '1');

  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.className = SEL.buttonClass;
  btn.title = 'Preview attachment';
  btn.setAttribute('aria-label', 'Preview attachment');
  btn.append(eyeIcon(doc));

  const cs = getComputedStyle(chip);
  if (cs.position === 'static') chip.style.position = 'relative';
  if (parseFloat(cs.paddingRight) < 56) chip.style.paddingRight = '56px';
  chip.appendChild(btn);
}

// One set of capturing listeners on the document, so buttons keep working even when
// Gmail clones or re-parents compose DOM (pop-out, full screen, reopened drafts).
function installDelegatedHandlers(root, onPreview) {
  const buttonOf = (e) => (e.target instanceof Element ? e.target.closest(`.${SEL.buttonClass}`) : null);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const activate = (e, btn) => {
    stop(e);
    const chip = btn.closest(`[${SEL.decoratedAttr}]`);
    if (chip) onPreview(chipInfo(chip), btn);
  };
  // The chip itself opens the download on click or Enter; keep our activation from reaching it.
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup']) {
    root.addEventListener(type, (e) => { if (buttonOf(e)) stop(e); }, true);
  }
  root.addEventListener('click', (e) => { const b = buttonOf(e); if (b) activate(e, b); }, true);
  root.addEventListener('keydown', (e) => {
    const b = buttonOf(e);
    if (b && (e.key === 'Enter' || e.key === ' ')) activate(e, b);
  }, true);
}

// Watches the document for new chips (Gmail is a single-page app) and decorates them.
// Scans are throttled and scoped to compose forms.
export function watchChips(root, onPreview, { throttleMs = 250 } = {}) {
  installDelegatedHandlers(root, onPreview);
  const scan = () => findChips(root).forEach(decorate);
  let timer = null;
  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => { timer = null; scan(); }, throttleMs);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(root.body || root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [SEL.downloadUrlAttr, 'href'],
  });
  scan();
  return observer;
}
