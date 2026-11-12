// Builds dist/<name>-<version>.zip containing only what the store upload needs.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const slug = manifest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
const out = path.join(dist, `${slug}-${manifest.version}.zip`);
fs.rmSync(out, { force: true });

const include = ['manifest.json', 'src', 'icons', 'LICENSE', 'README.md', 'PRIVACY.md'].filter((p) =>
  fs.existsSync(path.join(root, p)));
try {
  execFileSync('zip', ['-qr', '-X', out, ...include], { cwd: root, stdio: 'inherit' });
} catch (e) {
  console.error('zip failed (is the `zip` command installed?)');
  process.exit(1);
}
console.log(`wrote ${path.relative(root, out)} (${fs.statSync(out).size} bytes)`);
