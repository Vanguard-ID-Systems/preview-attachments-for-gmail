// The ⇄ button added to each docked compose window's header.
// Placement, labels and the delegated click/keyboard handling live here; which
// side the dock is on is decided by dock.js and reported through the callbacks.
import { SEL } from './selectors.js';

const LABELS = {
  left: 'Move compose window to the right side',
  right: 'Move compose window to the left side',
};

const ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">'
  + '<path fill="currentColor" d="M7 7l-4 4 4 4v-3h7v-2H7V7zm10 10l4-4-4-4v3h-7v2h7v3z"/></svg>';

// Where to put the button: just before Gmail's own header icons.
// 1. Class hint (fast path). 2. Structural: the first group of ≥2 clickable
// elements sharing a parent within the top band of the dialog. 3. null → caller
// falls back to absolute positioning.
export function findHeaderSlot(dialog) {
  const hinted = dialog.querySelector(SEL.headerButtonsHint);
  if (hinted) return hinted;

  const top = dialog.getBoundingClientRect().top;
  const groups = new Map();
  for (const el of dialog.querySelectorAll(SEL.clickable)) {
    if (el.classList.contains(SEL.buttonClass)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.top - top > SEL.headerBandPx) continue;
    // Skip containers that hold other clickables (we want the leaf icons).
    if (el.querySelector(SEL.clickable)) continue;
    const list = groups.get(el.parentElement) || [];
    list.push(el);
    groups.set(el.parentElement, list);
  }
  let best = null;
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    if (!best || list[0].getBoundingClientRect().top < best.getBoundingClientRect().top) best = list[0];
  }
  return best;
}

function makeButton(doc, side) {
  const b = doc.createElement('button');
  b.type = 'button';
  b.className = SEL.buttonClass;
  b.innerHTML = ICON;
  setLabel(b, side);
  return b;
}

function setLabel(button, side) {
  button.title = LABELS[side];
  button.setAttribute('aria-label', LABELS[side]);
}

// Adds the button to one dialog (idempotent).
export function decorateDialog(dialog, side) {
  // A dialog cloned by Gmail may carry the marker without the button; re-add it then.
  if (dialog.hasAttribute(SEL.decoratedAttr) && dialog.querySelector(`.${SEL.buttonClass}`)) return;
  dialog.setAttribute(SEL.decoratedAttr, '');
  const button = makeButton(dialog.ownerDocument, side);
  const slot = findHeaderSlot(dialog);
  if (slot) {
    slot.parentElement.insertBefore(button, slot);
  } else {
    button.setAttribute('data-fallback', '');
    dialog.appendChild(button);
  }
}

export function refreshLabels(doc, side) {
  doc.querySelectorAll(`.${SEL.buttonClass}`).forEach((b) => setLabel(b, side));
}

// One set of delegated handlers per document, in the capture phase so Gmail's
// header handlers (drag, minimize on click) never see the event.
export function installToggle(doc, onToggle) {
  const isOurs = (e) => e.target instanceof Element && e.target.closest(`.${SEL.buttonClass}`);
  const swallow = (e) => { e.preventDefault(); e.stopPropagation(); };
  doc.addEventListener('mousedown', (e) => { if (isOurs(e)) e.stopPropagation(); }, true);
  doc.addEventListener('click', (e) => {
    if (!isOurs(e)) return;
    swallow(e);
    onToggle();
  }, true);
  doc.addEventListener('keydown', (e) => {
    if (!isOurs(e) || (e.key !== 'Enter' && e.key !== ' ')) return;
    swallow(e);
    onToggle();
  }, true);
}
