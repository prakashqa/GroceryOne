/**
 * Copies non-TS files (HTML/CSS/renderer-JS) from src/ into dist/
 * after `tsc` has emitted the compiled main + preload.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const DIST = path.join(__dirname, '..', 'dist');

function ensure(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyTree(src, dest, extensions) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      ensure(d);
      copyTree(s, d, extensions);
    } else if (extensions.includes(path.extname(entry.name))) {
      fs.copyFileSync(s, d);
    }
  }
}

ensure(DIST);
copyTree(SRC, DIST, ['.html', '.css', '.js']);

console.log('Copied static assets to dist/');
