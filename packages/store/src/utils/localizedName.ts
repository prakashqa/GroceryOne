/**
 * Language-aware name resolver shared by web (and future mobile dedupe).
 *
 * Mirrors mobile's `getTranslatedItemName` / `getTranslatedCategoryName`
 * (mobile/src/domain/utils/itemTranslations.ts) but stays generic so any
 * entity with `{ name, nameTe }` can use it.
 *
 * Returns `nameTe` when the active language is Telugu (`te`, `te-IN`, …)
 * and `nameTe` is a non-empty string; otherwise falls back to `name`.
 */

export interface LocalizableName {
  name: string;
  nameTe?: string | null;
}

export function getLocalizedName(
  entity: LocalizableName | null | undefined,
  lang: string | null | undefined,
): string {
  if (!entity) return '';
  const language = (lang ?? 'en').toLowerCase();
  if (language.startsWith('te') && typeof entity.nameTe === 'string' && entity.nameTe.trim().length > 0) {
    return entity.nameTe;
  }
  return entity.name;
}
