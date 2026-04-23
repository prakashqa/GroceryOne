import { test, expect } from './fixtures/test-base';

test.describe('Language Switching', () => {
  test('language settings page shows English and Telugu', async ({ authenticatedPage: page }) => {
    await page.goto('/settings/language');
    await page.waitForLoadState('networkidle');

    // Each language option has name + nativeName — use button filter
    const englishOption = page.locator('button').filter({ hasText: 'English' });
    const teluguOption = page.locator('button').filter({ hasText: 'Telugu' });
    await expect(englishOption).toBeVisible();
    await expect(teluguOption).toBeVisible();
  });

  test('switching to Telugu changes sidebar labels', async ({ authenticatedPage: page }) => {
    await page.goto('/settings/language');
    await page.waitForLoadState('networkidle');

    // Verify sidebar is in English first
    await expect(page.locator('aside').getByText('Dashboard')).toBeVisible();

    // Click the Telugu button
    const teluguOption = page.locator('button').filter({ hasText: 'Telugu' });
    await teluguOption.click();
    await page.waitForTimeout(500);

    // Sidebar should now show Telugu text
    await expect(page.locator('aside').getByText('డాష్‌బోర్డ్')).toBeVisible();
  });

  test('switching back to English restores labels', async ({ authenticatedPage: page }) => {
    await page.goto('/settings/language');
    await page.waitForLoadState('networkidle');

    // Switch to Telugu first
    const teluguOption = page.locator('button').filter({ hasText: 'Telugu' });
    await teluguOption.click();
    await page.waitForTimeout(500);

    // Switch back to English
    const englishOption = page.locator('button').filter({ hasText: 'English' });
    await englishOption.click();
    await page.waitForTimeout(500);

    // Sidebar should be back in English
    await expect(page.locator('aside').getByText('Dashboard')).toBeVisible();
  });
});
