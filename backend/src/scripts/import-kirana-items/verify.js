/* Verification queries run inside the api container post-import. */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');

(async () => {
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
    const t = await c.query("SELECT id, slug, name FROM tenants WHERE slug='siri-general-stores'");
    if (t.rowCount === 0) throw new Error('tenant not found');
    const tid = t.rows[0].id;
    console.log('Tenant:', t.rows[0].name, tid);

    const cats = await c.query(
      'SELECT COUNT(*)::int n FROM categories WHERE tenant_id=$1',
      [tid],
    );
    const items = await c.query('SELECT COUNT(*)::int n FROM items WHERE tenant_id=$1', [tid]);
    const active = await c.query(
      'SELECT COUNT(*)::int n FROM items WHERE tenant_id=$1 AND is_active=true',
      [tid],
    );
    console.log(`Siri: ${cats.rows[0].n} categories, ${items.rows[0].n} items, ${active.rows[0].n} active`);

    const groupCats = await c.query(
      'SELECT tenant_id, COUNT(*)::int n FROM categories GROUP BY tenant_id',
    );
    const groupItems = await c.query(
      'SELECT tenant_id, COUNT(*)::int n FROM items GROUP BY tenant_id',
    );
    console.log('Categories by tenant:', JSON.stringify(groupCats.rows));
    console.log('Items by tenant:', JSON.stringify(groupItems.rows));

    const sample = await c.query(
      `SELECT c.name AS category, COUNT(i.id)::int AS items
       FROM categories c LEFT JOIN items i ON i.category_id = c.id
       WHERE c.tenant_id=$1 GROUP BY c.id, c.sort_order, c.name ORDER BY c.sort_order`,
      [tid],
    );
    console.log('\nPer-category breakdown:');
    for (const r of sample.rows) console.log(`  ${r.category.padEnd(28)} ${r.items}`);

    // Spot check unique slug invariant
    const dup = await c.query(
      `SELECT slug, COUNT(*)::int n FROM items WHERE tenant_id=$1
       GROUP BY slug HAVING COUNT(*) > 1`,
      [tid],
    );
    console.log(`\nDuplicate item slugs in tenant: ${dup.rowCount} (should be 0)`);
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
