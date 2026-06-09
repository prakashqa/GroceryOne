import { ean13CheckDigit, testBarcodeForSeq, isValidEan13 } from './ean13.util';

describe('ean13CheckDigit', () => {
  it('computes the correct check digit for known EAN-13 values', () => {
    // 978014300723 -> check digit 4 (well-known ISBN-13 example 9780143007234)
    expect(ean13CheckDigit('978014300723')).toBe(4);
    // 400638133393 -> check digit 1 (4006381333931)
    expect(ean13CheckDigit('400638133393')).toBe(1);
  });

  it('throws if the base is not exactly 12 digits', () => {
    expect(() => ean13CheckDigit('123')).toThrow();
    expect(() => ean13CheckDigit('12345678901a')).toThrow();
  });
});

describe('testBarcodeForSeq', () => {
  it('produces a valid 13-digit EAN-13 with the 200 internal prefix', () => {
    const code = testBarcodeForSeq(1);
    expect(code).toHaveLength(13);
    expect(code.startsWith('200')).toBe(true);
    expect(isValidEan13(code)).toBe(true);
  });

  it('is deterministic for a given sequence number', () => {
    expect(testBarcodeForSeq(7)).toBe(testBarcodeForSeq(7));
  });

  it('produces distinct codes for distinct sequence numbers', () => {
    const codes = new Set([1, 2, 3, 50, 999].map(testBarcodeForSeq));
    expect(codes.size).toBe(5);
  });

  it('zero-pads the sequence into the 9-digit body', () => {
    // '200' + '000000001' + check digit
    expect(testBarcodeForSeq(1).slice(0, 12)).toBe('200000000001');
  });

  it('rejects non-positive sequence numbers', () => {
    expect(() => testBarcodeForSeq(0)).toThrow();
    expect(() => testBarcodeForSeq(-3)).toThrow();
  });
});

describe('isValidEan13', () => {
  it('accepts a correct EAN-13 and rejects a tampered one', () => {
    const good = testBarcodeForSeq(42);
    expect(isValidEan13(good)).toBe(true);
    const bad = good.slice(0, 12) + ((Number(good[12]) + 1) % 10);
    expect(isValidEan13(bad)).toBe(false);
  });

  it('rejects wrong length or non-numeric', () => {
    expect(isValidEan13('123')).toBe(false);
    expect(isValidEan13('20000000000a4')).toBe(false);
  });
});
