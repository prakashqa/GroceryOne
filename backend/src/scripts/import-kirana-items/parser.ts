/**
 * Pure parsing logic for KIRANA ITEMS.xlsx → (categories, items) structures.
 *
 * Kept side-effect-free so it can be unit-tested without touching the
 * filesystem or database. The runner (`import-kirana-items.ts`) loads the
 * workbook with `xlsx`, hands the sheet-rows here, then forwards the result
 * to CategoriesService / ProductsService.
 */

/**
 * Unit-header tokens that appear in the spreadsheet's row 2 as column
 * headers (NOT item names). Any row whose column A matches one of these
 * exactly (case-insensitive, whitespace-stripped) is filtered out.
 */
const UNIT_HEADER_TOKENS = new Set([
  'KG',
  'GM',
  'G',
  'L',
  'ML',
  '1KG',
  '500GM',
  '250GM',
  '100GM',
  '50GM',
  '25GM',
  'BAG',
  'BAGS',
  'PAK',
  'PACK',
  'TIN',
  'PCS',
  'PIECE',
  'CASE',
  'BOX',
]);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    // Drop content inside empty parentheses like "name(   )" → "name"
    .replace(/\(\s*\)/g, '')
    // Replace any run of non-alphanumeric with single hyphen
    .replace(/[^a-z0-9]+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

function cleanName(raw: string): string {
  return raw
    // Drop empty () suffixes
    .replace(/\(\s*\)/g, '')
    // Collapse internal whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

function isUnitHeader(value: string): boolean {
  const normalised = value.replace(/\s+/g, '').toUpperCase();
  return UNIT_HEADER_TOKENS.has(normalised);
}

export interface ParsedCategory {
  name: string;
  slug: string;
}

export interface ParsedItem {
  categorySlug: string;
  name: string;
  slug: string;
}

export interface ParsedWorkbook {
  categories: ParsedCategory[];
  items: ParsedItem[];
  sheetsSkipped: string[];
  rowsSkipped: number;
}

/**
 * Parse the raw row-arrays returned by `xlsx.utils.sheet_to_json(ws, {header:1})`.
 *
 * @param sheets Map of sheet-name → 2D array (row-major).
 */
export function parseWorkbookRows(sheets: Record<string, (string | null | undefined)[][]>): ParsedWorkbook {
  const categories: ParsedCategory[] = [];
  const items: ParsedItem[] = [];
  const sheetsSkipped: string[] = [];
  let rowsSkipped = 0;

  for (const [sheetName, rows] of Object.entries(sheets)) {
    if (!rows || rows.length === 0) {
      sheetsSkipped.push(sheetName);
      continue;
    }

    const trimmedName = sheetName.trim();
    const categorySlug = slugify(trimmedName);
    const categoryUpperCompact = trimmedName.replace(/\s+/g, '').toUpperCase();

    const itemSlugsInCategory = new Set<string>();
    const sheetItems: ParsedItem[] = [];

    for (const row of rows) {
      const colA = row?.[0];
      if (colA === null || colA === undefined) {
        rowsSkipped++;
        continue;
      }
      const raw = String(colA);
      const cleaned = cleanName(raw);
      if (cleaned.length === 0) {
        rowsSkipped++;
        continue;
      }
      // Skip rows that ARE the category title (e.g., col A = "DALLS" on Dalls sheet)
      if (cleaned.replace(/\s+/g, '').toUpperCase() === categoryUpperCompact) {
        rowsSkipped++;
        continue;
      }
      // Skip unit-header tokens
      if (isUnitHeader(cleaned)) {
        rowsSkipped++;
        continue;
      }

      // Build a unique slug within the category. If we've already seen the
      // base slug, append an integer suffix until we find an unused one.
      const base = `${categorySlug}-${slugify(cleaned)}`;
      let slug = base;
      let suffix = 2;
      while (itemSlugsInCategory.has(slug)) {
        slug = `${base}-${suffix++}`;
      }
      itemSlugsInCategory.add(slug);

      sheetItems.push({ categorySlug, name: cleaned, slug });
    }

    if (sheetItems.length === 0) {
      // Sheet has no usable items — don't create the empty category.
      sheetsSkipped.push(sheetName);
      continue;
    }

    categories.push({ name: trimmedName, slug: categorySlug });
    items.push(...sheetItems);
  }

  return { categories, items, sheetsSkipped, rowsSkipped };
}
