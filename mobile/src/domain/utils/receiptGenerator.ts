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
  grandTotal?: string; // "GRAND TOTAL" / "మొత్తం"
  // Column headers for price display
  qtyShort?: string; // "QTY" / "పరి"
  unitPriceHeader?: string; // "UNIT PRICE" / "యూనిట్ ధర"
  totalPriceHeader?: string; // "TOTAL PRICE" / "మొత్తం ధర"
  totalShort?: string; // "TOTAL" / "మొత్తం" (for 58mm paper)
  // Column headers for 5-column layout
  noHeader?: string; // "NO" / "నం"
  itemHeader?: string; // "ITEM" / "వస్తువు"
  rateHeader?: string; // "RATE" / "రేటు"
  amtHeader?: string; // "AMT" / "అమౌంట్"
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

// Paper width in characters (used for non-tabular lines: dividers only on 80mm)
// 80mm: 28 chars → always-scaled to fill 576px bitmap (even larger font, ~22% bigger than 32 chars)
//       Tabular lines (header + items) use tab-separated format with pixel-based rendering
//       Label-value lines (Date, Time, etc.) use tab-separated format on 80mm
//       Header/footer use CENTER_MARKER for native pixel-based centering on 80mm
// 58mm: 23 chars at 384px bitmap → two-line format (unchanged)
const PAPER_WIDTHS: Record<string, number> = {
  '58mm': 23,
  '80mm': 28,
};

// Center marker: lines prefixed with this char are pixel-centered by the native module
// (ReceiptBitmapModule.kt renderCenteredLine). This replaces character-based center()
// which breaks for Telugu text on 80mm paper (Telugu chars are 1.5-2x wider than ASCII).
const CENTER_MARKER = '\u0002';

// Bold tab marker: lines prefixed with this char are rendered at 1.3x font by native module.
// Used for GRAND TOTAL on 80mm paper so both label and value stand out.
const BOLD_TAB_MARKER = '\u0003';

// Fixed column positions for label-value pair alignment
// Right column width for Date:, Time:, GRAND TOTAL, etc.
const QTY_COL_WIDTH: Record<string, number> = {
  '58mm': 10,
  '80mm': 12,
};

// Column layout config (only used for 58mm character-based padding)
// 80mm uses tab-separated format — native module handles pixel-based alignment
// 58mm: two-line format (Line 1 = item name, Line 2 = values)
const COLUMNS: Record<'58mm' | '80mm', { sno: number; name: number; qty: number; rate: number; amt: number }> = {
  '58mm': { sno: 0, name: 23, qty: 5, rate: 8, amt: 8 },  // two-line format
  '80mm': { sno: 3, name: 17, qty: 7, rate: 7, amt: 8 },  // not used for tab format
};

// Column widths for 58mm value lines (second line of two-line format)
const COLUMNS_58MM_VALUES = { indent: 2, qty: 5, rate: 8, amt: 8 };  // 2+5+8+8 = 23

// Dev assertion: verify 58mm column widths match paper width
// (80mm uses tab-separated format — column widths handled by native pixel rendering)
// eslint-disable-next-line no-undef
if (typeof __DEV__ !== 'undefined' && __DEV__) {
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
    // Column headers for 5-column layout
    noHeader: 'NO',
    itemHeader: 'ITEM',
    rateHeader: 'RATE',
    amtHeader: 'AMT',
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
    grandTotal: 'మొత్తం',
    // Column headers for price display
    qtyShort: 'పరి',
    unitPriceHeader: 'యూనిట్ ధర',
    totalPriceHeader: 'మొత్తం ధర',
    totalShort: 'మొత్తం',
    // Column headers for 5-column layout
    noHeader: 'న',
    itemHeader: 'వస్తువు',
    rateHeader: 'రేటు',
    amtHeader: 'అమౌంట్',
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

const divider = (width: number) => '-'.repeat(width);

const boldDivider = (width: number) => '='.repeat(width);

const center = (text: string, width: number): string => {
  // Truncate with ellipsis if too long (cleaner than hard-cut)
  if (text.length > width) {
    return text.slice(0, width - 1) + '…';
  }
  if (text.length === width) return text;
  const pad = Math.floor((width - text.length) / 2);
  // Right-pad to full width so every line renders at the same bitmap width
  return (' '.repeat(pad) + text).padEnd(width);
};

// Fixed two-column layout: label on left, value right-aligned
// 80mm: Tab-separated — native module renders at 70%/30% proportions with pixel alignment
// 58mm: Character-based padding (unchanged)
const formatLabelValue = (
  label: string,
  value: string,
  width: number,
  paperSize: '58mm' | '80mm',
): string => {
  if (paperSize === '80mm') {
    // Tab-separated: native module's renderTabColumnarLine handles pixel alignment
    // Value column is right-aligned at 30% of bitmap width
    return `${label}\t${value}`;
  }
  // 58mm: character-based padding (unchanged)
  const rightColWidth = QTY_COL_WIDTH[paperSize];
  const leftColWidth = width - rightColWidth;
  const truncatedLabel = label.slice(0, leftColWidth);
  const truncatedValue = value.slice(0, rightColWidth);
  return truncatedLabel.padEnd(leftColWidth) + truncatedValue.padStart(rightColWidth);
};


// Five-column header: SNO  ITEM  QTY  RATE  AMT
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
    // 80mm: Tab-separated columns — native module renders at proportional pixel positions
    // This guarantees alignment for both Telugu and English text
    return `${snoHeader}\t${itemNameHeader}\t${qtyHeader}\t${rateHeader}\t${amtHeader}`;
  }
};

// Five-column item row: SNO  ITEM  QTY  RATE  AMT
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
  // Display "g" instead of "gm" on receipts for cleaner output
  const receiptUnit = unit === 'gm' ? 'g' : unit;
  const qtyText = String(Math.max(0, qty)) + receiptUnit;

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

  // 80mm: Tab-separated — native module handles pixel alignment and ellipsis truncation
  // No character-based padding needed; TextUtils.ellipsize() in Kotlin respects
  // Telugu conjunct boundaries (no mid-character breaks)
  return `${sno}\t${fullName}\t${qtyText}\t${rateText}\t${amtText}`;
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
  const width = PAPER_WIDTHS[paperWidth] || 28;

  // Determine language from locale
  const lang = getLanguageFromLocale(locale);

  // Use provided translations or fall back to hardcoded
  const t = translations || TRANSLATIONS[lang];

  const now = new Date();
  const lines: string[] = [];

  // Check if any items have prices and calculate grand total
  // Round each item's total to integer BEFORE summing so the printed AMT column
  // (which uses maximumFractionDigits: 0) sums to exactly the GRAND TOTAL value.
  const hasPricedItems = items.some(item => item.price !== undefined && item.price > 0);
  const grandTotal = items.reduce((sum, item) => {
    if (item.itemTotal !== undefined) {
      return sum + Math.round(item.itemTotal);
    }
    if (item.price !== undefined && item.price > 0) {
      return sum + Math.round(item.price * item.quantity);
    }
    return sum;
  }, 0);

  // HEADER - Use cart name if provided, else use title from translations
  const title = cartName ? cartName.toUpperCase() : t.title;
  if (paperWidth === '80mm') {
    // 80mm: CENTER_MARKER prefix — native module renders with pixel-based centering
    // This works correctly for Telugu, English, and mixed text
    lines.push(CENTER_MARKER + title);
    lines.push('');
    lines.push(CENTER_MARKER + merchantInfo.name.toUpperCase());
    lines.push(CENTER_MARKER + merchantInfo.address);
    if (merchantInfo.phone) {
      lines.push(CENTER_MARKER + `Tel: ${merchantInfo.phone}`);
    }
  } else {
    // 58mm: character-based centering (unchanged)
    lines.push(center(title, width));
    lines.push('');
    lines.push(center(merchantInfo.name.toUpperCase(), width));
    lines.push(center(merchantInfo.address, width));
    if (merchantInfo.phone) {
      lines.push(center(`Tel: ${merchantInfo.phone}`, width));
    }
  }
  lines.push('');
  lines.push(boldDivider(width));

  // DATE / TIME - Format based on locale and paper width
  const dateLocale = locale || (lang === 'te' ? 'te-IN' : 'en-GB');
  // Shorter format for narrow paper (no weekday to prevent truncation)
  const dateOptions: Intl.DateTimeFormatOptions = width <= 24
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
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
    )
  );
  lines.push(
    formatLabelValue(
      `${t.time}:`,
      now.toLocaleTimeString(dateLocale, timeOptions),
      width,
      paperWidth,
    )
  );
  lines.push(divider(width));

  // SUMMARY - synced with Cart Review screen (Unique Items only, Categories removed)
  lines.push(
    formatLabelValue(`${t.uniqueItems}:`, String(items.length), width, paperWidth)
  );
  lines.push(divider(width));

  // COLUMN HEADERS
  const paperSize: '58mm' | '80mm' = paperWidth === '58mm' ? '58mm' : '80mm';

  // Use English headers for all languages (Telugu headers in tab-separated columns
  // cause print failures on thermal printers due to Android font fallback issues)
  const snoHeader = 'NO';
  const itemHeader = 'ITEM';
  const qtyHeader = 'QTY';
  const rateHeader = 'RATE';
  const amtHeader = 'AMT';

  lines.push(formatFiveColumnHeader(snoHeader, itemHeader, qtyHeader, rateHeader, amtHeader, width, paperSize));
  lines.push(divider(width));

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
    if (paperWidth === '80mm') {
      // Bold+large tab line: BOLD_TAB_MARKER prefix triggers 1.3x rendering in native module
      lines.push(BOLD_TAB_MARKER + `${grandTotalLabel}\t${grandTotalFormatted}`);
    } else {
      lines.push(formatLabelValue(grandTotalLabel, grandTotalFormatted, width, paperWidth));
    }
  }

  // PAYMENT STATUS - only show if cart is paid
  if (paymentStatus === 'paid') {
    lines.push(boldDivider(width));
    const paymentStatusLabel = t.paymentStatus || 'Payment Status';
    const paidLabel = t.paid || 'PAID';
    lines.push(formatLabelValue(paymentStatusLabel, paidLabel, width, paperWidth));
    if (paidAt) {
      const paidAtLabel = t.paidAt || 'Paid at';
      const paidDate = new Date(paidAt);
      const paidTime = paidDate.toLocaleTimeString(dateLocale, timeOptions);
      lines.push(formatLabelValue(paidAtLabel, paidTime, width, paperWidth));
    }
    lines.push(boldDivider(width));
  }

  // FOOTER — when payment section is present, its closing boldDivider already
  // provides visual separation. Only add empty line + divider when no payment section.
  if (paymentStatus !== 'paid') {
    lines.push('');
    lines.push(boldDivider(width));
  }
  if (paperWidth === '80mm') {
    lines.push(CENTER_MARKER + t.footer);
  } else {
    lines.push(center(t.footer, width));
  }
  lines.push(boldDivider(width));

  // Trailing empty lines: provide ~200px whitespace in the bitmap so the
  // footer is well above the thermal print head cutoff. 6 lines ≈ 25mm.
  // This is the PRIMARY paper feed mechanism — BLEPrinter.printText('\n')
  // paper feed can silently fail over BLE (printRawData swallows IOException).
  lines.push('');
  lines.push('');
  lines.push('');
  lines.push('');
  lines.push('');
  lines.push('');

  return lines.join('\n');
};

/////////////////////////////
// DEFAULT MERCHANT
/////////////////////////////

/////////////////////////////
// STRIP FORMAT MARKERS
/////////////////////////////

/**
 * Strip ESC/POS control sequences from receipt text for display preview.
 * Removes bold (ESC E), underline (ESC -), and other escape sequences
 * so the text renders cleanly in a mobile preview modal.
 */
export const stripFormatMarkers = (text: string): string => {
  // Remove ESC/POS escape sequences: ESC (0x1b) followed by command byte and parameter byte
  // Also remove CENTER_MARKER (U+0002) used for native pixel-based centering
  return text
    .replace(/\x1b[\x20-\x7e][\x00-\xff]/g, '')
    .replace(/[\x02\x03]/g, '');
};

/////////////////////////////
// FORMAT FOR PREVIEW
/////////////////////////////

// Preview column widths for 80mm monospace display (total = 28 chars)
// Derived from native pixel proportions: 8%/34%/15%/18%/25% (NO/ITEM/QTY/RATE/AMT)
const PREVIEW_COLS_5 = { sno: 2, name: 10, qty: 4, rate: 5, amt: 7 };
// Label-value (Date, Time, GRAND TOTAL, Payment Status, etc.)
const PREVIEW_COLS_2 = { label: 16, value: 12 };

const formatFiveColumnPreview = (parts: string[]): string => {
  const c = PREVIEW_COLS_5;
  const sno = parts[0].slice(0, c.sno).padEnd(c.sno);
  const name = parts[1].length > c.name
    ? parts[1].slice(0, c.name - 1) + '\u2026'
    : parts[1].padEnd(c.name);
  const qty = parts[2].slice(0, c.qty).padStart(c.qty);
  const rate = parts[3].slice(0, c.rate).padStart(c.rate);
  const amt = parts[4].slice(0, c.amt).padStart(c.amt);
  return sno + name + qty + rate + amt;
};

const formatTwoColumnPreview = (parts: string[]): string => {
  const c = PREVIEW_COLS_2;
  const label = parts[0].slice(0, c.label).padEnd(c.label);
  const value = parts[1].slice(0, c.value).padStart(c.value);
  return label + value;
};

/**
 * Format receipt text for preview display in React Native Text component.
 * - Strips ESC/POS control sequences and format markers (CENTER_MARKER, BOLD_TAB_MARKER)
 * - Converts tab-separated columns (used for 80mm native bitmap rendering)
 *   to space-padded columns for monospace font display (28 chars wide)
 * - 58mm receipts have no tabs and pass through unchanged after marker stripping
 */
export const formatForPreview = (text: string): string => {
  const stripped = stripFormatMarkers(text);

  // 58mm receipts never contain tabs — skip column conversion
  if (!stripped.includes('\t')) {
    return stripped;
  }

  return stripped.split('\n').map(line => {
    if (!line.includes('\t')) {
      return line; // Non-tabular line: dividers, centered text, empty lines
    }

    const parts = line.split('\t');

    if (parts.length === 5) {
      return formatFiveColumnPreview(parts);
    } else if (parts.length === 2) {
      return formatTwoColumnPreview(parts);
    }

    // Fallback for unexpected tab counts
    return parts.join(' ');
  }).join('\n');
};

/////////////////////////////
// SANITIZE FOR PRINTER
/////////////////////////////

/**
 * @deprecated Use image-mode printing via renderTextToImage() + printImage() instead.
 * Sanitize receipt text for thermal printers that use single-byte codepages
 * (CP437/Windows-1252). Replaces any non-ASCII characters (Telugu, emojis, etc.)
 * with '?' so the printer doesn't choke on multi-byte sequences.
 * Preserves newlines, spaces, and all printable ASCII characters.
 */
export const sanitizeForPrinter = (text: string): string => {
  // Replace any character outside printable ASCII (0x20-0x7E) and common control chars
  // (newline 0x0A, carriage return 0x0D, tab 0x09) with '?'
  return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');
};

export const DEFAULT_MERCHANT: MerchantInfo = {
  name: 'Suresh Groceries',
  address: 'Main Street, Vizag',
};
