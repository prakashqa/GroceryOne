/**
 * Bootstrap dependency / wiring regression tests.
 *
 * Catches the two failure modes that surfaced in dev:
 * 1. `@nestjs/platform-express` not resolvable from backend cwd
 *    (workspace-hoist breakage that produced the "No driver (HTTP)
 *    has been selected" startup error).
 * 2. `main.ts` silently going back to the implicit-driver form of
 *    `NestFactory.create(AppModule)`, which would re-introduce the
 *    same dynamic-require failure mode.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('bootstrap dependencies', () => {
  it('can resolve @nestjs/platform-express from the backend workspace', () => {
    expect(() => require.resolve('@nestjs/platform-express')).not.toThrow();
  });

  it('can resolve @nestjs/core', () => {
    expect(() => require.resolve('@nestjs/core')).not.toThrow();
  });
});

describe('main.ts wiring', () => {
  const mainSource = readFileSync(join(__dirname, 'main.ts'), 'utf8');

  it('imports ExpressAdapter from @nestjs/platform-express', () => {
    // Static import bypasses Nest's PackageLoader dynamic require, which is
    // brittle under npm-workspace hoisting. Removing this import would
    // re-introduce the "No driver (HTTP) has been selected" runtime error.
    expect(mainSource).toMatch(
      /from\s+['"]@nestjs\/platform-express['"]/,
    );
    expect(mainSource).toMatch(/ExpressAdapter/);
  });

  it('passes an explicit adapter to NestFactory.create', () => {
    // Must call create with at least two arguments so the adapter is
    // explicit; the failure mode was `NestFactory.create(AppModule)` alone.
    expect(mainSource).toMatch(
      /NestFactory\.create\s*\(\s*AppModule\s*,\s*new\s+ExpressAdapter/,
    );
  });
});
