// Entry point. Runs after selectors.js, toggle.js and dock.js, which share this
// classic content-script scope (no modules, no dynamic imports, nothing to fetch).
try {
  watchDock(document);
  console.info('[Compose on the Left] active');
} catch (err) {
  console.error('[Compose on the Left] failed to start', err);
}
