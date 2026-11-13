// End-to-end smoke test against a mock Gmail page, using Playwright/Chromium.
// Set SCREENSHOT=/path.png to capture the page with the windows on the left.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      const file = path.join(root, path.normalize(url.pathname));
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); return res.end('404');
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const assert = (cond, msg) => { if (!cond) throw new Error('assertion failed: ' + msg); console.log('ok  ', msg); };
  const rect = (sel) => page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, width: r.width }; });
  const rowSide = () => page.$eval('#row', (el) => el.getAttribute('data-gcl-row'));
  const settle = () => page.waitForTimeout(100);
  const W = 1280;
  const LEFT_EDGE = 56; // Gmail's collapsed nav rail

  await page.goto(`${base}/test/mock-gmail.html`);
  await page.waitForSelector('#compose-1 .gcl-toggle');
  await page.waitForSelector('#compose-2 .gcl-toggle');
  await settle();

  // Default: Gmail's layout is untouched, windows stay on the right.
  let r1 = await rect('#compose-1');
  let r2 = await rect('#compose-2');
  assert((await rowSide()) === 'right', 'row starts on the right (Gmail default)');
  assert(r2.right > W - 100 && r1.right < r2.left, `windows start at the right edge (right=${r2.right})`);
  const inlineBefore = await rect('#inline-reply');
  assert(inlineBefore.left > 0 && inlineBefore.top < 400, 'inline reply untouched');
  assert((await page.$$('#gcl-style')).length === 1, 'stylesheet injected once');

  // Toggle buttons: one per docked window, none on the inline reply.
  assert((await page.$$('#compose-1 .gcl-toggle')).length === 1, 'compose 1 has one toggle (class hint)');
  assert((await page.$$('#compose-2 .gcl-toggle')).length === 1, 'compose 2 has one toggle (structural fallback)');
  assert(await page.$eval('#compose-1 .gcl-toggle', (b) => b.nextElementSibling.classList.contains('Hl')), 'toggle inserted before the minimize icon');
  assert(await page.$eval('#compose-2 .gcl-toggle', (b) => b.parentElement.classList.contains('hdr') && !b.hasAttribute('data-fallback')), 'fallback toggle placed in header row');
  assert((await page.$$('#inline-reply .gcl-toggle')).length === 0, 'inline reply has no toggle');
  assert(/left side/.test(await page.getAttribute('#compose-1 .gcl-toggle', 'aria-label')), 'label offers the left side');

  // Click → everything moves left; header never sees the click or mousedown.
  await page.click('#compose-1 .gcl-toggle');
  await settle();
  r1 = await rect('#compose-1');
  r2 = await rect('#compose-2');
  assert((await rowSide()) === 'left', 'row attribute flipped to left');
  assert(r1.left < LEFT_EDGE + 10 && r2.left > r1.right && r2.left < W / 2, `toggle moves windows to the left edge (left=${r1.left})`);
  assert((await page.textContent('#header-clicks')) === '0', 'click did not reach Gmail header');
  assert(!(await page.$eval('#compose-1 .hdr', (h) => h.dataset.mousedown)), 'mousedown did not reach Gmail header');
  assert(/right side/.test(await page.getAttribute('#compose-2 .gcl-toggle', 'aria-label')), 'all labels updated');
  if (process.env.SCREENSHOT) await page.screenshot({ path: process.env.SCREENSHOT });

  // New compose while on the left opens on the left and gets a button.
  await page.click('#add-compose');
  await page.waitForSelector('#compose-3 .gcl-toggle');
  assert((await rect('#compose-3')).left > (await rect('#compose-2')).right && (await rect('#compose-1')).left < LEFT_EDGE + 10, 'new window follows current side (left)');

  // Keyboard toggle from compose 3 → back right; Space toggles too.
  await page.focus('#compose-3 .gcl-toggle');
  await page.keyboard.press('Enter');
  await settle();
  assert((await rowSide()) === 'right' && (await rect('#compose-3')).right > W - 100, 'Enter moves windows back right');
  await page.keyboard.press(' ');
  await settle();
  assert((await rowSide()) === 'left', 'Space toggles too');

  // Full-screen compose is left alone; collapsing restores the chosen side.
  await page.click('#expand');
  await page.waitForSelector('#row[data-gcl-row="right"]');
  r1 = await rect('#compose-1');
  assert(r1.width > W * 0.6, `expanded compose releases the row (width=${r1.width})`);
  await page.click('#expand');
  await page.waitForSelector('#row[data-gcl-row="left"]');
  assert((await rect('#compose-1')).left < LEFT_EDGE + 10, 'collapsing restores the left side');

  // One-off: closing every window resets to Gmail's default for the next one.
  await page.click('#close-all');
  await page.waitForFunction(() => !document.querySelector('[data-gcl-pin], [data-gcl-strip]'));
  await page.click('#add-compose');
  await page.waitForSelector('#compose-4 .gcl-toggle');
  assert((await rowSide()) === 'right' && (await rect('#compose-4')).right > W - 100, 'after all windows close, the next one opens on the right again');
  assert(/left side/.test(await page.getAttribute('#compose-4 .gcl-toggle', 'aria-label')), 'label reset too');

  await browser.close();
  server.close();
  if (errors.length) { console.error('page errors:', errors); process.exit(1); }
  console.log('smoke test passed');
}

main().catch((e) => { console.error(e); process.exit(1); });
