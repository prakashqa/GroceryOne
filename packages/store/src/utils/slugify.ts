/**
 * Slug Generation Utility
 * Generates URL-safe slugs from names with random suffix to avoid collisions
 */

/**
 * Generate a URL-safe slug from a name string.
 * - Lowercases, replaces spaces/underscores with hyphens
 * - Removes non-alphanumeric characters (except hyphens)
 * - Collapses consecutive hyphens, trims leading/trailing hyphens
 * - Appends a 4-char random suffix for uniqueness
 *
 * @example generateSlug('Atta, Rice & Grains') => 'atta-rice-grains-a3f2'
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  const suffix = Math.random().toString(36).substring(2, 6);
  const slug = base ? `${base}-${suffix}` : suffix;

  // Ensure minimum length of 2 (backend @MinLength(2))
  return slug.length < 2 ? `${slug}00`.substring(0, 2) : slug;
}
