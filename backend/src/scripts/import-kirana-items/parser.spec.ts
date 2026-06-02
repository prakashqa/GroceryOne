/**
 * Parser tests for KIRANA ITEMS.xlsx importer.
 * TDD: define the contract before implementation.
 */

import { parseWorkbookRows, slugify, ParsedWorkbook } from './parser';

describe('slugify', () => {
  it('lowercases alphanumerics and hyphenates separators', () => {
    expect(slugify('Dalls')).toBe('dalls');
    expect(slugify('Rava&flour')).toBe('rava-flour');
    expect(slugify('spices&chilli powder')).toBe('spices-chilli-powder');
    expect(slugify('BACKERY ITEMS')).toBe('backery-items');
  });

  it('preserves size markers like 20*26 in a slug-safe form', () => {
    expect(slugify('20*26')).toBe('20-26');
    expect(slugify('17*23')).toBe('17-23');
  });

  it('strips leading/trailing/internal whitespace', () => {
    expect(slugify('  CASHEW  ')).toBe('cashew');
    expect(slugify('CHANAGA PAPPU(          )')).toBe('chanaga-pappu');
  });

  it('drops empty parens-only suffixes', () => {
    expect(slugify('Item ( )')).toBe('item');
  });
});

describe('parseWorkbookRows', () => {
  // Mimics the shape returned by xlsx.utils.sheet_to_json(ws, {header:1, defval:null, blankrows:false})
  type Sheet = (string | null)[][];
  const sheets: Record<string, Sheet> = {
    Dalls: [
      ['DALLS', null, null, null, null, null, null],
      [null, null, '500GM', '250GM', 'BAG', null, null],
      ['CHANAGA PAPPU', null, null, null, null, null, null],
      ['CHANAGA PAPPU(          )', null, null, null, null, null, null],
      ['GULLAPAPPU', null, null, null, null, null, null],
    ],
    'Pooja samallu': [
      [null, null, null, '     POOJA SAMALLU', null, null, null, null, null, null],
      [null, 'KG', '500GM', '250GM', '100GM', '50GM', null, null, null, null],
      ['AAS.PASUPU', null, null, null, null, null, null, null, null, null],
      ['VEER.PASUPU', null, null, null, null, null, null, null, null, null],
    ],
    COVERS: [
      [null, null, 'HAND COVER', null, null, null, null, null, null],
      ['20*26', null, null, null, null, null, null, null, null],
      ['17*23', null, null, null, null, null, null, null, null],
    ],
    Sheet1: [],
  };

  let result: ParsedWorkbook;

  beforeAll(() => {
    result = parseWorkbookRows(sheets);
  });

  it('skips empty Sheet1', () => {
    expect(result.sheetsSkipped).toContain('Sheet1');
    expect(result.categories.find((c) => c.name === 'Sheet1')).toBeUndefined();
  });

  it('returns one category per non-empty sheet', () => {
    const names = result.categories.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['Dalls', 'Pooja samallu', 'COVERS']));
    expect(result.categories).toHaveLength(3);
  });

  it('builds a stable lowercase-hyphen slug per category', () => {
    const dalls = result.categories.find((c) => c.name === 'Dalls')!;
    expect(dalls.slug).toBe('dalls');
    const cov = result.categories.find((c) => c.name === 'COVERS')!;
    expect(cov.slug).toBe('covers');
  });

  it('filters out the title row whose column A equals the (upper) category name', () => {
    const items = result.items.filter((i) => i.categorySlug === 'dalls');
    expect(items.map((i) => i.name)).not.toContain('DALLS');
  });

  it('filters out unit-header rows (KG, 500GM, BAG, etc.)', () => {
    const allNames = result.items.map((i) => i.name);
    expect(allNames).not.toContain('KG');
    expect(allNames).not.toContain('500GM');
    expect(allNames).not.toContain('BAG');
  });

  it('filters out rows where column A is null/empty (title-in-other-column rows)', () => {
    // The Pooja samallu and COVERS sheets have row 0 with col A = null
    // (title is in column D/C). Those rows must NOT become items.
    const pooja = result.items.filter((i) => i.categorySlug === 'pooja-samallu');
    expect(pooja.every((i) => i.name && i.name.length > 0)).toBe(true);
    // Only 2 real items in our fixture
    expect(pooja).toHaveLength(2);
  });

  it('trims and collapses internal whitespace + drops empty parens', () => {
    const dalls = result.items.filter((i) => i.categorySlug === 'dalls');
    const cleaned = dalls.find((i) => i.name.startsWith('CHANAGA PAPPU('));
    // The "CHANAGA PAPPU(          )" item should be cleaned to "CHANAGA PAPPU"
    expect(cleaned).toBeUndefined();
    const names = dalls.map((i) => i.name);
    // Two CHANAGA PAPPU rows -> one cleaned, dedup may keep both with unique slugs
    expect(names.filter((n) => n === 'CHANAGA PAPPU').length).toBeGreaterThanOrEqual(1);
  });

  it('preserves size markers like 20*26 as item names verbatim', () => {
    const covers = result.items.filter((i) => i.categorySlug === 'covers');
    expect(covers.map((i) => i.name)).toEqual(['20*26', '17*23']);
  });

  it('generates unique item slugs within a category even for duplicate names', () => {
    const dalls = result.items.filter((i) => i.categorySlug === 'dalls');
    const slugs = dalls.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length); // all unique
    // Slugs should be prefixed by category slug
    expect(slugs.every((s) => s.startsWith('dalls-'))).toBe(true);
  });

  it('each item references its parent category via categorySlug', () => {
    for (const item of result.items) {
      const cat = result.categories.find((c) => c.slug === item.categorySlug);
      expect(cat).toBeDefined();
    }
  });
});
