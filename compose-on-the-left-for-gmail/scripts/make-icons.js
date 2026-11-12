// Generates icons/icon{16,48,128}.png: a blue rounded square with a window
// outline pushed to the bottom-left and a left-pointing arrow above it.
const fs = require('fs');
const path = require('path');
const { encodePng } = require('./png');

const BLUE = [26, 115, 232];
const WHITE = [255, 255, 255];

function icon(size) {
  const r = size * 0.2;
  const c = size / 2;
  const u = size / 16; // design unit on a 16-grid
  const inRect = (px, py, x0, y0, x1, y1) => px >= x0 * u && px < x1 * u && py >= y0 * u && py < y1 * u;
  return encodePng(size, size, (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    const dx = Math.max(Math.abs(px - c) - (c - r), 0);
    const dy = Math.max(Math.abs(py - c) - (c - r), 0);
    if (Math.hypot(dx, dy) > r) return [0, 0, 0, 0];

    // window: outline 2..9 x 7..14, with a thicker title bar
    const outer = inRect(px, py, 2, 7, 9.5, 14);
    const inner = inRect(px, py, 3, 9, 8.5, 13);
    if (outer && !inner) return [...WHITE, 255];

    // arrow pointing left at top-right: shaft 8..13 x 3.5..5, head triangle
    if (inRect(px, py, 8, 3.6, 13.5, 5)) return [...WHITE, 255];
    const hx = px / u; const hy = py / u;
    if (hx >= 5.5 && hx < 8.5 && Math.abs(hy - 4.3) <= (hx - 5.5) * 0.85) return [...WHITE, 255];

    return [...BLUE, 255];
  });
}

const dir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(dir, { recursive: true });
for (const size of [16, 48, 128]) {
  fs.writeFileSync(path.join(dir, `icon${size}.png`), icon(size));
  console.log(`wrote icons/icon${size}.png`);
}
