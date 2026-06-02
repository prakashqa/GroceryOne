# GroOne Desktop (Windows) — offline, self-contained

A fully offline Windows app for a single shop. Each install runs its **own
backend + database on the customer's PC** — no internet, no Vultr, no central
server. Licensing is **offline**: the vendor signs a per-customer key that the
app verifies locally with a built-in public key.

> This is a separate product from the cloud app (api.groone.in + the Android
> app). They share the same `backend` and `web` source; the desktop build just
> runs them locally against an embedded Postgres.

## Architecture

```
GroOne.exe (Electron main process)
 ├─ License gate (OFFLINE)  — verify Ed25519-signed key + expiry. No network.
 └─ On unlock, orchestrates 3 local processes (all 127.0.0.1):
     1. Embedded PostgreSQL   → %APPDATA%/GroOne/pgdata, port 47632 (UTF8)
     2. NestJS backend (reuse) → port 47600, DB_SYNCHRONIZE + REDIS_DISABLED
                                  + SUBSCRIPTION_ENFORCED=false
     3. Next.js UI (reuse)     → NEXT_PUBLIC_API_URL=http://127.0.0.1:47600/api/v1
   BrowserWindow → local UI → local backend → local Postgres.
```

- **Embedded Postgres** (`src/db.ts`): PostgreSQL 18.3 via `embedded-postgres`;
  initialised UTF8 on first run, started each launch, stopped gracefully on quit.
- **Bundled backend** (`src/backend.ts` + `scripts/bundle-backend.js`): the
  NestJS app compiled + isolated-installed into `backend-bundle/`, spawned under
  Electron's Node. bcrypt (native) loads under Electron's ABI — no rebuild.
- **Bundled UI** (`src/server.ts` + `scripts/bundle-web.js`): Next.js standalone
  in `web-bundle/`, served locally.
- **Offline licensing** (`src/license/`): `validator.ts` verifies an
  Ed25519-signed token offline; `store.ts` keeps it (encrypted, DPAPI). Keys
  work on any PC; expiry is enforced on every launch.

## Issuing a license to a customer (vendor)

The private key (`tools/license-gen/license-private.pem`) is generated once and
**kept secret / backed up** (gitignored, never shipped). The matching public key
is embedded in `src/license/publicKey.ts`.

```bash
cd desktop/tools/license-gen
node gen.js --customer "Siri General Stores" --years 1
# → prints the license key + writes Siri-General-Stores.lic
```

Email that key (or the `.lic` file) to the customer. They paste it (or "Import
.lic file") into the app's license gate.

> If the private key is ever lost or leaks, generate a new keypair, update
> `src/license/publicKey.ts`, ship a new build, and re-issue customer keys.

## Build the installer

```bash
cd desktop
npm install
npm run dist:fresh     # rebuild web (local API) + bundle backend + package
# → build/GroOne-Setup-<version>.exe
```

- `dist:fresh` runs `build:web` (bakes the local API URL) + `bundle:web` +
  `bundle:backend` + electron-builder.
- `dist` skips the web rebuild (use when `web/.next` is already built for local).
- Installer is large (~180–250 MB): Electron + Next + NestJS + node_modules +
  Postgres binaries.

Environment overrides (dev):
- `GROONE_WEB_URL=http://localhost:3001` — point the window at a running
  `next dev` instead of the bundled UI.
- `GROONE_DEVTOOLS=1` — open DevTools on the license gate.

## First run (customer)

1. Install + launch → license gate → paste key → app starts (splash while
   Postgres + backend + UI come up, a few seconds).
2. The shop owner does first-run signup (creates the local shop + admin in the
   embedded DB). Subsequent launches go straight in.
3. All data lives in `%APPDATA%/GroOne/pgdata`. Back it up by copying that folder.

## Tests

```bash
npm test    # validator (offline crypto) + store (encrypted persistence)
```

## Roadmap

- Dynamic backend port (drop the fixed 47600 assumption).
- Slimmer local first-run wizard (shop name + PIN).
- Automatic local backups (zip pgdata on quit).
- License-renewal UX (warn before expiry; re-import).
- EV code-signing cert (kills SmartScreen).
