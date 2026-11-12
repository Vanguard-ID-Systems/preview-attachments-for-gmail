// Content-script entry point. Chrome content scripts cannot be ES modules
// directly, so this tiny loader imports the real code as a module.
(async () => {
  try {
    await import(chrome.runtime.getURL('src/main.js'));
  } catch (err) {
    console.error('[Compose on the Left] failed to load', err);
  }
})();
