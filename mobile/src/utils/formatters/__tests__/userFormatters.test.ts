/**
 * userFormatters utility tests
 */

import { formatUserRole } from '../userFormatters';

describe('formatUserRole', () => {
  it('should capitalize single-word roles', () => {
    expect(formatUserRole('admin')).toBe('Admin');
    expect(formatUserRole('customer')).toBe('Customer');
    expect(formatUserRole('manager')).toBe('Manager');
  });

  it('should handle underscore-separated roles', () => {
    expect(formatUserRole('super_admin')).toBe('Super Admin');
  });

  it('should return empty string for empty input', () => {
    expect(formatUserRole('')).toBe('');
  });

  it('should handle already capitalized roles', () => {
    expect(formatUserRole('Admin')).toBe('Admin');
  });
});
