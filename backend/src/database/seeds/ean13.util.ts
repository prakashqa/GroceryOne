/**
 * EAN-13 helpers for generating valid *test* barcodes.
 *
 * Test barcodes use the GS1 "200–299" prefix range, which is reserved for
 * in-store / restricted distribution use — i.e. it will never collide with a
 * real manufactured product's barcode. We build a 12-digit base
 * (`'200' + zero-padded sequence`) and append the EAN-13 check digit so the
 * code is a genuine, scannable/printable EAN-13.
 */

/**
 * Standard EAN-13 check digit for a 12-digit base. Odd positions (1-indexed
 * from the left) are weighted 1, even positions weighted 3.
 */
export function ean13CheckDigit(base12: string): number {
  if (!/^\d{12}$/.test(base12)) {
    throw new Error(`ean13CheckDigit expects exactly 12 digits, got: "${base12}"`);
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = base12.charCodeAt(i) - 48; // '0' === 48
    // i is 0-indexed: i=0 is position 1 (weight 1), i=1 is position 2 (weight 3)…
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}

/** Validate a full 13-digit EAN-13 (length, digits, and check digit). */
export function isValidEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  return ean13CheckDigit(code.slice(0, 12)) === code.charCodeAt(12) - 48;
}

/**
 * Deterministic, valid EAN-13 test barcode for a 1-based sequence number.
 * `testBarcodeForSeq(1)` → '2000000000015'.
 */
export function testBarcodeForSeq(seq: number): string {
  if (!Number.isInteger(seq) || seq <= 0) {
    throw new Error(`testBarcodeForSeq expects a positive integer, got: ${seq}`);
  }
  const body = String(seq).padStart(9, '0');
  if (body.length > 9) {
    throw new Error(`Sequence ${seq} is too large for a 9-digit body`);
  }
  const base12 = `200${body}`;
  return `${base12}${ean13CheckDigit(base12)}`;
}
