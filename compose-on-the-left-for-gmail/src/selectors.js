// Every dependency on Gmail's DOM lives in this file.
// When Gmail changes its markup, this is the only file that should need updating.
//
// Observed docked compose (Nov 2026):
//   <div class="dw">                      position: fixed; bottom: 0; right: 0   ← the "dock"
//     <div class="no">                    row of windows, newest nearest the right edge
//       <div class="nH Hd" role="dialog"> one compose window
//         … header with minimize (.Hl), pop-out (.Hq) and close (.Ha) buttons …
//         <form enctype="multipart/form-data"> … </form>
//
// Inline replies in the reading pane and popped-out windows are not inside the
// fixed dock, so they are never touched. Detection is structural: the compose
// form, then the nearest position:fixed ancestor. Class names are hints only.
export const SEL = {
  // Both the docked compose window and inline replies wrap their fields in this form.
  composeForm: 'form[enctype="multipart/form-data"]',

  // The compose window element inside the dock.
  dialog: '[role="dialog"]',

  // Secondary hint for the dock container (not required).
  dockClassHint: '.dw',

  // Gmail's header icons (minimize, pop-out, close). Tried before the structural search.
  headerButtonsHint: '.Hl, .Hq, .Ha',

  // Structural fallback: clickable things near the top of the dialog.
  clickable: '[role="button"], button, [aria-label]',
  headerBandPx: 48,

  // A docked dialog wider than this fraction of the viewport is Gmail's
  // full-screen compose, which is centred and must not be pushed left.
  expandedFraction: 0.6,

  // Attributes and ids we add.
  dockAttr: 'data-gcl-dock',
  rowAttr: 'data-gcl-row',
  decoratedAttr: 'data-gcl-toggled',
  buttonClass: 'gcl-toggle',
  styleId: 'gcl-style',
};
