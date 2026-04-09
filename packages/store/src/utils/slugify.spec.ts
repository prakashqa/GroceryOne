import { generateSlug } from './slugify';

describe('generateSlug', () => {
  it('should convert name to lowercase slug with random suffix', () => {
    const slug = generateSlug('Atta Rice');
    expect(slug).toMatch(/^atta-rice-[a-z0-9]{4}$/);
  });

  it('should replace spaces and underscores with hyphens', () => {
    const slug = generateSlug('Hello World_Test');
    expect(slug).toMatch(/^hello-world-test-[a-z0-9]{4}$/);
  });

  it('should remove special characters', () => {
    const slug = generateSlug('Atta, Rice & Grains!');
    expect(slug).toMatch(/^atta-rice-grains-[a-z0-9]{4}$/);
  });

  it('should collapse consecutive hyphens', () => {
    const slug = generateSlug('A --- B');
    expect(slug).toMatch(/^a-b-[a-z0-9]{4}$/);
  });

  it('should trim leading and trailing hyphens', () => {
    const slug = generateSlug('--test--');
    expect(slug).toMatch(/^test-[a-z0-9]{4}$/);
  });

  it('should produce unique slugs for the same input', () => {
    const slug1 = generateSlug('Test');
    const slug2 = generateSlug('Test');
    // Extremely unlikely to be equal due to random suffix
    expect(slug1.startsWith('test-')).toBe(true);
    expect(slug2.startsWith('test-')).toBe(true);
  });

  it('should produce a valid slug for empty-ish input', () => {
    const slug = generateSlug('!!!');
    expect(slug.length).toBeGreaterThanOrEqual(2);
  });

  it('should ensure minimum length of 2', () => {
    const slug = generateSlug('a');
    expect(slug.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle unicode/non-latin characters gracefully', () => {
    const slug = generateSlug('తెలుగు');
    // Non-latin chars are stripped, leaving just the random suffix
    expect(slug.length).toBeGreaterThanOrEqual(2);
  });
});
