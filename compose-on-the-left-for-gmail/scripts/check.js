// Static sanity checks: manifest is valid, every referenced file exists, every JS file parses.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL', msg); };
const ok = (msg) => console.log('ok  ', msg);

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
if (manifest.permissions || manifest.host_permissions) fail('extension must not request permissions');
if (/^gmail/i.test(manifest.name)) fail('name must not start with "Gmail" (Web Store branding policy)');

const referenced = new Set();
Object.values(manifest.icons || {}).forEach((p) => referenced.add(p));
(manifest.content_scripts || []).forEach((cs) => (cs.js || []).forEach((p) => referenced.add(p)));
(manifest.web_accessible_resources || []).forEach((w) => (w.resources || []).forEach((p) => referenced.add(p)));
for (const p of referenced) {
  if (fs.existsSync(path.join(root, p))) ok(`exists ${p}`);
  else fail(`missing ${p}`);
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gcl-check-'));
try {
  for (const f of fs.readdirSync(path.join(root, 'src'))) {
    if (!f.endsWith('.js')) continue;
    const text = fs.readFileSync(path.join(root, 'src', f), 'utf8');
    const isModule = /^\s*(import|export)\b/m.test(text);
    const tmp = path.join(tmpDir, f.replace(/\.js$/, isModule ? '.mjs' : '.cjs'));
    fs.writeFileSync(tmp, text);
    try {
      execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
      ok(`parses src/${f}`);
    } catch (e) {
      fail(`syntax error in src/${f}\n${e.stderr}`);
    }
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Every ES module import inside src/ must be web-accessible.
const war = new Set((manifest.web_accessible_resources || []).flatMap((w) => w.resources || []));
for (const f of fs.readdirSync(path.join(root, 'src'))) {
  if (!f.endsWith('.js')) continue;
  const text = fs.readFileSync(path.join(root, 'src', f), 'utf8');
  for (const m of text.matchAll(/from '\.\/([^']+)'/g)) {
    if (!war.has(`src/${m[1]}`)) fail(`src/${f} imports src/${m[1]} which is not web-accessible`);
    else ok(`src/${f} -> src/${m[1]}`);
  }
}

if (failures) { console.error(`${failures} check(s) failed`); process.exit(1); }
console.log('all checks passed');
