import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('PIN login page loads with keypad', async ({ page }) => {
    await page.goto('/pin-login');
    await page.waitForSelector('button:has-text("1")', { timeout: 15000 });

    // Verify all 10 digit buttons exist
    for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      await expect(page.locator(`button:has-text("${digit}")`).first()).toBeVisible();
    }

    // Verify PIN dots (4 empty circles)
    const pinDots = page.locator('.rounded-full.border-2');
    await expect(pinDots).toHaveCount(4);
  });

  test('entering 4-digit PIN navigates to dashboard', async ({ page }) => {
    await page.goto('/pin-login');
    await page.waitForSelector('button:has-text("1")', { timeout: 15000 });

    // Enter PIN: 1234
    for (const digit of ['1', '2', '3', '4']) {
      await page.locator(`button:has-text("${digit}")`).first().click();
      await page.waitForTimeout(100);
    }

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('"Setup New Store" link navigates to tenant setup', async ({ page }) => {
    await page.goto('/pin-login');
    await page.waitForSelector('button:has-text("1")', { timeout: 15000 });

    const setupLink = page.locator('a[href="/tenant-setup"]');
    await expect(setupLink).toBeVisible();
    await expect(setupLink).toHaveText(/Setup New Store/);
  });
});
