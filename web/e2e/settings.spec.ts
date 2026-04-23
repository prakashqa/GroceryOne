import { test, expect } from './fixtures/test-base';

test.describe('Settings Pages', () => {
  test('settings hub shows all 6 options', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Should have 6 settings links
    const settingsLinks = page.locator('a[href^="/settings/"]');
    await expect(settingsLinks).toHaveCount(6);

    // Verify each sub-page link exists
    const subPages = ['appearance', 'language', 'notifications', 'printer', 'payment', 'about'];
    for (const sub of subPages) {
      await expect(page.locator(`a[href="/settings/${sub}"]`)).toBeVisible();
    }
  });

  test('each settings sub-page is accessible', async ({ authenticatedPage: page }) => {
    const subPages = ['appearance', 'language', 'notifications', 'printer', 'payment', 'about'];

    for (const sub of subPages) {
      await page.goto(`/settings/${sub}`);
      await page.waitForLoadState('networkidle');

      // Page should not show 404
      await expect(page.locator('text=404')).not.toBeVisible();

      // Back arrow link should be visible (use first() since sidebar also has /settings link)
      const backLink = page.locator('main a[href="/settings"]');
      await expect(backLink).toBeVisible();
    }
  });

  test('appearance page has 3 theme option buttons', async ({ authenticatedPage: page }) => {
    await page.goto('/settings/appearance');
    await page.waitForLoadState('networkidle');

    // Should have 3 theme buttons in the grid
    const themeGrid = page.locator('.grid.grid-cols-3');
    await expect(themeGrid).toBeVisible();

    const themeButtons = themeGrid.locator('button');
    await expect(themeButtons).toHaveCount(3);
  });
});
