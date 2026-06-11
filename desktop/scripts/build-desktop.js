/**
 * Channel-aware desktop build orchestrator.
 *
 *   node scripts/build-desktop.js          → INTERNAL/test build (test tools ON)
 *   node scripts/build-desktop.js --prod   → CUSTOMER build (test tools OFF, empty app)
 *
 * One flag (GROONE_TEST_TOOLS) drives BOTH the web `NEXT_PUBLIC_ENABLE_TEST_TOOLS`
 * (gates the "Generate test barcodes" button) and the generated desktop
 * `buildFlags.TEST_TOOLS_ENABLED` (gates the backend test-barcodes endpoint).
 * Centralising it here avoids brittle cross-env juggling across chained npm
 * scripts on Windows.
 */
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const prod = process.argv.includes('--prod');
const testTools = prod ? '0' : '1';

function run(cmd, extraEnv) {
  execSync(cmd, {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env, GROONE_TEST_TOOLS: testTools, ...(extraEnv || {}) },
  });
}

// 1. Bake the test-tools flag into desktop main/backend.
run('node scripts/write-build-flags.js');
// 2. Compile desktop TS + copy static assets.
run('npm run build:ts');
run('npm run copy:static');
// 3. Build the web UI with the matching NEXT_PUBLIC_ENABLE_TEST_TOOLS.
run('npm --prefix ../web run build', {
  NEXT_PUBLIC_API_URL: 'http://127.0.0.1:47600/api/v1',
  NEXT_PUBLIC_ENABLE_TEST_TOOLS: testTools,
  NEXT_PUBLIC_DESKTOP_BUILD: '1',
});
// 4. Bundle web + backend into the app resources.
run('node scripts/bundle-web.js');
run('node scripts/bundle-backend.js');
// 5. Package the NSIS installer.
run('npx electron-builder --win nsis --x64');

console.log(
  `\n✓ Built ${prod ? 'CUSTOMER installer (test tools OFF — empty app)' : 'INTERNAL installer (test tools ON)'}`,
);
