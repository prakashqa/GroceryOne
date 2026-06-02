/**
 * Plain-JS inserter — runs inside the prod api container which has `pg`
 * but NOT `xlsx` or `ts-node`. Reads the JSON emitted by index.ts
 * (--emit-json) from argv[2] and inserts into the prod DB inside a single
 * transaction.
 *
 * DB credentials come from the container's environment (set by docker-compose
 * from /srv/groone/.env), so no secrets touch the host shell.
 *
 * Usage (inside container):
 *   node /tmp/insert-from-json.js /tmp/kirana-parsed.json           # dry-run preview
 *   node /tmp/insert-from-json.js /tmp/kirana-parsed.json --commit  # writes
 *   node /tmp/insert-from-json.js /tmp/kirana-parsed.json --commit --force
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const { Client } = require('pg');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

async function main() {
  const args = process.argv.slice(2);
  const jsonPath = args[0];
  const commit = args.includes('--commit');
  const force = args.includes('--force');
  if (!jsonPath) throw new Error('Usage: insert-from-json <path-to-json> [--commit] [--force]');

  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const { tenantSlug, categories, items } = payload;
  console.log(`Tenant slug:   ${tenantSlug}`);
  console.log(`Categories:    ${categories.length}`);
  console.log(`Items:         ${items.length}`);

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Vultr Managed Postgres requires TLS unconditionally; force ssl on.
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const tenantRow = await client.query('SELECT id, name FROM tenants WHERE slug = $1', [tenantSlug]);
    if (tenantRow.rowCount === 0) throw new Error(`Tenant '${tenantSlug}' not found.`);
    const tenantId = tenantRow.rows[0].id;
    console.log(`Tenant:        ${tenantRow.rows[0].name} (${tenantId})`);

    const existingCats = await client.query(
      'SELECT COUNT(*)::int AS n FROM categories WHERE tenant_id = $1',
      [tenantId],
    );
    const existingItems = await client.query(
      'SELECT COUNT(*)::int AS n FROM items WHERE tenant_id = $1',
      [tenantId],
    );
    console.log(`Existing rows: ${existingCats.rows[0].n} categories / ${existingItems.rows[0].n} items`);

    if (!commit) {
      console.log('\nDRY RUN — no writes. Pass --commit to insert.');
      return;
    }
    if ((existingCats.rows[0].n > 0 || existingItems.rows[0].n > 0) && !force) {
      throw new Error('Refusing: tenant already has rows. Pass --force to import anyway.');
    }

    await client.query('BEGIN');
    const startedAt = Date.now();
    const slugToId = new Map();

    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      const id = uuid();
      slugToId.set(c.slug, id);
      await client.query(
        `INSERT INTO categories
          (id, slug, tenant_id, name, icon, sort_order, is_active, track_inventory, created_at, updated_at)
         VALUES ($1, $2, $3, $4, '📁', $5, true, false, NOW(), NOW())`,
        [id, c.slug, tenantId, c.name, i],
      );
    }
    console.log(`Inserted ${categories.length} categories`);

    let inserted = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const catId = slugToId.get(it.categorySlug);
      if (!catId) throw new Error(`No categoryId for ${it.categorySlug}`);
      await client.query(
        `INSERT INTO items
          (id, slug, tenant_id, name, category_id, unit, default_quantity, price, compare_at_price,
           stock_quantity, low_stock_threshold, track_inventory, is_active, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'pcs', 1, 0, 0, 0, 0, false, false, $6, NOW(), NOW())`,
        [uuid(), it.slug, tenantId, it.name, catId, i],
      );
      inserted++;
      if (inserted % 100 === 0) console.log(`  …${inserted}/${items.length}`);
    }
    console.log(`Inserted ${inserted} items`);

    await client.query('COMMIT');
    console.log(`\nDone in ${Date.now() - startedAt} ms. All items are isActive=false drafts at ₹0.`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('\nFATAL:', e.message || e);
  process.exit(1);
});
