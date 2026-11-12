import { FileStore } from './capture.js';
import { watchChips } from './chips.js';
import { getBlob } from './fetcher.js';
import { Viewer } from './viewer.js';

const TAG = '[Preview Attachments]';

try {
  const store = new FileStore(document);
  const viewer = new Viewer();

  watchChips(document, async (chip, trigger) => {
    const { token, signal } = viewer.showLoading(chip.name, trigger);
    try {
      const result = await getBlob(chip, store, signal);
      viewer.show(token, result);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      console.warn(TAG, 'preview failed', chip, err);
      viewer.showError(token, chip, err);
    }
  });
  console.info(TAG, 'active');
} catch (err) {
  console.error(TAG, 'failed to start', err);
}
