# GroOne Desktop (Windows)

Standalone Windows app gating on a per-tenant yearly license key (₹2,000 / year).

## Architecture

- **Electron 30** main process — license gate + window lifecycle + auto-update.
- Renderer for the main window points at the hosted web app (`https://app.groone.in` by default; override with `GROONE_WEB_URL`).
- License lives in `%APPDATA%\GroOne\license.dat`, encrypted via Electron's `safeStorage` (Windows DPAPI under the hood — file is bound to the OS user account).
- Heartbeat: `POST /licenses/validate` on launch + every 24h. 7-day offline grace if backend unreachable.
- Machine binding: `node-machine-id` reads `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`. Sent raw; backend SHA-256s it before storage.

## Folder layout

```
src/
├── main.ts                 Electron main process
├── preload.ts              IPC bridge (contextIsolation = on)
├── license/
│   ├── machineId.ts        node-machine-id wrapper
│   ├── store.ts            Encrypted license blob persistence
│   └── validator.ts        HTTP calls to /licenses/{activate,validate}
└── windows/
    ├── license-gate.html   Pre-launch UI
    ├── license-gate.css
    └── license-gate.js     Renderer script
```

## Development

```bash
cd desktop
npm install
npm start             # builds + launches Electron in dev
```

Environment overrides:
- `GROONE_API_URL` — default `https://api.groone.in/api/v1`
- `GROONE_WEB_URL` — default `https://app.groone.in`
- `GROONE_DEVTOOLS=1` — open Chrome DevTools on the license-gate window

## Build the Windows installer

```bash
npm run dist          # produces build/GroOne-Setup-1.0.0.exe (NSIS)
npm run dist:dir      # unpacked build for quick smoke tests
```

The first `npm run dist` after a fresh checkout will download Electron + NSIS binaries (~200 MB cached under `%LOCALAPPDATA%\electron-builder\Cache`).

**Code signing**: disabled in v1. Windows SmartScreen will show a warning at install time — click **More info → Run anyway**. Phase 3 adds an EV code-signing certificate.

## Manual activation flow

1. Customer pays ₹2,000 via UPI to `groone@upi`.
2. Customer emails the payment screenshot + business slug to `support@groone.in`.
3. Support runs `POST /licenses/generate` with their admin JWT:
   ```bash
   curl -X POST https://api.groone.in/api/v1/licenses/generate \
     -H "Authorization: Bearer <admin-jwt>" \
     -H "Content-Type: application/json" \
     -d '{"tenantSlug":"<slug>","plan":"desktop_yearly","paymentRef":"manual-UPI-2026-05-15"}'
   ```
4. Support emails the returned `GROD-XXXX-XXXX-XXXX-XXXX` key to the customer.
5. Customer pastes the key into the desktop license gate → main window opens.

## Auto-update

`electron-updater` checks GitHub Releases for new versions on launch. Configure `GH_TOKEN` in CI to publish. See `electron-builder.yml` → `publish` section.

## Roadmap

- **Phase 2**: in-app Razorpay checkout (no email round-trip).
- **Phase 3**: EV code-signing cert; admin "transfer to new machine" UI; Sentry crash reporting.
- **Phase 4**: macOS + Linux targets (`electron-builder.yml` adds two lines).
