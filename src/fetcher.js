// Produces a Blob for a chip: the locally captured File when we have it and it matches,
// otherwise Gmail's own download URL fetched with the user's existing session.
import { isSafeAttachmentUrl } from './chips.js';

const EXT_MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  svg: 'image/svg+xml', bmp: 'image/bmp', pdf: 'application/pdf', txt: 'text/plain',
  csv: 'text/csv', json: 'application/json', md: 'text/markdown',
};

export function guessMime(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  return EXT_MIME[ext] || '';
}

function pickMime(...candidates) {
  for (const c of candidates) {
    if (c && c !== 'application/octet-stream') return c.split(';')[0].trim();
  }
  return 'application/octet-stream';
}

// A locally captured file is only trusted when its size agrees with the chip's label,
// so two attachments that share a name cannot show the wrong file.
export function sizeMatches(fileSize, label) {
  if (!label) return true;
  const tolerance = Math.max(label.bytes * 0.02, label.unit);
  return Math.abs(fileSize - label.bytes) <= tolerance;
}

export async function getBlob(chip, store, signal) {
  const local = store.get(chip.name);
  if (local && sizeMatches(local.size, chip.size)) {
    return { blob: local, name: chip.name, mime: pickMime(local.type, chip.mime, guessMime(chip.name)) };
  }
  if (!chip.url || !isSafeAttachmentUrl(chip.url)) {
    throw new Error('Gmail has not provided a download link for this attachment yet. ' +
      'Wait for the upload to finish, or note that Drive attachments are not supported.');
  }
  const opts = { credentials: 'include', signal };
  let res = await fetch(chip.url, opts);
  let contentType = res.headers.get('content-type') || '';
  // Compose chips link to disp=safe. If Gmail answers with a page instead of bytes, try disp=inline once.
  if ((!res.ok || contentType.startsWith('text/html')) && chip.url.includes('disp=safe')) {
    res = await fetch(chip.url.replace('disp=safe', 'disp=inline'), opts);
    contentType = res.headers.get('content-type') || '';
  }
  if (!res.ok) throw new Error(`Gmail returned HTTP ${res.status} for this attachment.`);
  if (contentType.startsWith('text/html')) {
    throw new Error('Gmail returned a web page instead of the file (session may need refreshing).');
  }
  const blob = await res.blob();
  return { blob, name: chip.name, mime: pickMime(contentType, chip.mime, blob.type, guessMime(chip.name)) };
}
