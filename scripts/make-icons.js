// Generates icons/icon{16,48,128}.png: a blue rounded square with an eye.
const fs = require('fs');
const path = require('path');
const { encodePng } = require('./png');

const BLUE = [26, 115, 232];
const WHITE = [255, 255, 255];
const DARK = [32, 33, 36];

function icon(size) {
  const r = size * 0.2;
  const cx = size / 2;
  const cy = size / 2;
  return encodePng(size, size, (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    // rounded square
    const dx = Math.max(Math.abs(px - cx) - (cx - r), 0);
    const dy = Math.max(Math.abs(py - cy) - (cy - r), 0);
    if (Math.hypot(dx, dy) > r) return [0, 0, 0, 0];
    // eye: white ellipse, dark pupil
    const ex = (px - cx) / (size * 0.36);
    const ey = (py - cy) / (size * 0.22);
    if (ex * ex + ey * ey <= 1) {
      const pupil = Math.hypot(px - cx, py - cy) <= size * 0.12;
      return [...(pupil ? DARK : WHITE), 255];
    }
    return [...BLUE, 255];
  });
}

const dir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(dir, { recursive: true });
for (const size of [16, 48, 128]) {
  fs.writeFileSync(path.join(dir, `icon${size}.png`), icon(size));
  console.log(`wrote icons/icon${size}.png`);
}
