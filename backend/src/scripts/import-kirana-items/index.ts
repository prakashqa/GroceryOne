/**
 * One-off importer: KIRANA ITEMS.xlsx → Siri Enterprise prod DB.
 *
 * Usage (from `backend/`):
 *   ts-node src/scripts/import-kirana-items/index.ts <path-to-xlsx>            # dry-run
 *   ts-node src/scripts/import-kirana-items/index.ts <path-to-xlsx> --commit   # writes
 *   ts-node src/scripts/import-kirana-items/index.ts <path-to-xlsx> --commit --force
 *   ts-node src/scripts/import-kirana-items/index.ts <path-to-xlsx> --emit-json out.json
 *
 * --emit-json: skip DB entirely, write the parsed structure as JSON. Used when
 * the actual insert runs in a different environment (e.g. on the prod VM
 * where xlsx isn't installed in the api container).
 *
 * Default behaviour: dry-run prints the parsed counts and exits without
 * touching the DB. Pass --commit to actually insert. If Siri's tenant already
 * has categories or items, the script refuses unless --force is also passed
 * (so you can't accidentally double-import).
 *
 * All inserts run inside a single transaction. The whole batch either lands
 * or rolls back; no partial state.
 */

import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';
import { DataSource } from 'typeorm';
import { Category } from '../../modules/categories/entities/category.entity';
import { Item } from '../../modules/products/entities/item.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { parseWorkbookRows } from './parser';

// Siri Enterprise owner signed up via the mobile signup screen and chose
// the business name "Siri General Stores" — the slug auto-derives from
// that, so it's `siri-general-stores`, not the originally-planned
// `siri-enterprise`.
const TENANT_SLUG = 'siri-general-stores';

interface Args {
  filePath: string;
  commit: boolean;
  force: boolean;
  emitJsonPath: string | null;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let commit = false;
  let force = false;
  let emitJsonPath: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--commit') commit = true;
    else if (a === '--force') force = true;
    else if (a === '--emit-json') {
      emitJsonPath = argv[++i];
      if (!emitJsonPath) throw new Error('--emit-json requires a target path');
    } else positional.push(a);
  }
  if (positional.length === 0) {
    throw new Error('Usage: import-kirana-items <path-to-xlsx> [--commit] [--force] [--emit-json <path>]');
  }
  return { filePath: path.resolve(positional[0]), commit, force, emitJsonPath };
}

function buildDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'groone',
    ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false,
    entities: [Category, Item, Tenant],
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
  });
}

function loadSheets(filePath: string): Record<string, (string | null)[][]> {
  const wb = xlsx.readFile(filePath);
  const out: Record<string, (string | null)[][]> = {};
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<(string | null)[]>(ws, {
      header: 1,
      defval: null,
      blankrows: false,
      raw: false,
    });
    out[sheetName] = rows;
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Reading workbook: ${args.filePath}`);

  const sheets = loadSheets(args.filePath);
  const parsed = parseWorkbookRows(sheets);

  console.log('--- Parse summary ---');
  console.log(`Categories: ${parsed.categories.length}`);
  console.log(`Items:      ${parsed.items.length}`);
  console.log(`Sheets skipped: ${parsed.sheetsSkipped.join(', ') || '(none)'}`);
  console.log(`Rows skipped (headers / blanks): ${parsed.rowsSkipped}`);
  console.log('Per-category counts:');
  for (const cat of parsed.categories) {
    const n = parsed.items.filter((i) => i.categorySlug === cat.slug).length;
    console.log(`  ${cat.slug.padEnd(28)} ${n.toString().padStart(4)} items   [${cat.name}]`);
  }

  if (args.emitJsonPath) {
    fs.writeFileSync(
      args.emitJsonPath,
      JSON.stringify({ tenantSlug: TENANT_SLUG, ...parsed }, null, 2),
      'utf8',
    );
    console.log(`\nWrote parsed structure → ${args.emitJsonPath}`);
    return;
  }

  if (!args.commit) {
    console.log('\nDRY RUN — no DB writes. Pass --commit to insert.');
    return;
  }

  console.log('\nConnecting to DB…');
  const ds = buildDataSource();
  await ds.initialize();

  try {
    const tenantRepo = ds.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { slug: TENANT_SLUG } });
    if (!tenant) {
      throw new Error(`Tenant slug '${TENANT_SLUG}' not found — refusing to import.`);
    }
    const tenantId = tenant.id;
    console.log(`Tenant: ${tenant.name} (${tenantId})`);

    const categoryRepo = ds.getRepository(Category);
    const itemRepo = ds.getRepository(Item);

    const existingCategories = await categoryRepo.count({ where: { tenantId } });
    const existingItems = await itemRepo.count({ where: { tenantId } });
    console.log(`Existing: ${existingCategories} categories, ${existingItems} items`);

    if ((existingCategories > 0 || existingItems > 0) && !args.force) {
      throw new Error(
        `Tenant '${TENANT_SLUG}' already has ${existingCategories} categories / ${existingItems} items. ` +
          `Pass --force to import anyway (will create additional rows).`,
      );
    }

    const startedAt = Date.now();
    let categoriesInserted = 0;
    let itemsInserted = 0;

    await ds.transaction(async (mgr) => {
      // Categories: insert all with sortOrder = index.
      const catEntities = parsed.categories.map((c, idx) =>
        mgr.create(Category, {
          slug: c.slug,
          name: c.name,
          tenantId,
          sortOrder: idx,
          isActive: true,
          trackInventory: false,
        }),
      );
      const savedCats = await mgr.save(Category, catEntities);
      categoriesInserted = savedCats.length;
      const slugToId = new Map<string, string>();
      for (const c of savedCats) slugToId.set(c.slug, c.id);

      // Items: insert as inactive drafts with price=0.
      const itemEntities = parsed.items.map((it, idx) => {
        const catId = slugToId.get(it.categorySlug);
        if (!catId) {
          throw new Error(`No categoryId for slug ${it.categorySlug} (item ${it.slug})`);
        }
        return mgr.create(Item, {
          slug: it.slug,
          name: it.name,
          tenantId,
          categoryId: catId,
          unit: 'pcs' as const,
          defaultQuantity: 1,
          price: 0,
          compareAtPrice: 0,
          stockQuantity: 0,
          lowStockThreshold: 0,
          trackInventory: false,
          isActive: false,
          sortOrder: idx,
        });
      });
      const savedItems = await mgr.save(Item, itemEntities);
      itemsInserted = savedItems.length;
    });

    const durationMs = Date.now() - startedAt;
    console.log('\n--- Insert summary ---');
    console.log(`Categories inserted: ${categoriesInserted}`);
    console.log(`Items inserted:      ${itemsInserted}`);
    console.log(`Duration:            ${durationMs} ms`);
    console.log('\nDone. Items are inactive drafts (price=0). Owner must edit each to set MRP + activate.');
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('\nFATAL:', err.message ?? err);
  process.exit(1);
});
