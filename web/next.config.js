const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@groceryone/shared', '@groceryone/store', '@groceryone/i18n'],

  // `standalone` emits a self-contained server (.next/standalone) that the
  // desktop Electron app bundles and spawns locally — no external web host.
  // Harmless for normal `next start` web deploys.
  output: 'standalone',

  // This is a monorepo (npm workspaces). Point file-tracing at the repo root
  // so the standalone bundle includes the transpiled workspace packages
  // (@groceryone/*) and hoisted node_modules.
  outputFileTracingRoot: path.join(__dirname, '..'),
};

module.exports = nextConfig;
