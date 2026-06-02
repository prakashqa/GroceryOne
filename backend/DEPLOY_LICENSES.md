# Deploy runbook — license feature + Siri desktop key

The license backend (commit `f199139`) is on `main` but **not yet deployed**
to the Vultr VM. This session's machine got IP-blocked by the VM's fail2ban
after heavy SSH/curl traffic, so deploy is pending. Run these steps from any
machine that can reach the VM (or from this machine once the ban clears —
fail2ban bans are time-limited).

## 1. Deploy the backend

```bash
ssh -i ~/.ssh/groone_vultr groone@139.84.138.242

cd /srv/groone
git pull origin main
# Rebuild only the api image (TypeORM synchronize is ON for the schema,
# so the license_keys table + the subscriptions.plan widening auto-apply
# on boot — no migration needed).
docker compose build api
docker compose up -d api

# Confirm it booted clean and mapped the new routes:
docker logs groone-api 2>&1 | grep -iE 'LicensesController|license_keys|Nest application successfully started' | tail -10
```

Expected: log lines mapping `POST /licenses/activate|validate|generate|deactivate`,
and a `license_keys` table created by synchronize.

## 2. Smoke-test the endpoints

```bash
# Health: validate with a bogus key → 404 (proves the route is live, no auth needed)
curl -s -X POST https://api.groone.in/api/v1/licenses/validate \
  -H 'Content-Type: application/json' \
  -d '{"key":"GROD-AAAA-AAAA-AAAA-AAAA","machineId":"smoketest"}'
# → {"message":"License key not recognised", ... 404}
```

## 3. Mint Siri's desktop key

```bash
# Get Siri owner's admin JWT
TOKEN=$(curl -s -X POST https://api.groone.in/api/v1/auth/login/pin \
  -H 'Content-Type: application/json' -H 'X-Tenant-ID: siri-general-stores' \
  -d '{"identifier":"7382108689","pin":"1234"}' | jq -r .data.accessToken)

# Mint a desktop_yearly key (expires 1 year out by default)
curl -s -X POST https://api.groone.in/api/v1/licenses/generate \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -H 'X-Tenant-ID: siri-general-stores' \
  -d '{"tenantSlug":"siri-general-stores","plan":"desktop_yearly","paymentRef":"manual-UPI-beta-2026-05-15"}' | jq
# → { "key": "GROD-XXXX-XXXX-XXXX-XXXX", "status":"pending", "expiresAt": "2027-..." }
```

Copy that `key`. That's what Siri types into the desktop license gate.

(Or do it from the web: log in as Siri owner at app.groone.in → sidebar →
**Desktop licenses** → fill paymentRef → Generate → copy the key.)

## 4. Verify activation end-to-end (optional, from the desktop)

Install `desktop/build/GroOne-Setup-1.0.0.exe` on a Windows machine, enter:
- Business slug: `siri-general-stores`
- License key: the `GROD-…` from step 3

The gate calls `POST /licenses/activate`, binds the machine, mirrors a
`desktop_yearly` subscription, and opens the main window. Confirm in the DB:

```bash
docker exec groone-api env NODE_PATH=/app/node_modules node -e "
const {Client}=require('pg');
const c=new Client({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||5432),user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,ssl:{rejectUnauthorized:false}});
(async()=>{await c.connect();
const k=await c.query(\"SELECT key,status,machine_id_hash IS NOT NULL AS bound,expires_at FROM license_keys WHERE tenant_id='fb11b265-f9da-4a31-b3f1-9cc11bd30154'\");
const s=await c.query(\"SELECT plan,status,expires_at FROM subscriptions WHERE tenant_id='fb11b265-f9da-4a31-b3f1-9cc11bd30154' AND plan='desktop_yearly'\");
console.log('license:',JSON.stringify(k.rows));console.log('subscription:',JSON.stringify(s.rows));
await c.end();})().catch(e=>{console.error(e.message);process.exit(1);});
"
```

Expected: license `status=active, bound=true`; one `desktop_yearly`
subscription `status=active`.

## Notes

- **fail2ban**: if your deploy machine also gets blocked, unban via the Vultr
  web console (Serial Console): `sudo fail2ban-client unban <your-ip>` or
  `sudo fail2ban-client set sshd unbanip <your-ip>`. Consider raising
  `maxretry` / lowering aggressiveness if this recurs during ops.
- **No migration needed**: `synchronize` is on for the api's TypeORM config in
  this environment, so the new entity + enum widening apply on boot. If you
  later switch synchronize off for prod safety, generate a migration for
  `license_keys` + the `subscriptions.plan` length first.
