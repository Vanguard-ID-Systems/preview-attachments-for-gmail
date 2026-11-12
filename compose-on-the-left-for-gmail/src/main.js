import { watchDock } from './dock.js';

const TAG = '[Compose on the Left]';

try {
  watchDock(document);
  console.info(TAG, 'active');
} catch (err) {
  console.error(TAG, 'failed to start', err);
}
