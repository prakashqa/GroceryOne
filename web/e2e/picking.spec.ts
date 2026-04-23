import { test, expect } from './fixtures/test-base';

test.describe('Picking Page', () => {
  test('picking page loads with search and category bar', async ({ authenticatedPage: page }) => {
    await page.goto('/picking');
    await page.waitForLoadState('networkidle');

    // Search input should be visible
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    // "All" category button should be visible
    const allButton = page.locator('button').filter({ hasText: /^All$|^అన్నీ$/ }).first();
    await expect(allButton).toBeVisible();
  });

  test('category filter buttons are interactive', async ({ authenticatedPage: page }) => {
    await page.goto('/picking');
    await page.waitForLoadState('networkidle');

    // Find category buttons (after "All")
    const categoryButtons = page.locator('button').filter({ hasText: /🌾|🍚|🫘|🌶️|🥬|☕/ });
    const count = await categoryButtons.count();

    if (count > 0) {
      // Click first category button
      await categoryButtons.first().click();
      // The button should now have active styling (bg-primary/10)
      await expect(categoryButtons.first()).toHaveClass(/text-primary/);
    }
  });

  test('product grid or empty state renders', async ({ authenticatedPage: page }) => {
    await page.goto('/picking');
    await page.waitForLoadState('networkidle');

    // Either product cards exist or empty state shows
    const productGrid = page.locator('.grid.grid-cols-2');
    const emptyState = page.locator('text=/No items|ఐటెమ్లు లేవు/');

    const hasProducts = await productGrid.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasProducts || hasEmptyState).toBeTruthy();
  });
});
