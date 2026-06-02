/**
 * Applier: reads `te-translations.js` and UPDATEs `name_te` on every row.
 *
 * Safety:
 *  - Strict tenant scoping on every UPDATE: WHERE id=$1 AND tenant_id=$2.
 *  - Pre-flight: every UUID in the map must already exist in DB AND belong
 *    to the Siri tenant. Any cross-tenant UUID aborts BEFORE any UPDATE.
 *  - Single transaction. Mid-batch failure ⇒ ROLLBACK, no partial state.
 *  - Idempotent: skips rows that already have a non-null name_te (so a
 *    re-run is a no-op for already-translated rows).
 *
 * Usage (inside the prod api container):
 *   node /tmp/apply-te-translations.js /tmp/te-translations.js            # dry-run
 *   node /tmp/apply-te-translations.js /tmp/te-translations.js --commit
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { Client } = require('pg');

const TENANT_ID = 'fb11b265-f9da-4a31-b3f1-9cc11bd30154'; // Siri General Stores

(async () => {
  const [mapPath] = process.argv.slice(2);
  const commit = process.argv.includes('--commit');
  if (!mapPath) throw new Error('Usage: apply-te-translations.js <map.js> [--commit]');

  const translations = require(path.resolve(mapPath));
  const catEntries = Object.entries(translations.categories || {});
  const itemEntries = Object.entries(translations.items || {});
  console.log(`Map: ${catEntries.length} categories, ${itemEntries.length} items`);

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
    // ===== Pre-flight: every UUID must belong to Siri tenant =====
    const catIds = catEntries.map(([id]) => id);
    const itemIds = itemEntries.map(([id]) => id);

    const catCheck = await c.query(
      `SELECT id, tenant_id FROM categories WHERE id = ANY($1::uuid[])`,
      [catIds],
    );
    if (catCheck.rowCount !== catEntries.length) {
      const found = new Set(catCheck.rows.map((r) => r.id));
      const missing = catIds.filter((id) => !found.has(id));
      throw new Error(`Categories missing in DB: ${missing.join(', ')}`);
    }
    const catCrossTenant = catCheck.rows.filter((r) => r.tenant_id !== TENANT_ID);
    if (catCrossTenant.length > 0) {
      throw new Error(`Categories belong to other tenants: ${JSON.stringify(catCrossTenant)}`);
    }

    const itemCheck = await c.query(
      `SELECT id, tenant_id FROM items WHERE id = ANY($1::uuid[])`,
      [itemIds],
    );
    if (itemCheck.rowCount !== itemEntries.length) {
      const found = new Set(itemCheck.rows.map((r) => r.id));
      const missing = itemIds.filter((id) => !found.has(id));
      throw new Error(`Items missing in DB: ${missing.length} ${missing.slice(0, 5).join(', ')}…`);
    }
    const itemCrossTenant = itemCheck.rows.filter((r) => r.tenant_id !== TENANT_ID);
    if (itemCrossTenant.length > 0) {
      throw new Error(`Items belong to other tenants: ${itemCrossTenant.length} rows. ABORT.`);
    }
    console.log('Pre-flight: all UUIDs exist + scoped to Siri tenant ✓');

    // ===== Snapshot cross-tenant items (must be untouched after) =====
    const otherBefore = await c.query(
      `SELECT tenant_id, COUNT(*)::int n, COUNT(name_te)::int with_te FROM items WHERE tenant_id <> $1 GROUP BY tenant_id`,
      [TENANT_ID],
    );
    console.log('Other tenants BEFORE:', JSON.stringify(otherBefore.rows));

    if (!commit) {
      console.log('\nDRY RUN — no writes. Pass --commit to apply.');
      return;
    }

    // ===== Apply in one transaction =====
    await c.query('BEGIN');
    let catUpdated = 0;
    let catSkipped = 0;
    let itemUpdated = 0;
    let itemSkipped = 0;

    for (const [id, nameTe] of catEntries) {
      const r = await c.query(
        `UPDATE categories SET name_te = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3 AND name_te IS NULL`,
        [nameTe, id, TENANT_ID],
      );
      if (r.rowCount === 1) catUpdated++;
      else if (r.rowCount === 0) catSkipped++;
      else throw new Error(`Category ${id}: unexpected rowCount=${r.rowCount}`);
    }
    console.log(`Categories: ${catUpdated} updated, ${catSkipped} already had name_te`);

    for (const [id, nameTe] of itemEntries) {
      const r = await c.query(
        `UPDATE items SET name_te = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3 AND name_te IS NULL`,
        [nameTe, id, TENANT_ID],
      );
      if (r.rowCount === 1) itemUpdated++;
      else if (r.rowCount === 0) itemSkipped++;
      else throw new Error(`Item ${id}: unexpected rowCount=${r.rowCount}`);
    }
    console.log(`Items: ${itemUpdated} updated, ${itemSkipped} already had name_te`);

    // ===== Post-flight isolation checks =====
    const tenantsTouched = await c.query(
      `SELECT DISTINCT tenant_id FROM items WHERE updated_at > NOW() - INTERVAL '5 minutes'
       UNION
       SELECT DISTINCT tenant_id FROM categories WHERE updated_at > NOW() - INTERVAL '5 minutes'`,
    );
    const touched = tenantsTouched.rows.map((r) => r.tenant_id);
    console.log('Tenants touched in last 5 min:', touched);
    if (touched.length !== 1 || touched[0] !== TENANT_ID) {
      throw new Error('Cross-tenant write detected — ROLLBACK');
    }

    const otherAfter = await c.query(
      `SELECT tenant_id, COUNT(*)::int n, COUNT(name_te)::int with_te FROM items WHERE tenant_id <> $1 GROUP BY tenant_id`,
      [TENANT_ID],
    );
    if (JSON.stringify(otherAfter.rows) !== JSON.stringify(otherBefore.rows)) {
      throw new Error('Other-tenant items state diverged — ROLLBACK');
    }

    const siriCounts = await c.query(
      `SELECT
         (SELECT COUNT(*) FILTER (WHERE name_te IS NOT NULL)::int FROM categories WHERE tenant_id=$1) AS cats_with_te,
         (SELECT COUNT(*) FILTER (WHERE name_te IS NOT NULL)::int FROM items WHERE tenant_id=$1) AS items_with_te,
         (SELECT COUNT(*)::int FROM categories WHERE tenant_id=$1) AS cats_total,
         (SELECT COUNT(*)::int FROM items WHERE tenant_id=$1) AS items_total`,
      [TENANT_ID],
    );
    console.log('Final Siri counts:', siriCounts.rows[0]);
    if (
      siriCounts.rows[0].cats_with_te !== siriCounts.rows[0].cats_total ||
      siriCounts.rows[0].items_with_te !== siriCounts.rows[0].items_total
    ) {
      throw new Error('Not all Siri rows have name_te after apply — ROLLBACK');
    }

    await c.query('COMMIT');
    console.log('\n✓ Translations applied successfully.');
  } catch (err) {
    await c.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error('\nFATAL:', e.message || e);
  process.exit(1);
});
