/**
 * Bundles the NestJS backend into desktop/backend-bundle so the Electron app
 * can spawn it locally against the embedded Postgres.
 *
 * The backend is part of the repo's npm workspaces, so its production deps are
 * hoisted to the ROOT node_modules — backend/node_modules is sparse. To get a
 * self-contained tree we copy dist/ + a cleaned package.json and run an
 * isolated `npm install --omit=dev` inside the bundle.
 *
 * Notes:
 *  - `@groceryone/shared` is listed in deps but never imported by the backend
 *    (0 occurrences) — it's a phantom workspace dep we strip so the isolated
 *    install doesn't try to fetch it from the registry.
 *  - bcrypt is native but its prebuilt binary loads fine under Electron's Node
 *    ABI (verified), so no electron-rebuild is needed.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = path.join(__dirname, '..', '..');
const BACKEND = path.join(REPO, 'backend');
const OUT = path.join(__dirname, '..', 'backend-bundle');

function run(cmd, cwd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// 1. Compile the backend (tsc → backend/dist).
run('npm run build', BACKEND);

const distSrc = path.join(BACKEND, 'dist');
if (!fs.existsSync(path.join(distSrc, 'main.js'))) {
  console.error('✗ backend/dist/main.js missing after build');
  process.exit(1);
}

// 2. Fresh bundle dir with dist + a cleaned package.json.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(distSrc, path.join(OUT, 'dist'), { recursive: true });

const backendPkg = JSON.parse(fs.readFileSync(path.join(BACKEND, 'package.json'), 'utf8'));
const deps = { ...backendPkg.dependencies };
delete deps['@groceryone/shared']; // phantom workspace dep — not imported

const bundlePkg = {
  name: backendPkg.name,
  version: backendPkg.version,
  private: true,
  main: 'dist/main.js',
  dependencies: deps,
};
fs.writeFileSync(path.join(OUT, 'package.json'), JSON.stringify(bundlePkg, null, 2));

// 3. Isolated production install (self-contained node_modules incl. bcrypt prebuild).
run('npm install --omit=dev --no-package-lock --no-audit --no-fund', OUT);

if (!fs.existsSync(path.join(OUT, 'node_modules', '@nestjs', 'core'))) {
  console.error('✗ backend-bundle install incomplete (@nestjs/core missing)');
  process.exit(1);
}

// 4. Report size.
function dirSize(p) {
  let total = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    if (e.isDirectory()) total += dirSize(f);
    else total += fs.statSync(f).size;
  }
  return total;
}
console.log(`✓ Bundled backend → desktop/backend-bundle (${(dirSize(OUT) / 1024 / 1024).toFixed(0)} MB). Entry: dist/main.js`);
