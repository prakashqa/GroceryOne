/**
 * Bundles the web app's Next.js standalone output into desktop/web-bundle/
 * so the Electron app can serve the UI locally.
 *
 * Expects `web` to have been built with `output: 'standalone'` and
 * `outputFileTracingRoot` = repo root (see web/next.config.js). With those,
 * the monorepo standalone layout is:
 *
 *   web/.next/standalone/
 *   ├── node_modules/          (traced deps)
 *   ├── web/server.js          ← entry
 *   ├── web/.next/             (server chunks — NOT static assets)
 *   └── packages/ …            (workspace pkgs, if traced)
 *
 * Next does NOT copy static assets or /public into standalone — we do it
 * here so server.js can serve them.
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const WEB = path.join(REPO, 'web');
const STANDALONE = path.join(WEB, '.next', 'standalone');
const OUT = path.join(__dirname, '..', 'web-bundle');

function must(p, hint) {
  if (!fs.existsSync(p)) {
    console.error(`✗ Missing: ${p}\n  ${hint}`);
    process.exit(1);
  }
}

must(STANDALONE, 'Run `npm run build` in web/ first (needs output:standalone).');

// 1. Fresh out dir
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 2. Copy the whole standalone tree
fs.cpSync(STANDALONE, OUT, { recursive: true });

// 3. server.js lives at <standalone>/web/server.js in a monorepo build.
const serverDir = path.join(OUT, 'web');
must(path.join(serverDir, 'server.js'), 'Standalone server.js not found — check outputFileTracingRoot.');

// 4. Copy static assets the standalone bundle omits.
const staticSrc = path.join(WEB, '.next', 'static');
const staticDest = path.join(serverDir, '.next', 'static');
must(staticSrc, 'web/.next/static missing — build incomplete.');
fs.mkdirSync(path.dirname(staticDest), { recursive: true });
fs.cpSync(staticSrc, staticDest, { recursive: true });

// 5. Copy /public if present (optional).
const publicSrc = path.join(WEB, 'public');
if (fs.existsSync(publicSrc) && fs.readdirSync(publicSrc).length > 0) {
  fs.cpSync(publicSrc, path.join(serverDir, 'public'), { recursive: true });
}

// 6. Report size.
function dirSize(p) {
  let total = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    if (e.isDirectory()) total += dirSize(f);
    else total += fs.statSync(f).size;
  }
  return total;
}
const mb = (dirSize(OUT) / 1024 / 1024).toFixed(1);
console.log(`✓ Bundled web UI → desktop/web-bundle (${mb} MB). Entry: web/server.js`);
