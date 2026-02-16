/**
 * Picking List Receipt Generator
 * ===============================
 * ✔ Fixed column layout
 * ✔ English / Telugu switch
 * ✔ Monospace safe
 * ✔ Mobile + Printer compatible
 */

/////////////////////////////
// TYPES
/////////////////////////////

export interface MerchantInfo {
  name: string;
  address: string;
  phone?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  price?: number; // Unit price
  itemTotal?: number; // quantity * price
}

export interface ReceiptTranslations {
  title: string;
  date: string;
  time: string;
  categories: string;
  uniqueItems: string;
  totalQuantity: string;
  item: string;
  qty: string;
  footer: string;
  categoryName: string;
  itemName: string;
  quantity: string;
  unit?: string; // "UNIT" / "యూనిట్"
  total?: string; // "TOTAL" / "మొత్తం" - column header
  unitPrice?: string; // "Price" / "ధర"
  itemTotal?: string; // "Total" / "మొత్తం"
  grandTotal?: string; // "GRAND TOTAL" / "మహా మొత్తం"
  // Column headers for price display
  qtyShort?: string; // "QTY" / "పరి"
  unitPriceHeader?: string; // "UNIT PRICE" / "యూనిట్ ధర"
  totalPriceHeader?: string; // "TOTAL PRICE" / "మొత్తం ధర"
  totalShort?: string; // "TOTAL" / "మొత్తం" (for 58mm paper)
  // Payment status
  paymentStatus?: string; // "Payment Status" / "చెల్లింపు స్థితి"
  paid?: string; // "PAID" / "చెల్లించబడింది"
  paidAt?: string; // "Paid at" / "చెల్లించిన సమయం"
}

export interface ReceiptOptions {
  merchantInfo: MerchantInfo;
  items: ReceiptItem[];
  cartName?: string;
  paperWidth?: '58mm' | '80mm';
  locale?: string;
  translations?: ReceiptTranslations;
  paymentStatus?: 'paid' | 'unpaid';
  paidAt?: string;
}

/////////////////////////////
// CONSTANTS (THERMAL PRINTER)
/////////////////////////////

// Paper width in characters
const PAPER_WIDTHS: Record<string, number> = {
  '58mm': 32,
  '80mm': 48,
};

// Fixed column positions for quantity alignment
// Quantity column is fixed at right side (last 12 chars for 80mm, last 8 chars for 58mm)
const QTY_COL_WIDTH: Record<string, number> = {
  '58mm': 8,
  '80mm': 12,
};

// SINGLE SOURCE OF TRUTH for 5-column layout with vertical separators
// All header and item row formatters MUST use these values
// Format: | SNO | ITEM                  | QTY  | RATE | AMT |
const COLUMNS: Record<'58mm' | '80mm', { sno: number; name: number; qty: number; rate: number; amt: number }> = {
  // 58mm uses two-line format: Line 1 = item name (32 chars), Line 2 = QTY + RATE + AMT
  '58mm': { sno: 0, name: 32, qty: 5, rate: 10, amt: 14 },  // Line 2: 3 (indent) + 5 + 10 + 14 = 32
  // 80mm with pipes: | sno | name | qty | rate | amt |
  // With spacing: | SNO (5) | ITEM (24) | QTY (7) | RATE (6) | AMT (9) |
  // Total: 5 + 24 + 7 + 6 + 9 = 51 chars (too much for 48)
  // Adjusted: sno=4, name=20, qty=6, rate=6, amt=8 = 44 + 4 spaces = 48
  '80mm': { sno: 4, name: 17, qty: 5, rate: 5, amt: 6 },   // Content: 3+16+4+4+5=32, +16 overhead=48 ✓
};

// Column widths for 58mm value line (second line of two-line format)
const COLUMNS_58MM_VALUES = { indent: 3, qty: 5, rate: 10, amt: 14 };  // 3+5+10+14 = 32

// Dev assertion: verify column widths match paper widths
// eslint-disable-next-line no-undef
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  // Verify 80mm single-line format with pipes and spacing
  const col80 = COLUMNS['80mm'];
  // Format: | _ | _ _ _ | _ _ | _ _ | _ _ _ |
  // = 2 + (sno-1) + 3 + (name-1) + 3 + (qty-1) + 3 + (rate-1) + 3 + (amt-1) + 2
  // = 16 + (sno + name + qty + rate + amt - 5) = 11 + sum
  const overhead = 2 + 3 + 3 + 3 + 3 + 2; // 16 chars for pipes and spaces
  const content = col80.sno - 1 + col80.name - 1 + col80.qty - 1 + col80.rate - 1 + col80.amt - 1; // -1 for each padding
  const total80 = overhead + content;
  if (total80 !== PAPER_WIDTHS['80mm']) {
    console.error(`Column widths for 80mm (${total80}) != paper width (${PAPER_WIDTHS['80mm']})`);
  }
  // Verify 58mm two-line format (values line)
  const val58 = COLUMNS_58MM_VALUES;
  const total58 = val58.indent + val58.qty + val58.rate + val58.amt;
  if (total58 !== PAPER_WIDTHS['58mm']) {
    console.error(`58mm values line widths (${total58}) != paper width (${PAPER_WIDTHS['58mm']})`);
  }
}

/////////////////////////////
// TRANSLATIONS (HARDCODED)
/////////////////////////////

const TRANSLATIONS: Record<string, ReceiptTranslations> = {
  en: {
    title: 'PICKING LIST',
    date: 'Date',
    time: 'Time',
    categories: 'Categories',
    uniqueItems: 'Unique Items',
    totalQuantity: 'Total Quantity',
    item: 'Item',
    qty: 'Qty',
    footer: 'Thank You! Shop With Us',
    categoryName: 'CATEGORY NAME',
    itemName: 'ITEM NAME',
    quantity: 'QUANTITY',
    unit: 'UNIT',
    total: 'TOTAL',
    unitPrice: 'Price',
    itemTotal: 'Total',
    grandTotal: 'GRAND TOTAL',
    // Column headers for price display
    qtyShort: 'QTY',
    unitPriceHeader: 'UNIT PRICE',
    totalPriceHeader: 'TOTAL',
    totalShort: 'TOTAL',
    // Payment status
    paymentStatus: 'Payment Status',
    paid: 'PAID',
    paidAt: 'Paid at',
  },
  te: {
    title: 'పికింగ్ జాబితా',
    date: 'తేదీ',
    time: 'సమయం',
    categories: 'వర్గాలు',
    uniqueItems: 'ప్రత్యేక వస్తువులు',
    totalQuantity: 'మొత్తం పరిమాణం',
    item: 'వస్తువు',
    qty: 'పరిమాణం',
    footer: 'ధన్యవాదాలు! మాతో షాపింగ్ చేయండి',
    categoryName: 'వర్గం పేరు',
    itemName: 'వస్తువు పేరు',
    quantity: 'పరిమాణం',
    unit: 'యూనిట్',
    total: 'మొత్తం',
    unitPrice: 'ధర',
    itemTotal: 'మొత్తం',
    grandTotal: 'మహా మొత్తం',
    // Column headers for price display
    qtyShort: 'పరి',
    unitPriceHeader: 'యూనిట్ ధర',
    totalPriceHeader: 'మొత్తం ధర',
    totalShort: 'మొత్తం',
    // Payment status
    paymentStatus: 'చెల్లింపు స్థితి',
    paid: 'చెల్లించబడింది',
    paidAt: 'చెల్లించిన సమయం',
  },
};

/////////////////////////////
// VISUAL WIDTH (SIMPLE)
/////////////////////////////

/**
 * Simple character count for width calculation
 * WARNING: This is NOT accurate for Telugu, emojis, or wide glyphs.
 * Do NOT use for column alignment - use fixed COLUMNS config instead.
 * This function exists only for legacy compatibility.
 */
export const getVisualWidth = (text: string): number => {
  return text.length;
};

/////////////////////////////
// HELPERS (FIXED COLUMNS)
/////////////////////////////

const divider = (width: number, withPipes: boolean = false, paperSize: '58mm' | '80mm' = '80mm') => {
  if (!withPipes) {
    return '-'.repeat(width);
  }
  const col = COLUMNS[paperSize];
  return '|' + '-'.repeat(col.sno) + '|' + '-'.repeat(col.name) + '|' +
         '-'.repeat(col.qty) + '|' + '-'.repeat(col.rate) + '|' + '-'.repeat(col.amt) + '|';
};

const boldDivider = (width: number) => '='.repeat(width);

const center = (text: string, width: number): string => {
  // Truncate with ellipsis if too long (cleaner than hard-cut)
  if (text.length > width) {
    return text.slice(0, width - 1) + '…';
  }
  if (text.length === width) return text;
  const pad = Math.floor((width - text.length) / 2);
  return ' '.repeat(pad) + text;
};

// Fixed two-column layout: label on left, value right-aligned
// Value column is fixed width for consistent alignment
const formatLabelValue = (
  label: string,
  value: string,
  width: number,
  paperSize: '58mm' | '80mm',
  withPipes: boolean = false
): string => {
  if (!withPipes) {
    const rightColWidth = QTY_COL_WIDTH[paperSize];
    const leftColWidth = width - rightColWidth;
    // Truncate label and value if too long
    const truncatedLabel = label.slice(0, leftColWidth);
    const truncatedValue = value.slice(0, rightColWidth);
    return truncatedLabel.padEnd(leftColWidth) + truncatedValue.padStart(rightColWidth);
  }

  // With pipes format: | label | value |
  // Use wider value column for grand total and other values
  const valueWidth = 8; // Enough for values like "17,500"
  const labelWidth = width - valueWidth - 6; // 6 chars for "| " + " | " + " |"
  const truncatedLabel = label.slice(0, labelWidth).padEnd(labelWidth);
  const truncatedValue = value.slice(0, valueWidth).padStart(valueWidth);
  return '| ' + truncatedLabel + '| ' + truncatedValue + ' |';
};


// Five-column header: SNO | ITEM | QTY | RATE | AMT
// Uses COLUMNS config for consistent alignment
const formatFiveColumnHeader = (
  snoHeader: string,
  itemNameHeader: string,
  qtyHeader: string,
  rateHeader: string,
  amtHeader: string,
  width: number,
  paperSize: '58mm' | '80mm'
): string => {
  const col = COLUMNS[paperSize];

  if (paperSize === '58mm') {
    // Two-line format for 58mm: just show "ITEM" header (items will span full width on line 1)
    // Then show column headers for values on separate line
    const itemLine = itemNameHeader.padEnd(width);
    const valuesHeader = ' '.repeat(COLUMNS_58MM_VALUES.indent) +
                         qtyHeader.padStart(COLUMNS_58MM_VALUES.qty) +
                         rateHeader.padStart(COLUMNS_58MM_VALUES.rate) +
                         amtHeader.padStart(COLUMNS_58MM_VALUES.amt);
    return itemLine + '\n' + valuesHeader;
  } else {
    // 80mm format with vertical pipes: | SNO | ITEM | QTY | RATE | AMT |
    return '| ' + snoHeader.slice(0, col.sno - 1).padStart(col.sno - 1) + ' | ' +
           itemNameHeader.slice(0, col.name - 1).padEnd(col.name - 1) + ' | ' +
           qtyHeader.slice(0, col.qty - 1).padEnd(col.qty - 1) + ' | ' +
           rateHeader.slice(0, col.rate - 1).padStart(col.rate - 1) + ' | ' +
           amtHeader.slice(0, col.amt - 1).padStart(col.amt - 1) + ' |';
  }
};

// Five-column item row: SNO | ITEM | QTY | RATE | AMT
// Uses COLUMNS config for consistent alignment
// IMPORTANT: Unit is appended to item name, QTY is numeric only
const formatFiveColumnItemRow = (
  sno: number,
  name: string,
  qty: number,
  unit: string,
  unitPrice: number,
  total: number,
  width: number,
  paperSize: '58mm' | '80mm'
): string => {
  const col = COLUMNS[paperSize];

  // Item name without unit for display (unit shown in QTY column)
  const fullName = name.trim();

  // QTY includes unit - this matches the receipt format (no space between number and unit)
  // Clamp to 0 to handle negative or invalid values
  const qtyText = String(Math.max(0, qty)) + unit;

  // Format price values
  const hasValidPrice = unitPrice > 0;
  const rateText = hasValidPrice
    ? unitPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : '-';
  const amtText = hasValidPrice && total > 0
    ? total.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : '-';

  if (paperSize === '58mm') {
    // Two-line format for 58mm paper:
    // Line 1: Full item name with unit (up to 32 chars)
    // Line 2: Indented QTY, RATE, and AMT values
    const maxNameLen58 = width; // Full width for name line
    const displayName58 = fullName.length > maxNameLen58
      ? fullName.slice(0, maxNameLen58 - 1) + '…'
      : fullName;
    const nameLine = displayName58.padEnd(width);
    const valuesLine = ' '.repeat(COLUMNS_58MM_VALUES.indent) +
                       qtyText.padStart(COLUMNS_58MM_VALUES.qty) +
                       rateText.padStart(COLUMNS_58MM_VALUES.rate) +
                       amtText.padStart(COLUMNS_58MM_VALUES.amt);
    return nameLine + '\n' + valuesLine;
  }

  // 80mm format with vertical pipes: | SNO | ITEM | QTY | RATE | AMT |
  const snoText = String(sno);
  const displayName = fullName.length > col.name
    ? fullName.slice(0, col.name - 1) + '…'
    : fullName;

  // Add space padding around content for readability
  return '| ' + snoText.padStart(col.sno - 1) + ' | ' +
         displayName.padEnd(col.name - 1) + ' | ' +
         qtyText.padEnd(col.qty - 1) + ' | ' +
         rateText.padStart(col.rate - 1) + ' | ' +
         amtText.padStart(col.amt - 1) + ' |';
};


/////////////////////////////
// CURRENCY FORMATTING
/////////////////////////////

/**
 * Format a number as currency (INR)
 * Uses compact format for thermal printers
 */
export const formatCurrency = (
  amount: number,
  locale: string = 'en-IN',
  currency: string = 'INR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format currency in a compact way for receipts (shorter)
 * No currency symbol for cleaner alignment in monospace fonts
 */
const formatCurrencyCompact = (amount: number): string => {
  // Format as X,XXX without decimals and no currency symbol for cleaner alignment
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/////////////////////////////
// GROUPING
/////////////////////////////

const groupByCategory = (items: ReceiptItem[]) => {
  const map: Record<string, ReceiptItem[]> = {};
  items.forEach(i => {
    map[i.categoryName] = map[i.categoryName] || [];
    map[i.categoryName].push(i);
  });
  return map;
};

/////////////////////////////
// LANGUAGE DETECTION
/////////////////////////////

const getLanguageFromLocale = (locale?: string): 'en' | 'te' => {
  if (!locale) return 'en';
  if (locale.startsWith('te')) return 'te';
  return 'en';
};

/////////////////////////////
// MAIN GENERATOR
/////////////////////////////

export const generatePickingListReceipt = (
  options: ReceiptOptions
): string => {
  const {
    merchantInfo,
    items,
    cartName,
    paperWidth = '80mm',
    locale,
    translations,
    paymentStatus,
    paidAt,
  } = options;

  // Determine paper width in characters
  const width = PAPER_WIDTHS[paperWidth] || 48;

  // Determine language from locale
  const lang = getLanguageFromLocale(locale);

  // Use provided translations or fall back to hardcoded
  const t = translations || TRANSLATIONS[lang];

  const now = new Date();
  const lines: string[] = [];
  const grouped = groupByCategory(items);

  // Check if any items have prices and calculate grand total
  const hasPricedItems = items.some(item => item.price !== undefined && item.price > 0);
  const grandTotal = items.reduce((sum, item) => {
    if (item.itemTotal !== undefined) {
      return sum + item.itemTotal;
    }
    if (item.price !== undefined && item.price > 0) {
      return sum + (item.price * item.quantity);
    }
    return sum;
  }, 0);

  // HEADER - Use cart name if provided, else use title from translations
  const title = cartName ? cartName.toUpperCase() : t.title;
  lines.push(center(title, width));
  lines.push('');
  lines.push(center(merchantInfo.name.toUpperCase(), width));
  lines.push(center(merchantInfo.address, width));
  if (merchantInfo.phone) {
    lines.push(center(`Tel: ${merchantInfo.phone}`, width));
  }
  lines.push('');
  lines.push(boldDivider(width));

  // DATE / TIME - Format based on locale and paper width
  const dateLocale = locale || (lang === 'te' ? 'te-IN' : 'en-GB');
  // Shorter format for 58mm paper
  const dateOptions: Intl.DateTimeFormatOptions = width <= 32
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  lines.push(
    formatLabelValue(
      `${t.date}:`,
      now.toLocaleDateString(dateLocale, dateOptions),
      width,
      paperWidth,
      true
    )
  );
  lines.push(
    formatLabelValue(
      `${t.time}:`,
      now.toLocaleTimeString(dateLocale, timeOptions),
      width,
      paperWidth,
      true
    )
  );
  lines.push(divider(width)); // Simple divider without pipes

  // SUMMARY - synced with Cart Review screen (Categories + Unique Items only)
  lines.push(
    formatLabelValue(`${t.categories}:`, String(Object.keys(grouped).length), width, paperWidth, true)
  );
  lines.push(
    formatLabelValue(`${t.uniqueItems}:`, String(items.length), width, paperWidth, true)
  );
  lines.push(divider(width)); // Simple divider without pipes

  // COLUMN HEADERS - Clean format: SNO | ITEM | QTY | RATE | AMT
  const paperSize: '58mm' | '80mm' = paperWidth === '58mm' ? '58mm' : '80mm';

  // Use simple English headers for cleaner look (works for both languages)
  const snoHeader = 'SNO';
  const itemHeader = 'ITEM';
  const qtyHeader = 'QTY';
  const rateHeader = 'RATE';
  const amtHeader = 'AMT';

  lines.push(formatFiveColumnHeader(snoHeader, itemHeader, qtyHeader, rateHeader, amtHeader, width, paperSize));
  lines.push(divider(width)); // Simple horizontal divider without pipes

  // LIST ALL ITEMS (no category grouping for cleaner look)
  items.forEach((item, index) => {
    const itemPrice = item.price ?? 0;
    const itemTotal = item.itemTotal ?? (itemPrice * item.quantity);

    lines.push(formatFiveColumnItemRow(
      index + 1,
      item.name,
      item.quantity,
      item.unit,
      itemPrice,
      itemTotal,
      width,
      paperSize
    ));
  });

  // GRAND TOTAL - only show if there are priced items
  if (hasPricedItems && grandTotal > 0) {
    lines.push(boldDivider(width));
    const grandTotalLabel = t.grandTotal || 'GRAND TOTAL';
    const grandTotalFormatted = formatCurrencyCompact(grandTotal);
    lines.push(formatLabelValue(grandTotalLabel, grandTotalFormatted, width, paperWidth, true));
  }

  // PAYMENT STATUS - only show if cart is paid
  if (paymentStatus === 'paid') {
    lines.push('');
    lines.push(boldDivider(width));
    const paymentStatusLabel = t.paymentStatus || 'Payment Status';
    const paidLabel = t.paid || 'PAID';
    lines.push(formatLabelValue(paymentStatusLabel, paidLabel, width, paperWidth, true));
    if (paidAt) {
      const paidAtLabel = t.paidAt || 'Paid at';
      const paidDate = new Date(paidAt);
      const paidTime = paidDate.toLocaleTimeString(dateLocale, timeOptions);
      lines.push(formatLabelValue(paidAtLabel, paidTime, width, paperWidth, true));
    }
    lines.push(boldDivider(width));
  }

  // FOOTER
  lines.push('');
  lines.push(boldDivider(width));
  lines.push(center(t.footer, width));
  lines.push(boldDivider(width));

  return lines.join('\n');
};

/////////////////////////////
// DEFAULT MERCHANT
/////////////////////////////

export const DEFAULT_MERCHANT: MerchantInfo = {
  name: 'Suresh Groceries',
  address: 'Main Street, Vizag',
};
