/**
 * Fix A + B for the post-PIN-setup Siri owner regression:
 *  A) Set the owner's pin_hash to bcrypt('1234', 12) so /auth/login/pin
 *     returns full credentials and Redux gets the admin user on re-login.
 *  B) Activate all 519 kirana items so Manage Items shows them.
 *
 * Runs inside the prod api container. Both updates use the strictest
 * tenant + role + (where applicable) id predicates. Aborts unless the
 * affected row counts match expectations.
 *
 * Usage:
 *   node /tmp/fix-owner-pin-and-activate-items.js              # dry-run
 *   node /tmp/fix-owner-pin-and-activate-items.js --commit
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const OWNER_ID = '38ee2957-d90c-4fa3-8cd7-bd3168a6433c';
const TENANT_ID = 'fb11b265-f9da-4a31-b3f1-9cc11bd30154';
const PIN = '1234';
const SALT_ROUNDS = 12; // matches backend/src/modules/auth/services/password.service.ts:11

(async () => {
  const commit = process.argv.includes('--commit');
  const c = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  try {
    // Snapshot pre-state for verification
    const ownerBefore = await c.query(
      `SELECT id, phone, role, status, (pin_hash IS NOT NULL) AS has_pin
       FROM users WHERE id = $1`,
      [OWNER_ID],
    );
    if (ownerBefore.rowCount !== 1) throw new Error(`owner ${OWNER_ID} not found`);
    console.log('Owner BEFORE:', JSON.stringify(ownerBefore.rows[0]));

    const itemsBefore = await c.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE is_active = true)::int AS active
       FROM items WHERE tenant_id = $1`,
      [TENANT_ID],
    );
    console.log('Items BEFORE:', itemsBefore.rows[0]);

    // Cross-tenant items snapshot (defence-in-depth)
    const otherTenantsBefore = await c.query(
      `SELECT tenant_id, COUNT(*)::int n FROM items WHERE tenant_id <> $1 GROUP BY tenant_id`,
      [TENANT_ID],
    );
    console.log('Other tenants items BEFORE:', JSON.stringify(otherTenantsBefore.rows));

    if (!commit) {
      console.log('\nDRY RUN — no writes. Pass --commit to apply.');
      return;
    }

    // ===== Fix A: set pin_hash =====
    const hash = await bcrypt.hash(PIN, SALT_ROUNDS);
    if (!/^\$2[aby]?\$12\$/.test(hash)) {
      throw new Error(`bcrypt output looks wrong: ${hash}`);
    }
    console.log(`Computed bcrypt hash (${hash.length} chars, prefix ${hash.slice(0, 7)}…)`);

    const updA = await c.query(
      `UPDATE users
         SET pin_hash = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND role = 'admin'
       RETURNING id, (pin_hash IS NOT NULL) AS has_pin, length(pin_hash) AS hashlen`,
      [hash, OWNER_ID, TENANT_ID],
    );
    if (updA.rowCount !== 1) throw new Error(`Fix A: expected 1 row, got ${updA.rowCount}`);
    if (!updA.rows[0].has_pin || updA.rows[0].hashlen !== 60) {
      throw new Error(`Fix A: post-update has_pin/hashlen wrong: ${JSON.stringify(updA.rows[0])}`);
    }
    console.log('Fix A applied:', JSON.stringify(updA.rows[0]));

    // ===== Fix B: activate items =====
    const updB = await c.query(
      `UPDATE items
         SET is_active = true, updated_at = NOW()
       WHERE tenant_id = $1 AND is_active = false`,
      [TENANT_ID],
    );
    console.log(`Fix B applied: ${updB.rowCount} items activated`);

    // ===== Post-flight checks =====
    const itemsAfter = await c.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE is_active = true)::int AS active
       FROM items WHERE tenant_id = $1`,
      [TENANT_ID],
    );
    console.log('Items AFTER:', itemsAfter.rows[0]);
    if (itemsAfter.rows[0].active !== itemsAfter.rows[0].total) {
      throw new Error('Not all Siri items active post-fix');
    }

    const otherTenantsAfter = await c.query(
      `SELECT tenant_id, COUNT(*)::int n FROM items WHERE tenant_id <> $1 GROUP BY tenant_id`,
      [TENANT_ID],
    );
    console.log('Other tenants items AFTER:', JSON.stringify(otherTenantsAfter.rows));
    if (JSON.stringify(otherTenantsAfter.rows) !== JSON.stringify(otherTenantsBefore.rows)) {
      throw new Error('Cross-tenant items changed — abort.');
    }

    // User-row touch count: only owner should have moved
    const recentUserUpdates = await c.query(
      `SELECT id, role FROM users WHERE updated_at > NOW() - INTERVAL '1 minute'`,
    );
    console.log(`Users updated in last 1 min: ${recentUserUpdates.rowCount} (expect 1: owner)`);
    if (recentUserUpdates.rowCount !== 1 || recentUserUpdates.rows[0].id !== OWNER_ID) {
      throw new Error('Unexpected user-row activity');
    }

    // Items distinct tenant_id post-update
    const tenantTouched = await c.query(
      `SELECT DISTINCT tenant_id FROM items WHERE updated_at > NOW() - INTERVAL '1 minute'`,
    );
    if (tenantTouched.rowCount !== 1 || tenantTouched.rows[0].tenant_id !== TENANT_ID) {
      throw new Error('Items touched across multiple tenants — abort.');
    }

    // Bcrypt round-trip self-check
    const ok = await bcrypt.compare(PIN, hash);
    console.log(`bcrypt round-trip check (PIN '${PIN}' vs new hash): ${ok ? 'OK ✓' : 'FAIL'}`);
    if (!ok) throw new Error('bcrypt round-trip failed');

    console.log('\n✓ Both fixes applied successfully. Owner can now logout and re-login.');
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error('\nFATAL:', e.message || e);
  process.exit(1);
});
