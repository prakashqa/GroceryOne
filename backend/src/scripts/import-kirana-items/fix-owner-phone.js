/**
 * One-off fix: update Siri owner's phone from 9989114468 → 7382108689.
 *
 * Runs inside the prod api container. Uses three-predicate UPDATE
 * (id + tenant_id + role='admin') for safety. Aborts unless exactly one
 * row is affected. Pre-flight checks for cross-tenant collision.
 *
 * Usage:
 *   node /tmp/fix-owner-phone.js              # dry-run + collision check
 *   node /tmp/fix-owner-phone.js --commit     # writes
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');

const OWNER_ID = '38ee2957-d90c-4fa3-8cd7-bd3168a6433c';
const TENANT_ID = 'fb11b265-f9da-4a31-b3f1-9cc11bd30154';
const OLD_PHONE = '9989114468';
const NEW_PHONE = '7382108689';

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
    // Pre-flight 1: target row exists and is the admin we expect.
    const before = await c.query(
      `SELECT id, phone, email, role, status, first_name, tenant_id, (pin_hash IS NOT NULL) AS has_pin
       FROM users WHERE id = $1`,
      [OWNER_ID],
    );
    if (before.rowCount !== 1) throw new Error(`owner id ${OWNER_ID} not found`);
    console.log('Target row BEFORE:', JSON.stringify(before.rows[0], null, 2));
    if (before.rows[0].phone !== OLD_PHONE) {
      throw new Error(
        `Sanity check failed: expected phone='${OLD_PHONE}' on owner row, got '${before.rows[0].phone}'`,
      );
    }

    // Pre-flight 2: no other user anywhere holds the new phone (cross-tenant collision).
    const collision = await c.query(
      `SELECT id, tenant_id, phone, role FROM users
       WHERE id <> $1
         AND (phone = $2 OR regexp_replace(phone, '[^0-9]', '', 'g') LIKE $3)`,
      [OWNER_ID, NEW_PHONE, `%${NEW_PHONE}`],
    );
    if (collision.rowCount > 0) {
      console.log('Collision rows:', JSON.stringify(collision.rows, null, 2));
      throw new Error(
        `Cross-tenant collision: ${collision.rowCount} other user(s) already match ${NEW_PHONE}. Abort.`,
      );
    }
    console.log('Collision check: none ✓');

    if (!commit) {
      console.log('\nDRY RUN — no write. Pass --commit to apply.');
      return;
    }

    // Three-predicate UPDATE with RETURNING.
    const upd = await c.query(
      `UPDATE users
         SET phone = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND role = 'admin'
       RETURNING id, phone, email, role, tenant_id, updated_at`,
      [NEW_PHONE, OWNER_ID, TENANT_ID],
    );
    if (upd.rowCount !== 1) {
      throw new Error(`Expected 1 row updated, got ${upd.rowCount}. NOT COMMITTED.`);
    }
    console.log('UPDATE result:', JSON.stringify(upd.rows[0], null, 2));

    // Post-flight: count of recently-updated rows must be exactly 1.
    const recent = await c.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE updated_at > NOW() - INTERVAL '1 minute'`,
    );
    console.log(`Rows updated in last 1 min: ${recent.rows[0].n} (expect 1)`);
    if (recent.rows[0].n !== 1) {
      throw new Error('More than one row updated recently — investigate.');
    }
    console.log('\n✓ Owner phone updated successfully.');
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error('\nFATAL:', e.message || e);
  process.exit(1);
});
