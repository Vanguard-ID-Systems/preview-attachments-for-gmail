// Finds the group of docked compose windows (Gmail floats it right) and, on
// request, floats it left instead. Gmail's normal right side is the default;
// the header button flips it. The side is held in memory only and resets to
// the right once every docked window is closed. Nothing is stored.
// Classic content script: shares its top-level scope with selectors.js and toggle.js.

const GCL_TAG = '[Compose on the Left]';

const GCL_CSS = `
[${SEL.rowAttr}="left"], [${SEL.pinAttr}="left"] {
  float: left !important; margin-left: 0 !important; margin-right: auto !important;
  order: -1 !important; justify-content: flex-start !important;
}
[${SEL.stripAttr}="left"] { justify-content: flex-start !important; }
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

let gclSide = 'right';
const gclRows = new Set();
let gclWarned = false;

const getSide = () => gclSide;
function setSide(doc, next) {
  gclSide = next === 'right' ? 'right' : 'left';
  refreshLabels(doc, gclSide);
  gclApply(doc);
}
const toggleSide = (doc) => setSide(doc, gclSide === 'left' ? 'right' : 'left');

function gclEnsureStyle(doc) {
  if (doc.getElementById(SEL.styleId)) return;
  const style = doc.createElement('style');
  style.id = SEL.styleId;
  style.textContent = GCL_CSS;
  (doc.head || doc.documentElement).appendChild(style);
}

// The nearest ancestor of a compose form that Gmail floats right: the group of
// docked windows. null for inline replies, pop-outs and full-screen compose.
function findRow(form) {
  const win = form.ownerDocument.defaultView;
  for (let el = form.parentElement; el && el !== form.ownerDocument.body; el = el.parentElement) {
    // A row we already pinned left no longer floats right; recognise it by its marker.
    if (el.hasAttribute(SEL.rowAttr) || win.getComputedStyle(el).float === 'right') return el;
  }
  return null;
}

// Ancestors between the row and the full-width strip (exclusive), then the strip.
// Each of them may be what keeps the group on the right (flex alignment, auto
// margins, floats), so all are pinned.
function pinChain(row) {
  const doc = row.ownerDocument;
  const limit = doc.defaultView.innerWidth * SEL.stripFraction;
  const chain = [];
  let el = row.parentElement;
  for (; el && el !== doc.body; el = el.parentElement) {
    if (el.getBoundingClientRect().width >= limit) break;
    chain.push(el);
  }
  return { chain, strip: el && el !== doc.body ? el : null };
}

// The element to decorate and measure for one window: the dialog's nearest
// positioned ancestor below the row (Gmail's absolutely positioned box), or the
// dialog itself.
function windowBox(row, dialog) {
  const win = dialog.ownerDocument.defaultView;
  for (let el = dialog; el && el !== row; el = el.parentElement) {
    if (win.getComputedStyle(el).position !== 'static') return el;
  }
  return dialog;
}

// Full-screen compose: centred by Gmail, wider than most of the viewport.
function isExpanded(box) {
  const win = box.ownerDocument.defaultView;
  return box.getBoundingClientRect().width > win.innerWidth * SEL.expandedFraction;
}

function gclBoxesIn(row) {
  const out = [];
  for (const form of row.querySelectorAll(SEL.composeForm)) {
    const d = form.closest(SEL.dialog);
    if (!d || !row.contains(d)) continue;
    const box = windowBox(row, d);
    if (!out.includes(box)) out.push(box);
  }
  return out;
}

function gclApply(doc) {
  for (const row of [...gclRows]) {
    if (!row.isConnected) { gclRows.delete(row); continue; }
    const boxes = gclBoxesIn(row);
    if (!boxes.length) {
      gclRows.delete(row);
      row.removeAttribute(SEL.rowAttr);
      row.ownerDocument.querySelectorAll(`[${SEL.pinAttr}], [${SEL.stripAttr}]`)
        .forEach((el) => { el.removeAttribute(SEL.pinAttr); el.removeAttribute(SEL.stripAttr); });
      continue;
    }
    const side = gclSide === 'left' && !boxes.some(isExpanded) ? 'left' : 'right';
    row.setAttribute(SEL.rowAttr, side);
    const { chain, strip } = pinChain(row);
    chain.forEach((el) => el.setAttribute(SEL.pinAttr, side));
    if (strip) strip.setAttribute(SEL.stripAttr, side);
  }
  // One-off: once the last docked window is gone, go back to Gmail's default.
  if (!gclRows.size && gclSide !== 'right') { gclSide = 'right'; refreshLabels(doc, gclSide); }
  if (gclSide === 'left') gclDiagnose(doc);
}

// Log once, with sanitised markup, if the windows did not actually move.
function gclDiagnose(doc) {
  if (gclWarned) return;
  const win = doc.defaultView;
  for (const row of gclRows) {
    if (row.getAttribute(SEL.rowAttr) !== 'left') continue;
    // Stuck means even the leftmost window is still in the right half.
    const lefts = gclBoxesIn(row).map((b) => b.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => r.left);
    if (!lefts.length || Math.min(...lefts) <= win.innerWidth / 2) continue;
    gclWarned = true;
    const { chain, strip } = pinChain(row);
    const describe = (el) => {
      const cs = el.ownerDocument.defaultView.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} display=${cs.display} float=${cs.float} `
        + `pos=${cs.position} jc=${cs.justifyContent} ml=${cs.marginLeft} mr=${cs.marginRight} `
        + `l=${Math.round(r.left)} w=${Math.round(r.width)} siblings=${el.parentElement ? el.parentElement.children.length : 0}`;
    };
    console.warn(GCL_TAG, 'windows not moved; please report this:\n'
      + [row, ...chain, strip].filter(Boolean).map(describe).join('\n'));
  }
}

function gclScan(doc) {
  for (const form of doc.querySelectorAll(SEL.composeForm)) {
    const row = findRow(form);
    if (!row) continue;
    gclRows.add(row);
    const dialog = form.closest(SEL.dialog);
    if (dialog && row.contains(dialog)) decorateDialog(windowBox(row, dialog), gclSide);
  }
  gclApply(doc);
}

function watchDock(doc) {
  gclEnsureStyle(doc);
  installToggle(doc, () => toggleSide(doc));
  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    doc.defaultView.requestAnimationFrame(() => { pending = false; gclScan(doc); });
  };
  gclScan(doc);
  new MutationObserver(schedule).observe(doc.body || doc.documentElement,
    { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  doc.defaultView.addEventListener('resize', schedule);
  return { rescan: () => gclScan(doc) };
}
