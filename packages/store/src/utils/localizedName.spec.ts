import { getLocalizedName } from './localizedName';

describe('getLocalizedName', () => {
  it('returns English name when language is en', () => {
    expect(getLocalizedName({ name: 'Rice', nameTe: 'బియ్యం' }, 'en')).toBe('Rice');
  });

  it('returns Telugu name when language is te and nameTe is present', () => {
    expect(getLocalizedName({ name: 'Rice', nameTe: 'బియ్యం' }, 'te')).toBe('బియ్యం');
  });

  it('falls back to English when language is te but nameTe is undefined', () => {
    expect(getLocalizedName({ name: 'Rice' }, 'te')).toBe('Rice');
  });

  it('falls back to English when nameTe is empty string', () => {
    expect(getLocalizedName({ name: 'Rice', nameTe: '' }, 'te')).toBe('Rice');
  });

  it('falls back to English when nameTe is whitespace only', () => {
    expect(getLocalizedName({ name: 'Rice', nameTe: '   ' }, 'te')).toBe('Rice');
  });

  it('falls back to English when nameTe is null', () => {
    expect(getLocalizedName({ name: 'Rice', nameTe: null }, 'te')).toBe('Rice');
  });

  it('handles regional locale variants like te-IN', () => {
    expect(getLocalizedName({ name: 'Rice', nameTe: 'బియ్యం' }, 'te-IN')).toBe('బియ్యం');
  });

  it('handles uppercase language code', () => {
    expect(getLocalizedName({ name: 'Rice', nameTe: 'బియ్యం' }, 'TE')).toBe('బియ్యం');
  });

  it('returns empty string for null entity', () => {
    expect(getLocalizedName(null, 'te')).toBe('');
  });

  it('returns empty string for undefined entity', () => {
    expect(getLocalizedName(undefined, 'te')).toBe('');
  });

  it('defaults to English-style fallback when language is unrecognized', () => {
    expect(getLocalizedName({ name: 'Rice', nameTe: 'బియ్యం' }, 'fr')).toBe('Rice');
  });

  it('works with category-shaped objects (extra fields ignored)', () => {
    const cat = { id: '1', slug: 'rice', name: 'Rice', nameTe: 'బియ్యం', icon: '🍚' };
    expect(getLocalizedName(cat, 'te')).toBe('బియ్యం');
    expect(getLocalizedName(cat, 'en')).toBe('Rice');
  });

  it('works with item-shaped objects', () => {
    const item = { id: '1', slug: 'basmati', name: 'Basmati Rice', nameTe: 'బాస్మతి బియ్యం' };
    expect(getLocalizedName(item, 'te')).toBe('బాస్మతి బియ్యం');
  });
});
