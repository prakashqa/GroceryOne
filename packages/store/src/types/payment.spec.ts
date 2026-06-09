import { generateUpiDeepLink } from './payment';

describe('generateUpiDeepLink', () => {
  it('builds a upi://pay deep link with payee, name, amount and currency', () => {
    const link = generateUpiDeepLink('groone@hdfc', 'GroOne', 2000);
    expect(link).toBe('upi://pay?pa=groone@hdfc&pn=GroOne&am=2000.00&cu=INR');
  });

  it('url-encodes the merchant name', () => {
    const link = generateUpiDeepLink('groone@hdfc', 'GroOne Store', 2000);
    expect(link).toContain('pn=GroOne%20Store');
  });

  it('appends an encoded transaction note (tn) when provided', () => {
    const link = generateUpiDeepLink('groone@hdfc', 'GroOne', 2000, 'GroOne license test2-business');
    expect(link).toContain('&tn=GroOne%20license%20test2-business');
  });

  it('omits the note param when no note is given (backward compatible)', () => {
    const link = generateUpiDeepLink('groone@hdfc', 'GroOne', 2000);
    expect(link).not.toContain('&tn=');
  });

  it('formats the amount to two decimals', () => {
    expect(generateUpiDeepLink('a@b', 'X', 35.5)).toContain('am=35.50');
  });
});
