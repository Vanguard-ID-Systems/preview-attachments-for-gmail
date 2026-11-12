// End-to-end smoke test against a mock Gmail page, using Playwright/Chromium.
// Exercises chip detection (incl. non-English and hostile cases), fetch fallback, local
// File capture with size check, PDF path, error card, unsupported-type card, keyboard and
// focus behaviour. Set SCREENSHOT=/path.png to capture the open viewer.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { encodePng } = require('./png');

const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.pdf': 'application/pdf', '.zip': 'application/zip', '.json': 'application/json' };

function minimalPdf() {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((body, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => { out += `${String(o).padStart(10, '0')} 00000 n \n`; });
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

function writeFixtures(dir) {
  const png = encodePng(16, 16, (x, y) => [x * 16, y * 16, 128, 255]);
  fs.writeFileSync(path.join(dir, 'test.png'), png);
  fs.writeFileSync(path.join(dir, 'test.pdf'), minimalPdf());
  fs.writeFileSync(path.join(dir, 'test.zip'), Buffer.from('PK\u0005\u0006' + '\0'.repeat(18), 'latin1'));
  return { png };
}

function serve(fixtures) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      const notFound = () => { res.writeHead(404, { 'content-type': 'text/html' }); res.end('<h1>404</h1>'); };
      // Attachment endpoint shaped like Gmail's: /mail/u/0/?view=att&file=<fixture>
      if (url.pathname.startsWith('/mail/')) {
        const name = path.basename(url.searchParams.get('file') || '');
        const file = path.join(fixtures, name);
        if (!name || !fs.existsSync(file)) return notFound();
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream',
          'content-disposition': `attachment; filename="${name}"` });
        return res.end(fs.readFileSync(file));
      }
      const file = path.join(root, path.normalize(url.pathname));
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return notFound();
      let body = fs.readFileSync(file);
      if (file.endsWith('mock-gmail.html')) {
        body = Buffer.from(body.toString().replaceAll('__BASE__', `http://127.0.0.1:${server.address().port}`));
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  const fixtures = fs.mkdtempSync(path.join(os.tmpdir(), 'pafg-fixtures-'));
  const { png } = writeFixtures(fixtures);
  const server = await serve(fixtures);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // The error-path tests deliberately fetch 404s; ignore those resource errors.
  page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
  page.on('request', (r) => requests.push(r.url()));

  const assert = (cond, msg) => { if (!cond) throw new Error('assertion failed: ' + msg); console.log('ok  ', msg); };
  const overlay = () => page.evaluate(() => {
    const o = document.getElementById('gap-host').shadowRoot.querySelector('.overlay');
    return { hidden: o.hidden, role: o.getAttribute('role') };
  });
  const waitClosed = () => page.waitForFunction(() =>
    document.getElementById('gap-host').shadowRoot.querySelector('.overlay').hidden);
  const clickPreview = (chipId) => page.click(`#${chipId} .gap-preview-button`);
  const imageShown = async (frame) => {
    await frame.waitForSelector('img.preview');
    await frame.waitForFunction(() => document.querySelector('img.preview').naturalWidth > 0);
    return frame.$eval('img.preview', (img) => img.naturalWidth);
  };

  await page.goto(`${base}/test/mock-gmail.html`);
  await page.waitForSelector('#chip-bin .gap-preview-button');
  const decorated = await page.$$eval('.gap-preview-button', (els) => els.map((e) => e.parentElement.id));
  assert(decorated.length === 8, `8 compose chips decorated (got ${decorated.length})`);
  assert(decorated.includes('chip-de'), 'non-English chip decorated via structural match');
  assert(await page.$('#received .gap-preview-button') === null, 'attachments outside compose not decorated');
  assert(await page.$('[role="textbox"] .gap-preview-button') === null, 'quoted link in body not decorated');
  assert(await page.$('#gap-preview-style') !== null, 'button stylesheet injected once');

  const info = await page.evaluate(async () => {
    const { chipInfo, parseSizeLabel } = await import('/src/chips.js');
    return {
      remote: chipInfo(document.getElementById('chip-remote')),
      de: chipInfo(document.getElementById('chip-de')),
      foreign: chipInfo(document.getElementById('chip-foreign')),
      sizes: ['(1,758K)', '(2.3M)', '(950 B)', '(1 K)', '(12M)'].map(parseSizeLabel),
    };
  });
  assert(info.remote.name === 'Jack headshot (3).png', `name from .vI (${info.remote.name})`);
  assert(/\/mail\/u\/0\/\?.*view=att/.test(info.remote.url), 'url from link href');
  assert(info.remote.size && info.remote.size.bytes === 1024, 'size label parsed');
  assert(info.de.name === 'foto.png' && info.de.url, 'non-English chip resolves name and url');
  assert(info.foreign.url === '', 'off-origin link yields no url');
  const [s1, s2, s3, s4, s5] = info.sizes.map((s) => s && s.bytes);
  assert(s1 === 1758 * 1024 && Math.round(s2) === Math.round(2.3 * 1024 ** 2) && s3 === 950 && s4 === 1024 && s5 === 12 * 1024 ** 2,
    'size labels: thousands separator, decimal, bytes, spaced unit');

  // 1. Fetch path with an image; focus returns to the button on close.
  await page.focus('#chip-remote .gap-preview-button');
  await clickPreview('chip-remote');
  let o = await overlay();
  assert(!o.hidden && o.role === 'dialog', 'overlay opens with dialog role');
  await page.waitForTimeout(200);
  assert(context.pages().length === 1, 'clicking the eye does not open the chip link in a new tab');
  let frame;
  for (let i = 0; i < 50 && !(frame = page.frames().find((f) => f.url().includes('/src/frame.html'))); i++) {
    await page.waitForTimeout(100);
  }
  assert(frame, 'viewer frame present');
  assert((await imageShown(frame)) === 16, 'image rendered via fetch');
  assert((await frame.$eval('#name', (el) => el.textContent)) === 'Jack headshot (3).png', 'header shows filename');
  if (process.env.SCREENSHOT) await page.screenshot({ path: process.env.SCREENSHOT });
  await page.keyboard.press('Escape');
  await waitClosed();
  assert((await page.evaluate(() => document.activeElement.closest('#chip-remote') !== null)), 'focus returns to the chip button');

  // 2. Keyboard activation opens the preview without reaching Gmail.
  await page.focus('#chip-remote .gap-preview-button');
  await page.keyboard.press('Enter');
  assert(!(await overlay()).hidden, 'Enter on the button opens the preview');
  assert(context.pages().length === 1, 'Enter does not open the chip link');
  await page.keyboard.press('Escape');
  await waitClosed();

  // 3. Locally captured file beats a broken download URL when the size matches…
  await page.setInputFiles('#file-input', { name: 'local.png', mimeType: 'image/png', buffer: png });
  const before = requests.length;
  await clickPreview('chip-local');
  await imageShown(frame);
  assert(requests.slice(before).every((u) => !u.includes('file=missing.png')), 'local file used, no network request');
  await frame.click('#zoom');
  assert(await frame.$eval('#stage', (s) => s.classList.contains('zoomed')), 'zoom toggle works');
  await frame.click('#close');
  await waitClosed();

  // …but a same-named chip with a different size bypasses the local copy.
  await clickPreview('chip-mismatch');
  await frame.waitForSelector('.card.error');
  assert(/HTTP 404/.test(await frame.$eval('.card.error', (c) => c.textContent)), 'size mismatch falls back to fetch');
  await page.keyboard.press('Escape');
  await waitClosed();

  // 4. PDF path uses a blob: iframe and parks focus on Close.
  await clickPreview('chip-pdf');
  await frame.waitForSelector('iframe.preview');
  assert((await frame.$eval('iframe.preview', (f) => f.src)).startsWith('blob:'), 'PDF rendered in blob iframe');
  assert(await frame.evaluate(() => document.activeElement.id === 'close'), 'focus parked on Close for PDF');
  await page.keyboard.press('Escape');
  await waitClosed();

  // 5. Fetch failure shows an error card with a same-origin download link.
  await clickPreview('chip-error');
  await frame.waitForSelector('.card.error');
  assert(await frame.$('.card.error a.btn') !== null, 'error card offers download link');
  await page.keyboard.press('Escape');
  await waitClosed();

  // 6. Off-origin link: nothing fetched, no download link offered.
  const beforeForeign = requests.length;
  await clickPreview('chip-foreign');
  await frame.waitForSelector('.card.error');
  assert(requests.slice(beforeForeign).every((u) => !u.includes('attacker.example')), 'off-origin link never fetched');
  assert(await frame.$('.card.error a.btn') === null, 'no download link for off-origin url');
  await page.keyboard.press('Escape');
  await waitClosed();

  // 7. Unsupported type shows an informative card; Tab cycles inside the toolbar.
  await clickPreview('chip-bin');
  await frame.waitForSelector('.card:not(.error)');
  assert(/No preview available/.test(await frame.$eval('.card', (c) => c.textContent)), 'unsupported type shows no-preview card');
  await frame.focus('#close');
  await frame.press('#close', 'Tab');
  assert(await frame.evaluate(() => document.activeElement.id === 'download'), 'Tab wraps within the toolbar');
  await page.keyboard.press('Escape');
  await waitClosed();
  await page.waitForTimeout(100);
  assert((await frame.$eval('#stage', (s) => s.children.length)) === 0, 'stage cleared on close');

  // 8. A cloned chip (Gmail pop-out) still works through delegated handlers.
  await page.evaluate(() => {
    const clone = document.getElementById('chip-remote').cloneNode(true);
    clone.id = 'chip-clone';
    document.querySelector('.chips').appendChild(clone);
  });
  await clickPreview('chip-clone');
  assert((await imageShown(frame)) === 16, 'cloned chip previews via delegated handler');
  await page.keyboard.press('Escape');
  await waitClosed();

  await browser.close();
  server.close();
  fs.rmSync(fixtures, { recursive: true, force: true });
  if (errors.length) { console.error('page errors:', errors); process.exit(1); }
  console.log('smoke test passed');
}

main().catch((e) => { console.error(e); process.exit(1); });
