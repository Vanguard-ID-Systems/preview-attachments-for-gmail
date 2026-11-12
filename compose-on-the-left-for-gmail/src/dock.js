// Finds Gmail's docked-compose strip and pins it to the left edge.
// The side is held in memory only: 'left' on every page load, flipped by the
// header button, never stored.
import { SEL } from './selectors.js';
import { decorateDialog, refreshLabels, installToggle } from './toggle.js';

const TAG = '[Compose on the Left]';

const CSS = `
[${SEL.dockAttr}] { left: 0 !important; right: auto !important; flex-direction: row !important; }
[${SEL.dockAttr}] [${SEL.rowAttr}] {
  float: left !important; flex-direction: row !important; justify-content: flex-start !important;
  margin-left: 0 !important; margin-right: auto !important;
}
.${SEL.buttonClass} {
  display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;
  box-sizing: border-box; width: 24px; height: 24px; padding: 0; margin: 0 2px;
  border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer;
  opacity: .85; line-height: 0;
}
.${SEL.buttonClass}:hover, .${SEL.buttonClass}:focus-visible { opacity: 1; background: rgba(128,128,128,.25); outline: none; }
.${SEL.buttonClass}:focus-visible { box-shadow: 0 0 0 2px currentColor; }
.${SEL.buttonClass}[data-fallback] { position: absolute; top: 4px; right: 104px; z-index: 1; }
`;

let side = 'left';
const docks = new Set();
let warned = false;

export const getSide = () => side;
export function setSide(doc, next) {
  side = next === 'right' ? 'right' : 'left';
  refreshLabels(doc, side);
  apply(doc);
}
export const toggleSide = (doc) => setSide(doc, side === 'left' ? 'right' : 'left');

function ensureStyle(doc) {
  if (doc.getElementById(SEL.styleId)) return;
  const style = doc.createElement('style');
  style.id = SEL.styleId;
  style.textContent = CSS;
  (doc.head || doc.documentElement).appendChild(style);
}

// The nearest position:fixed ancestor of a compose form, or null for inline replies.
export function findDock(form) {
  const win = form.ownerDocument.defaultView;
  for (let el = form.parentElement; el && el !== form.ownerDocument.body; el = el.parentElement) {
    if (win.getComputedStyle(el).position === 'fixed') return el;
  }
  return null;
}

// Full-screen compose: centred by Gmail, wider than most of the viewport.
export function isExpanded(dialog) {
  const win = dialog.ownerDocument.defaultView;
  return dialog.getBoundingClientRect().width > win.innerWidth * SEL.expandedFraction;
}

function dialogsIn(dock) {
  const out = [];
  for (const form of dock.querySelectorAll(SEL.composeForm)) {
    const d = form.closest(SEL.dialog);
    if (d && dock.contains(d) && !out.includes(d)) out.push(d);
  }
  return out;
}

function rowOf(dock, dialog) {
  let el = dialog;
  while (el && el.parentElement !== dock) el = el.parentElement;
  return el;
}

function apply(doc) {
  for (const dock of [...docks]) {
    if (!dock.isConnected) { docks.delete(dock); continue; }
    const dialogs = dialogsIn(dock);
    if (!dialogs.length) { docks.delete(dock); dock.removeAttribute(SEL.dockAttr); continue; }
    for (const d of dialogs) {
      const row = rowOf(dock, d);
      if (row && row !== dock) row.setAttribute(SEL.rowAttr, '');
    }
    const pinLeft = side === 'left' && !dialogs.some(isExpanded);
    if (pinLeft) dock.setAttribute(SEL.dockAttr, '');
    else dock.removeAttribute(SEL.dockAttr);
  }
  if (side === 'left') diagnose(doc);
}

// Log once, with sanitised markup, if the dock did not actually move.
function diagnose(doc) {
  if (warned) return;
  const win = doc.defaultView;
  for (const dock of docks) {
    if (!dock.hasAttribute(SEL.dockAttr)) continue;
    const stuck = dialogsIn(dock).some((d) => d.getBoundingClientRect().left > win.innerWidth / 2);
    if (!stuck) continue;
    warned = true;
    const html = dock.outerHTML.replace(/[\w-]{20,}/g, '…').slice(0, 4000);
    console.warn(TAG, 'dock not moved; please report this markup:', html);
  }
}

function scan(doc) {
  for (const form of doc.querySelectorAll(SEL.composeForm)) {
    const dock = findDock(form);
    if (!dock) continue;
    docks.add(dock);
    const dialog = form.closest(SEL.dialog);
    if (dialog && dock.contains(dialog)) decorateDialog(dialog, side);
  }
  apply(doc);
}

export function watchDock(doc) {
  ensureStyle(doc);
  installToggle(doc, () => toggleSide(doc));
  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    doc.defaultView.requestAnimationFrame(() => { pending = false; scan(doc); });
  };
  scan(doc);
  new MutationObserver(schedule).observe(doc.body || doc.documentElement,
    { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  doc.defaultView.addEventListener('resize', schedule);
  return { rescan: () => scan(doc) };
}
