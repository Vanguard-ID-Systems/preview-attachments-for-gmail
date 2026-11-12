// Every dependency on Gmail's DOM lives in this file.
// When Gmail changes its markup, this is the only file that should need updating.
//
// Observed docked compose (Nov 2026):
//   <div class="dw">                      position: absolute; left/right/bottom: 0; full width
//     <div class="jvV5Me"><div class="nH lFFILd" (flex)><div class="nH">
//       <div class="no">                  float: right   ← the group of docked windows ("row")
//         <div class="nH nn"> (float: left) <div class="no"> <div class="nH nn"> (relative)
//           <div class="AD"> (absolute)   one window's box
//             <div class="nH"><div class="nH Hd" role="dialog">
//               … header with minimize (.Hl), pop-out (.Hq) and close (.Ha) …
//               <form enctype="multipart/form-data"> … </form>
//
// Inline replies in the reading pane, popped-out windows and full-screen compose
// are not inside a float:right group, so they are never touched. Detection is
// structural: the compose form, then the nearest ancestor with computed
// float: right. Class names are hints only.
const SEL = {
  // Both the docked compose window and inline replies wrap their fields in this form.
  composeForm: 'form[enctype="multipart/form-data"]',

  // The compose window element.
  dialog: '[role="dialog"]',

  // Gmail's header icons (minimize, pop-out, close). Tried before the structural search.
  headerButtonsHint: '.Hl, .Hq, .Ha',

  // Structural fallback: clickable things near the top of the window.
  clickable: '[role="button"], button, img[alt], img[aria-label], [aria-label]',
  headerBandPx: 48,

  // A docked window wider than this fraction of the viewport is Gmail's
  // full-screen compose, which is centred and must not be pushed left.
  expandedFraction: 0.6,

  // Attributes and ids we add.
  rowAttr: 'data-gcl-row',
  decoratedAttr: 'data-gcl-toggled',
  buttonClass: 'gcl-toggle',
  styleId: 'gcl-style',
};
